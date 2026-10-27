"use client";

import { useRouter } from "next/navigation";
import { writeDraft } from "@/components/draft";
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
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startDate = tomorrow.toISOString().slice(0, 10);
        writeDraft({
          mode: "single",
          planSlug: null,
          mealType: meal.mealType as "breakfast" | "lunch",
          startDate,
          pinCode: "",
          couponCode: "",
          selections: [{ date: startDate, mealId: meal.id, addonIds: [], quantity: 1, note: "", slotId: "" }],
        });
        router.push("/cart");
      }}
    >
      Add to cart
    </button>
  );
}
