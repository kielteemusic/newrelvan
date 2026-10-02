import { Resend } from "resend";

function resendClient() {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return null;
  return new Resend(key);
}

function fromAddress() {
  return process.env["RESEND_FROM_EMAIL"] || "RELVAN LUMINA <onboarding@resend.dev>";
}

function siteUrl() {
  return (process.env["SITE_URL"] || "http://localhost:3000").replace(/\/$/, "");
}

function formatNaira(amount: number) {
  return `\u20a6${Number(amount).toLocaleString("en-NG")}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Send order confirmation after a successful Paystack payment. */
export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping order confirmation");
    return;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, email, first_name, last_name, total, subtotal, discount_amount, status, payment_status, address, city, state, country",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.email) return;

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_name, quantity, unit_price, line_total")
    .eq("order_id", orderId);

  const rows = (items ?? [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e8e4dc;">${escapeHtml(item.product_name ?? "Item")}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e8e4dc;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e8e4dc;text-align:right;">${formatNaira(Number(item.line_total ?? 0))}</td>
        </tr>`,
    )
    .join("");

  const name = [order.first_name, order.last_name].filter(Boolean).join(" ") || "there";
  const accountUrl = `${siteUrl()}/account`;

  const html = `
  <div style="font-family:Georgia,serif;background:#f7f4ef;padding:32px 16px;color:#1c1c1c;">
    <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e8e4dc;">
      <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#2f6f5e;">RELVAN LUMINA</p>
      <h1 style="font-size:28px;margin:12px 0 8px;">Payment confirmed</h1>
      <p style="margin:0 0 24px;line-height:1.6;color:#555;">Hi ${escapeHtml(name)}, thank you for your order. We've received payment for <strong>${escapeHtml(order.order_number)}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #1c1c1c;">Item</th>
            <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #1c1c1c;">Qty</th>
            <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #1c1c1c;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:24px 0 0;font-family:system-ui,sans-serif;font-size:15px;text-align:right;">
        <strong>Order total: ${formatNaira(Number(order.total))}</strong>
      </p>
      <p style="margin:24px 0 0;line-height:1.6;color:#555;font-family:system-ui,sans-serif;font-size:14px;">
        We'll start preparing your order and update you about delivery.
        You can review your orders anytime in your <a href="${accountUrl}" style="color:#2f6f5e;">account</a>.
      </p>
      <p style="margin:32px 0 0;font-size:12px;color:#888;font-family:system-ui,sans-serif;">© RELVAN LUMINA</p>
    </div>
  </div>`;

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: order.email,
    subject: `Order ${order.order_number} confirmed — RELVAN LUMINA`,
    html,
  });

  if (error) throw new Error(error.message);
}

export type ContactMessageInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

/** Forward a contact-form submission to the store inbox + acknowledge the sender. */
export async function sendContactEmails(input: ContactMessageInput): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    throw new Error("Email is not configured yet. Please try WhatsApp or email us directly.");
  }

  const to = process.env["CONTACT_TO_EMAIL"] || "hello@relvanlumina.com";
  const safeName = escapeHtml(input.name);
  const safeSubject = escapeHtml(input.subject);
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br/>");

  const inboxHtml = `
  <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#1c1c1c;">
    <p><strong>From:</strong> ${safeName} &lt;${escapeHtml(input.email)}&gt;</p>
    <p><strong>Subject:</strong> ${safeSubject}</p>
    <hr style="border:none;border-top:1px solid #e8e4dc;margin:16px 0;" />
    <p>${safeMessage}</p>
  </div>`;

  const { error: inboxError } = await resend.emails.send({
    from: fromAddress(),
    to,
    replyTo: input.email,
    subject: `[Contact] ${input.subject}`,
    html: inboxHtml,
  });
  if (inboxError) throw new Error(inboxError.message);

  const ackHtml = `
  <div style="font-family:Georgia,serif;background:#f7f4ef;padding:32px 16px;color:#1c1c1c;">
    <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e8e4dc;">
      <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#2f6f5e;">RELVAN LUMINA</p>
      <h1 style="font-size:28px;margin:12px 0 8px;">We got your note</h1>
      <p style="margin:0;line-height:1.6;color:#555;">Hi ${safeName}, thanks for reaching out. Our care team will reply as soon as we can.</p>
      <p style="margin:24px 0 0;font-size:12px;color:#888;font-family:system-ui,sans-serif;">© RELVAN LUMINA</p>
    </div>
  </div>`;

  const { error: ackError } = await resend.emails.send({
    from: fromAddress(),
    to: input.email,
    subject: "We received your message — RELVAN LUMINA",
    html: ackHtml,
  });
  if (ackError) console.error("[email] contact acknowledgement failed", ackError);
}
