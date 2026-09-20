create policy "own manuscrits objects"
on storage.objects
for all
using (
  bucket_id = 'manuscrits'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'manuscrits'
  and (storage.foldername(name))[1] = auth.uid()::text
);
