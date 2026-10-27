"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addMenuLine, readMenu, writeMenu, type MenuLine } from "@/components/draft";
import { BowlTile } from "@/components/bowl-tile";
import { formatInr } from "@/lib/format";
import { bodyMassIndex, bodyMassLabel, suggestIntake, type Activity, type BodyGoal, type Sex } from "@/lib/guidance";
import { guideOrderText, whatsappHref } from "@/lib/order-message";
import type { PublicMeal } from "@/server/catalog";

const goals = [
  ["fat_loss", "Fat loss", "We use your measurements, then suggest a lower intake."],
  ["weight_gain", "Weight gain", "We use your measurements, then suggest a higher intake."],
  ["eat_healthy", "Eat healthy", "No calculation. Pick bowls and send the order."],
] as const;

const activities = [
  ["desk", "Mostly sitting"],
  ["light", "Light activity"],
  ["regular", "Regular workouts"],
  ["hard", "Hard training"],
] as const;

export function GoalPlanner({ meals, whatsapp }: { meals: PublicMeal[]; whatsapp: string }) {
  const [goal, setGoal] = useState<BodyGoal | "">("");
  const [step, setStep] = useState<"goal" | "measure" | "name" | "bowls">("goal");
  const [sex, setSex] = useState<Sex | "">("");
  const [activity, setActivity] = useState<Activity>("regular");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [reportedBmi, setReportedBmi] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [basket, setBasket] = useState<MenuLine[]>([]);
  useEffect(() => { setBasket(readMenu()); }, []);

  const numbers = {
    heightCm: Number(height),
    weightKg: Number(weight),
    age: Number(age),
  };
  const estimate = useMemo(() => {
    if (goal !== "fat_loss" && goal !== "weight_gain") return null;
    if (!sex || !numbers.heightCm || !numbers.weightKg || !numbers.age) return null;
    return suggestIntake({ goal, sex, activity, ...numbers });
  }, [goal, sex, activity, numbers.heightCm, numbers.weightKg, numbers.age]);

  const lines = basket;
  const goalLabel = goals.find((item) => item[0] === goal)?.[1] || "";
  const bodyLines = estimate && estimate.ok ? [
    `Height: ${numbers.heightCm} cm`,
    `Weight: ${numbers.weightKg} kg`,
    `Age: ${numbers.age}`,
    `BMI from measurements: ${estimate.bmi} · ${estimate.bmiLabel}`,
    reportedBmi ? `BMI from the report: ${reportedBmi}` : "",
    `Suggested intake: about ${estimate.kcal} kcal`,
    `Protein ${estimate.proteinG} g · Fat ${estimate.fatG} g · Carbs ${estimate.carbG} g`,
    estimate.note,
    "This is an estimate, not a medical plan. Bowl nutrition is not recorded, so these bowls are not claimed to add up to the target.",
  ].filter(Boolean) : [];
  const href = name.trim().length >= 2 ? whatsappHref(whatsapp, guideOrderText({
    name: name.trim(),
    goalLabel,
    body: bodyLines,
    lines: lines.map((line) => ({ name: line.name, quantity: line.quantity, pricePaise: line.pricePaise })),
  })) : "";

  function choose(next: BodyGoal) {
    setGoal(next);
    setError("");
    setStep(next === "eat_healthy" ? "name" : "measure");
  }

  function seeSuggestion() {
    if (goal !== "fat_loss" && goal !== "weight_gain") return;
    if (!sex) return setError("Choose female or male. The estimate uses that in the equation.");
    if (numbers.heightCm < 120 || numbers.heightCm > 220) return setError("Enter height in centimetres.");
    if (numbers.weightKg < 30 || numbers.weightKg > 250) return setError("Enter weight in kilograms.");
    if (numbers.age < 18 || numbers.age > 80) return setError("Enter an age from 18 to 80.");
    const result = suggestIntake({ goal, sex, activity, ...numbers });
    if (result && !result.ok) return setError(result.message);
    setError("");
    setStep("name");
  }

  function add(meal: PublicMeal) {
    addMenuLine({ slug: meal.slug, name: meal.name, pricePaise: meal.pricePaise, mealType: meal.mealType });
    setBasket(readMenu());
  }

  function less(slug: string) {
    const next = readMenu().map((line) => line.slug === slug ? { ...line, quantity: line.quantity - 1 } : line).filter((line) => line.quantity > 0);
    writeMenu(next);
    setBasket(next);
  }

  const bowls = meals.filter((meal) => meal.categorySlug !== "wellness-shots" && meal.categorySlug !== "fresh-sips");

  return (
    <div className="mx-auto max-w-5xl pb-28">
      {step === "goal" ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">Start here</p>
          <h1 className="display mt-3 max-w-xl text-4xl leading-[1.05] text-[#1A4A16] sm:text-6xl">What are the bowls for?</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-[#6A5A4E]">Fat loss and weight gain start with your measurements. Eat healthy goes straight to your name, then the bowls.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {goals.map(([value, title, copy]) => (
              <button key={value} type="button" className="rounded-[28px] bg-white p-6 text-left shadow-[0_16px_36px_rgba(26,74,22,0.06)]" onClick={() => choose(value)}>
                <span className="display block text-3xl text-[#1A4A16]">{title}</span>
                <span className="mt-3 block text-sm leading-6 text-[#6A5A4E]">{copy}</span>
              </button>
            ))}
          </div>
          <p className="mt-8 text-sm text-[#6A5A4E]"><Link className="font-semibold text-[#1A4A16]" href="/plans/weekday-breakfast">Skip to a prepaid weekday plan</Link></p>
        </section>
      ) : null}

      {step === "measure" && (goal === "fat_loss" || goal === "weight_gain") ? (
        <section className="mx-auto max-w-xl">
          <button type="button" className="text-sm font-semibold text-[#1A4A16]" onClick={() => setStep("goal")}>Back</button>
          <h1 className="display mt-3 text-4xl text-[#1A4A16]">Your measurements</h1>
          <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">Height and weight are enough for BMI. Add age and activity for the calorie estimate. If a report already states BMI, you can type that too.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#1A4A16]">Height (cm)<input className="field mt-1" inputMode="decimal" value={height} onChange={(event) => setHeight(event.target.value)} /></label>
            <label className="text-sm font-semibold text-[#1A4A16]">Weight (kg)<input className="field mt-1" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} /></label>
            <label className="text-sm font-semibold text-[#1A4A16]">Age<input className="field mt-1" inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} /></label>
            <label className="text-sm font-semibold text-[#1A4A16]">BMI from a report, if you have one<input className="field mt-1" inputMode="decimal" value={reportedBmi} onChange={(event) => setReportedBmi(event.target.value)} placeholder="Optional" /></label>
          </div>
          <div className="mt-4 flex gap-2">
            {(["female", "male"] as const).map((value) => (
              <button key={value} type="button" className={`chip capitalize ${sex === value ? "chip-on" : ""}`} onClick={() => setSex(value)}>{value}</button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {activities.map(([value, label]) => (
              <button key={value} type="button" className={`chip ${activity === value ? "chip-on" : ""}`} onClick={() => setActivity(value)}>{label}</button>
            ))}
          </div>
          {height && weight ? <p className="mt-4 text-sm text-[#1A4A16]">BMI from these measurements: {bodyMassIndex(Number(weight), Number(height)) || "—"} · {bodyMassLabel(bodyMassIndex(Number(weight), Number(height)))}</p> : null}
          {error ? <p className="mt-3 text-sm text-[#7a3410]" role="alert">{error}</p> : null}
          <button className="btn btn-accent mt-5" type="button" onClick={seeSuggestion}>See the suggestion</button>
        </section>
      ) : null}

      {step === "name" ? (
        <section className="mx-auto max-w-xl">
          <button type="button" className="text-sm font-semibold text-[#1A4A16]" onClick={() => setStep(goal === "eat_healthy" ? "goal" : "measure")}>Back</button>
          <h1 className="display mt-3 text-4xl text-[#1A4A16]">What should we call you?</h1>
          {estimate && estimate.ok ? (
            <div className="mt-5 rounded-[28px] bg-[#1A4A16] p-6 text-white">
              <p className="text-xs uppercase tracking-[0.14em] text-white/70">{goalLabel} · BMI {estimate.bmi}</p>
              <p className="display mt-2 text-5xl">{estimate.kcal}</p>
              <p className="text-sm text-white/80">kcal a day, as an estimate</p>
              <p className="mt-4 text-sm leading-6 text-white/85">Protein {estimate.proteinG} g · Fat {estimate.fatG} g · Carbs {estimate.carbG} g</p>
              <p className="mt-2 text-sm leading-6 text-white/75">{estimate.note} {estimate.bmiLabel}. Bowl nutrition is not on the menu, so this target is for the kitchen.</p>
            </div>
          ) : null}
          <label className="mt-5 block text-sm font-semibold text-[#1A4A16]">Name
            <input className="field mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          </label>
          <button className="btn btn-accent mt-4" type="button" disabled={name.trim().length < 2} onClick={() => setStep("bowls")}>Choose bowls</button>
        </section>
      ) : null}

      {step === "bowls" ? (
        <section>
          <button type="button" className="text-sm font-semibold text-[#1A4A16]" onClick={() => setStep("name")}>Back</button>
          <h1 className="display mt-3 text-4xl text-[#1A4A16]">Add the bowls, {name.trim()}.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6A5A4E]">Your name, goal{estimate?.ok ? ", measurements, and the calorie estimate" : ""} go with the bowls in one WhatsApp message to the kitchen.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {bowls.map((meal) => {
              const line = basket.find((item) => item.slug === meal.slug);
              return <BowlTile key={meal.slug} meal={meal} quantity={line?.quantity || 0} onAdd={() => add(meal)} onLess={() => less(meal.slug)} />;
            })}
          </div>
          <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-full bg-[#1A4A16] px-4 py-2 text-white md:bottom-6">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/70">{lines.reduce((sum, line) => sum + line.quantity, 0)} bowls · {formatInr(lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0))}</p>
              <p className="text-sm">{name.trim()}</p>
            </div>
            {href ? <a className="btn btn-accent" href={href} target="_blank" rel="noreferrer">Send on WhatsApp</a> : <span className="text-sm">Add a name first</span>}
          </div>
        </section>
      ) : null}
    </div>
  );
}
