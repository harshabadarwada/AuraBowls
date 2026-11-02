import type { Metadata } from "next";
import { GoalPlanner } from "@/components/goal-planner";
import { businessWhatsapp } from "@/lib/order-message";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { getSettings, listMeals } from "@/server/catalog";

export const metadata: Metadata = pageMeta({
  title: "Meal Plans in Madhapur",
  description: "Breakfast and lunch meal plans delivered in Madhapur PIN 500081. One day, five weekdays at 5% off, or twenty weekdays at 10% off the menu price. Pick each day's bowl. Order on WhatsApp.",
  path: "/plans",
});

export default async function PlansPage() {
  const meals = await listMeals();
  const settings = await getSettings().catch(() => null);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Meal plans", path: "/plans" }])} />
      <GoalPlanner meals={meals} whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />
    </>
  );
}
