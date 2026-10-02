-- Remove demo / seed catalog rows (safe to re-run). Keep categories & settings.
-- Run this on any DB that still has Lovable/demo products.

DELETE FROM public.reviews;
DELETE FROM public.product_images;
DELETE FROM public.product_variants;
DELETE FROM public.inventory;
DELETE FROM public.wishlists;
DELETE FROM public.cart_items;
DELETE FROM public.order_items;
DELETE FROM public.payments;
DELETE FROM public.orders;
DELETE FROM public.products;
DELETE FROM public.discount_codes;

UPDATE public.categories SET image_url = NULL WHERE image_url LIKE '/products/%';
