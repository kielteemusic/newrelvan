import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  defaultRoutineSteps,
  defaultValueProps,
  fallbackImage,
  stockLabel,
  type Category,
  type ContentCard,
  type CustomerReview,
  type Product,
  type RoutineStep,
  type StoreSettings,
} from "./catalog";

function asCards(value: unknown): ContentCard[] {
  if (!Array.isArray(value)) return defaultValueProps;
  const cards = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = typeof row["title"] === "string" ? row["title"] : "";
      const text = typeof row["text"] === "string" ? row["text"] : "";
      return title ? { title, text } : null;
    })
    .filter((item): item is ContentCard => Boolean(item));
  return cards.length ? cards : defaultValueProps;
}

function asSteps(value: unknown): RoutineStep[] {
  if (!Array.isArray(value)) return defaultRoutineSteps;
  const steps = value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = typeof row["title"] === "string" ? row["title"] : "";
      const text = typeof row["text"] === "string" ? row["text"] : "";
      const number =
        typeof row["number"] === "string"
          ? row["number"]
          : String(index + 1).padStart(2, "0");
      return title ? { number, title, text } : null;
    })
    .filter((item): item is RoutineStep => Boolean(item));
  return steps.length ? steps : defaultRoutineSteps;
}

function publicClient(): SupabaseClient<Database> {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();

  const [productsResult, categoriesResult, imagesResult, reviewsResult, settingsResult] =
    await Promise.all([
      supabase.from("products").select("*").eq("active", true).order("created_at"),
      supabase.from("categories").select("*").eq("active", true).order("sort_order"),
      supabase.from("product_images").select("product_id, url, sort_order").order("sort_order"),
      supabase.from("reviews").select("product_id, rating").eq("approved", true),
      supabase.from("site_settings").select("*").limit(1).maybeSingle(),
    ]);

  const settingsRow = settingsResult.data;
  const settings: StoreSettings = {
    businessName: settingsRow?.business_name ?? "RELVAN LUMINA",
    whatsapp: settingsRow?.whatsapp ?? "",
    instagram: settingsRow?.instagram ?? "",
    email: settingsRow?.email ?? "",
    deliveryFee: Number(settingsRow?.delivery_fee ?? 3500),
    freeDeliveryThreshold: Number(settingsRow?.free_delivery_threshold ?? 75000),
    lowStockThreshold: settingsRow?.low_stock_threshold ?? 5,
    announcement:
      settingsRow?.announcement ?? "Refined Skincare • Carefully Curated Korean Essentials",
    homepageEyebrow: settingsRow?.homepage_eyebrow ?? "The Korean skincare edit",
    homepageHeadline: settingsRow?.homepage_headline ?? "Refined Skincare. Real Results.",
    homepageSubcopy:
      settingsRow?.homepage_subcopy ??
      "Discover carefully curated Korean skincare essentials for clear, healthy and glowing skin.",
    aboutEyebrow: settingsRow?.about_eyebrow ?? "Our story",
    aboutTitle: settingsRow?.about_title ?? "Beauty, considered.",
    aboutIntro:
      settingsRow?.about_intro ??
      "RELVAN LUMINA is a beauty and personal-care brand dedicated to carefully selected Korean skincare.",
    aboutQuote:
      settingsRow?.about_quote ??
      "We believe the best routine is the one you understand, enjoy and return to.",
    aboutBody: settingsRow?.about_body ?? "",
    valueProps: asCards(settingsRow?.value_props),
    routineEyebrow: settingsRow?.routine_eyebrow ?? "Your daily ritual",
    routineTitle: settingsRow?.routine_title ?? "Five steps to luminous skin.",
    routineIntro:
      settingsRow?.routine_intro ??
      "A consistent routine does not need to be complicated. Start with the essentials, then listen to your skin.",
    routineSteps: asSteps(settingsRow?.routine_steps),
  };

  const categoryRows = categoriesResult.data ?? [];
  const categories: Category[] = categoryRows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    image: row.image_url && !row.image_url.startsWith("/products/") ? row.image_url : fallbackImage,
  }));

  const imagesByProduct = new Map<string, string[]>();
  for (const image of imagesResult.data ?? []) {
    // Ignore old demo paths that never existed in /public
    if (!image.url || image.url.startsWith("/products/")) continue;
    const list = imagesByProduct.get(image.product_id) ?? [];
    list.push(image.url);
    imagesByProduct.set(image.product_id, list);
  }

  const ratings = new Map<string, { total: number; count: number }>();
  for (const review of reviewsResult.data ?? []) {
    const current = ratings.get(review.product_id) ?? { total: 0, count: 0 };
    current.total += review.rating;
    current.count += 1;
    ratings.set(review.product_id, current);
  }

  const products: Product[] = (productsResult.data ?? []).map((row) => {
    const category = categoryRows.find((item) => item.id === row.category_id);
    const images = imagesByProduct.get(row.id) ?? [];
    const rating = ratings.get(row.id);
    return {
      id: row.id,
      slug: row.slug,
      brand: row.brand,
      name: row.name,
      description: row.description ?? row.short_description ?? "",
      shortDescription: row.short_description ?? row.description ?? "",
      price: Number(row.price),
      ...(row.compare_at_price ? { compareAt: Number(row.compare_at_price) } : {}),
      rating: rating && rating.count ? Math.round((rating.total / rating.count) * 10) / 10 : 0,
      reviews: rating?.count ?? 0,
      category: category?.name ?? "Skincare",
      categorySlug: category?.slug ?? "",
      skinType: row.skin_type ?? [],
      concerns: row.skin_concerns ?? [],
      benefits: row.benefits ?? [],
      ingredients: row.ingredients ?? [],
      howToUse:
        row.how_to_use ??
        "Apply to clean skin as the appropriate step in your morning or evening routine.",
      size: row.size ?? "",
      stockQuantity: row.stock_quantity,
      stock: stockLabel(row.stock_quantity, settings.lowStockThreshold),
      image: images[0] || fallbackImage,
      images,
      featured: row.featured,
      bestSeller: row.best_seller,
      newArrival: row.new_arrival,
    };
  });

  return { products, categories, settings };
});

export const listReviews = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, customer_name, rating, review, photo_url, verified, created_at, products(name)")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(48);

  const reviews: CustomerReview[] = (data ?? []).map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    rating: row.rating,
    review: row.review ?? "",
    photoUrl: row.photo_url,
    verified: row.verified,
    productName: (row.products as { name: string } | null)?.name ?? null,
    createdAt: row.created_at,
  }));
  return reviews;
});
