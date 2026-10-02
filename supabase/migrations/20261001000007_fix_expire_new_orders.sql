CREATE OR REPLACE FUNCTION public.expire_pending_orders()
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
GRANT EXECUTE ON FUNCTION public.expire_pending_orders() TO service_role;