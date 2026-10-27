import Link from "next/link";
import { dietLabel, formatInr } from "@/lib/format";
import type { PublicMeal } from "@/server/catalog";
import { grams, nutritionLabel } from "@/server/catalog";

export function MealPhoto({ meal, className = "" }: { meal: Pick<PublicMeal, "name" | "imageUrl" | "imageIsPlaceholder">; className?: string }) {
  if (!meal.imageUrl) {
    return <div className={`flex items-center justify-center bg-[#EAF6DC] text-sm text-[#6A5A4E] ${className}`}>Photo not added</div>;
  }
  return (
    <div className={`relative overflow-hidden bg-[#EAF6DC] ${className}`}>
      <img src={meal.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-center" />
      {meal.imageIsPlaceholder ? (
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#6A5A4E]">Placeholder photo</span>
      ) : null}
    </div>
  );
}

export function NutritionLine({ meal }: { meal: PublicMeal }) {
  if (meal.nutritionStatus === "missing" || meal.calories === null) {
    return <p className="text-sm text-[#6A5A4E]">Nutrition information has not been added.</p>;
  }
  return (
    <p className="text-sm text-[#6A5A4E]">
      <span className="font-semibold text-[#1A4A16]">{nutritionLabel(meal.nutritionStatus)}. </span>
      {meal.calories} kcal
      {grams(meal.proteinTenths) ? ` · ${grams(meal.proteinTenths)} g protein` : ""}
      {grams(meal.carbsTenths) ? ` · ${grams(meal.carbsTenths)} g carbs` : ""}
      {grams(meal.fatTenths) ? ` · ${grams(meal.fatTenths)} g fat` : ""}
    </p>
  );
}

export function MacroPills({ meal }: { meal: PublicMeal }) {
  if (meal.nutritionStatus === "missing" || meal.calories === null) return null;
  const items = [
    [`${meal.calories}`, "kcal"],
    grams(meal.proteinTenths) ? [`${grams(meal.proteinTenths)}g`, "protein"] : null,
    grams(meal.carbsTenths) ? [`${grams(meal.carbsTenths)}g`, "carbs"] : null,
    grams(meal.fatTenths) ? [`${grams(meal.fatTenths)}g`, "fat"] : null,
  ].filter((item): item is [string, string] => Boolean(item));
  return (
    <ul className="grid grid-cols-4 gap-2">
      {items.map(([value, label]) => (
        <li key={label} className="rounded-2xl border border-white/80 bg-[#EAF6DC] px-2 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
          <p className="text-sm font-semibold text-[#1A4A16]">{value}</p>
          <p className="text-[10px] uppercase tracking-wide text-[#6A5A4E]">{label}</p>
        </li>
      ))}
    </ul>
  );
}

export function MealCard({ meal, className = "" }: { meal: PublicMeal; className?: string }) {
  return (
    <article className={`store-card group flex h-full flex-col overflow-hidden ${className}`}>
      <Link href={`/meals/${meal.slug}`} className="block overflow-hidden">
        <MealPhoto meal={meal} className="aspect-[4/3] transition duration-200 group-hover:scale-[1.03] motion-reduce:transition-none" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[#EAF6DC] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1A4A16]">{meal.mealType}</span>
          {meal.dietTags.slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-[#F6F2EC] px-2 py-1 text-[11px] font-semibold text-[#6A5A4E]">{dietLabel(tag)}</span>)}
        </div>
        <h3 className="mt-3 text-lg leading-6 text-[#1A4A16]"><Link href={`/meals/${meal.slug}`}>{meal.name}</Link></h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6A5A4E]">{meal.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <div>
            <p className="text-lg font-semibold text-[#F15C00]">
              {meal.compareAtPaise > meal.pricePaise ? <span className="mr-2 text-sm font-medium text-[#6A5A4E] line-through">{formatInr(meal.compareAtPaise)}</span> : null}
              {formatInr(meal.pricePaise)}
            </p>
            <p className="text-xs text-[#6A5A4E]">{meal.available ? meal.portionLabel || "Available" : "Unavailable"}</p>
          </div>
          <Link href={`/meals/${meal.slug}`} className="btn btn-line px-3 py-2 text-sm">Add</Link>
        </div>
      </div>
    </article>
  );
}
