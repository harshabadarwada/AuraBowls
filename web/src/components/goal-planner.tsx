"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addMenuLine, readMenu, readPerson, SERVED_PIN, writeMenu, writePerson, type MenuLine } from "@/components/draft";
import { BowlTile } from "@/components/bowl-tile";
import { formatInr } from "@/lib/format";
import { bodyMassIndex, bodyMassLabel, suggestIntake, type Activity, type BodyGoal, type Sex } from "@/lib/guidance";
import { guideOrderText, outsideAreaText, subscriptionTotal, whatsappHref } from "@/lib/order-message";
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

const lengths = [
  { id: "daily", label: "1 day", days: 1, discountBps: 0, copy: "One delivery. Menu price." },
  { id: "weekly", label: "5 weekdays", days: 5, discountBps: 500, copy: "Monday to Friday. 5% off." },
  { id: "monthly", label: "20 weekdays", days: 20, discountBps: 1000, copy: "Twenty weekday deliveries. 10% off." },
] as const;

const mealChoices = [
  ["breakfast", "Breakfast"],
  ["both", "Breakfast and lunch"],
  ["lunch", "Lunch"],
] as const;

const morningSlots = ["7:30–9:00", "9:00–10:30"] as const;
const afternoonSlots = ["12:00–1:30", "1:30–3:00"] as const;

function kolkataTomorrow() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

export function GoalPlanner({ meals, whatsapp }: { meals: PublicMeal[]; whatsapp: string }) {
  const [goal, setGoal] = useState<BodyGoal | "">("");
  const [step, setStep] = useState<"place" | "goal" | "measure" | "name" | "subscription" | "bowls">("place");
  const [lengthId, setLengthId] = useState<(typeof lengths)[number]["id"]>("weekly");
  const [mealsChoice, setMealsChoice] = useState<(typeof mealChoices)[number][0]>("breakfast");
  const [startDate, setStartDate] = useState(kolkataTomorrow);
  const [morningSlot, setMorningSlot] = useState<(typeof morningSlots)[number]>(morningSlots[0]);
  const [afternoonSlot, setAfternoonSlot] = useState<(typeof afternoonSlots)[number]>(afternoonSlots[0]);
  const [sex, setSex] = useState<Sex | "">("");
  const [activity, setActivity] = useState<Activity>("regular");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [reportedBmi, setReportedBmi] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState("");
  const [inArea, setInArea] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [basket, setBasket] = useState<MenuLine[]>([]);
  useEffect(() => {
    setBasket(readMenu());
    const person = readPerson();
    setName(person.name);
    setAddress(person.address);
    setPin(person.pin);
  }, []);

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

  const length = lengths.find((item) => item.id === lengthId) || lengths[1];
  const mealsLabel = mealChoices.find((item) => item[0] === mealsChoice)?.[1] || "Breakfast";
  const lines = basket.filter((line) => mealsChoice === "both" ? line.mealType === "breakfast" || line.mealType === "lunch" : line.mealType === mealsChoice);
  const hasBreakfast = lines.some((line) => line.mealType === "breakfast");
  const hasLunch = lines.some((line) => line.mealType === "lunch");
  const bowlsReady = mealsChoice === "both" ? hasBreakfast && hasLunch : lines.length > 0;
  const perDay = lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  const priced = subscriptionTotal(perDay, length.days, length.discountBps);
  const slots = [
    mealsChoice !== "lunch" ? `Breakfast ${morningSlot}` : "",
    mealsChoice !== "breakfast" ? `Lunch ${afternoonSlot}` : "",
  ].filter(Boolean);
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
  const person = { name: name.trim(), address: address.trim(), pin: pin.trim() };
  const identified = person.name.length >= 2 && person.address.length >= 4;
  const outsideHref = identified ? whatsappHref(whatsapp, outsideAreaText(person)) : "";
  const href = identified && bowlsReady ? whatsappHref(whatsapp, guideOrderText({
    ...person,
    pin: SERVED_PIN,
    goalLabel,
    body: bodyLines,
    lines: lines.map((line) => ({ name: line.name, quantity: line.quantity, pricePaise: line.pricePaise })),
    subscription: { days: length.days, lengthLabel: length.label, mealsLabel, startDate, slots, discountBps: length.discountBps },
  })) : "";

  function savePlace(nextInArea: boolean) {
    if (!identified) return setError("Enter your name and address so we know who to reply to.");
    if (!nextInArea && pin.trim().length < 6 && address.trim().length < 4) return setError("Tell us the area or PIN where you are.");
    setError("");
    const next = { name: person.name, address: person.address, pin: nextInArea ? SERVED_PIN : pin.trim() };
    writePerson(next);
    setPin(next.pin);
    setInArea(nextInArea);
    if (nextInArea) setStep("goal");
  }

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
      {step === "place" ? (
        <section className="mx-auto max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">Delivery</p>
          <h1 className="display mt-3 text-4xl leading-[1.05] text-[#1A4A16] sm:text-5xl">We deliver in PIN 500081.</h1>
          <p className="mt-3 text-sm leading-7 text-[#6A5A4E]">Madhapur and Hitech City. If you are there, continue. If you are somewhere else, send your name and address on WhatsApp and we will reply.</p>
          <label className="mt-6 block text-sm font-semibold text-[#1A4A16]">Name
            <input className="field mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          </label>
          <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Address
            <input className="field mt-1" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Flat, street, area" />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={`chip ${inArea === true ? "chip-on" : ""}`} onClick={() => savePlace(true)}>I am in 500081</button>
            <button type="button" className={`chip ${inArea === false ? "chip-on" : ""}`} onClick={() => { setInArea(false); setError(""); }}>I am somewhere else</button>
          </div>
          {inArea === false ? (
            <label className="mt-4 block text-sm font-semibold text-[#1A4A16]">Your PIN or area
              <input className="field mt-1" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="PIN or neighbourhood" />
            </label>
          ) : null}
          {error ? <p className="mt-3 text-sm text-[#7a3410]" role="alert">{error}</p> : null}
          {inArea === false ? (
            outsideHref ? <a className="btn btn-accent mt-5" href={outsideHref} target="_blank" rel="noreferrer" onClick={() => writePerson({ name: person.name, address: person.address, pin: pin.trim() })}>Send my location on WhatsApp</a> : <p className="mt-4 text-sm text-[#6A5A4E]">Add your name and address, then the WhatsApp draft can open.</p>
          ) : null}
        </section>
      ) : null}

      {step === "goal" ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">Start here</p>
          <h1 className="display mt-3 max-w-xl text-4xl leading-[1.05] text-[#1A4A16] sm:text-6xl">What are the bowls for?</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-[#6A5A4E]">Fat loss and weight gain start with your measurements. Eat healthy skips that. Every goal then asks how many days, breakfast or lunch, the first day, and the delivery slot.</p>
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
          <h1 className="display mt-3 text-4xl text-[#1A4A16]">{estimate?.ok ? `${name.trim()}, here is the suggestion.` : name.trim() ? `${name.trim()}, next is the subscription.` : "What should we call you?"}</h1>
          <p className="mt-2 text-sm text-[#6A5A4E]">{address.trim()} · PIN {SERVED_PIN}</p>
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
          <button className="btn btn-accent mt-4" type="button" disabled={name.trim().length < 2} onClick={() => { writePerson({ name: name.trim(), address: address.trim(), pin: SERVED_PIN }); setStep("subscription"); }}>Choose the subscription</button>
        </section>
      ) : null}

      {step === "subscription" ? (
        <section className="mx-auto max-w-xl">
          <button type="button" className="text-sm font-semibold text-[#1A4A16]" onClick={() => setStep("name")}>Back</button>
          <h1 className="display mt-3 text-4xl text-[#1A4A16]">How long, and which meals?</h1>
          <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">Same lengths as the prepaid plans. The discount is on the bowls you pick, for every day in the subscription.</p>
          <div className="mt-6 grid gap-3">
            {lengths.map((item) => (
              <button key={item.id} type="button" className={`rounded-[24px] p-4 text-left ${lengthId === item.id ? "bg-[#1A4A16] text-white" : "bg-white text-[#1A4A16]"}`} onClick={() => setLengthId(item.id)}>
                <span className="display block text-2xl">{item.label}</span>
                <span className={`mt-1 block text-sm ${lengthId === item.id ? "text-white/80" : "text-[#6A5A4E]"}`}>{item.copy}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {mealChoices.map(([value, label]) => (
              <button key={value} type="button" className={`chip ${mealsChoice === value ? "chip-on" : ""}`} onClick={() => setMealsChoice(value)}>{label}</button>
            ))}
          </div>
          <label className="mt-5 block text-sm font-semibold text-[#1A4A16]">First day
            <input className="field mt-1" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          {mealsChoice !== "lunch" ? (
            <div className="mt-4">
              <p className="text-sm font-semibold text-[#1A4A16]">Morning slot</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {morningSlots.map((slot) => <button key={slot} type="button" className={`chip ${morningSlot === slot ? "chip-on" : ""}`} onClick={() => setMorningSlot(slot)}>{slot}</button>)}
              </div>
            </div>
          ) : null}
          {mealsChoice !== "breakfast" ? (
            <div className="mt-4">
              <p className="text-sm font-semibold text-[#1A4A16]">Afternoon slot</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {afternoonSlots.map((slot) => <button key={slot} type="button" className={`chip ${afternoonSlot === slot ? "chip-on" : ""}`} onClick={() => setAfternoonSlot(slot)}>{slot}</button>)}
              </div>
            </div>
          ) : null}
          <p className="mt-5 text-sm leading-6 text-[#6A5A4E]">{length.label} · {mealsLabel} · starts {startDate} · {slots.join(" · ")}</p>
          <button className="btn btn-accent mt-4" type="button" disabled={!/^\d{4}-\d{2}-\d{2}$/.test(startDate)} onClick={() => setStep("bowls")}>Choose bowls</button>
        </section>
      ) : null}

      {step === "bowls" ? (
        <section>
          <button type="button" className="text-sm font-semibold text-[#1A4A16]" onClick={() => setStep("subscription")}>Back</button>
          <h1 className="display mt-3 text-4xl text-[#1A4A16]">Add the bowls, {name.trim()}.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6A5A4E]">{length.label} of {mealsLabel.toLowerCase()}. {slots.join(" · ")}. Your name, address{estimate?.ok ? ", measurements, and the calorie estimate" : ""} go in the same WhatsApp message.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {bowls.filter((meal) => mealsChoice === "both" ? meal.mealType === "breakfast" || meal.mealType === "lunch" : meal.mealType === mealsChoice).map((meal) => {
              const line = basket.find((item) => item.slug === meal.slug);
              return <BowlTile key={meal.slug} meal={meal} quantity={line?.quantity || 0} onAdd={() => add(meal)} onLess={() => less(meal.slug)} />;
            })}
          </div>
          <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-full bg-[#1A4A16] px-4 py-2 text-white md:bottom-6">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/70">{length.label} · {formatInr(priced.totalPaise)}</p>
              <p className="text-sm">{bowlsReady ? name.trim() : mealsChoice === "both" ? "Add one breakfast and one lunch" : "Add a bowl"}</p>
            </div>
            {href ? <a className="btn btn-accent" href={href} target="_blank" rel="noreferrer">Send on WhatsApp</a> : <span className="text-sm">Add the bowls</span>}
          </div>
        </section>
      ) : null}
    </div>
  );
}
