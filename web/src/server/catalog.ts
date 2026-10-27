import { db } from "@/lib/db";

export async function getSettings() {
  return db().businessSettings.findUnique({ where: { id: "default" } });
}

export type PublicMeal = {
  id: string;
  slug: string;
  name: string;
  description: string;
  mealType: string;
  pricePaise: number;
  compareAtPaise: number;
  categorySlug: string;
  categoryName: string;
  portionLabel: string;
  dietTags: string[];
  ingredients: string;
  allergens: string;
  allergenVerified: boolean;
  imageUrl: string;
  imageIsPlaceholder: boolean;
  available: boolean;
  isPopular: boolean;
  nutritionStatus: string;
  calories: number | null;
  proteinTenths: number | null;
  carbsTenths: number | null;
  fatTenths: number | null;
  fiberTenths: number | null;
  nutritionSource: string;
  highProtein: boolean;
  goals: { slug: string; name: string }[];
  addons: { id: string; name: string; description: string; pricePaise: number }[];
};

export async function listMeals(mealType?: string): Promise<PublicMeal[]> {
  const settings = await getSettings();
  const minProtein = (settings?.proteinGoalMinG ?? 25) * 10;
  const meals = await db().meal.findMany({
    where: {
      published: true,
      ...(mealType ? { mealType } : {}),
      ...(settings?.dinnerEnabled ? {} : { mealType: mealType && mealType !== "dinner" ? mealType : { not: "dinner" } }),
    },
    include: { goals: { include: { goal: true } }, addons: { include: { addon: true } }, category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });
  return meals.map((meal) => ({
    id: meal.id,
    slug: meal.slug,
    name: meal.name,
    description: meal.description,
    mealType: meal.mealType,
    pricePaise: meal.pricePaise,
    compareAtPaise: meal.compareAtPaise,
    categorySlug: meal.category.slug,
    categoryName: meal.category.name,
    portionLabel: meal.portionLabel,
    dietTags: meal.dietTags.split(",").map((tag) => tag.trim()).filter(Boolean),
    ingredients: meal.ingredients,
    allergens: meal.allergens,
    allergenVerified: meal.allergenVerified,
    imageUrl: meal.imageUrl,
    imageIsPlaceholder: meal.imageIsPlaceholder,
    available: meal.available,
    isPopular: meal.isPopular,
    nutritionStatus: meal.nutritionStatus,
    calories: meal.calories,
    proteinTenths: meal.proteinTenths,
    carbsTenths: meal.carbsTenths,
    fatTenths: meal.fatTenths,
    fiberTenths: meal.fiberTenths,
    nutritionSource: meal.nutritionSource,
    highProtein:
      meal.nutritionStatus !== "missing" &&
      meal.proteinTenths !== null &&
      meal.proteinTenths >= minProtein &&
      meal.goals.some((link) => link.goal.slug === "high-protein"),
    goals: meal.goals.filter((link) => link.goal.active).map((link) => ({ slug: link.goal.slug, name: link.goal.name })),
    addons: meal.addons.filter((link) => link.addon.active).map((link) => ({
      id: link.addon.id,
      name: link.addon.name,
      description: link.addon.description,
      pricePaise: link.addon.pricePaise,
    })),
  }));
}

export async function getMeal(slug: string) {
  const meals = await listMeals();
  return meals.find((meal) => meal.slug === slug) ?? null;
}

export function nutritionLabel(status: string) {
  if (status === "verified") return "Verified nutrition";
  if (status === "estimated") return "Estimated nutrition";
  return "Nutrition not added";
}

export function grams(tenths: number | null) {
  if (tenths === null) return null;
  return (tenths / 10).toFixed(1).replace(/\.0$/, "");
}
