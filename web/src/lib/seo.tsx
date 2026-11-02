import type { Metadata } from "next";
import { dietLabel, formatInr } from "@/lib/format";
import { publicSiteUrl } from "@/lib/site";

export const brand = "AuraBowls";
export const servedPin = "500081";
export const servedAreas = ["Madhapur", "Hitech City"];
export const servedLabel = "Madhapur and nearby areas, PIN 500081, including Hitech City, Hyderabad";
export const businessPhone = "+91-9652148800";
export const businessPhoneDisplay = "+91 96521 48800";
export const shareImage = "/bowls/paneer-power-bowl.jpg";
export const cuisine = ["Healthy", "Indian", "Salads", "Bowls", "Biryani", "Breakfast"];

type MealSeo = {
  name: string;
  slug: string;
  description: string;
  ingredients: string;
  mealType: string;
  dietTags: string[];
  pricePaise: number;
  portionLabel: string;
  imageUrl: string;
  imageIsPlaceholder: boolean;
  available?: boolean;
  categoryName?: string;
};

export function absoluteUrl(path = "/") {
  return new URL(path, publicSiteUrl()).toString();
}

export function pageMeta({
  title,
  description,
  path,
  image = shareImage,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  index?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image.startsWith("http") ? image : absoluteUrl(image);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: brand,
      locale: "en_IN",
      url,
      title,
      description,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export function mealBlurb(meal: Pick<MealSeo, "name" | "description" | "ingredients" | "mealType" | "dietTags" | "pricePaise" | "portionLabel">) {
  const diet = meal.dietTags.map(dietLabel).filter(Boolean).join(", ").toLowerCase();
  const contents = meal.ingredients || meal.description;
  const kind = diet ? `${diet} ${meal.mealType}` : meal.mealType;
  return `${meal.name} is a ${kind} with ${contents}. ${meal.portionLabel}, ${formatInr(meal.pricePaise)}. Delivered in ${servedLabel}. Order on WhatsApp.`;
}

export function mealMeta(meal: MealSeo): Metadata {
  return pageMeta({
    title: `${meal.name} in Madhapur`,
    description: mealBlurb(meal),
    path: `/meals/${meal.slug}`,
    image: meal.imageIsPlaceholder || !meal.imageUrl ? shareImage : meal.imageUrl,
  });
}

export function businessJsonLd() {
  const url = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": ["FoodEstablishment", "LocalBusiness"],
    "@id": `${url}#business`,
    name: brand,
    alternateName: ["Aura Bowls", "The Aura Bowl", "AuraBowls Hyderabad"],
    description: `Healthy protein bowls, biryani bowls, overnight oats, salads, juices and meal plans, delivered in ${servedLabel}. Veg and non-veg. Custom bowls from ₹120. Order on WhatsApp.`,
    url,
    image: absoluteUrl(shareImage),
    logo: absoluteUrl("/aura-logo.png"),
    telephone: businessPhone,
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "UPI",
    servesCuisine: cuisine,
    hasMenu: absoluteUrl("/menu"),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Madhapur",
      addressRegion: "Telangana",
      postalCode: servedPin,
      addressCountry: "IN",
    },
    areaServed: servedAreas.map((name) => ({ "@type": "Place", name: `${name}, Hyderabad` })),
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "07:30", closes: "15:00" },
    ],
    knowsAbout: [
      "protein bowls Madhapur",
      "healthy lunch delivery Hitech City",
      "custom veg and non-veg bowls",
      "overnight oats Hyderabad",
      "meal plans Madhapur",
    ],
    potentialAction: {
      "@type": "OrderAction",
      target: absoluteUrl("/menu"),
      deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
    },
  };
}

export function websiteJsonLd() {
  const url = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}#website`,
    name: brand,
    alternateName: ["Aura Bowls", "The Aura Bowl"],
    url,
    inLanguage: "en-IN",
    publisher: { "@id": `${url}#business` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/menu")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

function menuItemJsonLd(meal: MealSeo) {
  return {
    "@type": "MenuItem",
    name: meal.name,
    url: absoluteUrl(`/meals/${meal.slug}`),
    description: meal.ingredients || meal.description,
    image: meal.imageIsPlaceholder || !meal.imageUrl ? undefined : absoluteUrl(meal.imageUrl),
    suitableForDiet: meal.dietTags.includes("non_veg") ? undefined : "https://schema.org/VegetarianDiet",
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (meal.pricePaise / 100).toFixed(2),
      availability: meal.available === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: absoluteUrl(`/meals/${meal.slug}`),
      areaServed: servedLabel,
    },
  };
}

export function mealJsonLd(meal: MealSeo) {
  return {
    "@context": "https://schema.org",
    ...menuItemJsonLd(meal),
    "@id": `${absoluteUrl(`/meals/${meal.slug}`)}#item`,
  };
}

export function menuJsonLd(meals: MealSeo[]) {
  const sections = new Map<string, MealSeo[]>();
  for (const meal of meals) {
    const name = meal.categoryName || meal.mealType;
    const list = sections.get(name) || [];
    list.push(meal);
    sections.set(name, list);
  }
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${brand} menu`,
    url: absoluteUrl("/menu"),
    hasMenuSection: [...sections.entries()].map(([name, items]) => ({
      "@type": "MenuSection",
      name,
      hasMenuItem: items.map(menuItemJsonLd),
    })),
  };
}

export function howToBuildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Build your own AuraBowls bowl",
    description: "Choose veg or non-veg, then a base, protein, veggies, sauce and extras. The price updates as you pick. A custom bowl starts at ₹120.",
    estimatedCost: { "@type": "MonetaryAmount", currency: "INR", minValue: 120 },
    step: [
      { "@type": "HowToStep", position: 1, name: "Choose veg or non-veg", text: "This decides which proteins and extras you see." },
      { "@type": "HowToStep", position: 2, name: "Pick a base", text: "Signature base, healthy biryani rice, or greens. Included in ₹120." },
      { "@type": "HowToStep", position: 3, name: "Add protein by portion", text: "Paneer, tofu, soya or chickpeas for veg. Grilled chicken, crispy chicken or boiled eggs for non-veg. ₹40, ₹80 or ₹120 for one to three portions." },
      { "@type": "HowToStep", position: 4, name: "Choose veggies and a sauce", text: "Up to four veggies and one sauce, included in the base price." },
      { "@type": "HowToStep", position: 5, name: "Add extras if you want", text: "Cheese, sprouts, extra sauce or extra egg at ₹40. Extra paneer, avocado or extra chicken at ₹50." },
      { "@type": "HowToStep", position: 6, name: "Send on WhatsApp", text: "Enter your name, address and PIN. PIN 500081 continues the order. Any other PIN sends a location enquiry." },
    ],
  };
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
