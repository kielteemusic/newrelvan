import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCatalog } from "@/lib/catalog-queries";
import type { Product } from "@/lib/catalog";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): { category?: string } =>
    typeof search["category"] === "string" ? { category: search["category"] } : {},
  head: () => ({
    meta: [
      { title: "Shop Korean Skincare — RELVAN LUMINA" },
      {
        name: "description",
        content: "Explore our curated edit of Korean skincare essentials.",
      },
      { property: "og:title", content: "Shop Korean Skincare — RELVAN LUMINA" },
      {
        property: "og:description",
        content: "Explore our curated edit of effective Korean skincare essentials.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function buildFilterGroups(products: Product[], categories: string[]) {
  const brands = uniqueSorted(products.map((p) => p.brand));
  const skinTypes = uniqueSorted(products.flatMap((p) => p.skinType));
  const concerns = uniqueSorted(products.flatMap((p) => p.concerns));
  const groups: Record<string, string[]> = {};
  if (categories.length) groups["Category"] = categories;
  if (brands.length) groups["Brand"] = brands;
  if (skinTypes.length) groups["Skin type"] = skinTypes;
  if (concerns.length) groups["Skin concern"] = concerns;
  groups["Availability"] = ["In stock", "Low stock"];
  groups["Rating"] = ["4.5 & up", "4.0 & up"];
  groups["Price"] = ["Under ₦25,000", "₦25,000–₦40,000", "Over ₦40,000"];
  return groups;
}

function Filters({
  groups,
  selected,
  toggle,
}: {
  groups: Record<string, string[]>;
  selected: string[];
  toggle: (value: string) => void;
}) {
  return (
    <div className="divide-y divide-border">
      {Object.entries(groups).map(([group, options]) => (
        <div key={group} className="py-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.13em]">{group}</h3>
          <div className="mt-3 space-y-2">
            {options.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                  className="accent-primary"
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function matchesFilter(product: Product, filter: string) {
  if (product.category === filter || product.brand === filter) return true;
  if (product.stock === filter) return true;
  if (filter === "Low stock" && product.stock === "Low stock") return true;
  if (filter === "4.5 & up" && product.rating >= 4.5 && product.reviews > 0) return true;
  if (filter === "4.0 & up" && product.rating >= 4 && product.reviews > 0) return true;
  if (filter === "Under ₦25,000" && product.price < 25000) return true;
  if (filter === "₦25,000–₦40,000" && product.price >= 25000 && product.price <= 40000)
    return true;
  if (filter === "Over ₦40,000" && product.price > 40000) return true;
  if (product.skinType.includes(filter) || product.concerns.includes(filter)) return true;
  return false;
}

function ShopPage() {
  const { products, categories, isLoading } = useCatalog();
  const initial = Route.useSearch().category;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(initial ? [initial] : []);
  const [sort, setSort] = useState("featured");

  const filterGroups = useMemo(
    () => buildFilterGroups(products, categories.map((c) => c.name)),
    [products, categories],
  );

  const toggle = (value: string) =>
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );

  const visible = useMemo(() => {
    let result = products.filter((p) =>
      `${p.name} ${p.brand} ${p.category} ${p.concerns.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
    if (selected.length) {
      result = result.filter((p) => selected.some((filter) => matchesFilter(p, filter)));
    }
    if (sort === "new") result = [...result].sort((a, b) => Number(b.newArrival) - Number(a.newArrival));
    if (sort === "featured")
      result = [...result].sort((a, b) => Number(b.featured) - Number(a.featured));
    if (sort === "low") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "high") result = [...result].sort((a, b) => b.price - a.price);
    if (sort === "rated") result = [...result].sort((a, b) => b.rating - a.rating);
    if (sort === "best") result = [...result].sort((a, b) => b.reviews - a.reviews);
    return result;
  }, [products, query, selected, sort]);

  const sorts: Array<[string, string]> = [
    ["featured", "Featured"],
    ["new", "Newest"],
    ["best", "Best Selling"],
    ["low", "Price Low → High"],
    ["high", "Price High → Low"],
    ["rated", "Highest Rated"],
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-10">
      <header className="border-b border-border pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          The complete edit
        </p>
        <h1 className="mt-2 font-display text-5xl">Shop skincare</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Effective Korean skincare, thoughtfully selected for every complexion and concern.
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block">
          <Filters groups={filterGroups} selected={selected} toggle={toggle} />
        </aside>
        <div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:flex sm:items-center">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the collection"
              className="h-11 min-w-0 rounded-none sm:max-w-sm"
            />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-11 rounded-none lg:hidden">
                  <SlidersHorizontal /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-display text-2xl">Filter the edit</SheetTitle>
                </SheetHeader>
                <Filters groups={filterGroups} selected={selected} toggle={toggle} />
              </SheetContent>
            </Sheet>
            <div className="col-span-2 flex min-w-0 items-center justify-between gap-3 sm:ml-auto">
              <span className="text-sm text-muted-foreground">{visible.length} products</span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-11 w-44 rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sorts.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.map((item) => (
                <button
                  key={item}
                  onClick={() => toggle(item)}
                  className="flex items-center gap-1 bg-secondary px-3 py-1 text-xs"
                >
                  {item}
                  <X className="size-3" />
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <p className="mt-16 text-center text-sm text-muted-foreground">Loading products…</p>
          ) : visible.length === 0 ? (
            <p className="mt-16 text-center text-sm text-muted-foreground">
              {products.length === 0
                ? "No products yet. Add them in Admin → Products."
                : "No products match your filters."}
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 items-stretch gap-x-3 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
