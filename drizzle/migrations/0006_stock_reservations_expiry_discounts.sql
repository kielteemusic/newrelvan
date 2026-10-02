ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reserved_until timestamptz;

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
GRANT EXECUTE ON FUNCTION public.reserve_order(uuid, int) TO service_role;