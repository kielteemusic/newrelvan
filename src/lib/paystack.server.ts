// Server-only Paystack helpers. Never import from client code.

const PAYSTACK_API = "https://api.paystack.co";

export function paystackKey() {
  const key = process.env["PAYSTACK_SECRET_KEY"];
  if (!key) throw new Error("Paystack secret key is not configured (PAYSTACK_SECRET_KEY).");
  return key;
}

export async function paystackInitialize(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<{ ok: true; authorizationUrl: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    });
    const body = (await res.json()) as {
      status: boolean;
      message?: string;
      data?: { authorization_url?: string };
    };
    if (!res.ok || !body.status || !body.data?.authorization_url) {
      return { ok: false, error: body.message || "Paystack could not start the payment." };
    }
    return { ok: true, authorizationUrl: body.data.authorization_url };
  } catch {
    return { ok: false, error: "We could not reach the payment service. Please try again." };
  }
}

export async function paystackVerify(reference: string): Promise<
  | { ok: true; status: string; amountKobo: number; paidAt: string | null }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(
      `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${paystackKey()}` } },
    );
    const body = (await res.json()) as {
      status: boolean;
      message?: string;
      data?: { status?: string; amount?: number; paid_at?: string | null };
    };
    if (!res.ok || !body.status || !body.data) {
      return { ok: false, error: body.message || "We could not verify the payment." };
    }
    return {
      ok: true,
      status: body.data.status ?? "unknown",
      amountKobo: Number(body.data.amount ?? 0),
      paidAt: body.data.paid_at ?? null,
    };
  } catch {
    return { ok: false, error: "We could not reach the payment service. Please try again." };
  }
}

/**
 * Idempotently mark an order as paid after a confirmed Paystack success.
 * Safe to call from both the return-page verification and the webhook.
 */
export async function finalizePaidOrder(
  reference: string,
  amountKobo: number,
  paidAt: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("finalize_paid_order", {
    _reference: reference,
    _amount_kobo: amountKobo,
    _paid_at: paidAt ?? new Date().toISOString(),
  });
  if (error) return { ok: false, error: "Payment could not be confirmed." };
  const r = data as { ok: boolean; error?: string; already?: boolean };

  // Only email on a fresh finalization (webhook + verify race → one email).
  if (r.ok && !r.already) {
    try {
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("order_id")
        .eq("reference", reference)
        .maybeSingle();
      if (payment?.order_id) {
        const { sendOrderConfirmationEmail } = await import("@/lib/email.server");
        void sendOrderConfirmationEmail(payment.order_id).catch((err) =>
          console.error("[email] order confirmation failed", err),
        );
      }
    } catch (err) {
      console.error("[email] could not queue confirmation", err);
    }
  }

  return r.error ? { ok: r.ok, error: r.error } : { ok: r.ok };
}
