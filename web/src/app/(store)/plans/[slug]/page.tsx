import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlanBuilder } from "@/components/plan-builder";
import { db } from "@/lib/db";
import { listMeals } from "@/server/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const plan = await db().planTemplate.findUnique({ where: { slug: (await params).slug } });
  return { title: plan?.name || "Meal plan" };
}

function mealsFrom(pricePaise: number, count: number, discountBps: number) {
  const reference = pricePaise * count;
  const discount = Math.round((reference * discountBps) / 10_000);
  return reference - Math.min(discount, reference);
}

const scopes = ["breakfast", "lunch", "both"] as const;
const cadences = ["daily", "weekly", "monthly"] as const;

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const plan = await db().planTemplate.findUnique({ where: { slug: (await params).slug } });
  if (!plan || !plan.active || !scopes.includes(plan.mealType as (typeof scopes)[number])) notFound();
  const mealType = plan.mealType as (typeof scopes)[number];
  const meals = (await listMeals()).filter((meal) => mealType === "both" ? meal.mealType === "breakfast" || meal.mealType === "lunch" : meal.mealType === mealType);
  const slots = await db().deliverySlot.findMany({
    where: { active: true, mealType: mealType === "both" ? { in: ["breakfast", "lunch"] } : mealType },
    orderBy: { sortOrder: "asc" },
  });
  const templates = await db().planTemplate.findMany({ where: { active: true } });
  const defaults = await db().meal.findMany({
    where: { slug: { in: templates.flatMap((item) => [item.defaultMealSlug, item.companionMealSlug].filter(Boolean)) }, published: true },
    select: { slug: true, pricePaise: true, imageUrl: true, imageIsPlaceholder: true },
  });
  const mealBySlug = new Map(defaults.map((meal) => [meal.slug, meal]));
  const options = templates
    .filter((item): item is typeof item & { mealType: (typeof scopes)[number]; cadence: (typeof cadences)[number] } =>
      scopes.includes(item.mealType as (typeof scopes)[number]) && cadences.includes(item.cadence as (typeof cadences)[number]))
    .map((item) => {
      const first = mealBySlug.get(item.defaultMealSlug);
      const second = item.companionMealSlug ? mealBySlug.get(item.companionMealSlug) : undefined;
      const mealsFromPaise = item.mealType === "both"
        ? first && second ? mealsFrom(first.pricePaise, item.fixedDeliveryCount, item.discountBps) + mealsFrom(second.pricePaise, item.fixedDeliveryCount, item.discountBps) : null
        : first ? mealsFrom(first.pricePaise, item.fixedDeliveryCount, item.discountBps) : null;
      return {
        slug: item.slug,
        name: item.name,
        mealType: item.mealType,
        cadence: item.cadence,
        fixedDeliveryCount: item.fixedDeliveryCount,
        discountBps: item.discountBps,
        mealsFromPaise,
        imageUrl: first?.imageUrl || "",
        lunchImageUrl: second?.imageUrl || "",
        imageIsPlaceholder: first?.imageIsPlaceholder ?? true,
      };
    });
  return (
    <PlanBuilder
      plan={{
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        mealType,
        cadence: plan.cadence,
        fixedDeliveryCount: plan.fixedDeliveryCount,
        discountBps: plan.discountBps,
        defaultMealSlug: plan.defaultMealSlug,
        companionMealSlug: plan.companionMealSlug,
      }}
      meals={meals}
      slots={slots.map((slot) => ({ id: slot.id, label: slot.label, startTime: slot.startTime, mealType: slot.mealType as "breakfast" | "lunch" }))}
      options={options}
    />
  );
}
