import { createFileRoute } from "@tanstack/react-router";
import heroImage from "@/assets/relvan-hero.jpg";
import { EditorialPage } from "@/components/editorial-page";
import { useCatalog } from "@/lib/catalog-queries";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — RELVAN LUMINA" },
      {
        name: "description",
        content: "Discover RELVAN LUMINA's thoughtful approach to Korean skincare.",
      },
      { property: "og:title", content: "Our Story — RELVAN LUMINA" },
      {
        property: "og:description",
        content: "A beauty brand dedicated to simple, effective and refined skincare.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { settings } = useCatalog();
  const paragraphs = settings.aboutBody
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <EditorialPage
      eyebrow={settings.aboutEyebrow}
      title={settings.aboutTitle}
      intro={settings.aboutIntro}
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <img
          src={heroImage}
          alt="The RELVAN LUMINA skincare edit"
          width={1600}
          height={1200}
          className="aspect-[4/3] w-full object-cover object-right"
        />
        <div>
          {settings.aboutQuote && (
            <p className="font-display text-3xl leading-snug">{settings.aboutQuote}</p>
          )}
          <div className="mt-6 space-y-5 leading-7 text-muted-foreground">
            {paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </EditorialPage>
  );
}
