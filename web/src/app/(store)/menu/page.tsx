import type { Metadata } from "next";
import Link from "next/link";
import { MenuBrowser } from "@/components/menu-browser";
import { Stage } from "@/components/stage";
import { listMeals } from "@/server/catalog";

export const metadata: Metadata = { title: "Menu", description: "Breakfast and lunch bowls from AuraBowls." };

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ goal?: string; q?: string }> }) {
  const { goal, q } = await searchParams;
  const meals = await listMeals();
  const filtered = goal ? meals.filter((meal) => meal.goals.some((item) => item.slug === goal)) : meals;
  return (
    <div>
      <Stage eyebrow="AuraBowls" title="Menu" copy="Signature bowls, biryani, morning plates, sips, and bites. Offer prices are what you pay. Placeholder photos are labelled. Dinner appears only when the kitchen opens it.">
        <Link href="/bowls/build" className="btn btn-forest">Build Your Own Bowl</Link>
      </Stage>
      <MenuBrowser meals={filtered} initialQuery={q || ""} />
    </div>
  );
}
