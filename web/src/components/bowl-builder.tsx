"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { writeDraft } from "@/components/draft";
import { formatInr } from "@/lib/format";
import type { PublicMeal } from "@/server/catalog";

const groups = [
  ["base", "Base"],
  ["protein", "Protein"],
  ["vegetable", "Vegetables"],
  ["sauce", "Sauces"],
  ["extra", "Add-ons"],
] as const;

export function BowlBuilder({ meal }: { meal: PublicMeal }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const grouped = useMemo(() => {
    return groups.map(([id, label]) => ({
      id,
      label,
      options: meal.addons.filter((addon) => addon.description === id),
    }));
  }, [meal.addons]);
  const selected = meal.addons.filter((addon) => picked.includes(addon.id));
  const extra = selected.reduce((sum, addon) => sum + addon.pricePaise, 0);
  const total = meal.pricePaise + extra;
  const current = grouped[step];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-4">
        <ol className="flex gap-2 overflow-x-auto">
          {grouped.map((group, index) => (
            <li key={group.id}>
              <button type="button" className={`chip ${index === step ? "chip-on" : ""}`} onClick={() => setStep(index)}>{group.label}</button>
            </li>
          ))}
        </ol>
        {current.options.length === 0 ? (
          <p className="store-card p-5 text-sm leading-6 text-[#6A5A4E]">The kitchen has not published {current.label.toLowerCase()} yet. The ₹120 base bowl can still be ordered, and new components can be added in admin without inventing prices here.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {current.options.map((option) => {
              const on = picked.includes(option.id);
              return (
                <button key={option.id} type="button" className={`store-card p-4 text-left ${on ? "ring-2 ring-[#1A4A16]" : ""}`} onClick={() => setPicked((currentIds) => on ? currentIds.filter((id) => id !== option.id) : [...currentIds, option.id])}>
                  <span className="block font-semibold text-[#1A4A16]">{option.name}</span>
                  <span className="text-sm text-[#F15C00]">{option.pricePaise === 0 ? "Included" : `+ ${formatInr(option.pricePaise)}`}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <aside className="store-card h-fit p-5">
        <h2 className="text-lg text-[#1A4A16]">Your bowl</h2>
        <p className="mt-2 text-sm text-[#6A5A4E]">Base {formatInr(meal.pricePaise)}</p>
        <ul className="mt-3 space-y-1 text-sm text-[#1A4A16]">
          {selected.length === 0 ? <li>No extra components yet.</li> : selected.map((addon) => <li key={addon.id}>{addon.name} · {formatInr(addon.pricePaise)}</li>)}
        </ul>
        <p className="mt-4 text-2xl font-semibold text-[#F15C00]">{formatInr(total)}</p>
        <p className="mt-1 text-xs text-[#6A5A4E]">The server prices this again before payment. Nutrition is shown only when the kitchen records it.</p>
        <button
          className="btn btn-accent mt-4 w-full"
          type="button"
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const startDate = tomorrow.toISOString().slice(0, 10);
            writeDraft({
              mode: "single",
              planSlug: null,
              mealType: "lunch",
              startDate,
              pinCode: "",
              couponCode: "",
              selections: [{ date: startDate, mealId: meal.id, addonIds: picked, quantity: 1, note: "", slotId: "" }],
            });
            router.push("/cart");
          }}
        >
          Add to cart
        </button>
      </aside>
    </div>
  );
}
