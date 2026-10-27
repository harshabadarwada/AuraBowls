"use client";

import { useState } from "react";
import Link from "next/link";
import { formatInr } from "@/lib/format";

export type PlanListing = {
  slug: string;
  name: string;
  description: string;
  mealType: "breakfast" | "lunch" | "both";
  cadence: "daily" | "weekly" | "monthly";
  fixedDeliveryCount: number;
  discountBps: number;
  mealsFromPaise: number | null;
  mealName: string;
  lunchMealName: string;
  imageUrl: string;
  lunchImageUrl: string;
  imageIsPlaceholder: boolean;
};

const scopes = [
  ["breakfast", "Breakfast"],
  ["both", "Both"],
  ["lunch", "Lunch"],
] as const;

function scheduleLine(plan: PlanListing) {
  if (plan.mealType === "both" && plan.cadence === "daily") return "One open day, breakfast and lunch";
  if (plan.mealType === "both" && plan.cadence === "weekly") return "Five weekdays, breakfast and lunch each day";
  if (plan.mealType === "both") return "Twenty weekdays, breakfast and lunch each day";
  if (plan.cadence === "daily") return "One delivery on the next eligible open day";
  if (plan.cadence === "weekly") return "Five weekday deliveries";
  return "Twenty weekday deliveries";
}

function Plate({ plan, compact = false }: { plan: PlanListing; compact?: boolean }) {
  const split = plan.mealType === "both" && plan.lunchImageUrl;
  return (
    <span className={`plate relative block overflow-hidden rounded-full border border-white/80 bg-[#F6F2EC] shadow-[0_16px_30px_rgba(26,74,22,0.12)] ${compact ? "h-16 w-16" : "aspect-square w-full"}`}>
      {split ? (
        <span className="grid h-full grid-cols-2">
          <img src={plan.imageUrl} alt="" />
          <img src={plan.lunchImageUrl} alt="" />
        </span>
      ) : plan.imageUrl ? <img src={plan.imageUrl} alt="" /> : <span className="grid h-full place-items-center text-xs text-[#6A5A4E]">Photo not added</span>}
    </span>
  );
}

export function PlansBoard({ plans }: { plans: PlanListing[] }) {
  const [mealType, setMealType] = useState<PlanListing["mealType"]>("both");
  const visible = plans.filter((plan) => plan.mealType === mealType).sort((a, b) => a.fixedDeliveryCount - b.fixedDeliveryCount);
  const sample = {
    breakfast: plans.find((plan) => plan.mealType === "breakfast" && plan.imageUrl),
    lunch: plans.find((plan) => plan.mealType === "lunch" && plan.imageUrl),
    both: plans.find((plan) => plan.mealType === "both"),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header className="relative mb-10">
        <div className="hero-light pointer-events-none absolute -left-10 -top-12 -z-10 h-48 w-48 rounded-full bg-[#EAF6DC] blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">AuraBowls</p>
        <h1 className="display mt-3 text-4xl leading-[1.05] text-[#1A4A16] sm:text-6xl">The whole day, or just one sitting.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#6A5A4E]">Breakfast, lunch, or both on the same days. One payment. Nothing renews, and a change on one day stays on that day.</p>
      </header>

      <div className="grid grid-cols-3 gap-3 sm:gap-8" role="tablist" aria-label="What arrives">
        {scopes.map(([value, label]) => {
          const plan = sample[value];
          const on = mealType === value;
          return (
            <button key={value} type="button" role="tab" aria-selected={on} className="text-center" onClick={() => setMealType(value)}>
              <span className={`mx-auto block w-24 rounded-full p-1 sm:w-36 ${on ? "bg-[#F15C00]/15 ring-2 ring-[#F15C00]" : ""}`}>
                {plan ? <Plate plan={plan} /> : <span className="block aspect-square rounded-full bg-[#EAF6DC]" />}
              </span>
              <span className={`mt-3 block text-sm font-semibold ${on ? "text-[#F15C00]" : "text-[#1A4A16]"}`}>{label}</span>
            </button>
          );
        })}
      </div>

      <ol className="mt-10 space-y-3">
        {visible.length === 0 ? <li className="store-card p-6 text-sm text-[#6A5A4E]">This sitting is not open right now.</li> : visible.map((plan) => (
          <li key={plan.slug}>
            <Link href={`/plans/${plan.slug}`} className="store-card grid items-center gap-4 p-4 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:p-5">
              <span className="display text-5xl leading-none text-[#1A4A16]">{plan.fixedDeliveryCount}</span>
              <span>
                <span className="block text-xl text-[#1A4A16]">{plan.name}</span>
                <span className="mt-1 block text-sm leading-6 text-[#6A5A4E]">{scheduleLine(plan)}. Prepaid once.</span>
                <span className="mt-1 block text-sm text-[#6A5A4E]">
                  {plan.mealType === "both"
                    ? `Starts with ${plan.mealName || "the breakfast"} and ${plan.lunchMealName || "the lunch"}.`
                    : `Starts with ${plan.mealName || "the current default meal"}.`}
                </span>
                {plan.discountBps > 0 ? <span className="mt-2 inline-flex rounded-full bg-[#EAF6DC] px-2.5 py-1 text-xs font-semibold text-[#1A4A16]">{plan.discountBps / 100}% off each default meal</span> : null}
              </span>
              <span className="sm:text-right">
                <span className="block text-xl font-semibold text-[#F15C00]">{plan.mealsFromPaise === null ? "Price pending" : formatInr(plan.mealsFromPaise)}</span>
                <span className="mt-1 block text-xs text-[#6A5A4E]">{plan.mealsFromPaise === null ? "Waiting on the default meal" : "Meals from this. Delivery follows the PIN."}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
