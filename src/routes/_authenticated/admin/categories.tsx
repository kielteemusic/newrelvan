import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/categories")({ component: Categories });

function Categories() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [] });
  const [form, setForm] = useState({ name: "", description: "", image_url: "" });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-categories"] }); void qc.invalidateQueries({ queryKey: ["catalog"] }); };
  const add = async (e: FormEvent) => { e.preventDefault(); const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); const { error } = await supabase.from("categories").insert({ ...form, slug, sort_order: data.length + 1 }); if (error) toast.error(error.message); else { setForm({ name: "", description: "", image_url: "" }); refresh(); } };
  const update = async (id: string, patch: { name?: string; description?: string; active?: boolean }) => { const { error } = await supabase.from("categories").update(patch).eq("id", id); if (error) toast.error(error.message); else refresh(); };
  return <div><h1 className="font-display text-4xl">Categories</h1><form onSubmit={add} className="mt-6 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"><Input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-none" /><Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-none" /><Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="rounded-none" /><Button className="rounded-none">ADD</Button></form><div className="mt-6 divide-y divide-border border-y border-border">{data.map((c) => <div key={c.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_2fr_auto] sm:items-center"><Input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && update(c.id, { name: e.target.value })} className="rounded-none" /><Input defaultValue={c.description ?? ""} onBlur={(e) => update(c.id, { description: e.target.value })} className="rounded-none" /><Button size="sm" variant="outline" className="rounded-none" onClick={() => update(c.id, { active: !c.active })}>{c.active ? "Hide" : "Show"}</Button></div>)}</div></div>;
}
