import { Link, createFileRoute } from "@tanstack/react-router";
import { EditorialPage } from "@/components/editorial-page";
import { useCatalog } from "@/lib/catalog-queries";
export const Route = createFileRoute("/categories")({ head: () => ({ meta: [{ title: "Skincare Categories — RELVAN LUMINA" }, { name: "description", content: "Browse Korean skincare by category." }, { property: "og:title", content: "Skincare Categories — RELVAN LUMINA" }, { property: "og:description", content: "Find the right skincare step for your routine." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: CategoriesPage });
function CategoriesPage() {
  const { categories } = useCatalog();
  return (
    <EditorialPage
      eyebrow="Explore"
      title="Skincare, step by step."
      intro="Begin with the part of your routine that needs the most care."
    >
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet. Add them in Admin.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((item) => (
            <Link to="/shop" search={{ category: item.name }} key={item.name} className="group">
              {item.image ? (
                <img src={item.image} alt={item.name} className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="aspect-[4/5] w-full bg-secondary/60" />
              )}
              <h2 className="mt-4 font-display text-2xl">{item.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </Link>
          ))}
        </div>
      )}
    </EditorialPage>
  );
}
