import { Link, createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-queries";
import { checkDiscountCode } from "@/lib/orders.functions";

export const discountKey = "relvan-lumina-discount";

export const Route = createFileRoute("/cart")({ head: () => ({ meta: [{ title: "Your Cart — RELVAN LUMINA" }, { name: "description", content: "Review the skincare products in your cart." }, { property: "og:title", content: "Your Cart — RELVAN LUMINA" }, { property: "og:description", content: "Review your selected skincare essentials." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: CartPage });

function CartPage() {
  const { items, subtotal, update, remove } = useCart();
  const { settings } = useCatalog();
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<{ code: string; amount: number; label: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const apply = async (value: string) => {
    setChecking(true); setMessage(null);
    const result = await checkDiscountCode({ data: { code: value, subtotal } });
    setChecking(false);
    if (result.ok) { setDiscount(result); window.sessionStorage.setItem(discountKey, result.code); }
    else { setDiscount(null); setMessage(result.error); window.sessionStorage.removeItem(discountKey); }
  };

  useEffect(() => {
    const saved = window.sessionStorage.getItem(discountKey);
    if (saved && subtotal > 0) { setCode(saved); void apply(saved); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const delivery = subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;
  const total = Math.max(0, subtotal + delivery - (discount?.amount ?? 0));

  if (!items.length) return <div className="mx-auto max-w-2xl px-5 py-24 text-center"><h1 className="font-display text-5xl">Your cart is quiet.</h1><p className="mt-4 text-muted-foreground">Discover something thoughtful for your daily ritual.</p><Button asChild className="mt-8 h-12 rounded-none px-8"><Link to="/shop">EXPLORE SKINCARE</Link></Button></div>;
  return <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-8"><h1 className="font-display text-5xl">Your cart</h1><div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]"><div className="divide-y divide-border border-y border-border">{items.map(({product,quantity}) => <article key={product.id} className="grid grid-cols-[88px_minmax(0,1fr)_auto] gap-4 py-5"><img src={product.image} alt={product.name} className="aspect-[4/5] size-full object-cover" /><div className="min-w-0"><p className="text-[10px] font-semibold tracking-[0.14em] text-primary">{product.brand}</p><h2 className="truncate font-medium">{product.name}</h2><p className="mt-2 text-sm">{formatPrice(product.price)}</p>{quantity > product.stockQuantity && <p className="mt-1 text-xs text-destructive">Only {product.stockQuantity} available</p>}<div className="mt-3 inline-grid grid-cols-3 border border-input"><Button variant="ghost" size="icon" onClick={() => update(product.id,quantity-1)} aria-label="Decrease quantity"><Minus /></Button><span className="grid w-8 place-items-center text-sm">{quantity}</span><Button variant="ghost" size="icon" disabled={quantity >= product.stockQuantity} onClick={() => update(product.id,quantity+1)} aria-label="Increase quantity"><Plus /></Button></div></div><div className="flex flex-col items-end justify-between"><strong>{formatPrice(product.price*quantity)}</strong><Button variant="ghost" size="icon" onClick={() => remove(product.id)} aria-label={`Remove ${product.name}`}><Trash2 /></Button></div></article>)}</div><aside className="bg-secondary/40 p-6"><h2 className="font-display text-2xl">Order summary</h2><div className="mt-6 space-y-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between"><span>Delivery</span><span>{delivery === 0 ? "Free" : formatPrice(delivery)}</span></div>{discount && <div className="flex justify-between text-primary"><span>Discount ({discount.code})</span><span>−{formatPrice(discount.amount)}</span></div>}{delivery > 0 && <p className="text-xs text-muted-foreground">Free delivery on orders above {formatPrice(settings.freeDeliveryThreshold)}.</p>}</div><form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); void apply(code); }}><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Discount code" className="rounded-none bg-background" /><Button type="submit" disabled={checking} variant="outline" className="rounded-none">APPLY</Button></form>{message && <p className="mt-2 text-xs text-destructive">{message}</p>}{discount && <p className="mt-2 text-xs text-primary">{discount.label}</p>}<div className="mt-6 flex justify-between border-t border-border pt-5 text-lg font-semibold"><span>Total</span><span>{formatPrice(total)}</span></div><Button asChild className="mt-6 h-12 w-full rounded-none"><Link to="/checkout">PROCEED TO CHECKOUT</Link></Button><Button asChild variant="link" className="mt-3 w-full"><Link to="/shop">CONTINUE SHOPPING</Link></Button></aside></div></div>;
}
