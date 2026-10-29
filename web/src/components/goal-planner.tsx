"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readPerson, SERVED_PIN, writePerson } from "@/components/draft";
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

function addIsoDays(iso: string, count: number) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + count)).toISOString().slice(0, 10);
}

function weekdayNumber(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function planDates(start: string, count: number, weekdaysOnly: boolean) {
  const dates: string[] = [];
  let cursor = start;
  for (let step = 0; step < 90 && dates.length < count; step += 1) {
    const weekday = weekdayNumber(cursor);
    if (!weekdaysOnly || (weekday !== 0 && weekday !== 6)) dates.push(cursor);
    cursor = addIsoDays(cursor, 1);
  }
  return dates;
}

function dayBits(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return {
    weekday: date.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }),
    day: String(day),
  };
}

const breakfastRotation = ["mango-coconut-overnight-oats", "apple-cinnamon-oats", "kiwi-overnight-oats", "mediterranean-breakfast-salad", "pomegranate-overnight-oats", "mango-crunch-breakfast-salad", "strawberry-cream-oats", "dates-almond-energy-oats", "choco-banana-protein-oats", "egg-avocado-breakfast-salad"];
const lunchRotation = ["paneer-power-bowl", "tofu-power-bowl", "falafel-hummus-bowl", "sweet-potato-power-bowl", "mixed-veg-biryani-bowl", "mediterranean-chicken-bowl", "paneer-biryani-bowl", "egg-biryani-bowl", "pepper-mushroom-bowl", "asian-sesame-veg-bowl"];

type DayPick = { date: string; breakfast: string; lunch: string; source: "" | "recommendation" | "yours" };

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
  const [askSend, setAskSend] = useState(false);
  const [confirmPin, setConfirmPin] = useState("");
  const [days, setDays] = useState<DayPick[]>([]);
  const [activeDate, setActiveDate] = useState("");
  const [picking, setPicking] = useState<"breakfast" | "lunch">("breakfast");
  useEffect(() => {
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
  const mealBySlug = useMemo(() => new Map(meals.map((meal) => [meal.slug, meal])), [meals]);
  const needsBreakfast = mealsChoice !== "lunch";
  const needsLunch = mealsChoice !== "breakfast";
  const bowlsReady = days.length === length.days && days.every((day) => (!needsBreakfast || day.breakfast) && (!needsLunch || day.lunch));
  const chosenMeals = days.flatMap((day) => [needsBreakfast ? mealBySlug.get(day.breakfast) : undefined, needsLunch ? mealBySlug.get(day.lunch) : undefined].filter((meal): meal is PublicMeal => Boolean(meal)));
  const mealsTotal = chosenMeals.reduce((sum, meal) => sum + meal.pricePaise, 0);
  const priced = subscriptionTotal(mealsTotal, 1, length.discountBps);
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
  const confirmPerson = { name: name.trim(), address: address.trim(), pin: confirmPin.trim() };
  const pinReady = /^\d{6}$/.test(confirmPerson.pin);
  const sendReady = confirmPerson.name.length >= 2 && confirmPerson.address.length >= 4 && pinReady;
  const sendOutside = pinReady && confirmPerson.pin !== SERVED_PIN;
  const orderText = guideOrderText({
    ...confirmPerson,
    goalLabel,
    body: bodyLines,
    lines: [],
    days: days.map((day) => ({
      date: day.date,
      note: day.source === "recommendation" ? "our recommendation" : day.source === "yours" ? "your choice" : "",
      items: [
        needsBreakfast && mealBySlug.get(day.breakfast) ? { mealLabel: "Breakfast", name: mealBySlug.get(day.breakfast)!.name, pricePaise: mealBySlug.get(day.breakfast)!.pricePaise } : null,
        needsLunch && mealBySlug.get(day.lunch) ? { mealLabel: "Lunch", name: mealBySlug.get(day.lunch)!.name, pricePaise: mealBySlug.get(day.lunch)!.pricePaise } : null,
      ].filter((item): item is { mealLabel: string; name: string; pricePaise: number } => Boolean(item)),
    })),
    subscription: { days: length.days, lengthLabel: length.label, mealsLabel, startDate, slots, discountBps: length.discountBps },
  });
  const href = sendReady && bowlsReady ? whatsappHref(whatsapp, sendOutside ? outsideAreaText(confirmPerson) : orderText) : "";

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

  function openDays() {
    const dates = planDates(startDate, length.days, length.id !== "daily");
    setDays(dates.map((date) => ({ date, breakfast: "", lunch: "", source: "" })));
    setActiveDate(dates[0] || "");
    setPicking(mealsChoice === "lunch" ? "lunch" : "breakfast");
    setStep("bowls");
  }

  function recommend() {
    const breakfasts = breakfastRotation.map((slug) => mealBySlug.get(slug)).filter((meal): meal is PublicMeal => Boolean(meal));
    const lunches = lunchRotation.map((slug) => mealBySlug.get(slug)).filter((meal): meal is PublicMeal => Boolean(meal));
    setDays((current) => current.map((day, index) => ({
      date: day.date,
      breakfast: needsBreakfast ? breakfasts[index % Math.max(breakfasts.length, 1)]?.slug || "" : "",
      lunch: needsLunch ? lunches[index % Math.max(lunches.length, 1)]?.slug || "" : "",
      source: "recommendation",
    })));
  }

  function pickMeal(meal: PublicMeal) {
    setDays((current) => current.map((day) => {
      if (day.date !== activeDate) return day;
      const next = { ...day, source: "yours" as const };
      if (meal.mealType === "breakfast") next.breakfast = meal.slug;
      if (meal.mealType === "lunch") next.lunch = meal.slug;
      return next;
    }));
    if (mealsChoice === "both" && meal.mealType === "breakfast") setPicking("lunch");
  }

  function clearMeal(mealType: "breakfast" | "lunch") {
    setDays((current) => current.map((day) => day.date === activeDate ? { ...day, [mealType]: "", source: "yours" } : day));
  }

  const bowls = meals.filter((meal) => meal.categorySlug !== "wellness-shots" && meal.categorySlug !== "fresh-sips" && meal.mealType === picking);
  const active = days.find((day) => day.date === activeDate);
  const filled = days.filter((day) => (!needsBreakfast || day.breakfast) && (!needsLunch || day.lunch)).length;

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
          <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">After this, each day gets its own bowl. You can take our recommendation or choose the food yourself.</p>
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
          <p className="mt-2 text-sm leading-6 text-[#6A5A4E]">Delivery charges vary by location and are not included in the bowl total.</p>
          <button className="btn btn-accent mt-4" type="button" disabled={!/^\d{4}-\d{2}-\d{2}$/.test(startDate)} onClick={openDays}>Choose each day</button>
        </section>
      ) : null}

      {step === "bowls" ? (
        <section>
          <button type="button" className="text-sm font-semibold text-[#1A4A16]" onClick={() => setStep("subscription")}>Back</button>
          <h1 className="display mt-3 text-4xl text-[#1A4A16]">A bowl for each day.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6A5A4E]">{length.label} of {mealsLabel.toLowerCase()}. {filled} of {days.length} days are filled. Our recommendation is a kitchen rotation, not a claim that the bowls match the calorie estimate.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn btn-forest" onClick={recommend}>Use our recommendation</button>
            <button type="button" className="btn btn-line" onClick={() => setDays((current) => current.map((day) => ({ ...day, breakfast: "", lunch: "", source: "" })))}>Clear and choose myself</button>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Delivery days">
            {days.map((day) => {
              const ready = (!needsBreakfast || day.breakfast) && (!needsLunch || day.lunch);
              const on = day.date === activeDate;
              return (
                <button key={day.date} type="button" className={`min-w-16 rounded-full px-3 py-2 text-center ${on ? "bg-[#1A4A16] text-white" : "bg-white text-[#1A4A16]"}`} onClick={() => setActiveDate(day.date)}>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide">{dayBits(day.date).weekday}</span>
                  <span className="text-lg font-semibold">{dayBits(day.date).day}</span>
                  <span className="block text-[10px]">{ready ? "Set" : "Pick"}</span>
                </button>
              );
            })}
          </div>
          {mealsChoice === "both" ? (
            <div className="mt-4 flex gap-2">
              {(["breakfast", "lunch"] as const).map((mealType) => (
                <button key={mealType} type="button" className={`chip capitalize ${picking === mealType ? "chip-on" : ""}`} onClick={() => setPicking(mealType)}>{mealType}</button>
              ))}
            </div>
          ) : null}
          <p className="mt-4 text-sm text-[#6A5A4E]">
            {active ? `${dayBits(active.date).weekday} ${dayBits(active.date).day}: ${picking === "breakfast" ? mealBySlug.get(active.breakfast)?.name || "choose a breakfast" : mealBySlug.get(active.lunch)?.name || "choose a lunch"}` : ""}
            {active?.source === "recommendation" ? " · our recommendation" : active?.source === "yours" ? " · your choice" : ""}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {bowls.map((meal) => {
              const selected = picking === "breakfast" ? active?.breakfast === meal.slug : active?.lunch === meal.slug;
              return <BowlTile key={meal.slug} meal={meal} quantity={selected ? 1 : 0} onAdd={() => pickMeal(meal)} onLess={() => clearMeal(picking)} />;
            })}
          </div>
          {askSend ? (
            <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 rounded-[28px] bg-white p-4 text-[#1A4A16] shadow-[0_16px_40px_rgba(26,74,22,0.18)] md:bottom-6">
              <p className="text-sm font-semibold">Check this before WhatsApp opens</p>
              <label className="mt-3 block text-sm font-semibold">Name
                <input className="field mt-1" value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label className="mt-3 block text-sm font-semibold">Address
                <input className="field mt-1" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Flat, street, area" />
              </label>
              <label className="mt-3 block text-sm font-semibold">PIN code
                <input className="field mt-1" inputMode="numeric" maxLength={6} value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="500081" />
              </label>
              <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">Delivery charges vary by location and are not included in {formatInr(priced.totalPaise)}. The kitchen confirms the charge on WhatsApp.</p>
              {sendOutside ? <p className="mt-2 text-sm text-[#7a3410]">PIN {confirmPerson.pin} is outside 500081. This sends your name and address so we can reply.</p> : null}
              {href ? (
                <a className="btn btn-accent mt-4 w-full" href={href} target="_blank" rel="noreferrer" onClick={() => writePerson(confirmPerson)}>Send on WhatsApp</a>
              ) : (
                <p className="mt-3 text-sm text-[#6A5A4E]">Enter your name, address, and a 6-digit PIN. WhatsApp stays closed until those are filled in.</p>
              )}
              <button type="button" className="mt-3 text-sm font-semibold text-[#1A4A16]" onClick={() => setAskSend(false)}>Back to bowls</button>
            </div>
          ) : (
            <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-full bg-[#1A4A16] px-4 py-2 text-white md:bottom-6">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/70">{filled}/{days.length} days · {formatInr(priced.totalPaise)} · delivery extra</p>
                <p className="text-sm">{bowlsReady ? "PIN is checked next" : "Choose a bowl for each day"}</p>
              </div>
              <button type="button" className="btn btn-accent" disabled={!bowlsReady} onClick={() => setAskSend(true)}>Send on WhatsApp</button>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
