import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/reviews")({ component: Reviews });

function Reviews() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-reviews"], queryFn: async () => (await supabase.from("reviews").select("*, products(name)").order("approved").order("created_at", { ascending: false })).data ?? [] });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-reviews"] }); void qc.invalidateQueries({ queryKey: ["reviews"] }); void qc.invalidateQueries({ queryKey: ["catalog"] }); };
  return <div><h1 className="font-display text-4xl">Reviews</h1><div className="mt-6 divide-y divide-border border-y border-border">{data.map((r) => <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-4 text-sm"><div className="min-w-0 flex-1"><p className="font-medium">{r.customer_name} · {"★".repeat(r.rating)} · {r.products?.name}{r.verified && <span className="ml-2 text-xs text-primary">Verified</span>}</p><p className="text-muted-foreground">{r.review}</p></div><div className="flex gap-2"><Button size="sm" variant={r.approved ? "outline" : "default"} className="rounded-none" onClick={async () => { await supabase.from("reviews").update({ approved: !r.approved }).eq("id", r.id); refresh(); }}>{r.approved ? "Unpublish" : "Approve"}</Button><Button size="sm" variant="ghost" className="rounded-none text-destructive" onClick={async () => { if (confirm("Delete review?")) { await supabase.from("reviews").delete().eq("id", r.id); refresh(); } }}>Delete</Button></div></div>)}</div></div>;
}
