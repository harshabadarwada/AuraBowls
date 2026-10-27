import { db } from "@/lib/db";
import { catalog, categories } from "../../prisma/catalog";

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

function publishedCatalog(mealType?: string): PublicMeal[] {
  const names = new Map<string, string>(categories.map((item) => [item[0], item[1]]));
  const order = new Map<string, number>(categories.map((item) => [item[0], item[4]]));
  return catalog
    .filter((meal) => !mealType || meal.type === mealType)
    .sort((left, right) => (order.get(left.category) ?? 0) - (order.get(right.category) ?? 0) || left.name.localeCompare(right.name))
    .map((meal) => ({
      id: meal.slug,
      slug: meal.slug,
      name: meal.name,
      description: meal.description,
      mealType: meal.type,
      pricePaise: meal.price,
      compareAtPaise: meal.compareAt,
      categorySlug: meal.category,
      categoryName: names.get(meal.category) || meal.category,
      portionLabel: meal.portion,
      dietTags: [meal.diet],
      ingredients: meal.ingredients,
      allergens: "",
      allergenVerified: false,
      imageUrl: meal.image,
      imageIsPlaceholder: true,
      available: true,
      isPopular: false,
      nutritionStatus: "missing",
      calories: null,
      proteinTenths: null,
      carbsTenths: null,
      fatTenths: null,
      fiberTenths: null,
      nutritionSource: "",
      highProtein: false,
      goals: [],
      addons: [],
    }));
}

export async function listMeals(mealType?: string): Promise<PublicMeal[]> {
  try {
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
  } catch {
    return publishedCatalog(mealType);
  }
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
