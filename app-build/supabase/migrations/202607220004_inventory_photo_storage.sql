insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('inventory-photos','inventory-photos',false,12582912,array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "Collectors insert their inventory photos"
on storage.objects for insert to authenticated
with check (bucket_id='inventory-photos' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Collectors read their inventory photos"
on storage.objects for select to authenticated
using (bucket_id='inventory-photos' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Collectors update their inventory photos"
on storage.objects for update to authenticated
using (bucket_id='inventory-photos' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='inventory-photos' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Collectors delete their inventory photos"
on storage.objects for delete to authenticated
using (bucket_id='inventory-photos' and (storage.foldername(name))[1]=auth.uid()::text);
