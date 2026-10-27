"use client";

import { useMemo, useState } from "react";
import { MealCard } from "@/components/meal-card";
import type { PublicMeal } from "@/server/catalog";

export function MenuBrowser({ meals, initialType = "all", initialQuery = "" }: { meals: PublicMeal[]; initialType?: string; initialQuery?: string }) {
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
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((meal, index) => (
                  <div key={meal.id} className="story" style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}>
                    <MealCard meal={meal} />
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
