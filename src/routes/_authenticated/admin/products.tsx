import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["products"]["Row"];
export const Route = createFileRoute("/_authenticated/admin/products")({ component: Products });

const blank = { name: "", slug: "", brand: "RELVAN LUMINA", price: "", compare_at_price: "", sku: "", stock_quantity: "0", size: "", category_id: "", short_description: "", description: "", how_to_use: "", skin_type: "", skin_concerns: "", benefits: "", ingredients: "", featured: false, best_seller: false, new_arrival: false, active: true };
type Form = typeof blank;
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Products() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-products"], queryFn: async () => {
    const [p, c, i] = await Promise.all([supabase.from("products").select("*").order("created_at", { ascending: false }), supabase.from("categories").select("id, name").order("sort_order"), supabase.from("product_images").select("*").order("sort_order")]);
    return { products: p.data ?? [], categories: c.data ?? [], images: i.data ?? [] };
  } });
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-products"] }); void qc.invalidateQueries({ queryKey: ["catalog"] }); };

  const edit = (p: Row) => { setEditing(p.id); setForm({ name: p.name, slug: p.slug, brand: p.brand, price: String(p.price), compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "", sku: p.sku ?? "", stock_quantity: String(p.stock_quantity), size: p.size ?? "", category_id: p.category_id ?? "", short_description: p.short_description ?? "", description: p.description ?? "", how_to_use: p.how_to_use ?? "", skin_type: p.skin_type.join(", "), skin_concerns: p.skin_concerns.join(", "), benefits: p.benefits.join(", "), ingredients: p.ingredients.join(", "), featured: p.featured, best_seller: p.best_seller, new_arrival: p.new_arrival, active: p.active }); window.scrollTo({ top: 0 }); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, slug: form.slug || slugify(form.name), brand: form.brand, price: Number(form.price), compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null, sku: form.sku || null, stock_quantity: Number(form.stock_quantity) || 0, size: form.size || null, category_id: form.category_id || null, short_description: form.short_description || null, description: form.description || null, how_to_use: form.how_to_use || null, skin_type: list(form.skin_type), skin_concerns: list(form.skin_concerns), benefits: list(form.benefits), ingredients: list(form.ingredients), featured: form.featured, best_seller: form.best_seller, new_arrival: form.new_arrival, active: form.active };
    const { error } = editing ? await supabase.from("products").update(payload).eq("id", editing) : await supabase.from("products").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Product updated" : "Product created"); setEditing(null); setForm(blank); refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product? Products with orders should be deactivated instead.")) return;
    await supabase.from("product_images").delete().eq("product_id", id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error("Could not delete — deactivate it instead."); else refresh();
  };

  const upload = async (productId: string, file: File) => {
    const path = `${productId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
    if (error) { toast.error(error.message); return; }
    const { data: signed } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (!signed) return;
    const count = (data?.images ?? []).filter((i) => i.product_id === productId).length;
    await supabase.from("product_images").insert({ product_id: productId, url: signed.signedUrl, sort_order: count });
    toast.success("Image uploaded"); refresh();
  };
  const removeImage = async (id: string) => { await supabase.from("product_images").delete().eq("id", id); refresh(); };

  const text = (key: keyof Form, label: string, type = "text") => <label className="block text-xs font-medium">{label}<Input type={type} value={String(form[key])} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 h-10 rounded-none bg-card" /></label>;
  const flag = (key: "featured" | "best_seller" | "new_arrival" | "active", label: string) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />{label}</label>;

  return <div><h1 className="font-display text-4xl">Products</h1>
    <form onSubmit={save} className="mt-8 border border-border p-5"><h2 className="font-display text-2xl">{editing ? "Edit product" : "Add product"}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{text("name", "Name *")}{text("slug", "Slug (auto)")}{text("brand", "Brand")}{text("price", "Price (₦) *", "number")}{text("compare_at_price", "Compare-at price", "number")}{text("sku", "SKU")}{text("stock_quantity", "Stock", "number")}{text("size", "Size")}<label className="block text-xs font-medium">Category<select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="mt-1 h-10 w-full border border-input bg-card px-2 text-sm"><option value="">—</option>{data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{text("skin_type", "Skin types (comma separated)")}{text("skin_concerns", "Skin concerns")}{text("benefits", "Benefits")}{text("ingredients", "Key ingredients")}{text("short_description", "Short description")}</div><label className="mt-3 block text-xs font-medium">Description<Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 rounded-none bg-card" /></label><label className="mt-3 block text-xs font-medium">How to use<Textarea value={form.how_to_use} onChange={(e) => setForm({ ...form, how_to_use: e.target.value })} className="mt-1 rounded-none bg-card" /></label><div className="mt-4 flex flex-wrap gap-5">{flag("featured", "Featured")}{flag("best_seller", "Best seller")}{flag("new_arrival", "New arrival")}{flag("active", "Active")}</div><div className="mt-5 flex gap-2"><Button className="rounded-none" disabled={!form.name || !form.price}>{editing ? "SAVE CHANGES" : "CREATE PRODUCT"}</Button>{editing && <Button type="button" variant="outline" className="rounded-none" onClick={() => { setEditing(null); setForm(blank); }}>CANCEL</Button>}</div></form>
    <div className="mt-8 divide-y divide-border border-y border-border">{data?.products.map((p) => { const imgs = data.images.filter((i) => i.product_id === p.id); return <div key={p.id} className="py-4"><div className="flex flex-wrap items-center gap-4"><img src={imgs[0]?.url || ""} alt="" className="size-14 bg-secondary object-cover" /><div className="min-w-0 flex-1"><p className="font-medium">{p.name} {!p.active && <span className="text-xs text-destructive">(inactive)</span>}</p><p className="text-xs text-muted-foreground">{p.brand} · {p.sku ?? "no SKU"} · stock {p.stock_quantity} · {formatPrice(Number(p.price))}{p.featured ? " · featured" : ""}{p.best_seller ? " · best seller" : ""}{p.new_arrival ? " · new" : ""}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" className="rounded-none" onClick={() => edit(p)}>Edit</Button><Button size="sm" variant="outline" className="rounded-none" onClick={async () => { await supabase.from("products").update({ active: !p.active }).eq("id", p.id); refresh(); }}>{p.active ? "Deactivate" : "Activate"}</Button><Button size="sm" variant="ghost" className="rounded-none text-destructive" onClick={() => remove(p.id)}>Delete</Button></div></div><div className="mt-3 flex flex-wrap items-center gap-2">{imgs.map((i) => <div key={i.id} className="relative"><img src={i.url} alt="" className="size-12 object-cover" /><button onClick={() => removeImage(i.id)} className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-destructive text-[10px] text-destructive-foreground" aria-label="Remove image">×</button></div>)}<label className="cursor-pointer border border-dashed border-border px-3 py-2 text-xs">+ Upload image<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(p.id, f); e.target.value = ""; }} /></label></div></div>; })}</div>
  </div>;
}
