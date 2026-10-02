import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-queries";
import { useSession } from "@/lib/session-context";
import { supabase } from "@/integrations/supabase/client";
import { checkDiscountCode, placeOrder } from "@/lib/orders.functions";
import { initializePayment } from "@/lib/paystack.functions";

const discountKey = "relvan-lumina-discount";

export const Route = createFileRoute("/checkout")({ head: () => ({ meta: [{ title: "Checkout — RELVAN LUMINA" }, { name: "description", content: "Enter delivery details and review your RELVAN LUMINA order." }, { property: "og:title", content: "Checkout — RELVAN LUMINA" }, { property: "og:description", content: "Review delivery details for your skincare order." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: CheckoutPage });

type Form = Record<"firstName" | "lastName" | "email" | "phone" | "address" | "city" | "state" | "country" | "deliveryNotes", string>;

function Field({ label, name, form, set, type = "text", required = false }: { label: string; name: keyof Form; form: Form; set: (k: keyof Form, v: string) => void; type?: string; required?: boolean }) {
  return <label className="block text-sm font-medium">{label}{required && " *"}<Input required={required} type={type} value={form[name]} onChange={(e) => set(name, e.target.value)} className="mt-2 h-11 rounded-none bg-card" /></label>;
}

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { settings } = useCatalog();
  const { userId, session } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", state: "", country: "Nigeria", deliveryNotes: "" });
  const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const [{ data: profile }, { data: address }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, email").eq("id", userId).maybeSingle(),
        supabase.from("addresses").select("*").eq("user_id", userId).order("is_default", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const [first = "", ...rest] = (profile?.full_name ?? "").split(" ");
      setForm((f) => ({ ...f, firstName: f.firstName || first, lastName: f.lastName || rest.join(" "), email: f.email || profile?.email || session?.user.email || "", phone: f.phone || profile?.phone || address?.phone || "", address: f.address || address?.address || "", city: f.city || address?.city || "", state: f.state || address?.state || "", country: address?.country || f.country }));
    })();
  }, [userId, session?.user.email]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(discountKey);
    if (!saved || subtotal <= 0) return;
    void checkDiscountCode({ data: { code: saved, subtotal } }).then((r) => setDiscount(r.ok ? { code: r.code, amount: r.amount } : null));
  }, [subtotal]);

  const delivery = subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;
  const total = Math.max(0, subtotal + delivery - (discount?.amount ?? 0));
  const stockIssue = items.find((l) => l.quantity > l.product.stockQuantity);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (stockIssue) { setError(`Only ${stockIssue.product.stockQuantity} of ${stockIssue.product.name} available.`); return; }
    setSubmitting(true);
    const result = await placeOrder({ data: { ...form, items: items.map((l) => ({ productId: l.product.id, quantity: l.quantity })), ...(discount ? { discountCode: discount.code } : {}) } });
    if (!result.ok) { setSubmitting(false); setError(result.error); return; }
    const payment = await initializePayment({ data: { orderId: result.orderId } });
    setSubmitting(false);
    if (!payment.ok) {
      // Order is reserved as Pending Payment; customer can pay later.
      window.sessionStorage.removeItem(discountKey);
      clear();
      navigate({
        to: "/order-received",
        search: { number: result.orderNumber, total: result.total, reference: "", orderId: result.orderId },
      });
      return;
    }
    window.sessionStorage.removeItem(discountKey);
    clear();
    window.location.href = payment.authorizationUrl;
  };

  return <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-8"><h1 className="font-display text-5xl">Checkout</h1>{!userId && <p className="mt-4 text-sm text-muted-foreground">Checking out as a guest. <Link to="/sign-in" className="text-primary underline">Sign in</Link> to track orders in your account.</p>}<div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]"><form className="space-y-8" onSubmit={submit}><section><h2 className="font-display text-2xl">Contact & delivery</h2><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="First name" name="firstName" form={form} set={set} required /><Field label="Last name" name="lastName" form={form} set={set} required /><Field label="Email" name="email" type="email" form={form} set={set} required /><Field label="Phone" name="phone" type="tel" form={form} set={set} required /><div className="sm:col-span-2"><Field label="Address" name="address" form={form} set={set} required /></div><Field label="City" name="city" form={form} set={set} required /><Field label="State" name="state" form={form} set={set} required /><Field label="Country" name="country" form={form} set={set} required /></div><label className="mt-5 block text-sm font-medium">Delivery notes<Textarea value={form.deliveryNotes} onChange={(e) => set("deliveryNotes", e.target.value)} className="mt-2 min-h-28 rounded-none bg-card" /></label></section><section className="border border-border p-5"><div className="flex items-center gap-3"><LockKeyhole className="size-5 text-primary" /><div><h2 className="font-medium">Secure payment powered by Paystack</h2><p className="mt-1 text-sm text-muted-foreground">After placing your order you'll be redirected to Paystack's secure page to pay by card, bank transfer or USSD. Your card details never touch our site.</p></div></div></section>{error && <p className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={submitting || items.length === 0} className="h-12 w-full rounded-none tracking-[0.12em]">{submitting ? "PLACING ORDER…" : "PLACE ORDER & PAY"}</Button></form><aside className="bg-secondary/40 p-6 lg:order-none"><h2 className="font-display text-2xl">Your order</h2><div className="mt-6 divide-y divide-border">{items.map(({product,quantity}) => <div key={product.id} className="grid grid-cols-[64px_1fr_auto] gap-3 py-4"><img src={product.image} alt="" className="aspect-[4/5] w-16 object-cover" /><div><p className="text-sm font-medium">{product.name}</p><p className="text-xs text-muted-foreground">Qty {quantity}</p></div><span className="text-sm">{formatPrice(product.price*quantity)}</span></div>)}</div><div className="mt-5 space-y-3 border-t border-border pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between"><span>Delivery</span><span>{delivery === 0 ? "Free" : formatPrice(delivery)}</span></div>{discount && <div className="flex justify-between text-primary"><span>Discount ({discount.code})</span><span>−{formatPrice(discount.amount)}</span></div>}<div className="flex justify-between text-lg font-semibold"><span>Total</span><span>{formatPrice(total)}</span></div></div>{items.length === 0 && <Button asChild variant="link" className="mt-4 px-0"><Link to="/shop">Return to shop</Link></Button>}</aside></div></div>;
}
