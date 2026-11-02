import type { Metadata } from "next";
import Link from "next/link";
import { MenuBrowser } from "@/components/menu-browser";
import { Stage } from "@/components/stage";
import { businessWhatsapp } from "@/lib/order-message";
import { JsonLd, breadcrumbJsonLd, menuJsonLd, pageMeta } from "@/lib/seo";
import { getSettings, listMeals } from "@/server/catalog";

export const metadata: Metadata = pageMeta({
  title: "Healthy Bowl Menu in Madhapur",
  description: "Full Aura Bowls menu with prices: paneer, chicken, tofu and egg protein bowls, healthy biryani bowls, overnight oats, salads, wellness shots, juices, buttermilk and crispy rolls. Delivered in Madhapur PIN 500081.",
  path: "/menu",
});

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ goal?: string; q?: string }> }) {
  const { goal, q } = await searchParams;
  const meals = await listMeals();
  const settings = await getSettings().catch(() => null);
  const filtered = goal ? meals.filter((meal) => meal.goals.some((item) => item.slug === goal)) : meals;
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Menu", path: "/menu" }])} />
      <JsonLd data={menuJsonLd(meals)} />
      <Stage eyebrow="AuraBowls · Madhapur" title="Menu" copy="Protein bowls, oats, salads, juices and bites with prices. WhatsApp opens a draft from your number. We reply on that chat with the payment QR.">
        <Link href="/bowls/build" className="btn btn-forest">Build Your Own Bowl</Link>
      </Stage>
      <MenuBrowser meals={filtered} initialQuery={q || ""} whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />
    </div>
  );
}
