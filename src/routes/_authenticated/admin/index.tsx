import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dashboard });

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [orders, customers, products, settings] = await Promise.all([
        supabase.from("orders").select("total, status, payment_status"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("stock_quantity, active"),
        supabase.from("site_settings").select("low_stock_threshold").maybeSingle(),
      ]);
      const low = settings.data?.low_stock_threshold ?? 5;
      const o = orders.data ?? [];
      return {
        sales: o.filter((x) => x.payment_status === "Successful").reduce((s, x) => s + Number(x.total), 0),
        orders: o.length,
        pending: o.filter((x) => x.status === "Pending Payment" || x.status === "Processing").length,
        customers: customers.count ?? 0,
        products: (products.data ?? []).length,
        lowStock: (products.data ?? []).filter((p) => p.stock_quantity <= low).length,
      };
    },
  });
  const cards: Array<[string, string]> = [["Total sales (paid)", formatPrice(data?.sales ?? 0)], ["Orders", String(data?.orders ?? 0)], ["Pending orders", String(data?.pending ?? 0)], ["Customers", String(data?.customers ?? 0)], ["Products", String(data?.products ?? 0)], ["Low / out of stock", String(data?.lowStock ?? 0)]];
  return <div><h1 className="font-display text-4xl">Dashboard</h1><div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">{cards.map(([l, v]) => <div key={l} className="border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{l}</p><p className="mt-3 text-2xl font-semibold">{v}</p></div>)}</div></div>;
}
