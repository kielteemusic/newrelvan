-- ============ roles ============
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ categories ============
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_touch BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ products ============
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  brand text NOT NULL DEFAULT 'RELVAN LUMINA',
  description text,
  short_description text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(12,2),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sku text UNIQUE,
  stock_quantity int NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  size text,
  skin_type text[] NOT NULL DEFAULT '{}',
  skin_concerns text[] NOT NULL DEFAULT '{}',
  benefits text[] NOT NULL DEFAULT '{}',
  ingredients text[] NOT NULL DEFAULT '{}',
  how_to_use text,
  featured boolean NOT NULL DEFAULT false,
  best_seller boolean NOT NULL DEFAULT false,
  new_arrival boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_active_idx ON public.products(active);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ product_images ============
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_images_product_idx ON public.product_images(product_id);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product images public read" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "product images admin write" ON public.product_images FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ product_variants ============
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  price numeric(12,2),
  stock_quantity int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_variants_product_idx ON public.product_variants(product_id);
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variants public read" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "variants admin write" ON public.product_variants FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ inventory (adjustment ledger) ============
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  change int NOT NULL,
  resulting_quantity int NOT NULL,
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inventory_product_idx ON public.inventory(product_id);
GRANT SELECT, INSERT ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory admin all" ON public.inventory FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ addresses ============
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  address text NOT NULL,
  city text,
  state text,
  country text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX addresses_user_idx ON public.addresses(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ cart_items ============
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON public.cart_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER cart_touch BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ wishlists ============
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist" ON public.wishlists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ discount_codes ============
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  value numeric(12,2) NOT NULL CHECK (value > 0),
  min_order numeric(12,2) NOT NULL DEFAULT 0,
  expires_at timestamptz,
  usage_limit int,
  used_count int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_codes TO authenticated;
GRANT ALL ON public.discount_codes TO service_role;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discounts admin all" ON public.discount_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER discounts_touch BEFORE UPDATE ON public.discount_codes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ orders ============
CREATE SEQUENCE public.order_number_seq START 1;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  city text,
  state text,
  country text,
  delivery_notes text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  discount_code text,
  total numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending Payment' CHECK (status IN ('Pending Payment','Paid','Processing','Ready for Delivery','Shipped','Delivered','Cancelled','Refunded')),
  payment_status text NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending','Successful','Failed','Refunded')),
  tracking_number text,
  tracking_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON public.orders(user_id);
CREATE INDEX orders_created_idx ON public.orders(created_at DESC);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin orders all" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS text LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'RL-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0')
$$;

-- ============ order_items ============
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  brand text,
  image_url text,
  unit_price numeric(12,2) NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  line_total numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own order items read" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "admin order items all" ON public.order_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ payments ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'paystack',
  reference text,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Successful','Failed','Refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON public.payments(order_id);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments read" ON public.payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "admin payments all" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ reviews ============
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  photo_url text,
  verified boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reviews_product_idx ON public.reviews(product_id);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (approved = true);
CREATE POLICY "own reviews read" ON public.reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin reviews all" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ site_settings ============
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  business_name text NOT NULL DEFAULT 'RELVAN LUMINA',
  whatsapp text NOT NULL DEFAULT '+234 800 000 0000',
  instagram text NOT NULL DEFAULT '@relvanlumina',
  email text NOT NULL DEFAULT 'hello@relvanlumina.com',
  currency text NOT NULL DEFAULT 'NGN',
  delivery_fee numeric(12,2) NOT NULL DEFAULT 3500,
  free_delivery_threshold numeric(12,2) NOT NULL DEFAULT 75000,
  low_stock_threshold int NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (id) VALUES (true);

-- ============ seed categories ============
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Cleansers', 'cleansers', 'A fresh, balanced beginning', 1),
  ('Toners', 'toners', 'Prep and replenish', 2),
  ('Serums', 'serums', 'Targeted daily concentrates', 3),
  ('Moisturisers', 'moisturisers', 'Comfort that lasts', 4),
  ('Sunscreen', 'sunscreen', 'Elegant everyday protection', 5),
  ('Masks', 'masks', 'A restorative weekly ritual', 6),
  ('Treatments', 'treatments', 'Focused care for visible results', 7),
  ('Sets & Bundles', 'sets-bundles', 'Complete, considered routines', 8);

-- Catalog products / images / reviews are added via Admin — no demo seed data.

CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_key ON public.cart_items (user_id, product_id);
CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_product_key ON public.wishlists (user_id, product_id);CREATE POLICY "admins manage product images objects" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "anyone reads product images objects" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images');DROP POLICY IF EXISTS "categories public read" ON public.categories;
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

DROP POLICY IF EXISTS "anyone reads product images objects" ON storage.objects;CREATE UNIQUE INDEX IF NOT EXISTS payments_reference_key ON public.payments(reference);

CREATE OR REPLACE FUNCTION public.finalize_paid_order(_reference text, _amount_kobo bigint, _paid_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; o record; it record; cur int; rem int; short boolean := false;
BEGIN
  SELECT * INTO p FROM payments WHERE reference = _reference FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Unknown payment reference.'); END IF;
  SELECT * INTO o FROM orders WHERE id = p.order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Order not found.'); END IF;
  IF p.status = 'Successful' OR o.payment_status = 'Successful' THEN
    UPDATE payments SET status = 'Successful', paid_at = COALESCE(paid_at, _paid_at) WHERE id = p.id AND status <> 'Successful';
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;
  IF round(o.total * 100)::bigint <> _amount_kobo THEN
    UPDATE payments SET status = 'Failed' WHERE id = p.id;
    RETURN jsonb_build_object('ok', false, 'error', 'Payment amount does not match the order total.');
  END IF;
  UPDATE payments SET status = 'Successful', paid_at = _paid_at WHERE id = p.id;
  FOR it IN SELECT product_id, quantity FROM order_items WHERE order_id = o.id AND product_id IS NOT NULL ORDER BY product_id LOOP
    SELECT stock_quantity INTO cur FROM products WHERE id = it.product_id FOR UPDATE;
    IF cur IS NULL THEN CONTINUE; END IF;
    IF cur < it.quantity THEN short := true; END IF;
    rem := GREATEST(0, cur - it.quantity);
    UPDATE products SET stock_quantity = rem WHERE id = it.product_id;
    INSERT INTO inventory(product_id, change, resulting_quantity, reason)
      VALUES (it.product_id, rem - cur, rem, CASE WHEN cur < it.quantity THEN 'Order paid — STOCK SHORTFALL (' || _reference || ')' ELSE 'Order paid (' || _reference || ')' END);
  END LOOP;
  UPDATE orders SET payment_status = 'Successful', status = 'Paid',
    tracking_note = CASE WHEN short THEN 'ATTENTION: paid but stock was insufficient — contact customer / refund.' ELSE tracking_note END
  WHERE id = o.id;
  RETURN jsonb_build_object('ok', true, 'shortfall', short);
END $$;

REVOKE ALL ON FUNCTION public.finalize_paid_order(text, bigint, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order(text, bigint, timestamptz) TO service_role;
REVOKE EXECUTE ON FUNCTION public.next_order_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reserved_until timestamptz;

CREATE OR REPLACE FUNCTION public.expire_pending_orders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  WITH x AS (
    UPDATE orders SET status = 'Cancelled', payment_status = 'Failed',
      tracking_note = COALESCE(tracking_note, 'Expired: payment not completed in time.')
    WHERE status = 'Pending Payment' AND payment_status = 'Pending'
      AND (reserved_until IS NULL OR reserved_until < now())
    RETURNING id)
  SELECT count(*) INTO n FROM x;
  UPDATE payments SET status = 'Failed' WHERE status = 'Pending'
    AND order_id IN (SELECT id FROM orders WHERE status = 'Cancelled');
  RETURN n;
END $$;

-- Atomically reserve stock for a just-created order. Rows are locked so two buyers
-- of the last item are serialized; the loser's order is cancelled.
CREATE OR REPLACE FUNCTION public.reserve_order(_order_id uuid, _minutes int DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE it record; stock int; held int; pname text;
BEGIN
  PERFORM expire_pending_orders();
  FOR it IN SELECT product_id, quantity FROM order_items WHERE order_id = _order_id AND product_id IS NOT NULL ORDER BY product_id LOOP
    SELECT stock_quantity, name INTO stock, pname FROM products WHERE id = it.product_id FOR UPDATE;
    SELECT COALESCE(sum(oi.quantity), 0) INTO held FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = it.product_id AND o.id <> _order_id
        AND o.status = 'Pending Payment' AND o.payment_status = 'Pending' AND o.reserved_until > now();
    IF stock - held < it.quantity THEN
      UPDATE orders SET status = 'Cancelled', payment_status = 'Failed', tracking_note = 'Not enough stock at checkout.' WHERE id = _order_id;
      RETURN jsonb_build_object('ok', false, 'error',
        CASE WHEN stock - held <= 0 THEN pname || ' has just sold out.' ELSE 'Only ' || (stock - held) || ' left of ' || pname || '.' END);
    END IF;
  END LOOP;
  UPDATE orders SET reserved_until = now() + make_interval(mins => _minutes) WHERE id = _order_id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.finalize_paid_order(_reference text, _amount_kobo bigint, _paid_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; o record; it record; cur int; rem int; short boolean := false;
BEGIN
  SELECT * INTO p FROM payments WHERE reference = _reference FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Unknown payment reference.'); END IF;
  SELECT * INTO o FROM orders WHERE id = p.order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Order not found.'); END IF;
  IF p.status = 'Successful' OR o.payment_status = 'Successful' THEN
    UPDATE payments SET status = 'Successful', paid_at = COALESCE(paid_at, _paid_at) WHERE id = p.id AND status <> 'Successful';
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;
  IF round(o.total * 100)::bigint <> _amount_kobo THEN
    UPDATE payments SET status = 'Failed' WHERE id = p.id;
    RETURN jsonb_build_object('ok', false, 'error', 'Payment amount does not match the order total.');
  END IF;
  UPDATE payments SET status = 'Successful', paid_at = _paid_at WHERE id = p.id;
  FOR it IN SELECT product_id, quantity FROM order_items WHERE order_id = o.id AND product_id IS NOT NULL ORDER BY product_id LOOP
    SELECT stock_quantity INTO cur FROM products WHERE id = it.product_id FOR UPDATE;
    IF cur IS NULL THEN CONTINUE; END IF;
    IF cur < it.quantity THEN short := true; END IF;
    rem := GREATEST(0, cur - it.quantity);
    UPDATE products SET stock_quantity = rem WHERE id = it.product_id;
    INSERT INTO inventory(product_id, change, resulting_quantity, reason)
      VALUES (it.product_id, rem - cur, rem, CASE WHEN cur < it.quantity THEN 'Order paid — STOCK SHORTFALL (' || _reference || ')' ELSE 'Order paid (' || _reference || ')' END);
  END LOOP;
  IF o.discount_code IS NOT NULL THEN
    UPDATE discount_codes SET used_count = used_count + 1 WHERE code = o.discount_code;
  END IF;
  UPDATE orders SET payment_status = 'Successful', status = 'Paid',
    tracking_note = CASE WHEN short THEN 'ATTENTION: paid but stock was insufficient — contact customer / refund.'
                         WHEN o.status = 'Cancelled' THEN NULL ELSE tracking_note END
  WHERE id = o.id;
  RETURN jsonb_build_object('ok', true, 'shortfall', short);
END $$;

REVOKE ALL ON FUNCTION public.expire_pending_orders() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_order(uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_orders() TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_order(uuid, int) TO service_role;CREATE OR REPLACE FUNCTION public.expire_pending_orders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  WITH x AS (
    UPDATE orders SET status = 'Cancelled', payment_status = 'Failed',
      tracking_note = COALESCE(tracking_note, 'Expired: payment not completed in time.')
    WHERE status = 'Pending Payment' AND payment_status = 'Pending'
      AND COALESCE(reserved_until, created_at + interval '30 minutes') < now()
    RETURNING id)
  SELECT count(*) INTO n FROM x;
  UPDATE payments SET status = 'Failed' WHERE status = 'Pending'
    AND order_id IN (SELECT id FROM orders WHERE status = 'Cancelled');
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.expire_pending_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_orders() TO service_role;-- Private storage bucket for product photos (10 MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-images', 'product-images', false, 10485760)
ON CONFLICT (id) DO NOTHING;
