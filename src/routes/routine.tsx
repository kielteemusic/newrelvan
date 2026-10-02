import { Link, createFileRoute } from "@tanstack/react-router";
import { EditorialPage } from "@/components/editorial-page";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/lib/catalog-queries";

export const Route = createFileRoute("/routine")({
  head: () => ({
    meta: [
      { title: "Build Your Routine — RELVAN LUMINA" },
      { name: "description", content: "Build a simple five-step Korean skincare routine." },
      { property: "og:title", content: "Build Your Routine — RELVAN LUMINA" },
      {
        property: "og:description",
        content: "A clear five-step guide to your daily skincare ritual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoutinePage,
});

function RoutinePage() {
  const { settings } = useCatalog();
  return (
    <EditorialPage
      eyebrow={settings.routineEyebrow}
      title={settings.routineTitle}
      intro={settings.routineIntro}
    >
      <div className="divide-y divide-border border-y border-border">
        {settings.routineSteps.map((step) => (
          <div
            key={`${step.number}-${step.title}`}
            className="grid gap-4 py-8 sm:grid-cols-[90px_180px_1fr_auto] sm:items-center"
          >
            <span className="font-display text-3xl text-primary">{step.number}</span>
            <h2 className="font-display text-2xl">{step.title}</h2>
            <p className="text-muted-foreground">{step.text}</p>
            <Button asChild variant="outline" className="rounded-none">
              <Link to="/shop">SHOP STEP</Link>
            </Button>
          </div>
        ))}
      </div>
    </EditorialPage>
  );
}
