import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Gem, HeartHandshake, Sparkles, Star } from "lucide-react";
import heroImage from "@/assets/relvan-hero.jpg";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { reviewsQuery, useCatalog } from "@/lib/catalog-queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RELVAN LUMINA — Refined Korean Skincare" },
      {
        name: "description",
        content: "Carefully curated Korean skincare essentials for clear, healthy and glowing skin.",
      },
      { property: "og:title", content: "RELVAN LUMINA — Refined Korean Skincare" },
      {
        property: "og:description",
        content: "Carefully curated Korean skincare essentials for clear, healthy and glowing skin.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { categories, products, settings } = useCatalog();
  const { data: reviews = [] } = useQuery(reviewsQuery);
  const featured = [...products].sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
  const testimonials = reviews.slice(0, 3);
  const concerns = [
    ...new Set(products.flatMap((p) => p.concerns).filter(Boolean)),
  ].slice(0, 8);
  const [heroLine1, heroLine2] = splitHeadline(settings.homepageHeadline);

  return (
    <div>
      <section className="relative min-h-[620px] overflow-hidden md:min-h-[690px]">
        <img
          src={heroImage}
          alt="An edit of refined skincare essentials with camellia flowers"
          width={1600}
          height={1200}
          className="absolute inset-0 size-full object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        <div className="relative mx-auto flex min-h-[620px] max-w-[1440px] items-center px-5 pb-12 pt-8 sm:px-8 md:min-h-[690px] lg:px-10">
          <div className="max-w-xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {settings.homepageEyebrow}
            </p>
            <h1 className="font-display text-5xl leading-[1.04] sm:text-6xl lg:text-7xl">
              {heroLine1}
              {heroLine2 ? (
                <>
                  <br />
                  <em className="font-normal">{heroLine2}</em>
                </>
              ) : null}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-foreground/75 sm:text-lg">
              {settings.homepageSubcopy}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-none px-8 text-xs tracking-[0.13em]">
                <Link to="/shop">SHOP SKINCARE</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-none border-primary bg-background/40 px-8 text-xs tracking-[0.13em]"
              >
                <Link to="/routine">FIND YOUR ROUTINE</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SectionHeading
        eyebrow="Explore the edit"
        title="Shop by category"
        copy="A considered selection for every step of your ritual."
      />
      {categories.length === 0 ? (
        <p className="mx-auto max-w-[1440px] px-4 pb-4 text-center text-sm text-muted-foreground sm:px-8 lg:px-10">
          Categories will appear here once added in Admin.
        </p>
      ) : (
      <section className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-3 gap-y-8 px-4 sm:px-8 md:grid-cols-4 lg:px-10">
        {categories.map((category) => (
          <Link to="/shop" search={{ category: category.name }} key={category.name} className="group">
            <div className="overflow-hidden bg-secondary/50">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  width={1024}
                  height={1280}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="aspect-[4/5] w-full bg-secondary/70" />
              )}
            </div>
            <h3 className="mt-4 font-display text-xl sm:text-2xl">{category.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
            <span className="mt-3 inline-block border-b border-primary pb-1 text-[11px] font-semibold tracking-[0.14em] text-primary">
              SHOP NOW
            </span>
          </Link>
        ))}
      </section>
      )}

      <SectionHeading
        eyebrow="Loved most"
        title="The best sellers"
        copy="Proven staples our community returns to."
      />
      {featured.length === 0 ? (
        <p className="mx-auto max-w-[1440px] px-4 pb-4 text-center text-sm text-muted-foreground sm:px-8 lg:px-10">
          Products will appear here once added in Admin.
        </p>
      ) : (
      <section className="mx-auto grid max-w-[1440px] grid-cols-2 items-stretch gap-x-3 gap-y-10 px-4 sm:px-8 md:grid-cols-3 lg:grid-cols-4 lg:px-10">
        {featured.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
      )}

      <section className="mt-24 bg-secondary/45 py-20">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {settings.routineEyebrow}
              </p>
              <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
                {settings.routineTitle}
              </h2>
              <p className="mt-5 max-w-md leading-7 text-muted-foreground">
                {settings.routineIntro}
              </p>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {settings.routineSteps.map((step) => (
                <Link
                  to="/shop"
                  key={`${step.number}-${step.title}`}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-5 py-5 hover:text-primary"
                >
                  <span className="font-display text-2xl text-primary">{step.number}</span>
                  <span>
                    <strong className="block font-medium">{step.title}</strong>
                    <span className="text-sm text-muted-foreground">{step.text}</span>
                  </span>
                  <span>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {concerns.length > 0 && (
        <>
          <SectionHeading eyebrow="Shop with intention" title="What does your skin need?" />
          <section className="mx-auto grid max-w-[1440px] grid-cols-2 border-l border-t border-border px-4 sm:grid-cols-4 sm:px-8 lg:px-10">
            {concerns.map((concern) => (
              <Link
                to="/shop"
                key={concern}
                className="flex min-h-32 items-end border-b border-r border-border bg-card p-4 font-display text-lg transition-colors hover:bg-secondary/50 sm:min-h-40 sm:p-6 sm:text-xl"
              >
                {concern}
              </Link>
            ))}
          </section>
        </>
      )}

      {settings.valueProps.length > 0 && (
        <section className="mt-24 bg-primary py-16 text-primary-foreground">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-10">
            {settings.valueProps.map((card, index) => {
              const Icon = VALUE_ICONS[index % VALUE_ICONS.length]!;
              return (
                <div key={`${card.title}-${index}`}>
                  <Icon className="size-6" strokeWidth={1.4} />
                  <h3 className="mt-5 font-display text-xl">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 opacity-70">{card.text}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <>
          <SectionHeading eyebrow="The Lumina community" title="Real routines. Real glow." />
          <section className="mx-auto grid max-w-[1200px] gap-5 px-5 sm:px-8 md:grid-cols-3">
            {testimonials.map((review) => (
              <blockquote key={review.id} className="border border-border bg-card p-7">
                <div className="flex gap-1 text-accent-foreground">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`size-4 ${index < review.rating ? "fill-accent" : ""}`}
                    />
                  ))}
                </div>
                <p className="mt-5 font-display text-xl leading-8">“{review.review}”</p>
                <footer className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  {review.customerName}
                  {review.productName ? ` · ${review.productName}` : ""}
                </footer>
              </blockquote>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-5 pb-10 pt-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl sm:text-5xl">{title}</h2>
      {copy && <p className="mt-4 text-muted-foreground">{copy}</p>}
    </div>
  );
}

const VALUE_ICONS = [Sparkles, BadgeCheck, Gem, HeartHandshake] as const;

function splitHeadline(headline: string): [string, string] {
  const parts = headline.split(/(?<=\.)\s+/).filter(Boolean);
  if (parts.length >= 2) return [parts[0]!, parts.slice(1).join(" ")];
  return [headline, ""];
}
