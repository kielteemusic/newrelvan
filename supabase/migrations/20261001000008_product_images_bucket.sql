-- Private storage bucket for product photos (10 MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-images', 'product-images', false, 10485760)
ON CONFLICT (id) DO NOTHING;
