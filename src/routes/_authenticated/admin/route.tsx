import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/account" });
  },
  head: () => ({ meta: [{ title: "Admin — RELVAN LUMINA" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const nav = [
  ["Dashboard", "/admin"], ["Products", "/admin/products"], ["Categories", "/admin/categories"], ["Inventory", "/admin/inventory"],
  ["Orders", "/admin/orders"], ["Customers", "/admin/customers"], ["Reviews", "/admin/reviews"], ["Discounts", "/admin/discounts"], ["Settings", "/admin/settings"],
] as const;

function AdminLayout() {
  return <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-10"><aside><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Admin</p><nav className="mt-4 flex gap-1 overflow-x-auto lg:flex-col">{nav.map(([label, to]) => <Link key={to} to={to} activeOptions={{ exact: to === "/admin" }} activeProps={{ className: "bg-secondary text-primary" }} className="whitespace-nowrap px-3 py-2 text-sm">{label}</Link>)}</nav></aside><section className="min-w-0"><Outlet /></section></div>;
}
