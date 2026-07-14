
-- Storage policies for client-photos bucket
CREATE POLICY "client_photos_admin_all_storage"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'client-photos' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'client-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "client_photos_prof_read_storage"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'client-photos'
  AND public.has_role(auth.uid(), 'profissional')
);

CREATE POLICY "client_photos_prof_write_storage"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'client-photos'
  AND public.has_role(auth.uid(), 'profissional')
);
