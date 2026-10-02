import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin/customers")({ component: Customers });

function Customers() {
  const { data } = useQuery({ queryKey: ["admin-customers"], queryFn: async () => {
    const [p, o] = await Promise.all([supabase.from("profiles").select("*").order("created_at", { ascending: false }), supabase.from("orders").select("id, user_id, order_number, total, status, created_at").not("user_id", "is", null)]);
    return { profiles: p.data ?? [], orders: o.data ?? [] };
  } });
  const [open, setOpen] = useState<string | null>(null);
  return <div><h1 className="font-display text-4xl">Customers</h1><div className="mt-6 divide-y divide-border border-y border-border">{data?.profiles.map((c) => { const orders = data.orders.filter((o) => o.user_id === c.id); return <div key={c.id} className="py-3 text-sm"><button className="grid w-full gap-1 text-left sm:grid-cols-[1fr_1fr_auto_auto] sm:gap-4" onClick={() => setOpen(open === c.id ? null : c.id)}><strong>{c.full_name || "—"}</strong><span>{c.email} {c.phone && `· ${c.phone}`}</span><span className="text-muted-foreground">Joined {new Date(c.created_at).toLocaleDateString("en-NG")}</span><span>{orders.length} orders</span></button>{open === c.id && <div className="mt-3 bg-secondary/40 p-4">{orders.length ? orders.map((o) => <p key={o.id}>{o.order_number} · {o.status} · {formatPrice(Number(o.total))}</p>) : <p className="text-muted-foreground">No orders yet.</p>}</div>}</div>; })}</div></div>;
}
