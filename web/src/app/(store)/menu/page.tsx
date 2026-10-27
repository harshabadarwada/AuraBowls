import type { Metadata } from "next";
import Link from "next/link";
import { MenuBrowser } from "@/components/menu-browser";
import { Stage } from "@/components/stage";
import { businessWhatsapp } from "@/lib/order-message";
import { getSettings, listMeals } from "@/server/catalog";

export const metadata: Metadata = { title: "Menu", description: "Breakfast and lunch bowls from AuraBowls." };

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ goal?: string; q?: string }> }) {
  const { goal, q } = await searchParams;
  const meals = await listMeals();
  const settings = await getSettings().catch(() => null);
  const filtered = goal ? meals.filter((meal) => meal.goals.some((item) => item.slug === goal)) : meals;
  return (
    <div>
      <Stage eyebrow="AuraBowls" title="Menu" copy="Add what you want. WhatsApp opens a draft from your number. We reply on that chat with the payment QR.">
        <Link href="/bowls/build" className="btn btn-forest">Build Your Own Bowl</Link>
      </Stage>
      <MenuBrowser meals={filtered} initialQuery={q || ""} whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />
    </div>
  );
}
