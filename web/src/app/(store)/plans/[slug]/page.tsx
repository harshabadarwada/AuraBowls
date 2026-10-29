import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlanBuilder } from "@/components/plan-builder";
import { db } from "@/lib/db";
import { businessWhatsapp } from "@/lib/order-message";
import { getSettings, listMeals, mealImage, type PublicMeal } from "@/server/catalog";
import { planMealsFromPaise, publishedPlan, publishedPlans, publishedSlots, type PublishedPlan } from "@/server/published-plans";

const scopes = ["breakfast", "lunch", "both"] as const;
const cadences = ["daily", "weekly", "monthly"] as const;

function optionsFor(templates: PublishedPlan[], meals: PublicMeal[]) {
  const mealBySlug = new Map(meals.map((meal) => [meal.slug, meal]));
  return templates
    .filter((item) => scopes.includes(item.mealType) && cadences.includes(item.cadence))
    .map((item) => {
      const first = mealBySlug.get(item.defaultMealSlug);
      const second = item.companionMealSlug ? mealBySlug.get(item.companionMealSlug) : undefined;
      const mealsFrom = item.mealType === "both"
        ? first && second ? planMealsFromPaise(first.pricePaise, item.fixedDeliveryCount, item.discountBps) + planMealsFromPaise(second.pricePaise, item.fixedDeliveryCount, item.discountBps) : null
        : first ? planMealsFromPaise(first.pricePaise, item.fixedDeliveryCount, item.discountBps) : null;
      return {
        slug: item.slug,
        name: item.name,
        mealType: item.mealType,
        cadence: item.cadence,
        fixedDeliveryCount: item.fixedDeliveryCount,
        discountBps: item.discountBps,
        mealsFromPaise: mealsFrom,
        imageUrl: first?.imageUrl || "",
        lunchImageUrl: second?.imageUrl || "",
        imageIsPlaceholder: first?.imageIsPlaceholder ?? true,
      };
    });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  try {
    const plan = await db().planTemplate.findUnique({ where: { slug } });
    return { title: plan?.name || publishedPlan(slug)?.name || "Meal plan" };
  } catch {
    return { title: publishedPlan(slug)?.name || "Meal plan" };
  }
}

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const meals = await listMeals();
  const settings = await getSettings().catch(() => null);
  const whatsapp = businessWhatsapp(settings?.supportWhatsapp || "");
  const loaded = await loadPlan(slug, meals);
  if (!loaded) notFound();
  const mealType = loaded.plan.mealType;
  return (
    <PlanBuilder
      plan={loaded.plan}
      meals={meals.filter((meal) => mealType === "both" ? meal.mealType === "breakfast" || meal.mealType === "lunch" : meal.mealType === mealType)}
      slots={loaded.slots}
      options={loaded.options}
      whatsapp={whatsapp}
    />
  );
}

async function loadPlan(slug: string, meals: PublicMeal[]) {
  try {
    const plan = await db().planTemplate.findUnique({ where: { slug } });
    if (!plan || !plan.active || !scopes.includes(plan.mealType as (typeof scopes)[number]) || !cadences.includes(plan.cadence as (typeof cadences)[number])) return null;
    const mealType = plan.mealType as (typeof scopes)[number];
    const slots = await db().deliverySlot.findMany({
      where: { active: true, mealType: mealType === "both" ? { in: ["breakfast", "lunch"] } : mealType },
      orderBy: { sortOrder: "asc" },
    });
    const templates = await db().planTemplate.findMany({ where: { active: true } });
    const defaults = await db().meal.findMany({
      where: { slug: { in: templates.flatMap((item) => [item.defaultMealSlug, item.companionMealSlug].filter(Boolean)) }, published: true },
      select: { slug: true, pricePaise: true, imageUrl: true, imageIsPlaceholder: true },
    });
    const priceBySlug = new Map(meals.map((meal) => [meal.slug, meal]));
    for (const meal of defaults) {
      const current = priceBySlug.get(meal.slug);
      if (current) priceBySlug.set(meal.slug, { ...current, pricePaise: meal.pricePaise, ...mealImage(meal) });
    }
    const published = templates.flatMap((item) => {
      if (!scopes.includes(item.mealType as (typeof scopes)[number]) || !cadences.includes(item.cadence as (typeof cadences)[number])) return [];
      return [{
        slug: item.slug,
        name: item.name,
        description: item.description,
        mealType: item.mealType as PublishedPlan["mealType"],
        cadence: item.cadence as PublishedPlan["cadence"],
        scheduleRule: item.scheduleRule === "weekdays" ? "weekdays" as const : "all_days" as const,
        fixedDeliveryCount: item.fixedDeliveryCount,
        defaultMealSlug: item.defaultMealSlug,
        companionMealSlug: item.companionMealSlug,
        discountBps: item.discountBps,
        active: true as const,
      }];
    });
    return {
      plan: {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        mealType,
        cadence: plan.cadence,
        fixedDeliveryCount: plan.fixedDeliveryCount,
        discountBps: plan.discountBps,
        defaultMealSlug: plan.defaultMealSlug,
        companionMealSlug: plan.companionMealSlug,
      },
      slots: slots.flatMap((slot) => slot.mealType === "breakfast" || slot.mealType === "lunch" ? [{ id: slot.id, label: slot.label, startTime: slot.startTime, mealType: slot.mealType as "breakfast" | "lunch" }] : []),
      options: optionsFor(published, [...priceBySlug.values()]),
    };
  } catch {
    const plan = publishedPlan(slug);
    if (!plan) return null;
    return {
      plan,
      slots: publishedSlots.filter((slot) => plan.mealType === "both" || slot.mealType === plan.mealType).map((slot) => ({ id: slot.id, label: slot.label, startTime: slot.startTime, mealType: slot.mealType })),
      options: optionsFor(publishedPlans(), meals),
    };
  }
}
