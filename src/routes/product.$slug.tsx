import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Heart, Minus, Plus, Star } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { formatPrice } from "@/lib/catalog";
import { catalogQuery, useCatalog } from "@/lib/catalog-queries";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    const catalog = await context.queryClient.ensureQueryData(catalogQuery);
    const product = catalog.products.find((item) => item.slug === params.slug);
    if (!product) throw notFound();
    return product;
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="font-display text-4xl">Product unavailable</h1>
      <p className="mt-3 text-muted-foreground">This product could not be found.</p>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="font-display text-4xl">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">Please refresh the page.</p>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.name} — RELVAN LUMINA` : "Product unavailable — RELVAN LUMINA",
      },
      { name: "description", content: loaderData?.description ?? "This product could not be found." },
      {
        property: "og:title",
        content: loaderData ? `${loaderData.name} — RELVAN LUMINA` : "Product unavailable",
      },
      {
        property: "og:description",
        content: loaderData?.description ?? "This product could not be found.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();
  const { products } = useCatalog();
  const { add } = useCart();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const soldOut = product.stockQuantity <= 0;
  const maxQty = Math.max(1, product.stockQuantity);
  const gallery = [0, 1, 2].map((i) => product.images[i] ?? product.image);
  const reviewLabel =
    product.reviews > 0 ? `${product.rating} · ${product.reviews} reviews` : "No reviews yet";
  const filledStars = product.reviews > 0 ? Math.round(product.rating) : 0;
  const sections: Array<[string, string]> = [
    [
      "Description",
      `${product.description} Thoughtfully formulated to layer beautifully within a simple, consistent routine.`,
    ],
    ["Benefits", product.benefits.join(" • ")],
    ["Key ingredients", product.ingredients.join(", ")],
    ["How to use", product.howToUse],
    ["Suitable skin types", product.skinType.join(", ")],
    [
      "Full ingredients",
      `${product.ingredients.join(", ")}. Please refer to the product packaging for the most current complete ingredient list.`,
    ],
    [
      "Reviews",
      product.reviews > 0
        ? `${product.rating} out of 5 from ${product.reviews} verified customer reviews.`
        : "Be the first to review this product after purchase.",
    ],
  ];

  return (
    <div>
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-16">
        <div className="grid gap-3 sm:grid-cols-2">
          <img
            src={gallery[0]}
            alt={product.name}
            width={1024}
            height={1280}
            className="aspect-[4/5] w-full bg-secondary object-cover sm:col-span-2"
          />
          <img
            src={gallery[1]}
            alt={`${product.name} detail`}
            width={1024}
            height={1280}
            className="hidden aspect-square w-full object-cover object-top sm:block"
          />
          <img
            src={gallery[2]}
            alt={`${product.name} packaging`}
            width={1024}
            height={1280}
            className="hidden aspect-square w-full object-cover object-bottom sm:block"
          />
        </div>
        <section className="lg:sticky lg:top-20 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {product.brand}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${i < filledStars ? "fill-accent text-accent-foreground" : "text-muted-foreground"}`}
                />
              ))}
            </span>
            <span>{reviewLabel}</span>
            <span className="ml-auto text-xs text-muted-foreground">{product.stock}</span>
          </div>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
            {product.compareAt && (
              <span className="text-muted-foreground line-through">
                {formatPrice(product.compareAt)}
              </span>
            )}
          </div>
          <p className="mt-6 border-y border-border py-6 leading-7 text-muted-foreground">
            {product.description}
          </p>
          <dl className="grid grid-cols-2 gap-4 py-6 text-sm">
            <div>
              <dt className="text-muted-foreground">Skin type</dt>
              <dd className="mt-1 font-medium">{product.skinType.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Size</dt>
              <dd className="mt-1 font-medium">{product.size}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Benefits</dt>
              <dd className="mt-1 font-medium">{product.benefits.join(" · ")}</dd>
            </div>
          </dl>
          <div className="flex gap-3">
            <div className="grid h-12 grid-cols-3 border border-input">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
              >
                <Minus />
              </Button>
              <span className="grid w-8 place-items-center text-sm">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                disabled={quantity >= maxQty}
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                aria-label="Increase quantity"
              >
                <Plus />
              </Button>
            </div>
            <Button
              disabled={soldOut}
              onClick={() => add(product, quantity)}
              className="h-12 flex-1 rounded-none text-xs tracking-[0.12em]"
            >
              {soldOut ? "SOLD OUT" : "ADD TO CART"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => wishlist.toggle(product.id, product.name)}
              className="size-12 rounded-none"
              aria-label="Add to wishlist"
            >
              <Heart className={wishlist.has(product.id) ? "fill-primary text-primary" : ""} />
            </Button>
          </div>
          <Button
            disabled={soldOut}
            onClick={() => {
              add(product, quantity);
              navigate({ to: "/checkout" });
            }}
            variant="outline"
            className="mt-3 h-12 w-full rounded-none border-primary text-xs tracking-[0.12em]"
          >
            BUY NOW
          </Button>
          <Accordion type="single" collapsible className="mt-8">
            {sections.map(([title, content]) => (
              <AccordionItem key={title} value={title}>
                <AccordionTrigger>{title}</AccordionTrigger>
                <AccordionContent className="leading-6 text-muted-foreground">
                  {content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
      <section className="mx-auto max-w-[1440px] px-4 pb-8 sm:px-8 lg:px-10">
        <h2 className="mb-8 font-display text-3xl">You may also like</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 items-stretch">
          {products
            .filter((p) => p.id !== product.id)
            .slice(0, 4)
            .map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
        </div>
      </section>
    </div>
  );
}
