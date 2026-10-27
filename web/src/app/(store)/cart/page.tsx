import type { Metadata } from "next";
import { CartReview } from "@/components/cart-review";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };

export default async function CartPage() {
  const meals = await db().meal.findMany({ select: { id: true, name: true } });
  const mealNames = Object.fromEntries(meals.map((meal) => [meal.id, meal.name]));
  return <CartReview mealNames={mealNames} />;
}
