"use client";

import { useRouter } from "next/navigation";
import { addMenuLine } from "@/components/draft";
import type { PublicMeal } from "@/server/catalog";

export function AddMealButton({ meal }: { meal: PublicMeal }) {
  const router = useRouter();
  if (meal.mealType === "dinner" || !meal.available) {
    return <p className="text-sm text-[#6A5A4E]">This meal cannot be added right now.</p>;
  }
  return (
    <button
      className="btn btn-accent w-full sm:w-auto"
      onClick={() => {
        addMenuLine({ slug: meal.slug, name: meal.name, pricePaise: meal.pricePaise, mealType: meal.mealType });
        router.push("/cart");
      }}
    >
      Add and send on WhatsApp
    </button>
  );
}
