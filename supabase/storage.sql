-- ============================================================================
-- TradeMarco — Supabase Storage setup
--
-- Run after schema.sql, in the SQL Editor. Creates the two buckets the admin
-- panel uploads to (product images, PDF datasheets), both public-read so the
-- public site can link straight to the file, with writes restricted to
-- authenticated admins.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('datasheets', 'datasheets', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Public can view datasheets" on storage.objects;
create policy "Public can view datasheets"
  on storage.objects for select
  using (bucket_id = 'datasheets');

drop policy if exists "Admins can upload datasheets" on storage.objects;
create policy "Admins can upload datasheets"
  on storage.objects for insert
  with check (bucket_id = 'datasheets' and auth.role() = 'authenticated');

drop policy if exists "Admins can update datasheets" on storage.objects;
create policy "Admins can update datasheets"
  on storage.objects for update
  using (bucket_id = 'datasheets' and auth.role() = 'authenticated');

drop policy if exists "Admins can delete datasheets" on storage.objects;
create policy "Admins can delete datasheets"
  on storage.objects for delete
  using (bucket_id = 'datasheets' and auth.role() = 'authenticated');
