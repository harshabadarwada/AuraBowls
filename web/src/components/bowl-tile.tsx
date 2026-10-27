import Link from "next/link";
import { dietLabel, formatInr } from "@/lib/format";
import type { PublicMeal } from "@/server/catalog";

export function BowlTile({ meal, quantity, onAdd, onLess }: { meal: PublicMeal; quantity: number; onAdd: () => void; onLess: () => void }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_14px_32px_rgba(26,74,22,0.06)]">
      <Link href={`/meals/${meal.slug}`} className="plate block aspect-[4/5] bg-[#EAF6DC] sm:aspect-square">
        {meal.imageUrl ? <img src={meal.imageUrl} alt="" /> : null}
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A5A4E]">{meal.dietTags.map(dietLabel).join(" · ") || meal.mealType}</p>
        <h3 className="mt-1 text-base leading-5 text-[#1A4A16] sm:text-lg"><Link href={`/meals/${meal.slug}`}>{meal.name}</Link></h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="text-sm font-semibold text-[#F15C00] sm:text-base">
            {meal.compareAtPaise > meal.pricePaise ? <span className="mr-1 text-xs font-medium text-[#6A5A4E] line-through">{formatInr(meal.compareAtPaise)}</span> : null}
            {formatInr(meal.pricePaise)}
          </p>
          {quantity > 0 ? (
            <span className="inline-flex items-center gap-1">
              <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF6DC] text-[#1A4A16]" aria-label={`Fewer ${meal.name}`} onClick={onLess}>−</button>
              <span className="w-4 text-center text-sm font-semibold">{quantity}</span>
              <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-[#F15C00] text-white" aria-label={`More ${meal.name}`} onClick={onAdd}>+</button>
            </span>
          ) : (
            <button type="button" className="rounded-full bg-[#F15C00] px-3 py-1.5 text-sm font-semibold text-white" onClick={onAdd}>Add</button>
          )}
        </div>
      </div>
    </article>
  );
}
