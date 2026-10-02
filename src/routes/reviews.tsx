import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { EditorialPage } from "@/components/editorial-page";
import { reviewsQuery } from "@/lib/catalog-queries";

export const Route = createFileRoute("/reviews")({ head: () => ({ meta: [{ title: "Customer Reviews — RELVAN LUMINA" }, { name: "description", content: "Read reviews from the RELVAN LUMINA skincare community." }, { property: "og:title", content: "Customer Reviews — RELVAN LUMINA" }, { property: "og:description", content: "Real routines and thoughtful skincare reviews." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: ReviewsPage });

function ReviewsPage() {
  const { data: reviews = [] } = useQuery(reviewsQuery);
  return <EditorialPage eyebrow="Community notes" title="Real routines. Real glow." intro="Honest reflections from customers building calmer, more consistent skincare rituals."><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{reviews.map((r) => <article key={r.id} className="border border-border bg-card p-7"><div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-accent text-accent-foreground" : "text-border"}`} />)}</div><p className="mt-5 font-display text-xl leading-8">“{r.review}”</p><p className="mt-6 text-xs font-semibold tracking-[0.14em] text-primary">{r.customerName}{r.verified ? " · VERIFIED CUSTOMER" : ""}</p>{r.productName && <p className="mt-1 text-xs text-muted-foreground">{r.productName}</p>}</article>)}</div></EditorialPage>;
}
