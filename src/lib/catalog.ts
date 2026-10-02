export type Product = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  category: string;
  categorySlug: string;
  skinType: string[];
  concerns: string[];
  benefits: string[];
  ingredients: string[];
  howToUse: string;
  size: string;
  stockQuantity: number;
  stock: string;
  image: string;
  images: string[];
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
};

export type ContentCard = { title: string; text: string };
export type RoutineStep = { number: string; title: string; text: string };

export type StoreSettings = {
  businessName: string;
  whatsapp: string;
  instagram: string;
  email: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  lowStockThreshold: number;
  announcement: string;
  homepageEyebrow: string;
  homepageHeadline: string;
  homepageSubcopy: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutIntro: string;
  aboutQuote: string;
  aboutBody: string;
  valueProps: ContentCard[];
  routineEyebrow: string;
  routineTitle: string;
  routineIntro: string;
  routineSteps: RoutineStep[];
};

export type CustomerReview = {
  id: string;
  customerName: string;
  rating: number;
  review: string;
  photoUrl: string | null;
  verified: boolean;
  productName: string | null;
  createdAt: string;
};

export const fallbackImage = "";

export const defaultValueProps: ContentCard[] = [
  { title: "Curated Korean Essentials", text: "A focused edit, never endless choice." },
  { title: "Quality-Focused Selection", text: "Every formula is selected with care." },
  { title: "Skincare Made Simple", text: "Clear guidance for confident routines." },
  { title: "Customer-Centred Service", text: "Thoughtful support at every step." },
];

export const defaultRoutineSteps: RoutineStep[] = [
  { number: "01", title: "Cleanse", text: "Remove sunscreen, makeup and daily buildup without disrupting your skin." },
  { number: "02", title: "Tone", text: "Replenish hydration and prepare skin for the steps that follow." },
  { number: "03", title: "Treat", text: "Choose a serum or ampoule for your most important concern." },
  { number: "04", title: "Moisturize", text: "Support the barrier and seal in comfort." },
  { number: "05", title: "Protect", text: "Finish every morning with broad-spectrum sunscreen." },
];

export const stockLabel = (quantity: number, lowStockThreshold = 5) =>
  quantity <= 0 ? "Sold out" : quantity <= lowStockThreshold ? "Low stock" : "In stock";

export const formatPrice = (value: number) => `\u20a6${Math.round(value).toLocaleString("en-NG")}`;
