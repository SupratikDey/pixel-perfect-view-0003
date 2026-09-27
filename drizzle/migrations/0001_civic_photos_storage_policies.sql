-- Signed-in users may upload into the civic-photos bucket under their own user folder
create policy "civic photos upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'civic-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Any signed-in user may read civic evidence photos (needed for citizens, workers, admins)
create policy "civic photos readable by authenticated" on storage.objects for select to authenticated
  using (bucket_id = 'civic-photos');

-- Uploaders may replace or remove their own files
create policy "civic photos update own" on storage.objects for update to authenticated
  using (bucket_id = 'civic-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "civic photos delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'civic-photos' and (storage.foldername(name))[1] = auth.uid()::text);
