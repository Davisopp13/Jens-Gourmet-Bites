-- Existing rows retain a NULL status and appear in History. New website requests use the RPC.
alter table public.contact_submissions
  add column submission_id uuid unique,
  add column request_fingerprint text,
  add column status text check (status in ('new','in_progress','done')),
  add column version integer not null default 1,
  add column updated_at timestamptz not null default now();
create index contact_queue_order on public.contact_submissions(status,created_at desc,id);

create table public.inquiry_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);
create table public.inquiry_activity (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.contact_submissions(id) on delete cascade,
  actor_id uuid not null,
  actor_label text not null,
  kind text not null check (kind in ('status','note')),
  body text not null,
  created_at timestamptz not null default now()
);
create index inquiry_activity_order on public.inquiry_activity(inquiry_id,created_at,id);
create table public.inquiry_notifications (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.contact_submissions(id) on delete cascade,
  channel text not null check(channel in ('email','push')),
  target text not null,
  subscription_id uuid references public.inquiry_push_subscriptions(id) on delete set null,
  state text not null default 'pending' check(state in ('pending','accepted','failed')),
  attempts integer not null default 0,
  lease_token uuid,
  leased_until timestamptz,
  provider_id text,
  last_error text,
  created_at timestamptz not null default now(),
  unique(inquiry_id,channel,target)
);
create index inquiry_notification_lookup on public.inquiry_notifications(inquiry_id);
alter table public.inquiry_push_subscriptions enable row level security;
alter table public.inquiry_activity enable row level security;
alter table public.inquiry_notifications enable row level security;
alter table public.contact_submissions enable row level security;
-- All access is via server handlers which verify the owner allowlist, never arbitrary signed-in users.
drop policy if exists "Anyone can submit contact form" on public.contact_submissions;
drop policy if exists "Authenticated users can view submissions" on public.contact_submissions;
revoke all on public.contact_submissions, public.inquiry_activity, public.inquiry_notifications, public.inquiry_push_subscriptions from public,anon,authenticated;
grant all on public.contact_submissions, public.inquiry_activity, public.inquiry_notifications, public.inquiry_push_subscriptions to service_role;

create function public.create_inquiry(p_submission_id uuid,p_fingerprint text,p_name text,p_email text,p_phone text,p_message text,p_format text,p_admin_ids uuid[])
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_fingerprint text;
begin
  insert into public.contact_submissions(submission_id,request_fingerprint,name,email,phone,message,preferred_format,status)
    values(p_submission_id,p_fingerprint,p_name,p_email,p_phone,p_message,p_format,'new')
    on conflict(submission_id) do nothing returning id into v_id;
  if v_id is null then
    select id,request_fingerprint into v_id,v_fingerprint from public.contact_submissions where submission_id=p_submission_id;
    if v_fingerprint is distinct from p_fingerprint then raise exception 'Submission ID already used' using errcode='PT409'; end if;
    return v_id;
  end if;
  insert into public.inquiry_notifications(inquiry_id,channel,target) values(v_id,'email','owner');
  insert into public.inquiry_notifications(inquiry_id,channel,target,subscription_id)
    select v_id,'push',id::text,id from public.inquiry_push_subscriptions where user_id=any(p_admin_ids);
  return v_id;
end $$;

create function public.edit_inquiry(p_id uuid,p_version integer,p_actor uuid,p_actor_label text,p_status text default null,p_note text default null)
returns void language plpgsql security invoker set search_path='' as $$
declare v_row public.contact_submissions;
begin
  select * into v_row from public.contact_submissions where id=p_id for update;
  if not found then raise exception 'Not found' using errcode='PT404'; end if;
  if v_row.version<>p_version then raise exception 'Version conflict' using errcode='PT409'; end if;
  if p_status is not null then
    if p_status not in ('new','in_progress','done') then raise exception 'Invalid status' using errcode='22023'; end if;
    if p_status is distinct from v_row.status then
      insert into public.inquiry_activity(inquiry_id,actor_id,actor_label,kind,body)
        values(p_id,p_actor,p_actor_label,'status',coalesce(v_row.status,'history')||' → '||p_status);
    end if;
  elsif p_note is not null and length(trim(p_note)) between 1 and 5000 then
    insert into public.inquiry_activity(inquiry_id,actor_id,actor_label,kind,body) values(p_id,p_actor,p_actor_label,'note',trim(p_note));
  else raise exception 'Invalid edit' using errcode='22023'; end if;
  update public.contact_submissions set status=coalesce(p_status,status),version=version+1,updated_at=now() where id=p_id;
end $$;

create function public.claim_inquiry_notifications(p_id uuid,p_token uuid)
returns setof public.inquiry_notifications language sql security invoker set search_path='' as $$
  update public.inquiry_notifications set lease_token=p_token,leased_until=now()+interval '60 seconds',attempts=attempts+1
  where inquiry_id=p_id and state in ('pending','failed') and (leased_until is null or leased_until<now())
  returning *;
$$;
revoke all on function public.create_inquiry(uuid,text,text,text,text,text,text,uuid[]),public.edit_inquiry(uuid,integer,uuid,text,text,text),public.claim_inquiry_notifications(uuid,uuid) from public,anon,authenticated;
grant execute on function public.create_inquiry(uuid,text,text,text,text,text,text,uuid[]),public.edit_inquiry(uuid,integer,uuid,text,text,text),public.claim_inquiry_notifications(uuid,uuid) to service_role;
