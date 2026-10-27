import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MacroPills, MealPhoto, NutritionLine } from "@/components/meal-card";
import { AddMealButton } from "@/components/add-meal";
import { dietLabel, formatInr } from "@/lib/format";
import { getMeal, grams } from "@/server/catalog";
import type { CSSProperties } from "react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const meal = await getMeal((await params).slug);
  return { title: meal?.name || "Meal", description: meal?.description };
}

export default async function MealPage({ params }: { params: Promise<{ slug: string }> }) {
  const meal = await getMeal((await params).slug);
  if (!meal) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: meal.name,
    description: meal.description,
    image: meal.imageIsPlaceholder ? undefined : meal.imageUrl,
    offers: { "@type": "Offer", priceCurrency: "INR", price: (meal.pricePaise / 100).toFixed(2), availability: meal.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };
  return (
    <article className="relative grid gap-6 pb-24 lg:grid-cols-2 lg:pb-0">
      <div className="hero-light pointer-events-none absolute -left-8 top-8 -z-10 h-56 w-56 rounded-full bg-[#EAF6DC] blur-3xl" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="hero-bowl" style={{ "--d": "200ms" } as CSSProperties}>
        <MealPhoto meal={meal} className="aspect-[4/5] rounded-[1.8rem] shadow-[0_24px_48px_rgba(26,74,22,0.12)] sm:aspect-[5/4]" />
      </div>
      <div>
        <p className="hero-line text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]" style={{ "--d": "80ms" } as CSSProperties}>{meal.mealType}</p>
        <h1 className="display hero-line mt-2 text-4xl text-[#1A4A16] sm:text-5xl" style={{ "--d": "180ms" } as CSSProperties}>{meal.name}</h1>
        <p className="hero-line mt-3 text-base leading-7 text-[#6A5A4E]" style={{ "--d": "300ms" } as CSSProperties}>{meal.description}</p>
        <p className="mt-4 text-3xl font-semibold text-[#F15C00]">{meal.compareAtPaise > meal.pricePaise ? <span className="mr-2 text-lg font-medium text-[#6A5A4E] line-through">{formatInr(meal.compareAtPaise)}</span> : null}{formatInr(meal.pricePaise)}</p>
        <p className="mt-1 text-sm text-[#6A5A4E]">{meal.portionLabel} · {meal.dietTags.map(dietLabel).join(", ") || "Diet tag not set"}</p>
        <div className="mt-5"><MacroPills meal={meal} /></div>
        <div className="mt-6 space-y-4 text-sm leading-6">
          <section>
            <h2 className="text-lg text-[#1A4A16]">Ingredients</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {(meal.ingredients || "Ingredients have not been added.").split(",").map((item) => <span key={item} className="chip">{item.trim()}</span>)}
            </div>
          </section>
          <section>
            <h2 className="text-lg text-[#1A4A16]">Declared allergens</h2>
            <p className="text-[#6A5A4E]">{meal.allergens ? meal.allergens : "No allergens have been declared for this meal yet. That is not an allergen-free claim."}</p>
            <p className="text-[#6A5A4E]">{meal.allergenVerified ? "The kitchen has marked this declaration as checked against its preparation controls." : "This declaration comes from the recipe card. It is not a certified allergen-control audit."}</p>
          </section>
          <section>
            <h2 className="text-lg text-[#1A4A16]">Nutrition</h2>
            <NutritionLine meal={meal} />
            {meal.nutritionSource ? <p className="text-[#6A5A4E]">{meal.nutritionSource}</p> : null}
            {grams(meal.fiberTenths) ? <p className="text-[#6A5A4E]">Fibre {grams(meal.fiberTenths)} g</p> : null}
          </section>
        </div>
        {meal.addons.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-lg text-[#1A4A16]">Add-ons</h2>
            <ul className="mt-2 space-y-1 text-sm text-[#6A5A4E]">
              {meal.addons.map((addon) => <li key={addon.id}>{addon.name} · {formatInr(addon.pricePaise)}</li>)}
            </ul>
          </section>
        ) : null}
        <div className="mt-6 hidden gap-3 sm:flex">
          <AddMealButton meal={meal} />
          <Link href="/plans" className="btn btn-line">Add inside a plan</Link>
        </div>
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 grid grid-cols-[1fr_auto] gap-2 border-t border-[#EAE4DD] bg-[#FFF8F2] p-3 sm:hidden">
          <AddMealButton meal={meal} />
          <Link href="/plans" className="btn btn-line">Plan</Link>
        </div>
      </div>
    </article>
  );
}
