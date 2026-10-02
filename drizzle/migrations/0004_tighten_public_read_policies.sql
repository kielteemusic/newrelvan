DROP POLICY IF EXISTS "categories public read" ON public.categories;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated
USING (active OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "variants public read" ON public.product_variants;
CREATE POLICY "variants public read" ON public.product_variants FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variants.product_id AND p.active) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "product images public read" ON public.product_images;
CREATE POLICY "product images public read" ON public.product_images FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_images.product_id AND p.active) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "settings public read" ON public.site_settings;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated
USING (id = true);

DROP POLICY IF EXISTS "anyone reads product images objects" ON storage.objects;