import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const saved = wishlist.has(product.id);
  const soldOut = product.stockQuantity <= 0;
  const discount = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0;

  return (
    <article className="group flex h-full min-w-0 flex-col">
      <div className="relative aspect-[4/5] shrink-0 overflow-hidden bg-secondary/45">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          aria-label={`View ${product.name}`}
          className="absolute inset-0 block"
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              width={1024}
              height={1280}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            />
          ) : (
            <div className="grid size-full place-items-center bg-secondary/60 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              No image
            </div>
          )}
        </Link>
        {discount > 0 && (
          <span className="absolute left-2 top-2 bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground sm:left-3 sm:top-3">
            -{discount}%
          </span>
        )}
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-2 rounded-full shadow-none sm:right-3 sm:top-3"
          onClick={() => wishlist.toggle(product.id, product.name)}
          aria-label={`Save ${product.name}`}
          aria-pressed={saved}
        >
          <Heart className={saved ? "fill-primary text-primary" : ""} />
        </Button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          {product.brand}
        </p>
        <div className="mt-1 flex min-w-0 items-start justify-between gap-2">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="line-clamp-2 min-h-[2.5rem] font-medium leading-snug text-foreground hover:text-primary"
          >
            {product.name}
          </Link>
          <span className="shrink-0 text-xs text-muted-foreground">{product.stock}</span>
        </div>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {product.shortDescription || product.description}
        </p>
        <div className="mt-2 min-h-5 text-xs text-muted-foreground">
          {product.reviews > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-accent text-accent-foreground" />
              <span className="font-medium text-foreground">{product.rating}</span>
              <span>({product.reviews})</span>
            </span>
          ) : (
            <span>New</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {product.compareAt && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compareAt)}
            </span>
          )}
        </div>
        <Button
          disabled={soldOut}
          onClick={() => add(product)}
          className="mt-auto h-10 w-full rounded-none text-xs tracking-[0.12em]"
        >
          {soldOut ? "SOLD OUT" : "ADD TO CART"}
        </Button>
      </div>
    </article>
  );
}
