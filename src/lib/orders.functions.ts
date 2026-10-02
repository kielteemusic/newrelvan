import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

export type OrderItemInput = { productId: string; quantity: number };

export type PlaceOrderInput = {
  items: OrderItemInput[];
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  deliveryNotes?: string;
  discountCode?: string;
};

export type PlaceOrderResult =
  | { ok: true; orderId: string; orderNumber: string; total: number }
  | { ok: false; error: string };

export type DiscountResult =
  | { ok: true; code: string; amount: number; label: string }
  | { ok: false; error: string };

function text(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function currentUserId(): Promise<string | null> {
  const header = getRequestHeader("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  if (token.split(".").length !== 3) return null;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });
    const { data } = await client.auth.getClaims(token);
    return (data?.claims?.sub as string | undefined) ?? null;
  } catch {
    return null;
  }
}

function discountAmount(
  row: { discount_type: string; value: number | string; min_order: number | string },
  subtotal: number,
) {
  const value = Number(row.value);
  return row.discount_type === "fixed"
    ? Math.min(value, subtotal)
    : Math.round((subtotal * value) / 100);
}

export const checkDiscountCode = createServerFn({ method: "POST" })
  .validator((input: { code: string; subtotal: number }) => ({
    code: text(input.code, 40).toUpperCase(),
    subtotal: Math.max(0, Number(input.subtotal) || 0),
  }))
  .handler(async ({ data }): Promise<DiscountResult> => {
    if (!data.code) return { ok: false, error: "Enter a discount code." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("discount_codes")
      .select("*")
      .ilike("code", data.code)
      .eq("active", true)
      .maybeSingle();

    if (!row) return { ok: false, error: "That code is not valid." };
    if (row.expires_at && new Date(row.expires_at) < new Date())
      return { ok: false, error: "That code has expired." };
    if (row.usage_limit !== null && row.used_count >= row.usage_limit)
      return { ok: false, error: "That code has reached its limit." };
    if (data.subtotal < Number(row.min_order))
      return { ok: false, error: `Valid on orders above \u20a6${Number(row.min_order).toLocaleString("en-NG")}.` };

    return {
      ok: true,
      code: row.code,
      amount: discountAmount(row, data.subtotal),
      label: row.discount_type === "fixed" ? "Fixed discount" : `${Number(row.value)}% off`,
    };
  });

export const placeOrder = createServerFn({ method: "POST" })
  .validator((input: PlaceOrderInput) => ({
    items: (Array.isArray(input.items) ? input.items : [])
      .map((item) => ({
        productId: text(item.productId, 60),
        quantity: Math.min(50, Math.max(1, Math.floor(Number(item.quantity) || 1))),
      }))
      .filter((item) => item.productId),
    firstName: text(input.firstName, 80),
    lastName: text(input.lastName, 80),
    email: text(input.email, 160),
    phone: text(input.phone, 40),
    address: text(input.address, 300),
    city: text(input.city, 80),
    state: text(input.state, 80),
    country: text(input.country, 80),
    deliveryNotes: text(input.deliveryNotes, 600),
    discountCode: text(input.discountCode, 40),
  }))
  .handler(async ({ data }): Promise<PlaceOrderResult> => {
    if (!data.items.length) return { ok: false, error: "Your cart is empty." };
    if (!data.firstName || !data.lastName) return { ok: false, error: "Enter your full name." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { ok: false, error: "Enter a valid email address." };
    if (!data.address) return { ok: false, error: "Enter a delivery address." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await currentUserId();

    const { data: productRows, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, brand, price, stock_quantity, active")
      .in("id", data.items.map((item) => item.productId));
    if (productsError) return { ok: false, error: "We could not load your items. Please try again." };

    const lines: Array<{
      product_id: string;
      product_name: string;
      brand: string;
      unit_price: number;
      quantity: number;
      line_total: number;
      remaining: number;
    }> = [];

    for (const item of data.items) {
      const product = (productRows ?? []).find((row) => row.id === item.productId);
      if (!product || !product.active) return { ok: false, error: "One of your items is no longer available." };
      if (product.stock_quantity < item.quantity) {
        return {
          ok: false,
          error:
            product.stock_quantity <= 0
              ? `${product.name} has sold out.`
              : `Only ${product.stock_quantity} left of ${product.name}.`,
        };
      }
      const unitPrice = Number(product.price);
      lines.push({
        product_id: product.id,
        product_name: product.name,
        brand: product.brand,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: unitPrice * item.quantity,
        remaining: product.stock_quantity - item.quantity,
      });
    }

    const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);

    const { data: settings } = await supabaseAdmin
      .from("site_settings")
      .select("delivery_fee, free_delivery_threshold")
      .limit(1)
      .maybeSingle();
    const freeThreshold = Number(settings?.free_delivery_threshold ?? 75000);
    const deliveryFee = subtotal >= freeThreshold ? 0 : Number(settings?.delivery_fee ?? 3500);

    let discountValue = 0;
    let discountCode: string | null = null;
    if (data.discountCode) {
      const { data: codeRow } = await supabaseAdmin
        .from("discount_codes")
        .select("*")
        .ilike("code", data.discountCode)
        .eq("active", true)
        .maybeSingle();
      const usable =
        codeRow &&
        (!codeRow.expires_at || new Date(codeRow.expires_at) >= new Date()) &&
        (codeRow.usage_limit === null || codeRow.used_count < codeRow.usage_limit) &&
        subtotal >= Number(codeRow.min_order);
      if (usable && codeRow) {
        discountValue = discountAmount(codeRow, subtotal);
        discountCode = codeRow.code; // usage is counted only once payment is confirmed
      }
    }

    const total = Math.max(0, subtotal + deliveryFee - discountValue);
    const { data: orderNumberData } = await supabaseAdmin.rpc("next_order_number");
    const orderNumber = (orderNumberData as string | null) ?? `RL-${Date.now()}`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        address: data.address,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        delivery_notes: data.deliveryNotes || null,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: discountValue,
        discount_code: discountCode,
        total,
        status: "Pending Payment",
        payment_status: "Pending",
      })
      .select("id, order_number")
      .single();
    if (orderError || !order) return { ok: false, error: "We could not create your order. Please try again." };

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      lines.map((line) => ({
        order_id: order.id,
        product_id: line.product_id,
        product_name: line.product_name,
        brand: line.brand,
        unit_price: line.unit_price,
        quantity: line.quantity,
        line_total: line.line_total,
      })),
    );
    if (itemsError) return { ok: false, error: "We could not save your order items. Please try again." };

    // Hold stock for 30 minutes (atomic, row-locked). Stock itself is only reduced on confirmed payment.
    const { data: reserved, error: reserveError } = await supabaseAdmin.rpc("reserve_order", { _order_id: order.id, _minutes: 30 });
    const r = reserved as { ok: boolean; error?: string } | null;
    if (reserveError || !r?.ok) return { ok: false, error: r?.error ?? "We could not reserve your items. Please try again." };

    if (userId) await supabaseAdmin.from("cart_items").delete().eq("user_id", userId);

    return { ok: true, orderId: order.id, orderNumber: order.order_number, total };
  });
