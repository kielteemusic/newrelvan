import { queryOptions, useQuery } from "@tanstack/react-query";
import { getCatalog, listReviews } from "./catalog.functions";
import {
  defaultRoutineSteps,
  defaultValueProps,
  type StoreSettings,
} from "./catalog";

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});

export const reviewsQuery = queryOptions({
  queryKey: ["reviews"],
  queryFn: () => listReviews(),
  staleTime: 60_000,
});

export const defaultSettings: StoreSettings = {
  businessName: "RELVAN LUMINA",
  whatsapp: "",
  instagram: "",
  email: "",
  deliveryFee: 3500,
  freeDeliveryThreshold: 75000,
  lowStockThreshold: 5,
  announcement: "Refined Skincare • Carefully Curated Korean Essentials",
  homepageEyebrow: "The Korean skincare edit",
  homepageHeadline: "Refined Skincare. Real Results.",
  homepageSubcopy:
    "Discover carefully curated Korean skincare essentials for clear, healthy and glowing skin.",
  aboutEyebrow: "Our story",
  aboutTitle: "Beauty, considered.",
  aboutIntro:
    "RELVAN LUMINA is a beauty and personal-care brand dedicated to carefully selected Korean skincare.",
  aboutQuote: "We believe the best routine is the one you understand, enjoy and return to.",
  aboutBody: "",
  valueProps: defaultValueProps,
  routineEyebrow: "Your daily ritual",
  routineTitle: "Five steps to luminous skin.",
  routineIntro:
    "A consistent routine does not need to be complicated. Start with the essentials, then listen to your skin.",
  routineSteps: defaultRoutineSteps,
};

export function useCatalog() {
  const { data, isLoading } = useQuery(catalogQuery);
  return {
    products: data?.products ?? [],
    categories: data?.categories ?? [],
    settings: data?.settings ?? defaultSettings,
    isLoading,
  };
}
