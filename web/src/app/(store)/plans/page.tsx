import type { Metadata } from "next";
import { GoalPlanner } from "@/components/goal-planner";
import { businessWhatsapp } from "@/lib/order-message";
import { getSettings, listMeals } from "@/server/catalog";

export const metadata: Metadata = { title: "Meal plans", description: "Choose fat loss, weight gain, or eat healthy, then add bowls." };

export default async function PlansPage() {
  const meals = await listMeals();
  const settings = await getSettings().catch(() => null);
  return <GoalPlanner meals={meals} whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />;
}
