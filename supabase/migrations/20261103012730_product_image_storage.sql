-- Product photos are public storefront assets. Receipt storage remains private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Resolve the site's two existing administrators once at migration time.
-- Future signups do not automatically gain upload access.
do $$
declare
  admin_ids uuid[];
begin
  select array_agg(id order by id) into admin_ids
  from auth.users
  where lower(email) in ('davisopp@docodelab.com', 'jensgourmetbites@gmail.com')
    and not coalesce(is_anonymous, false)
    and deleted_at is null;
  if coalesce(cardinality(admin_ids), 0) <> 2 then
    raise exception 'Expected both existing site administrators; refusing to grant upload access';
  end if;
  execute format(
    'create policy "Site administrators can upload product images"
     on storage.objects for insert to authenticated
     with check (bucket_id = %L and (select auth.uid()) = any (%L::uuid[]))',
    'product-images', admin_ids::text
  );
end
$$;
