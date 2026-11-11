import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuBrowser } from "@/components/menu-browser";
import { Stage } from "@/components/stage";
import { businessWhatsapp } from "@/lib/order-message";
import { JsonLd, breadcrumbJsonLd, menuJsonLd, pageMeta } from "@/lib/seo";
import { getSettings, listMeals } from "@/server/catalog";

const typeCopy = {
  breakfast: {
    title: "Breakfast Bowls, Oats & Salads in Madhapur",
    heading: "Breakfast",
    description: "Overnight oats, breakfast salads, wellness shots, juices and buttermilk for Madhapur and Hitech City. Breakfast slots run 7:30 to 10:30 am, Monday to Saturday. Order on WhatsApp.",
  },
  lunch: {
    title: "Healthy Lunch Bowls Delivered in Madhapur",
    heading: "Lunch",
    description: "Paneer, chicken, tofu, egg and soya protein bowls, healthy biryani bowls and crispy rolls for Madhapur offices and homes. Lunch slots run 12:00 to 3:00 pm, Monday to Saturday.",
  },
  dinner: {
    title: "Dinner Bowls in Madhapur",
    heading: "Dinner",
    description: "Dinner is not open yet at Aura Bowls. Breakfast and lunch are available within 7 km of Madhapur.",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const copy = typeCopy[type as keyof typeof typeCopy];
  if (!copy) return { title: "Menu" };
  return pageMeta({
    title: copy.title,
    description: copy.description,
    path: `/menu/${type}`,
    index: type !== "dinner",
  });
}

export default async function MealTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!["breakfast", "lunch", "dinner"].includes(type)) notFound();
  const copy = typeCopy[type as keyof typeof typeCopy];
  const settings = await getSettings().catch(() => null);
  if (type === "dinner" && !settings?.dinnerEnabled) {
    return (
      <>
        <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Menu", path: "/menu" }, { name: "Dinner", path: "/menu/dinner" }])} />
        <Stage eyebrow="Coming soon" title="Dinner is not open yet" copy="Breakfast and lunch are available within 7 km of Madhapur. Dinner appears here after it is enabled in admin settings and meals are published." />
      </>
    );
  }
  const meals = await listMeals(type);
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Menu", path: "/menu" }, { name: copy.heading, path: `/menu/${type}` }])} />
      {meals.length > 0 ? <JsonLd data={menuJsonLd(meals)} /> : null}
      <Stage eyebrow={`Menu · ${copy.heading}`} title={copy.heading} copy={meals.length === 0 ? `No ${type} meals are published.` : copy.description} />
      {meals.length === 0 ? null : <MenuBrowser meals={meals} initialType={type} whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />}
    </div>
  );
}
