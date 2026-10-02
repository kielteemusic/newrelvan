import { Link, createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/lib/catalog-queries";
import { useWishlist } from "@/lib/wishlist-context";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — RELVAN LUMINA" }, { name: "description", content: "Your saved skincare products." }, { property: "og:title", content: "Wishlist — RELVAN LUMINA" }, { property: "og:description", content: "Products you've saved for later." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { products } = useCatalog();
  const { productIds, signedIn } = useWishlist();
  const saved = products.filter((p) => productIds.includes(p.id));
  return <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-10"><h1 className="font-display text-5xl">Wishlist</h1>{!signedIn ? <div className="mt-8"><p className="text-muted-foreground">Sign in to save products to your wishlist.</p><Button asChild className="mt-6 h-12 rounded-none px-8"><Link to="/sign-in">SIGN IN</Link></Button></div> : saved.length === 0 ? <div className="mt-8"><p className="text-muted-foreground">Nothing saved yet.</p><Button asChild className="mt-6 h-12 rounded-none px-8"><Link to="/shop">EXPLORE SKINCARE</Link></Button></div> : <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 xl:grid-cols-4">{saved.map((p) => <ProductCard key={p.id} product={p} />)}</div>}</div>;
}
