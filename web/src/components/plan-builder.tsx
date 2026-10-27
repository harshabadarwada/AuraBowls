"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readDraft, readPerson, writeDraft, writePerson, type DraftSelection } from "@/components/draft";
import { MealPhoto } from "@/components/meal-card";
import { formatInr } from "@/lib/format";
import { planOrderText, whatsappHref } from "@/lib/order-message";
import type { PublicMeal } from "@/server/catalog";

type Slot = { id: string; label: string; startTime: string; mealType: "breakfast" | "lunch" };
type Scope = "breakfast" | "lunch" | "both";
type Plan = {
  slug: string;
  name: string;
  description: string;
  mealType: Scope;
  cadence: string;
  fixedDeliveryCount: number;
  discountBps: number;
  defaultMealSlug: string;
  companionMealSlug: string;
};
type PlanOption = {
  slug: string;
  name: string;
  mealType: Scope;
  cadence: "daily" | "weekly" | "monthly";
  fixedDeliveryCount: number;
  discountBps: number;
  mealsFromPaise: number | null;
  imageUrl: string;
  lunchImageUrl: string;
  imageIsPlaceholder: boolean;
};
type Quote = { totalPaise: number; referenceFoodPaise: number; customizationDeltaPaise: number; addonPaise: number; deliveryFeePaise: number; planDiscountPaise: number; bundleDiscountPaise?: number };

const headlines: Record<Scope, [string, string]> = {
  breakfast: ["Mornings, already decided.", "One breakfast on every open day in the plan."],
  lunch: ["Lunch, without the scramble.", "One lunch on every open day in the plan."],
  both: ["Breakfast at the door. Lunch when the day turns.", "Every open day brings both. A day is kept only when the kitchen can cook both meals."],
};

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

function isoParts(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return {
    weekday: date.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }),
    long: date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
    day: String(day),
  };
}

function kolkataTomorrow() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

function cadenceLabel(cadence: string) {
  if (cadence === "daily") return "Tomorrow";
  if (cadence === "weekly") return "This week";
  return "This month";
}

export function PlanBuilder({ plan, meals, slots, options, whatsapp }: { plan: Plan; meals: PublicMeal[]; slots: Slot[]; options: PlanOption[]; whatsapp: string }) {
  const router = useRouter();
  const breakfastSlots = slots.filter((slot) => slot.mealType === "breakfast");
  const lunchSlots = slots.filter((slot) => slot.mealType === "lunch");
  const breakfastDefault = meals.find((meal) => meal.slug === plan.defaultMealSlug);
  const lunchDefault = meals.find((meal) => meal.slug === plan.companionMealSlug);
  const [startDate, setStartDate] = useState(kolkataTomorrow);
  const [pinCode, setPinCode] = useState("");
  const [breakfastSlotId, setBreakfastSlotId] = useState(breakfastSlots[0]?.id || "");
  const [lunchSlotId, setLunchSlotId] = useState(lunchSlots[0]?.id || slots[0]?.id || "");
  const [rows, setRows] = useState<DraftSelection[]>([]);
  const [activeDate, setActiveDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [priceError, setPriceError] = useState("");
  const [busy, setBusy] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [orderOnWhatsapp, setOrderOnWhatsapp] = useState(false);
  const mealById = useMemo(() => new Map(meals.map((meal) => [meal.id, meal])), [meals]);
  const slotById = useMemo(() => new Map(slots.map((slot) => [slot.id, slot])), [slots]);
  const lengths = options.filter((option) => option.mealType === plan.mealType).sort((a, b) => a.fixedDeliveryCount - b.fixedDeliveryCount);
  const scopes = (["breakfast", "both", "lunch"] as const)
    .map((mealType) => options.find((option) => option.mealType === mealType && option.cadence === plan.cadence))
    .filter((option): option is PlanOption => Boolean(option));
  const dates = [...new Set(rows.map((row) => row.date))];
  const current = options.find((option) => option.slug === plan.slug);
  const mealsFrom = current?.mealsFromPaise ?? null;
  const dayCount = dates.length || plan.fixedDeliveryCount;

  useEffect(() => {
    const person = readPerson();
    setCustomerName(person.name);
    setAddress(person.address);
    if (person.pin === "500081") setPinCode(person.pin);
    const draft = readDraft();
    if (!draft || draft.planSlug !== plan.slug || draft.selections.length === 0) return;
    setStartDate(draft.startDate || kolkataTomorrow());
    setPinCode(draft.pinCode);
    const known = new Map(slots.map((slot) => [slot.id, slot.mealType]));
    const firstBreakfast = draft.selections.find((row) => known.get(row.slotId) !== "lunch");
    const firstLunch = draft.selections.find((row) => known.get(row.slotId) === "lunch");
    if (plan.mealType === "lunch") setLunchSlotId(draft.selections[0]?.slotId || slots.find((slot) => slot.mealType === "lunch")?.id || "");
    else if (firstBreakfast) setBreakfastSlotId(firstBreakfast.slotId);
    if (firstLunch) setLunchSlotId(firstLunch.slotId);
    setRows(draft.selections);
    setActiveDate(draft.selections[0]?.date || "");
  }, [plan.slug, plan.mealType, slots]);

  useEffect(() => {
    if (rows.length === 0 || !/^\d{6}$/.test(pinCode)) return;
    const handle = window.setTimeout(async () => {
      try {
        const data = await postJson("/api/quote", { mode: "plan", planSlug: plan.slug, mealType: plan.mealType, startDate, pinCode, couponCode: "", selections: rows });
        setQuote(data.quote);
        setPriceError("");
      } catch (caught) {
        setQuote(null);
        setPriceError(caught instanceof Error ? caught.message : "The price could not be confirmed.");
      }
    }, 350);
    return () => window.clearTimeout(handle);
  }, [rows, pinCode, startDate, plan.slug, plan.mealType]);

  async function layOutDays() {
    setBusy(true);
    setError("");
    try {
      const preview = await postJson("/api/schedule", {
        mode: "plan",
        planSlug: plan.slug,
        mealType: plan.mealType,
        startDate,
        pinCode,
        slotId: plan.mealType === "lunch" ? lunchSlotId : breakfastSlotId,
        lunchSlotId: plan.mealType === "both" ? lunchSlotId : "",
      });
      setNote(preview.area?.localityNote || "");
      setOrderOnWhatsapp(preview.orderOnWhatsapp === true);
      const kept = rows;
      const next = (preview.dates as string[]).flatMap((date) => {
        if (plan.mealType === "both") {
          return [
            { date, mealId: preview.defaultMealId || breakfastDefault?.id, addonIds: [], quantity: 1, note: "", slotId: breakfastSlotId },
            { date, mealId: preview.lunchMealId || lunchDefault?.id, addonIds: [], quantity: 1, note: "", slotId: lunchSlotId },
          ];
        }
        const slotId = plan.mealType === "lunch" ? lunchSlotId : breakfastSlotId;
        return [{ date, mealId: preview.defaultMealId || breakfastDefault?.id || lunchDefault?.id, addonIds: [], quantity: 1, note: "", slotId }];
      });
      setRows(next.map((row) => {
        const kind = slotById.get(row.slotId)?.mealType;
        const previous = kept.find((item) => item.date === row.date && slotById.get(item.slotId)?.mealType === kind);
        return previous ? { ...previous, slotId: row.slotId } : row;
      }));
      setActiveDate(preview.dates[0] || "");
    } catch (caught) {
      setRows([]);
      setError(caught instanceof Error ? caught.message : "The schedule could not be built.");
    } finally {
      setBusy(false);
    }
  }

  function rowFor(date: string, mealType: "breakfast" | "lunch") {
    return rows.find((row) => row.date === date && (slotById.get(row.slotId)?.mealType || plan.mealType) === mealType);
  }

  function updateRow(date: string, mealType: "breakfast" | "lunch", patch: Partial<DraftSelection>) {
    setRows((currentRows) => currentRows.map((row) => (row.date === date && (slotById.get(row.slotId)?.mealType || plan.mealType) === mealType ? { ...row, ...patch } : row)));
  }

  function repeatMeal(mealType: "breakfast" | "lunch", mealId: string) {
    const customized = rows.some((row) => row.date !== activeDate && (slotById.get(row.slotId)?.mealType || plan.mealType) === mealType && (row.mealId !== mealId || row.addonIds.length > 0));
    if (customized && !window.confirm(mealType === "breakfast" ? "Some mornings already have their own meal or add-ons. Use this breakfast on every morning?" : "Some afternoons already have their own meal or add-ons. Use this lunch on every afternoon?")) return;
    setRows((currentRows) => currentRows.map((row) => ((slotById.get(row.slotId)?.mealType || plan.mealType) === mealType ? { ...row, mealId, addonIds: [] } : row)));
  }

  function continueToDelivery() {
    if (rows.length === 0 || !quote) return;
    writeDraft({ mode: "plan", planSlug: plan.slug, mealType: plan.mealType, startDate, pinCode, couponCode: "", selections: rows });
    router.push("/checkout");
  }

  const sitting = plan.mealType === "both" ? `${dayCount} days · breakfast and lunch` : `${dayCount} ${plan.mealType} ${dayCount === 1 ? "delivery" : "deliveries"}`;
  const personReady = customerName.trim().length >= 2 && address.trim().length >= 4 && pinCode === "500081";
  const planHref = orderOnWhatsapp && quote && rows.length > 0 && personReady
    ? whatsappHref(whatsapp, planOrderText({
      name: customerName.trim(),
      address: address.trim(),
      pin: pinCode,
      planName: plan.name,
      totalPaise: quote.totalPaise,
      lines: rows.map((row) => ({ date: row.date, mealName: mealById.get(row.mealId)?.name || "Meal", slotLabel: slotById.get(row.slotId)?.label || "" })),
    }))
    : "";

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <header className="relative max-w-2xl">
        <div className="hero-light pointer-events-none absolute -left-8 -top-10 -z-10 h-40 w-40 rounded-full bg-[#F15C00]/10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">AuraBowls</p>
        <h1 className="display mt-3 text-4xl leading-[1.05] text-[#1A4A16] sm:text-6xl">{headlines[plan.mealType][0]}</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#6A5A4E]">{headlines[plan.mealType][1]}</p>
      </header>

      <div className="mt-8 flex items-end gap-4 overflow-x-auto pb-1" role="tablist" aria-label="What arrives">
        {scopes.map((option) => {
          const on = option.slug === plan.slug;
          return (
            <Link key={option.slug} href={`/plans/${option.slug}`} aria-current={on ? "page" : undefined} className="w-24 shrink-0 text-center sm:w-28">
              <ScopePlate option={option} on={on} />
              <span className={`mt-2 block text-sm font-semibold capitalize ${on ? "text-[#F15C00]" : "text-[#1A4A16]"}`}>{option.mealType === "both" ? "Both" : option.mealType}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#EAE4DD] pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6A5A4E]">{cadenceLabel(plan.cadence)}</p>
          <p className="display mt-1 text-5xl text-[#F15C00]">{mealsFrom === null ? "—" : formatInr(mealsFrom)}</p>
          <p className="mt-1 text-sm text-[#6A5A4E]">{sitting}. {plan.discountBps > 0 ? `${plan.discountBps / 100}% off each default meal. ` : "Menu price. "}Delivery is added from the PIN{plan.mealType === "both" ? ", once for each drop" : ""}.</p>
        </div>
        <div className="flex gap-4 text-sm font-semibold">
          {lengths.map((option) => (
            <Link key={option.slug} href={`/plans/${option.slug}`} className={option.slug === plan.slug ? "text-[#1A4A16] underline decoration-[#F15C00] decoration-2 underline-offset-4" : "text-[#6A5A4E]"}>
              {option.cadence === "daily" ? "1 day" : option.cadence === "weekly" ? "5 days" : "20 days"}
            </Link>
          ))}
        </div>
      </div>

      <section className="mt-6 flex flex-wrap items-end gap-3 rounded-[28px] bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <label className="min-w-[11rem] flex-1 text-sm font-semibold text-[#1A4A16]">First day
          <input className="field mt-1" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="min-w-[11rem] flex-1 text-sm font-semibold text-[#1A4A16]">PIN code
          <input className="field mt-1" inputMode="numeric" maxLength={6} value={pinCode} placeholder="6 digits" onChange={(event) => setPinCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
        </label>
        {plan.mealType !== "lunch" ? (
          <SlotField label="Morning slot" value={breakfastSlotId} slots={breakfastSlots} onChange={setBreakfastSlotId} />
        ) : null}
        {plan.mealType !== "breakfast" ? (
          <SlotField label="Afternoon slot" value={lunchSlotId} slots={lunchSlots} onChange={setLunchSlotId} />
        ) : null}
        <button className="btn btn-forest shrink-0" type="button" disabled={busy || pinCode.length !== 6} onClick={layOutDays}>{busy ? "Asking the kitchen…" : rows.length ? "Refresh the days" : "Lay out the days"}</button>
      </section>
      {error ? <p className="mt-3 rounded-2xl bg-[#fff1e8] px-3 py-2 text-sm text-[#7a3410]" role="alert">{error}</p> : null}
      {note ? <p className="mt-3 text-xs leading-5 text-[#6A5A4E]">{note}</p> : null}

      {dates.length === 0 ? (
        <p className="mt-8 text-sm leading-7 text-[#6A5A4E]">The days appear here after the kitchen confirms the first day. Closed days and the cutoff are skipped.</p>
      ) : (
        <>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Delivery days">
            {dates.map((date) => {
              const on = date === activeDate;
              return (
                <button key={date} type="button" className={`min-w-16 rounded-full px-3 py-2 text-center ${on ? "bg-[#1A4A16] text-white" : "bg-white text-[#1A4A16]"}`} onClick={() => setActiveDate(date)}>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide">{isoParts(date).weekday}</span>
                  <span className="text-lg font-semibold">{isoParts(date).day}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-[#6A5A4E]">{activeDate ? isoParts(activeDate).long : ""}</p>
          <div className={`mt-3 grid gap-4 ${plan.mealType === "both" ? "lg:grid-cols-2" : ""}`}>
            {plan.mealType !== "lunch" ? (
              <DayPlate
                kicker="Morning"
                tone="leaf"
                mealType="breakfast"
                row={activeDate ? rowFor(activeDate, "breakfast") : undefined}
                meals={meals.filter((meal) => meal.mealType === "breakfast" && meal.available)}
                slots={breakfastSlots}
                mealById={mealById}
                onChange={(patch) => activeDate && updateRow(activeDate, "breakfast", patch)}
                onRepeat={(mealId) => repeatMeal("breakfast", mealId)}
              />
            ) : null}
            {plan.mealType !== "breakfast" ? (
              <DayPlate
                kicker="Afternoon"
                tone="warm"
                mealType="lunch"
                row={activeDate ? rowFor(activeDate, "lunch") : undefined}
                meals={meals.filter((meal) => meal.mealType === "lunch" && meal.available)}
                slots={lunchSlots}
                mealById={mealById}
                onChange={(patch) => activeDate && updateRow(activeDate, "lunch", patch)}
                onRepeat={(mealId) => repeatMeal("lunch", mealId)}
              />
            ) : null}
          </div>
        </>
      )}

      <section className="mt-8 flex flex-col gap-4 rounded-[28px] bg-[#FFF8F2] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6A5A4E]">Payable</p>
          <p className="display text-4xl text-[#1A4A16]">{quote ? formatInr(quote.totalPaise) : mealsFrom === null ? "Price pending" : formatInr(mealsFrom)}</p>
          <p className="text-sm text-[#6A5A4E]">{quote ? sitting : "The kitchen confirms the payable total after the days are laid out."}</p>
          {priceError ? <p className="mt-2 text-sm text-[#7a3410]" role="alert">{priceError}</p> : null}
          {quote ? (
            <dl className="mt-3 grid max-w-sm grid-cols-2 gap-x-6 gap-y-1 text-sm text-[#6A5A4E]">
              <dt>Default meals</dt><dd className="text-right">{formatInr(quote.referenceFoodPaise)}</dd>
              <dt>Meal changes</dt><dd className="text-right">{formatInr(quote.customizationDeltaPaise)}</dd>
              <dt>Add-ons</dt><dd className="text-right">{formatInr(quote.addonPaise)}</dd>
              <dt>Delivery</dt><dd className="text-right">{formatInr(quote.deliveryFeePaise)}</dd>
              <dt>Plan discount</dt><dd className="text-right">-{formatInr(quote.planDiscountPaise)}</dd>
            </dl>
          ) : null}
        </div>
        {orderOnWhatsapp ? (
          <div className="w-full max-w-sm">
            <label className="block text-sm font-semibold text-[#1A4A16]">Name
              <input className="field mt-1" value={customerName} onChange={(event) => { setCustomerName(event.target.value); writePerson({ name: event.target.value, address, pin: pinCode }); }} />
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Address
              <input className="field mt-1" value={address} onChange={(event) => { setAddress(event.target.value); writePerson({ name: customerName, address: event.target.value, pin: pinCode }); }} placeholder="Flat, street, area" />
            </label>
            {planHref ? <a className="btn btn-accent mt-4 w-full" href={planHref} target="_blank" rel="noreferrer">Send this plan on WhatsApp</a> : <p className="mt-3 text-sm text-[#6A5A4E]">Add your name and address. The message includes both, plus the days and the total.</p>}
          </div>
        ) : (
          <button className={`btn btn-accent ${rows.length === 0 || !quote ? "opacity-50" : ""}`} type="button" disabled={rows.length === 0 || !quote} onClick={continueToDelivery}>Continue to delivery</button>
        )}
      </section>
    </div>
  );
}

function ScopePlate({ option, on }: { option: PlanOption; on: boolean }) {
  const split = option.mealType === "both" && option.imageUrl && option.lunchImageUrl;
  return (
    <span className={`plate mx-auto block aspect-square overflow-hidden rounded-full bg-[#F6F2EC] ${on ? "ring-2 ring-[#F15C00] ring-offset-2" : ""}`}>
      {split ? (
        <span className="grid h-full grid-cols-2">
          <img src={option.imageUrl} alt="" />
          <img src={option.lunchImageUrl} alt="" />
        </span>
      ) : option.imageUrl ? <img src={option.imageUrl} alt="" /> : <span className="block h-full bg-[#EAF6DC]" />}
    </span>
  );
}

function SlotField({ label, value, slots, onChange }: { label: string; value: string; slots: Slot[]; onChange: (value: string) => void }) {
  return (
    <label className="min-w-[11rem] flex-1 text-sm font-semibold text-[#1A4A16]">{label}
      <select className="field mt-1" value={value} onChange={(event) => onChange(event.target.value)}>
        {slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}
      </select>
    </label>
  );
}

function DayPlate({
  kicker,
  tone,
  mealType,
  row,
  meals,
  slots,
  mealById,
  onChange,
  onRepeat,
}: {
  kicker: string;
  tone: "leaf" | "warm";
  mealType: "breakfast" | "lunch";
  row?: DraftSelection;
  meals: PublicMeal[];
  slots: Slot[];
  mealById: Map<string, PublicMeal>;
  onChange: (patch: Partial<DraftSelection>) => void;
  onRepeat: (mealId: string) => void;
}) {
  const meal = row ? mealById.get(row.mealId) : undefined;
  return (
    <article className={`rounded-[28px] p-4 sm:p-5 ${tone === "leaf" ? "bg-[#EAF6DC]" : "bg-[#fff1e8]"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">{kicker}</p>
      {meal ? <MealPhoto meal={meal} className="plate mx-auto mt-3 h-36 w-36 rounded-full" /> : <div className="mx-auto mt-3 h-36 w-36 rounded-full bg-white" />}
      <h2 className="mt-4 text-center text-2xl text-[#1A4A16]">{meal?.name || "Choose a meal"}</h2>
      <p className="text-center text-sm font-semibold text-[#F15C00]">{meal && row ? formatInr(meal.pricePaise * row.quantity) : ""}</p>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {meals.map((choice) => (
          <button key={choice.id} type="button" className={`w-16 shrink-0 text-center ${choice.id === row?.mealId ? "opacity-100" : "opacity-70"}`} onClick={() => onChange({ mealId: choice.id, addonIds: [] })}>
            <span className={`plate mx-auto block h-16 w-16 overflow-hidden rounded-full bg-white ${choice.id === row?.mealId ? "ring-2 ring-[#1A4A16]" : ""}`}>
              {choice.imageUrl ? <img src={choice.imageUrl} alt="" /> : null}
            </span>
            <span className="mt-1 block truncate text-[11px] font-semibold text-[#1A4A16]">{choice.name}</span>
          </button>
        ))}
      </div>
      {row ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button key={slot.id} type="button" className={`chip ${row.slotId === slot.id ? "chip-on" : ""}`} onClick={() => onChange({ slotId: slot.id })}>{slot.label}</button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#1A4A16]">Bowls</span>
            <span className="flex items-center gap-3">
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white" onClick={() => onChange({ quantity: Math.max(1, row.quantity - 1) })}>−</button>
              <span className="w-6 text-center font-semibold">{row.quantity}</span>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-[#F15C00] text-white" onClick={() => onChange({ quantity: Math.min(3, row.quantity + 1) })}>+</button>
            </span>
          </div>
          {meal && meal.addons.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {meal.addons.map((addon) => {
                const on = row.addonIds.includes(addon.id);
                return <button key={addon.id} type="button" className={`chip ${on ? "chip-on" : ""}`} onClick={() => onChange({ addonIds: on ? row.addonIds.filter((id) => id !== addon.id) : [...row.addonIds, addon.id] })}>{addon.name} · {formatInr(addon.pricePaise)}</button>;
              })}
            </div>
          ) : null}
          <input className="field" value={row.note} maxLength={240} placeholder={`Note for this ${mealType}`} onChange={(event) => onChange({ note: event.target.value })} />
          {meal ? <button type="button" className="text-sm font-semibold text-[#1A4A16]" onClick={() => onRepeat(meal.id)}>{mealType === "breakfast" ? "Use this breakfast every morning" : "Use this lunch every afternoon"}</button> : null}
        </div>
      ) : null}
    </article>
  );
}
