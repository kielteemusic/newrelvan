import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

export type InitializePaymentResult =
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: false; error: string };

export type VerifyPaymentResult =
  | { ok: true; paid: boolean; orderId: string; orderNumber: string; total: number }
  | { ok: false; error: string };

export const initializePayment = createServerFn({ method: "POST" })
  .validator((input: { orderId?: string; orderNumber?: string }) => ({
    orderId: typeof input.orderId === "string" ? input.orderId.slice(0, 60) : "",
    orderNumber: typeof input.orderNumber === "string" ? input.orderNumber.slice(0, 40) : "",
  }))
  .handler(async ({ data }): Promise<InitializePaymentResult> => {
    if (!data.orderId && !data.orderNumber) return { ok: false, error: "Missing order." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { paystackInitialize } = await import("./paystack.server");

    await supabaseAdmin.rpc("expire_pending_orders");

    let orderQuery = supabaseAdmin
      .from("orders")
      .select("id, order_number, email, total, payment_status, status");
    orderQuery = data.orderId
      ? orderQuery.eq("id", data.orderId)
      : orderQuery.eq("order_number", data.orderNumber);

    const { data: order } = await orderQuery.maybeSingle();
    if (!order) return { ok: false, error: "We could not find that order." };
    if (order.payment_status === "Successful")
      return { ok: false, error: "That order is already paid." };
    if (order.status === "Cancelled")
      return { ok: false, error: "This order has expired. Please place a new order." };

    const reference = `${order.order_number}-${Date.now().toString(36)}`;
    const origin = new URL(getRequestUrl()).origin;
    const callbackUrl = `${origin}/order-received?reference=${encodeURIComponent(reference)}`;

    const initialized = await paystackInitialize({
      email: order.email,
      amountKobo: Math.round(Number(order.total) * 100),
      reference,
      callbackUrl,
      metadata: { order_id: order.id, order_number: order.order_number },
    });
    if (!initialized.ok) return { ok: false, error: initialized.error };

    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      provider: "paystack",
      reference,
      amount: order.total,
      status: "Pending",
    });
    if (paymentError)
      return { ok: false, error: "We could not record the payment. Please try again." };

    return { ok: true, authorizationUrl: initialized.authorizationUrl, reference };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .validator((input: { reference: string }) => ({
    reference: typeof input.reference === "string" ? input.reference.slice(0, 80) : "",
  }))
  .handler(async ({ data }): Promise<VerifyPaymentResult> => {
    if (!data.reference) return { ok: false, error: "Missing payment reference." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { paystackVerify, finalizePaidOrder } = await import("./paystack.server");

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, status")
      .eq("reference", data.reference)
      .maybeSingle();
    if (!payment) return { ok: false, error: "We could not find that payment." };

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total")
      .eq("id", payment.order_id)
      .single();
    if (!order) return { ok: false, error: "We could not find that order." };

    const base = {
      orderId: order.id,
      orderNumber: order.order_number,
      total: Number(order.total),
    };

    if (payment.status === "Successful") {
      return { ok: true, paid: true, ...base };
    }

    const verified = await paystackVerify(data.reference);
    if (!verified.ok) return { ok: false, error: verified.error };

    if (verified.status === "success") {
      const finalized = await finalizePaidOrder(data.reference, verified.amountKobo, verified.paidAt);
      if (!finalized.ok) return { ok: false, error: finalized.error ?? "Payment could not be confirmed." };
      return { ok: true, paid: true, ...base };
    }

    if (verified.status === "failed" || verified.status === "abandoned") {
      await supabaseAdmin.from("payments").update({ status: "Failed" }).eq("id", payment.id);
    }
    return { ok: true, paid: false, ...base };
  });
