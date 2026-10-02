CREATE UNIQUE INDEX IF NOT EXISTS payments_reference_key ON public.payments(reference);

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
GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;