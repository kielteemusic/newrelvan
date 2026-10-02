import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { paystackKey } from "@/lib/paystack.server";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let secret: string;
        try {
          secret = paystackKey();
        } catch {
          return new Response("Not configured", { status: 500 });
        }

        const signature = request.headers.get("x-paystack-signature");
        const body = await request.text();

        const expected = createHmac("sha512", secret).update(body).digest("hex");
        const valid =
          signature &&
          signature.length === expected.length &&
          timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
        if (!valid) return new Response("Invalid signature", { status: 401 });

        let event: {
          event?: string;
          data?: { reference?: string; amount?: number; paid_at?: string | null };
        };
        try {
          event = JSON.parse(body);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        if (event.event === "charge.success" && event.data?.reference) {
          const { finalizePaidOrder } = await import("@/lib/paystack.server");
          await finalizePaidOrder(
            event.data.reference,
            Number(event.data.amount ?? 0),
            event.data.paid_at ?? null,
          );
        }

        return new Response("ok");
      },
    },
  },
});
