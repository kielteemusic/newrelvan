import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { productId: string; rating: number; review: string }) => ({
    productId: String(input.productId).slice(0, 60),
    rating: Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5))),
    review: String(input.review ?? "").trim().slice(0, 2000),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Only customers with a paid/delivered order containing this product may review.
    const { data: orders } = await supabase
      .from("orders")
      .select("id, first_name, last_name, payment_status, status, order_items!inner(product_id)")
      .eq("user_id", userId)
      .eq("order_items.product_id", data.productId);
    const eligible = (orders ?? []).find((o) => o.payment_status === "Successful" || o.status === "Delivered");
    if (!eligible) return { ok: false as const, error: "Only customers who have purchased this product can review it." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("reviews").insert({
      product_id: data.productId,
      user_id: userId,
      order_id: eligible.id,
      customer_name: `${eligible.first_name} ${eligible.last_name.charAt(0)}.`,
      rating: data.rating,
      review: data.review,
      verified: true,
      approved: false,
    });
    if (error) return { ok: false as const, error: "Could not save your review." };
    return { ok: true as const };
  });
