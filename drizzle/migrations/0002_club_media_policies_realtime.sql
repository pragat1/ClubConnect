create policy "club-media read for signed in" on storage.objects for select to authenticated using (bucket_id = 'club-media');
create policy "club-media upload own folder" on storage.objects for insert to authenticated with check (bucket_id = 'club-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "club-media delete own" on storage.objects for delete to authenticated using (bucket_id = 'club-media' and owner = auth.uid());
alter publication supabase_realtime add table public.notifications;