import Link from "next/link";
import { dietLabel, formatInr } from "@/lib/format";
import type { PublicMeal } from "@/server/catalog";

export function BowlTile({ meal, quantity, onAdd, onLess }: { meal: PublicMeal; quantity: number; onAdd: () => void; onLess: () => void }) {
  const diet = meal.dietTags.map(dietLabel).join(" · ") || meal.mealType;
  return (
    <article className="flex h-full overflow-hidden rounded-[24px] bg-white shadow-[0_14px_32px_rgba(26,74,22,0.06)] max-sm:items-stretch sm:flex-col">
      <Link href={`/meals/${meal.slug}`} className="plate block h-28 w-28 shrink-0 bg-[#EAF6DC] sm:aspect-square sm:h-auto sm:w-full">
        {meal.imageUrl ? <img src={meal.imageUrl} alt="" /> : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between p-3 sm:p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A5A4E]">{diet}</p>
          <h3 className="mt-1 line-clamp-2 text-base leading-5 text-[#1A4A16] sm:text-lg"><Link href={`/meals/${meal.slug}`}>{meal.name}</Link></h3>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#F15C00] sm:text-base">
            {meal.compareAtPaise > meal.pricePaise ? <span className="mr-1 text-xs font-medium text-[#6A5A4E] line-through">{formatInr(meal.compareAtPaise)}</span> : null}
            {formatInr(meal.pricePaise)}
          </p>
          {quantity > 0 ? (
            <span className="inline-flex items-center gap-1">
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-[#EAF6DC] text-lg text-[#1A4A16]" aria-label={`Fewer ${meal.name}`} onClick={onLess}>−</button>
              <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-[#F15C00] text-lg text-white" aria-label={`More ${meal.name}`} onClick={onAdd}>+</button>
            </span>
          ) : (
            <button type="button" className="min-h-10 rounded-full bg-[#F15C00] px-4 text-sm font-semibold text-white" onClick={onAdd}>Add</button>
          )}
        </div>
      </div>
    </article>
  );
}
