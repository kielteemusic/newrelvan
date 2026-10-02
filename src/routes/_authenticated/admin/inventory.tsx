import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { stockLabel } from "@/lib/catalog";
import { useSession } from "@/lib/session-context";

export const Route = createFileRoute("/_authenticated/admin/inventory")({ component: Inventory });

function Inventory() {
  const qc = useQueryClient(); const { userId } = useSession();
  const { data } = useQuery({ queryKey: ["admin-inventory"], queryFn: async () => {
    const [p, s, log] = await Promise.all([supabase.from("products").select("id, name, sku, stock_quantity").order("stock_quantity"), supabase.from("site_settings").select("low_stock_threshold").maybeSingle(), supabase.from("inventory").select("*, products(name)").order("created_at", { ascending: false }).limit(20)]);
    return { products: p.data ?? [], low: s.data?.low_stock_threshold ?? 5, log: log.data ?? [] };
  } });
  const [changes, setChanges] = useState<Record<string, string>>({});
  const adjust = async (id: string, current: number) => {
    const change = Math.round(Number(changes[id])); if (!change) return;
    const next = Math.max(0, current + change);
    const { error } = await supabase.from("products").update({ stock_quantity: next }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("inventory").insert({ product_id: id, change, resulting_quantity: next, reason: "Manual adjustment", created_by: userId });
    setChanges({ ...changes, [id]: "" }); void qc.invalidateQueries({ queryKey: ["admin-inventory"] }); void qc.invalidateQueries({ queryKey: ["catalog"] });
  };
  return <div><h1 className="font-display text-4xl">Inventory</h1><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="text-left text-xs uppercase tracking-[0.1em] text-muted-foreground"><tr><th className="py-2">Product</th><th>SKU</th><th>Stock</th><th>Status</th><th>Adjust (+/−)</th></tr></thead><tbody className="divide-y divide-border">{data?.products.map((p) => { const label = stockLabel(p.stock_quantity, data.low); return <tr key={p.id}><td className="py-3">{p.name}</td><td>{p.sku ?? "—"}</td><td>{p.stock_quantity}</td><td className={label !== "In stock" ? "text-destructive" : ""}>{label === "Sold out" ? "Out of stock" : label}</td><td><div className="flex gap-2"><Input type="number" value={changes[p.id] ?? ""} onChange={(e) => setChanges({ ...changes, [p.id]: e.target.value })} className="h-9 w-20 rounded-none" /><Button size="sm" className="rounded-none" onClick={() => adjust(p.id, p.stock_quantity)}>Apply</Button></div></td></tr>; })}</tbody></table></div><h2 className="mt-10 font-display text-2xl">Recent changes</h2><ul className="mt-3 space-y-1 text-sm text-muted-foreground">{data?.log.map((l) => <li key={l.id}>{new Date(l.created_at).toLocaleString("en-NG")} · {l.products?.name} · {l.change > 0 ? "+" : ""}{l.change} → {l.resulting_quantity} ({l.reason})</li>)}</ul></div>;
}
