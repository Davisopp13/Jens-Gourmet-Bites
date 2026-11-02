-- Published content is public. Drafts/history are accessible only through the admin API.
create table public.website_content (
  id boolean primary key default true check (id),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  published_at timestamptz not null default now()
);
create table public.website_content_editor (
  id boolean primary key default true check (id),
  draft jsonb check (jsonb_typeof(draft) = 'object'),
  previous jsonb check (jsonb_typeof(previous) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  draft_saved_at timestamptz,
  previous_published_at timestamptz,
  updated_by uuid
);
alter table public.website_content enable row level security;
alter table public.website_content_editor enable row level security;
revoke all on public.website_content, public.website_content_editor from public, anon, authenticated;
grant select on public.website_content to anon, authenticated;
grant select, insert, update on public.website_content, public.website_content_editor to service_role;
create policy "Read published website content" on public.website_content for select to anon, authenticated using (true);
-- No browser policies on the editor table: even signed-in visitors cannot read drafts.
insert into public.website_content(id, content)
select true, '{"homeEyebrow":"Recipe No. 1","homeHeading":"Cookies, from scratch.","homeIntro":"Gourmet cookies made fresh in Johns Creek, Georgia. Choose from our selection of artisan cookies, available as fresh-baked treats or convenient frozen dough.","browseButton":"Flip through the recipes","orderButton":"Place an order","noteTitle":"a note from Jen","noteMessage":"What started as a passion for baking in my Johns Creek kitchen has grown into a labor of love that I''m thrilled to share with you. Each cookie is made from scratch using family recipes and the finest ingredients, because you deserve nothing less than the best.","noteFooter":"Proudly serving Metro Atlanta. Local pickup available, and we can arrange delivery for larger orders.","orderInstructions":"","fulfillmentInfo":"","responseTime":"Jen will get back to you within 24 hours.","confirmationHeading":"Your card is in the oven!","confirmationMessage":"Thank you for your order.","publicEmail":"jensgourmetbites@gmail.com","serviceArea":"Johns Creek, GA · Serving Metro Atlanta","footerDescription":"Handcrafted gourmet cookies made with love. Available as fresh-baked or frozen dough.","siteTitle":"Jen''s Gourmet Bites | Artisan Cookies in Johns Creek, GA","siteDescription":"Handcrafted gourmet cookies made with love in Johns Creek, GA. Available as fresh-baked or frozen dough. Serving Metro Atlanta.","shareTitle":"Jen''s Gourmet Bites | Artisan Cookies","shareDescription":"Handcrafted gourmet cookies made with love. Available as fresh-baked or frozen dough."}'::jsonb || jsonb_build_object(
  'noteTitle', coalesce(nullif(btrim((select value from public.site_settings where key='home_note_title')), ''), 'a note from Jen'),
  'noteMessage', coalesce(nullif(btrim((select value from public.site_settings where key='home_note_quote')), ''), 'What started as a passion for baking in my Johns Creek kitchen has grown into a labor of love that I''m thrilled to share with you. Each cookie is made from scratch using family recipes and the finest ingredients, because you deserve nothing less than the best.'),
  'noteFooter', coalesce(btrim((select value from public.site_settings where key='home_note_footer')), 'Proudly serving Metro Atlanta. Local pickup available, and we can arrange delivery for larger orders.')
);
insert into public.website_content_editor(id) values (true);

-- One statement gives the editor a consistent public/private snapshot.
create or replace function public.get_website_content_state()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('published', live.content, 'draft', editor.draft, 'previous', editor.previous,
    'revision', editor.revision, 'publishedAt', live.published_at, 'draftSavedAt', editor.draft_saved_at,
    'previousPublishedAt', editor.previous_published_at)
  from public.website_content live cross join public.website_content_editor editor
  where live.id=true and editor.id=true;
$$;
revoke all on function public.get_website_content_state() from public, anon, authenticated;
grant execute on function public.get_website_content_state() to service_role;

-- Service-only invoker RPC: the server verifies the signed-in admin allowlist.
-- Row locking and an expected revision prevent stale tabs overwriting newer work.
create or replace function public.edit_website_content(p_action text, p_revision integer, p_actor uuid, p_content jsonb default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  editor public.website_content_editor%rowtype;
  live public.website_content%rowtype;
begin
  select * into strict editor from public.website_content_editor where id = true for update;
  select * into strict live from public.website_content where id = true for update;
  if p_revision is distinct from editor.revision then
    raise exception 'Content was changed in another tab' using errcode = 'PT409';
  end if;
  if p_actor is null then raise exception 'Admin required' using errcode = '22023'; end if;
  if p_action = 'save' then
    if p_content is null or jsonb_typeof(p_content) <> 'object' then
      raise exception 'Content must be an object' using errcode = '22023';
    end if;
    update public.website_content_editor set draft=p_content, draft_saved_at=now(), revision=revision+1, updated_by=p_actor where id=true;
  elsif p_action = 'restore' then
    if editor.previous is null then raise exception 'No previous version' using errcode = '22023'; end if;
    update public.website_content_editor set draft=previous, draft_saved_at=now(), revision=revision+1, updated_by=p_actor where id=true;
  elsif p_action = 'publish' then
    if editor.draft is null then raise exception 'No saved draft' using errcode = '22023'; end if;
    if editor.draft is distinct from live.content then
      update public.website_content_editor set previous=live.content, previous_published_at=live.published_at where id=true;
      update public.website_content set content=editor.draft, published_at=now() where id=true;
    end if;
    update public.website_content_editor set draft=null, draft_saved_at=null, revision=revision+1, updated_by=p_actor where id=true;
  else
    raise exception 'Unknown action' using errcode = '22023';
  end if;
  select * into strict editor from public.website_content_editor where id=true;
  select * into strict live from public.website_content where id=true;
  return jsonb_build_object('published', live.content, 'draft', editor.draft, 'previous', editor.previous,
    'revision', editor.revision, 'publishedAt', live.published_at, 'draftSavedAt', editor.draft_saved_at,
    'previousPublishedAt', editor.previous_published_at);
end;
$$;
revoke all on function public.edit_website_content(text, integer, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.edit_website_content(text, integer, uuid, jsonb) to service_role;
