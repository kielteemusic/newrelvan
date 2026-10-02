import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin/discounts")({ component: Discounts });

function Discounts() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-discounts"], queryFn: async () => (await supabase.from("discount_codes").select("*").order("created_at", { ascending: false })).data ?? [] });
  const blank = { code: "", discount_type: "percentage", value: "", min_order: "0", expires_at: "", usage_limit: "" };
  const [f, setF] = useState(blank);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin-discounts"] });
  const add = async (e: FormEvent) => { e.preventDefault(); const { error } = await supabase.from("discount_codes").insert({ code: f.code.trim().toUpperCase(), discount_type: f.discount_type, value: Number(f.value), min_order: Number(f.min_order) || 0, expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null, usage_limit: f.usage_limit ? Number(f.usage_limit) : null }); if (error) toast.error(error.message); else { setF(blank); refresh(); } };
  return <div><h1 className="font-display text-4xl">Discounts</h1><form onSubmit={add} className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-7"><Input required placeholder="CODE" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} className="rounded-none" /><select value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value })} className="h-10 border border-input bg-background px-2 text-sm"><option value="percentage">Percentage</option><option value="fixed">Fixed (₦)</option></select><Input required type="number" placeholder="Value" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} className="rounded-none" /><Input type="number" placeholder="Min order" value={f.min_order} onChange={(e) => setF({ ...f, min_order: e.target.value })} className="rounded-none" /><Input type="date" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} className="rounded-none" /><Input type="number" placeholder="Usage limit" value={f.usage_limit} onChange={(e) => setF({ ...f, usage_limit: e.target.value })} className="rounded-none" /><Button className="rounded-none">ADD</Button></form><div className="mt-6 divide-y divide-border border-y border-border">{data.map((d) => <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span><strong>{d.code}</strong> · {d.discount_type === "percentage" ? `${d.value}%` : formatPrice(Number(d.value))} off · min {formatPrice(Number(d.min_order))} · used {d.used_count}{d.usage_limit ? `/${d.usage_limit}` : ""}{d.expires_at ? ` · expires ${new Date(d.expires_at).toLocaleDateString("en-NG")}` : ""}</span><div className="flex gap-2"><Button size="sm" variant="outline" className="rounded-none" onClick={async () => { await supabase.from("discount_codes").update({ active: !d.active }).eq("id", d.id); refresh(); }}>{d.active ? "Deactivate" : "Activate"}</Button><Button size="sm" variant="ghost" className="rounded-none text-destructive" onClick={async () => { await supabase.from("discount_codes").delete().eq("id", d.id); refresh(); }}>Delete</Button></div></div>)}</div></div>;
}
