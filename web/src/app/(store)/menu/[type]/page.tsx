import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuBrowser } from "@/components/menu-browser";
import { Stage } from "@/components/stage";
import { getSettings, listMeals } from "@/server/catalog";

export function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  return params.then(({ type }) => ({ title: type[0]?.toUpperCase() + type.slice(1) }));
}

export default async function MealTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!["breakfast", "lunch", "dinner"].includes(type)) notFound();
  const settings = await getSettings();
  if (type === "dinner" && !settings?.dinnerEnabled) {
    return (
      <Stage eyebrow="Coming soon" title="Dinner is not open yet" copy="Breakfast and lunch are available. Dinner appears here after it is enabled in admin settings and meals are published." />
    );
  }
  const meals = await listMeals(type);
  return (
    <div>
      <Stage eyebrow="Menu" title={type[0].toUpperCase() + type.slice(1)} copy={meals.length === 0 ? `No ${type} meals are published.` : undefined} />
      {meals.length === 0 ? null : <MenuBrowser meals={meals} initialType={type} />}
    </div>
  );
}
