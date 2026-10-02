import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/cron/expire-orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("expire_pending_orders");
        if (error) {
          console.error("[cron] expire_pending_orders", error);
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ ok: true, expired: data ?? 0 }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
