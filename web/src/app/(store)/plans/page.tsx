import type { Metadata } from "next";
import { SubscribeFlow } from "@/components/subscribe-flow";
import { businessWhatsapp } from "@/lib/order-message";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { getSettings } from "@/server/catalog";

export const metadata: Metadata = pageMeta({
  title: "Lunch Meal Plans in Madhapur",
  description: "Aura Bowls lunch subscriptions within 7 km of Madhapur. 3, 5, 10, 20 or 22 days as Pure Veg, Pure Non-Veg or Mixed. Balanced, Power Protein and Carb Load have different plan prices. Pick your bowls and place the order on WhatsApp.",
  path: "/plans",
});

export default async function PlansPage() {
  const settings = await getSettings().catch(() => null);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Meal plans", path: "/plans" }])} />
      <SubscribeFlow whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />
    </>
  );
}
