"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addMenuLine, readMenu, writeMenu, type MenuLine } from "@/components/draft";
import { formatInr, dietLabel } from "@/lib/format";
import { menuOrderText, whatsappHref } from "@/lib/order-message";
import type { PublicMeal } from "@/server/catalog";

export function MenuBrowser({ meals, whatsapp = "", initialType = "all", initialQuery = "" }: { meals: PublicMeal[]; whatsapp?: string; initialType?: string; initialQuery?: string }) {
  const [type, setType] = useState(initialType);
  const [category, setCategory] = useState("all");
  const [diet, setDiet] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const [maxPrice, setMaxPrice] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const ingredients = useMemo(() => {
    const set = new Set<string>();
    for (const meal of meals) {
      for (const part of meal.ingredients.split(",")) {
        const name = part.trim();
        if (name) set.add(name);
      }
    }
    return [...set].slice(0, 12);
  }, [meals]);
  const [ingredient, setIngredient] = useState("");
  const [basket, setBasket] = useState<MenuLine[]>([]);
  useEffect(() => { setBasket(readMenu()); }, []);
  function refresh(next: MenuLine[]) {
    writeMenu(next);
    setBasket(next);
  }
  function add(meal: PublicMeal) {
    addMenuLine({ slug: meal.slug, name: meal.name, pricePaise: meal.pricePaise, mealType: meal.mealType });
    setBasket(readMenu());
  }

  const visible = meals.filter((meal) => {
    if (type !== "all" && meal.mealType !== type) return false;
    if (category === "fresh-sips" && meal.categorySlug !== "fresh-sips" && meal.categorySlug !== "wellness-shots") return false;
    if (category !== "all" && category !== "fresh-sips" && meal.categorySlug !== category) return false;
    if (diet !== "all" && !meal.dietTags.includes(diet)) return false;
    if (query && !`${meal.name} ${meal.description} ${meal.ingredients}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (maxPrice && meal.pricePaise > Number(maxPrice) * 100) return false;
    if (availableOnly && !meal.available) return false;
    if (ingredient && !meal.ingredients.toLowerCase().includes(ingredient.toLowerCase())) return false;
    return true;
  });

  const types = [
    ["all", "All"],
    ["breakfast", "Breakfast"],
    ["lunch", "Lunch"],
  ];
  const diets = [
    ["all", "Any diet"],
    ["veg", "Vegetarian"],
    ["vegan", "Vegan"],
    ["non_veg", "Non-veg"],
  ];

  return (
    <div>
      <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meals or ingredients" aria-label="Search meals" />
      <div className="sticky top-16 z-20 -mx-1 mt-4 flex gap-2 overflow-x-auto bg-[#FFF8F2]/90 px-1 py-2 backdrop-blur">
        {[["all", "All"], ["signature-bowls", "Signature Bowls"], ["aura-biryani", "Aura Biryani"], ["morning-aura", "Morning Aura"], ["fresh-sips", "Fresh Sips"], ["guilt-free-bites", "Guilt-Free Bites"]].map(([value, label]) => (
          <button key={value} type="button" className={`chip shrink-0 ${category === value ? "chip-on" : ""}`} onClick={() => setCategory(value)}>{label}</button>
        ))}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {types.map(([value, label]) => (
          <button key={value} type="button" className={`chip shrink-0 ${type === value ? "chip-on" : ""}`} onClick={() => setType(value)}>{label}</button>
        ))}
        {diets.slice(1).map(([value, label]) => (
          <button key={value} type="button" className={`chip shrink-0 ${diet === value ? "chip-on" : ""}`} onClick={() => setDiet(diet === value ? "all" : value)}>{label}</button>
        ))}
        <button type="button" className={`chip shrink-0 ${filtersOpen ? "chip-on" : ""}`} onClick={() => setFiltersOpen((open) => !open)}>Filters</button>
      </div>
      {filtersOpen ? (
        <div className="store-card mt-3 grid gap-3 p-4 sm:grid-cols-2">
          <label className="text-sm">Highest price (₹)
            <input className="field mt-1" inputMode="decimal" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Any" />
          </label>
          {ingredients.length > 0 ? (
            <label className="text-sm">Ingredient
              <select className="field mt-1" value={ingredient} onChange={(event) => setIngredient(event.target.value)}>
                <option value="">Any</option>
                {ingredients.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /> Available now</label>
        </div>
      ) : null}
      {visible.length === 0 ? (
        <p className="store-card mt-6 p-8 text-center text-[#6A5A4E]">No meals match these filters.</p>
      ) : (
        [["signature-bowls", "Signature Bowls"], ["aura-biryani", "Aura Biryani"], ["morning-aura", "Morning Aura"], ["wellness-shots", "Wellness Shots"], ["fresh-sips", "Juices and buttermilk"], ["guilt-free-bites", "Guilt-Free Bites"], ["build-your-own", "Build Your Own Bowl"]].map(([slug, title]) => {
          const items = visible.filter((meal) => meal.categorySlug === slug);
          if (items.length === 0) return null;
          return (
            <section key={slug} className="mt-8">
              <h2 className="text-2xl text-[#1A4A16]">{title}</h2>
              <ul className="mt-3 overflow-hidden rounded-[20px] border border-[#EAE4DD] bg-white">
                {items.map((meal) => {
                  const line = basket.find((item) => item.slug === meal.slug);
                  return (
                    <li key={meal.slug} className="flex items-center gap-3 border-b border-[#EAE4DD] p-3 last:border-b-0">
                      <Link href={`/meals/${meal.slug}`} className="plate h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#EAF6DC]">
                        {meal.imageUrl ? <img src={meal.imageUrl} alt="" /> : null}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/meals/${meal.slug}`} className="block truncate font-semibold text-[#1A4A16]">{meal.name}</Link>
                        <p className="truncate text-xs text-[#6A5A4E]">{meal.portionLabel} · {meal.dietTags.map(dietLabel).join(", ") || meal.mealType}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[#F15C00]">
                          {meal.compareAtPaise > meal.pricePaise ? <span className="mr-1 font-medium text-[#6A5A4E] line-through">{formatInr(meal.compareAtPaise)}</span> : null}
                          {formatInr(meal.pricePaise)}
                        </p>
                        {line ? (
                          <span className="mt-1 inline-flex items-center gap-2">
                            <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF6DC]" aria-label={`Fewer ${meal.name}`} onClick={() => refresh(basket.map((item) => item.slug === meal.slug ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0))}>−</button>
                            <span className="w-4 text-center text-sm font-semibold">{line.quantity}</span>
                            <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-[#F15C00] text-white" aria-label={`More ${meal.name}`} onClick={() => add(meal)}>+</button>
                          </span>
                        ) : (
                          <button type="button" className="mt-1 text-sm font-semibold text-[#1A4A16]" onClick={() => add(meal)}>Add</button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
      <BasketBar lines={basket} whatsapp={whatsapp} />
    </div>
  );
}

function BasketBar({ lines, whatsapp }: { lines: MenuLine[]; whatsapp: string }) {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  if (count === 0) return null;
  const href = whatsappHref(whatsapp, menuOrderText(lines));
  return (
    <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-full bg-[#1A4A16] px-4 py-2 text-white shadow-[0_12px_30px_rgba(26,74,22,0.2)] md:bottom-6">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-white/70">{count} {count === 1 ? "item" : "items"}</p>
        <p className="text-lg font-semibold">{formatInr(total)}</p>
      </div>
      {href ? <a className="btn btn-accent" href={href} target="_blank" rel="noreferrer">Send on WhatsApp</a> : <Link className="btn btn-accent" href="/cart">Review order</Link>}
    </div>
  );
}
