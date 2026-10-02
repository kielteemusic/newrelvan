CREATE POLICY "admins manage product images objects" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "anyone reads product images objects" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images');