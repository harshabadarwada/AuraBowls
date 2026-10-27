import type { Metadata } from "next";
import { PlansBoard, type PlanListing } from "@/components/plans-board";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Meal plans", description: "Breakfast, lunch, or both, planned once and paid once." };

function mealsFrom(pricePaise: number, count: number, discountBps: number) {
  const reference = pricePaise * count;
  const discount = Math.round((reference * discountBps) / 10_000);
  return reference - Math.min(discount, reference);
}

export default async function PlansPage() {
  const plans = await db().planTemplate.findMany({ where: { active: true }, orderBy: [{ mealType: "asc" }, { fixedDeliveryCount: "asc" }] });
  const slugs = plans.flatMap((plan) => [plan.defaultMealSlug, plan.companionMealSlug].filter(Boolean));
  const meals = await db().meal.findMany({
    where: { slug: { in: slugs }, published: true },
    select: { slug: true, name: true, pricePaise: true, imageUrl: true, imageIsPlaceholder: true },
  });
  const mealBySlug = new Map(meals.map((meal) => [meal.slug, meal]));
  const cards: PlanListing[] = plans
    .filter((plan): plan is typeof plan & { mealType: PlanListing["mealType"]; cadence: PlanListing["cadence"] } =>
      (plan.mealType === "breakfast" || plan.mealType === "lunch" || plan.mealType === "both") && (plan.cadence === "daily" || plan.cadence === "weekly" || plan.cadence === "monthly"))
    .map((plan) => {
      const meal = mealBySlug.get(plan.defaultMealSlug);
      const lunch = plan.companionMealSlug ? mealBySlug.get(plan.companionMealSlug) : undefined;
      const mealsFromPaise = plan.mealType === "both"
        ? meal && lunch ? mealsFrom(meal.pricePaise, plan.fixedDeliveryCount, plan.discountBps) + mealsFrom(lunch.pricePaise, plan.fixedDeliveryCount, plan.discountBps) : null
        : meal ? mealsFrom(meal.pricePaise, plan.fixedDeliveryCount, plan.discountBps) : null;
      return {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        mealType: plan.mealType,
        cadence: plan.cadence,
        fixedDeliveryCount: plan.fixedDeliveryCount,
        discountBps: plan.discountBps,
        mealsFromPaise,
        mealName: meal?.name || "",
        lunchMealName: lunch?.name || "",
        imageUrl: meal?.imageUrl || "",
        lunchImageUrl: lunch?.imageUrl || "",
        imageIsPlaceholder: (meal?.imageIsPlaceholder ?? true) || (plan.mealType === "both" && (lunch?.imageIsPlaceholder ?? true)),
      };
    });
  return <PlansBoard plans={cards} />;
}
