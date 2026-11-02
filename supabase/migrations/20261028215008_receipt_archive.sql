-- Additive migration; requires existing pricing_migration.sql tables.
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  source text not null check (source in ('upload','email')),
  source_id text,
  fingerprint text not null,
  subject text, sender text,
  status text not null default 'pending' check (status in ('pending','archived','reviewed')),
  extraction_status text not null default 'manual' check (extraction_status in ('manual','ready','failed','processing')),
  extraction_message text,
  extraction_attempts integer not null default 0,
  files jsonb not null default '[]',
  data jsonb not null default '{}',
  search_text text generated always as (data::text) stored,
  raw_text text,
  applied_prices jsonb not null default '[]',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(owner_id, fingerprint), unique(owner_id, source_id)
);
create index receipts_owner_created on public.receipts(owner_id, created_at desc);
alter table public.receipts enable row level security;
create policy receipts_owner_read on public.receipts for select to authenticated using (owner_id = (select auth.uid()));
revoke all on public.receipts from anon, authenticated;
grant select on public.receipts to authenticated;
grant all on public.receipts to service_role;

create table public.pricing_drafts (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
  name text not null, snapshot jsonb not null, created_at timestamptz not null default now()
);
alter table public.pricing_drafts enable row level security;
create policy pricing_drafts_owner_read on public.pricing_drafts for select to authenticated using (owner_id = (select auth.uid()));
revoke all on public.pricing_drafts from anon, authenticated;
grant select on public.pricing_drafts to authenticated;
grant all on public.pricing_drafts to service_role;
create index pricing_drafts_owner_created on public.pricing_drafts(owner_id, created_at desc);

alter table public.ingredients add column if not exists exact_product_name text;
alter table public.ingredients add column if not exists price_verified_at timestamptz;
alter table public.ingredients add column if not exists price_receipt_id uuid references public.receipts(id);
alter table public.price_history add column if not exists receipt_id uuid references public.receipts(id);
alter table public.price_history add column if not exists package_quantity numeric;
alter table public.price_history add column if not exists unit text;
alter table public.price_history add column if not exists exact_product_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf','text/plain','message/rfc822'])
on conflict (id) do update set public = false;
-- No client storage grants: server authorizes ownership before issuing temporary URLs.

create function public.review_receipt(p_id uuid, p_owner uuid, p_version integer, p_data jsonb, p_apply boolean)
returns public.receipts language plpgsql security invoker set search_path = '' as $$
declare
  r public.receipts; line jsonb; ing public.ingredients; seen uuid[] := '{}';
  selected uuid; net numeric; qty numeric; pkg numeric; new_price integer;
  unit_name text; factor numeric; source_factor numeric; target_factor numeric;
  source_family text; target_family text; total numeric := 0; changes jsonb := '[]';
begin
  -- EXECUTE is service-role only. Caller must authenticate and supply the owner.
  select * into r from public.receipts where id=p_id and owner_id=p_owner for update;
  if not found then raise exception 'Receipt not found' using errcode='P0002'; end if;
  if r.version <> p_version then raise exception 'Receipt changed. Reload before saving.' using errcode='40001'; end if;
  if r.status = 'reviewed' then raise exception 'Reviewed receipts are immutable. Upload a correction separately.'; end if;
  if jsonb_typeof(p_data->'lines') <> 'array' or jsonb_array_length(p_data->'lines') > 150 then raise exception 'Invalid lines'; end if;
  if coalesce(p_data->>'store','') = '' or coalesce(p_data->>'purchased_on','') = '' then raise exception 'Store and date required'; end if;
  if (p_data->>'total_cents')::numeric < 0 or (p_data->>'tax_cents')::numeric < 0 then raise exception 'Invalid totals'; end if;
  -- Stable lock ordering prevents concurrent receipt updates deadlocking on ingredients.
  if p_apply then
    perform 1 from public.ingredients where id in (select (x->>'ingredient_id')::uuid from jsonb_array_elements(p_data->'lines') x where (x->>'use_for_pricing')::boolean) order by id for update;
  end if;
  for line in select * from jsonb_array_elements(p_data->'lines') loop
    net := (line->>'net_cents')::numeric; qty := (line->>'quantity')::numeric;
    if net is null or net < 0 or net <> trunc(net) or qty is null or qty <= 0 then raise exception 'Invalid purchase amount'; end if;
    total := total + net;
    if p_apply and coalesce((line->>'use_for_pricing')::boolean,false) then
      selected := (line->>'ingredient_id')::uuid;
      if selected is null or selected = any(seen) then raise exception 'Each ingredient must be selected once'; end if;
      seen := array_append(seen, selected);
      if line->>'category' <> 'ingredient' or not coalesce((line->>'confirmed')::boolean,false) or length(trim(coalesce(line->>'exact_product',''))) = 0 then raise exception 'Confirm exact product and package first'; end if;
      select * into ing from public.ingredients where id=selected;
      if not found then raise exception 'Ingredient not found'; end if;
      pkg := (line->>'package_quantity')::numeric; unit_name := line->>'unit';
      if pkg is null or pkg <= 0 or ing.package_quantity <= 0 then raise exception 'Invalid package quantity'; end if;
      select family, scale into source_family, source_factor from (values ('g','mass',1::numeric),('kg','mass',1000),('oz','mass',28.349523125),('lb','mass',453.59237),('ml','volume',1),('l','volume',1000),('tsp','volume',4.92892159375),('tbsp','volume',14.78676478125),('cup','volume',236.5882365),('count','count',1)) u(unit,family,scale) where unit=unit_name;
      select family, scale into target_family, target_factor from (values ('g','mass',1::numeric),('kg','mass',1000),('oz','mass',28.349523125),('lb','mass',453.59237),('ml','volume',1),('l','volume',1000),('tsp','volume',4.92892159375),('tbsp','volume',14.78676478125),('cup','volume',236.5882365),('count','count',1)) u(unit,family,scale) where unit=ing.unit;
      if source_family is null or target_family is null or source_family <> target_family then raise exception 'Incompatible ingredient and receipt units'; end if;
      factor := (ing.package_quantity * target_factor) / (pkg * source_factor);
      new_price := round(net / qty * factor);
      if new_price < 0 or new_price > 100000000 then raise exception 'Price out of range'; end if;
      if ing.price_verified_at is not null and (p_data->>'purchased_on')::date < ing.price_verified_at::date then raise exception 'This receipt is older than the verified ingredient cost. Save it without updating costs.'; end if;
      update public.ingredients set current_price_cents=new_price, supplier_name=p_data->>'store', exact_product_name=line->>'exact_product', price_verified_at=(p_data->>'purchased_on')::date, price_receipt_id=p_id where id=selected;
      insert into public.price_history (ingredient_id,price_cents,supplier_name,receipt_id,package_quantity,unit,exact_product_name) values (selected,new_price,p_data->>'store',p_id,ing.package_quantity,ing.unit,line->>'exact_product');
      changes := changes || jsonb_build_array(jsonb_build_object('ingredient_id',selected,'name',ing.name,'old_cents',ing.current_price_cents,'new_cents',new_price));
    end if;
  end loop;
  if p_apply and (cardinality(seen)=0 or total+(p_data->>'tax_cents')::numeric+(p_data->>'adjustment_cents')::numeric <> (p_data->>'total_cents')::numeric or (p_data->>'adjustment_cents')::numeric <> 0) then raise exception 'Reconcile all line amounts, tax and adjustments first'; end if;
  update public.receipts set data=p_data, status=case when p_apply then 'reviewed' else 'archived' end, reviewed_at=now(), version=version+1, applied_prices=changes where id=p_id returning * into r;
  return r;
end $$;
revoke all on function public.review_receipt(uuid,uuid,integer,jsonb,boolean) from public, anon, authenticated;
grant execute on function public.review_receipt(uuid,uuid,integer,jsonb,boolean) to service_role;
