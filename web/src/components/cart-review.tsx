"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readDraft, writeDraft, type Draft } from "@/components/draft";
import { Stage } from "@/components/stage";
import { formatInr } from "@/lib/format";

type QuoteLine = { date: string; mealName: string; mealType: string; quantity: number; addons: string[]; slotLabel: string };
type Quote = {
  totalPaise: number;
  foodPaise: number;
  customizationDeltaPaise: number;
  addonPaise: number;
  deliveryFeePaise: number;
  planDiscountPaise: number;
  couponPaise: number;
  bundleDiscountPaise?: number;
  referenceFoodPaise: number;
  lines?: QuoteLine[];
};

export function CartReview({ mealNames }: { mealNames: Record<string, string> }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState("");

  useEffect(() => {
    const saved = readDraft();
    setDraft(saved);
    setCoupon(saved?.couponCode || "");
  }, []);

  async function price(next = draft) {
    if (!next || !next.pinCode || next.selections.some((selection) => !selection.slotId || !selection.date)) {
      setError("Choose a delivery PIN and slot in checkout if this draft is still incomplete.");
      setQuote(null);
      return;
    }
    setError("");
    const response = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...next, couponCode: coupon }) });
    const data = await response.json();
    if (!response.ok) {
      setQuote(null);
      setError(data.message || "The price could not be confirmed.");
      return;
    }
    setQuote({ ...data.quote, lines: data.lines });
    const updated = { ...next, couponCode: coupon };
    setDraft(updated);
    writeDraft(updated);
  }

  if (!draft) return <Stage eyebrow="Cart" title="Your cart is empty" copy="The menu is ready whenever you are. A draft stays on this device until you continue."><Link href="/menu" className="btn btn-accent">Explore Bowls</Link></Stage>;

  const lines = quote?.lines || draft.selections.map((selection) => ({
    date: selection.date || "Date confirmed at checkout",
    mealName: mealNames[selection.mealId] || "Selected meal",
    mealType: draft.mealType,
    quantity: selection.quantity,
    addons: [] as string[],
    slotLabel: "",
  }));

  return (
    <div>
      <Stage eyebrow="Review" title="Your meal plan" copy="Every scheduled day is listed here. The payable amount is confirmed by the kitchen before payment." />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div>
        <ul className="space-y-3">
          {lines.map((line) => {
            const [year, month, day] = line.date.split("-").map(Number);
            const label = year && month && day ? new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : line.date;
            return (
              <li key={`${line.date}-${line.mealType}-${line.mealName}`}>
                <details className="store-card p-4" open>
                  <summary className="cursor-pointer text-sm font-semibold text-[#1A4A16]">{label}</summary>
                  <p className="mt-2 capitalize text-[#1A4A16]">{line.mealType}</p>
                  <p className="text-lg text-[#1A4A16]">{line.mealName}</p>
                  <p className="text-sm text-[#6A5A4E]">Quantity {line.quantity}</p>
                  {line.addons.length > 0 ? <p className="text-sm text-[#6A5A4E]">Add-on: {line.addons.join(", ")}</p> : null}
                  {line.slotLabel ? <p className="text-sm text-[#6A5A4E]">Delivery slot: {line.slotLabel}</p> : null}
                </details>
              </li>
            );
          })}
        </ul>
        {draft.planSlug ? <Link href={`/plans/${draft.planSlug}`} className="mt-4 inline-block text-sm font-semibold text-[#1A4A16]">Edit a day</Link> : null}
      </div>
      <aside className="store-card h-fit p-5">
        <label className="text-sm">Coupon
          <input className="field mt-1" value={coupon} onChange={(event) => setCoupon(event.target.value.toUpperCase())} />
        </label>
        <button className="btn btn-line mt-3 w-full" type="button" onClick={() => price()}>Refresh price</button>
        {error ? <p className="mt-3 text-sm text-[#7a3410]" role="alert">{error}</p> : null}
        {quote ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Default meals at menu prices</dt><dd>{formatInr(quote.referenceFoodPaise)}</dd></div>
            <div className="flex justify-between"><dt>Your meal changes</dt><dd>{formatInr(quote.customizationDeltaPaise)}</dd></div>
            <div className="flex justify-between"><dt>Add-ons</dt><dd>{formatInr(quote.addonPaise)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{formatInr(quote.deliveryFeePaise)}</dd></div>
            <div className="flex justify-between"><dt>Plan discount</dt><dd>-{formatInr(quote.planDiscountPaise)}</dd></div>
            <div className="flex justify-between"><dt>Coupon</dt><dd>-{formatInr(quote.couponPaise)}</dd></div>
            {quote.bundleDiscountPaise ? <div className="flex justify-between"><dt>Bundle</dt><dd>-{formatInr(quote.bundleDiscountPaise)}</dd></div> : null}
            <div className="flex justify-between text-lg font-semibold text-[#1A4A16]"><dt>Total payable</dt><dd className="text-[#F15C00]">{formatInr(quote.totalPaise)}</dd></div>
          </dl>
        ) : null}
        <Link href="/checkout" className="btn btn-accent mt-4 w-full">Continue to Delivery</Link>
      </aside>
      </div>
    </div>
  );
}
