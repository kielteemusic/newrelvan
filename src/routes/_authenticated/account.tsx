import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayAgainButton } from "@/components/pay-again-button";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-queries";
import { useWishlist } from "@/lib/wishlist-context";
import { submitReview } from "@/lib/reviews.functions";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account — RELVAN LUMINA" },
      { name: "description", content: "Your profile, orders, addresses and wishlist." },
      { property: "og:title", content: "My account — RELVAN LUMINA" },
      { property: "og:description", content: "Manage your RELVAN LUMINA account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const signOut = async () => {
    await queryClient.cancelQueries();
    await supabase.auth.signOut();
    navigate({ to: "/sign-in", replace: true });
  };
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">My account</p>
          <h1 className="mt-2 font-display text-5xl">Hello.</h1>
          <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" className="rounded-none" onClick={signOut}>
          SIGN OUT
        </Button>
      </div>
      <Tabs defaultValue="orders" className="mt-10">
        <TabsList className="flex h-auto w-full flex-wrap justify-start rounded-none bg-secondary/50">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <Orders userId={user.id} />
        </TabsContent>
        <TabsContent value="profile">
          <Profile userId={user.id} />
        </TabsContent>
        <TabsContent value="addresses">
          <Addresses userId={user.id} />
        </TabsContent>
        <TabsContent value="wishlist">
          <WishlistTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function canRepay(o: { payment_status: string; status: string }) {
  return (
    o.status !== "Cancelled" &&
    o.payment_status !== "Successful" &&
    (o.payment_status === "Pending" ||
      o.payment_status === "Failed" ||
      o.status === "Pending Payment")
  );
}

function Orders({ userId }: { userId: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-orders", userId],
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const [open, setOpen] = useState<string | null>(null);
  if (isLoading) return <p className="py-8 text-sm text-muted-foreground">Loading orders…</p>;
  if (!data.length)
    return (
      <div className="py-8">
        <p className="text-muted-foreground">No orders yet.</p>
        <Button asChild className="mt-4 rounded-none">
          <Link to="/shop">START SHOPPING</Link>
        </Button>
      </div>
    );
  return (
    <div className="mt-6 divide-y divide-border border-y border-border">
      {data.map((o) => (
        <div key={o.id} className="py-5">
          <button
            className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
            onClick={() => setOpen(open === o.id ? null : o.id)}
          >
            <span>
              <strong className="block font-medium">{o.order_number}</strong>
              <span className="text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleDateString("en-NG")}
              </span>
            </span>
            <span className="text-sm">
              {o.status} · {o.payment_status}
            </span>
            <strong>{formatPrice(Number(o.total))}</strong>
          </button>
          {open === o.id && (
            <div className="mt-5 bg-secondary/40 p-5 text-sm">
              <div className="space-y-3">
                {o.order_items.map((i) => (
                  <div key={i.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {i.product_name} × {i.quantity}
                    </span>
                    <span>{formatPrice(Number(i.line_total))}</span>
                    {(o.payment_status === "Successful" || o.status === "Delivered") &&
                      i.product_id && <ReviewForm productId={i.product_id} />}
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 border-t border-border pt-4">
                <p>
                  Subtotal {formatPrice(Number(o.subtotal))} · Delivery{" "}
                  {formatPrice(Number(o.delivery_fee))}
                  {Number(o.discount_amount) > 0 &&
                    ` · Discount −${formatPrice(Number(o.discount_amount))}`}
                </p>
                <p>
                  Deliver to: {o.address}, {o.city}, {o.state}, {o.country}
                </p>
                {o.tracking_number && (
                  <p>
                    Tracking: {o.tracking_number} {o.tracking_note}
                  </p>
                )}
              </div>
              {canRepay(o) && (
                <div className="mt-5">
                  <PayAgainButton
                    orderId={o.id}
                    className="h-11 rounded-none px-6"
                    label="COMPLETE PAYMENT"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewForm({ productId }: { productId: string }) {
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  if (!show)
    return (
      <Button size="sm" variant="link" className="px-0" onClick={() => setShow(true)}>
        Write a review
      </Button>
    );
  const send = async (e: FormEvent) => {
    e.preventDefault();
    const r = await submitReview({ data: { productId, rating, review: text } });
    if (r.ok) {
      toast.success("Thank you — your review will appear once approved.");
      setShow(false);
    } else toast.error(r.error);
  };
  return (
    <form onSubmit={send} className="flex w-full flex-wrap gap-2">
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="h-10 border border-input bg-background px-2"
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} ★
          </option>
        ))}
      </select>
      <Input
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your review"
        className="h-10 min-w-0 flex-1 rounded-none bg-background"
      />
      <Button className="h-10 rounded-none">SUBMIT</Button>
    </form>
  );
}

function Profile({ userId }: { userId: string }) {
  const { data, refetch } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () =>
      (await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()).data,
  });
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: name ?? data?.full_name ?? null,
      phone: phone ?? data?.phone ?? null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Profile saved");
      void refetch();
    }
  };
  return (
    <form onSubmit={save} className="mt-6 max-w-md space-y-5">
      <label className="block text-sm font-medium">
        Full name
        <Input
          value={name ?? data?.full_name ?? ""}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 h-11 rounded-none bg-card"
        />
      </label>
      <label className="block text-sm font-medium">
        Phone
        <Input
          value={phone ?? data?.phone ?? ""}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-2 h-11 rounded-none bg-card"
        />
      </label>
      <Button className="rounded-none">SAVE PROFILE</Button>
    </form>
  );
}

function Addresses({ userId }: { userId: string }) {
  const { data = [], refetch } = useQuery({
    queryKey: ["addresses", userId],
    queryFn: async () =>
      (
        await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", userId)
          .order("created_at")
      ).data ?? [],
  });
  const empty = {
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Nigeria",
  };
  const [form, setForm] = useState(empty);
  const add = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("addresses")
      .insert({ ...form, user_id: userId, is_default: data.length === 0 });
    if (error) toast.error(error.message);
    else {
      setForm(empty);
      void refetch();
    }
  };
  const remove = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    void refetch();
  };
  return (
    <div className="mt-6 grid gap-10 md:grid-cols-2">
      <div className="space-y-3">
        {data.length === 0 && <p className="text-sm text-muted-foreground">No saved addresses.</p>}
        {data.map((a) => (
          <div key={a.id} className="border border-border p-4 text-sm">
            <p className="font-medium">
              {a.full_name}
              {a.is_default && <span className="ml-2 text-xs text-primary">Default</span>}
            </p>
            <p className="text-muted-foreground">
              {a.address}, {a.city}, {a.state}, {a.country}
            </p>
            <p className="text-muted-foreground">{a.phone}</p>
            <Button variant="link" size="sm" className="px-0" onClick={() => remove(a.id)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="space-y-3">
        <h3 className="font-display text-2xl">Add address</h3>
        {(Object.keys(empty) as Array<keyof typeof empty>).map((k) => (
          <Input
            key={k}
            required={k !== "phone"}
            placeholder={k.replace("_", " ")}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            className="h-11 rounded-none bg-card capitalize"
          />
        ))}
        <Button className="rounded-none">SAVE ADDRESS</Button>
      </form>
    </div>
  );
}

function WishlistTab() {
  const { products } = useCatalog();
  const { productIds, toggle } = useWishlist();
  const { add } = useCart();
  const saved = products.filter((p) => productIds.includes(p.id));
  if (!saved.length) return <p className="py-8 text-sm text-muted-foreground">Nothing saved yet.</p>;
  return (
    <div className="mt-6 divide-y divide-border border-y border-border">
      {saved.map((p) => (
        <div
          key={p.id}
          className="grid grid-cols-[64px_1fr] gap-4 py-4 sm:grid-cols-[64px_1fr_auto]"
        >
          <img src={p.image} alt="" className="aspect-[4/5] w-16 object-cover" />
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-primary">{p.brand}</p>
            <Link to="/product/$slug" params={{ slug: p.slug }} className="font-medium">
              {p.name}
            </Link>
            <p className="text-sm">{formatPrice(p.price)}</p>
          </div>
          <div className="col-span-2 flex gap-2 sm:col-span-1">
            <Button
              size="sm"
              className="rounded-none"
              disabled={p.stockQuantity <= 0}
              onClick={() => {
                add(p);
                toggle(p.id, p.name);
              }}
            >
              MOVE TO CART
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-none"
              onClick={() => toggle(p.id, p.name)}
            >
              REMOVE
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
