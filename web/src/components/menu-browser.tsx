"use client";

import { useEffect, useMemo, useState } from "react";
import { BowlTile } from "@/components/bowl-tile";
import { addMenuLine, readMenu, readPerson, SERVED_PIN, writeMenu, writePerson, type MenuLine } from "@/components/draft";
import { formatInr } from "@/lib/format";
import { menuOrderText, outsideAreaText, whatsappHref } from "@/lib/order-message";
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
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {items.map((meal) => {
                  const line = basket.find((item) => item.slug === meal.slug);
                  return (
                    <BowlTile
                      key={meal.slug}
                      meal={meal}
                      quantity={line?.quantity || 0}
                      onAdd={() => add(meal)}
                      onLess={() => refresh(basket.map((item) => item.slug === meal.slug ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0))}
                    />
                  );
                })}
              </div>
            </section>
          );
        })
      )}
      <BasketBar lines={basket} whatsapp={whatsapp} />
      {basket.length > 0 ? <div className="h-28" /> : null}
    </div>
  );
}

function BasketBar({ lines, whatsapp }: { lines: MenuLine[]; whatsapp: string }) {
  const [ask, setAsk] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState("");
  useEffect(() => {
    const person = readPerson();
    setName(person.name);
    setAddress(person.address);
  }, [lines]);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  if (count === 0) return null;
  const person = { name: name.trim(), address: address.trim(), pin: pin.trim() };
  const ready = person.name.length >= 2 && person.address.length >= 4 && /^\d{6}$/.test(person.pin);
  const outside = ready && person.pin !== SERVED_PIN;
  const href = ready ? whatsappHref(whatsapp, outside ? outsideAreaText(person) : menuOrderText({ ...person, lines })) : "";
  if (ask) {
    return (
      <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 rounded-[28px] bg-white p-4 text-[#1A4A16] shadow-[0_16px_40px_rgba(26,74,22,0.18)] md:bottom-6">
        <p className="text-sm font-semibold">Place this order</p>
        <label className="mt-3 block text-sm font-semibold">Name
          <input className="field mt-1" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-semibold">Address
          <input className="field mt-1" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Flat, street, area" />
        </label>
        <label className="mt-3 block text-sm font-semibold">PIN code
          <input className="field mt-1" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="500081" />
        </label>
        <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">Delivery charges vary by location and are not included in {formatInr(total)}.</p>
        {outside ? <p className="mt-2 text-sm text-[#7a3410]">PIN {person.pin} is outside 500081. This sends your name and address so we can reply.</p> : null}
        {href ? (
          <a className="btn btn-accent mt-4 w-full" href={href} target="_blank" rel="noreferrer" onClick={() => writePerson(person)}>Send on WhatsApp</a>
        ) : (
          <p className="mt-3 text-sm text-[#6A5A4E]">Enter your name, address, and a 6-digit PIN. WhatsApp stays closed until those are filled in.</p>
        )}
        <button type="button" className="mt-3 text-sm font-semibold text-[#1A4A16]" onClick={() => setAsk(false)}>Back to the menu</button>
      </div>
    );
  }
  return (
    <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-full bg-[#1A4A16] px-4 py-2 text-white shadow-[0_12px_30px_rgba(26,74,22,0.2)] md:bottom-6">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-white/70">{count} {count === 1 ? "item" : "items"} · delivery extra</p>
        <p className="text-lg font-semibold">{formatInr(total)}</p>
      </div>
      <button type="button" className="btn btn-accent" onClick={() => setAsk(true)}>Place order</button>
    </div>
  );
}
