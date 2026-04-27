-- Bucket público para imagens de procedimentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública
CREATE POLICY "service_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

-- Apenas admins podem inserir
CREATE POLICY "service_images_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem atualizar
CREATE POLICY "service_images_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem deletar
CREATE POLICY "service_images_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));