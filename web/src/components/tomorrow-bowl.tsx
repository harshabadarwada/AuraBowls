"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BowlStage } from "@/components/bowl-stage";
import { readPerson, writePerson } from "@/components/draft";
import { isServedArea, servedAreaLabel } from "@/lib/area";
import { whatsappHref } from "@/lib/order-message";
import {
  DAILY_CUTOFF,
  dailyProcess,
  bowlStyles,
  bowlsFor,
  dayBits,
  findBowl,
  kitchenPickDate,
  readSavedPlan,
  tomorrowSheet,
  type SavedPlan,
} from "@/lib/power-bowls";

export function TomorrowBowl({ whatsapp }: { whatsapp: string }) {
  const pick = useMemo(() => kitchenPickDate(), []);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [name, setName] = useState("");
  const [styleId, setStyleId] = useState<(typeof bowlStyles)[number]["id"]>("balanced");
  const [diet, setDiet] = useState<"veg" | "non_veg">("veg");
  const [bowlId, setBowlId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = readSavedPlan();
    const person = readPerson();
    setPlan(saved);
    setName(saved?.name || person.name);
    if (saved) {
      setStyleId(saved.style);
      setDiet(saved.diet);
      const planned = saved.picks.find((item) => item.date === pick.date)?.bowlId || saved.bowlId;
      setBowlId(planned);
    }
  }, [pick.date]);

  const menu = bowlsFor(styleId, plan?.mix || (diet === "non_veg" ? "non_veg" : "veg"), diet);
  const bowl = findBowl(bowlId) || menu[0];
  const style = bowlStyles.find((item) => item.id === styleId) || bowlStyles[0];
  const defaultBowl = plan ? findBowl(plan.bowlId) : null;
  const ready = name.trim().length >= 2 && Boolean(bowl);
  const sheet = ready && bowl
    ? tomorrowSheet({
      name: name.trim(),
      address: plan?.address,
      pin: plan?.pin,
      date: pick.date,
      style: style.name,
      slot: plan?.slot,
      bowlName: bowl.name,
      defaultBowlName: defaultBowl?.name,
    })
    : "";
  const href = sheet ? whatsappHref(whatsapp, sheet) : "";

  function send() {
    if (!href || !ready) return;
    writePerson({ name: name.trim(), address: plan?.address || "", pin: plan?.pin || "" });
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function copySheet() {
    if (!sheet) return;
    try {
      await navigator.clipboard.writeText(sheet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl pb-28">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">Sheet update · before {DAILY_CUTOFF}</p>
      <h1 className="display mt-3 text-4xl leading-[1.05] text-[#1A4A16] sm:text-5xl">Which bowl should we cook {pick.when}?</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[#6A5A4E]">
        This is where sheet updates show. Send this daily kitchen sheet before {DAILY_CUTOFF} Asia/Kolkata if you want a different bowl from the plan order sheet. If the kitchen does not get it, they cook whatever is already written for {dayBits(pick.date).label}.
      </p>
      {pick.lockedToday ? (
        <p className="mt-4 rounded-[22px] bg-[#FFF3E8] px-4 py-3 text-sm leading-6 text-[#7a3410]" role="status">
          {DAILY_CUTOFF} has passed today, so this sheet is for {dayBits(pick.date).label}, not today&apos;s lunch.
        </p>
      ) : null}

      <article className="kitchen-sheet mt-8 rounded-[28px] bg-[#FFFAF3] p-5 text-[#1A4A16] shadow-[0_16px_36px_rgba(26,74,22,0.06)] sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F15C00]">Daily kitchen sheet</p>
        <h2 className="display mt-2 text-3xl">{name.trim() || "Your name"}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-[11px] uppercase tracking-[0.14em] text-[#6A5A4E]">Date</dt><dd className="mt-1 font-semibold">{dayBits(pick.date).label}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-[0.14em] text-[#6A5A4E]">Slot</dt><dd className="mt-1 font-semibold">{plan?.slot || "Lunch"}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-[0.14em] text-[#6A5A4E]">Style</dt><dd className="mt-1 font-semibold">{style.name}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-[0.14em] text-[#6A5A4E]">Bowl</dt><dd className="mt-1 font-semibold">{bowl?.name || "Pick a bowl"}</dd></div>
        </dl>
        {plan?.address ? <p className="mt-3 text-sm text-[#6A5A4E]">{plan.address}{plan.pin ? ` · ${isServedArea(plan.pin) ? servedAreaLabel : plan.pin}` : ""}</p> : null}
        <div className="mt-5 rounded-[22px] bg-[#FFF3E8] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F15C00]">How to process</p>
          <ol className="mt-2 space-y-2 text-sm leading-6">
            {dailyProcess.map((line, index) => (
              <li key={line}><span className="font-semibold">{index + 1}.</span> {line}</li>
            ))}
          </ol>
        </div>
      </article>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
        {bowl ? <BowlStage key={`${styleId}-${bowl.id}`} styleId={styleId} protein={bowl.protein} name={bowl.name} /> : null}
        <div>
          <label className="block text-sm font-semibold text-[#1A4A16]">Name
            <input className="field mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Same name as the order sheet" />
          </label>
          {plan ? <p className="mt-3 text-sm text-[#6A5A4E]">On the plan sheet: {defaultBowl?.name || "saved bowl"} · {plan.lengthLabel}</p> : <p className="mt-3 text-sm text-[#6A5A4E]">No saved plan on this phone yet. Pick a style and bowl anyway, or <Link className="font-semibold text-[#1A4A16]" href="/plans">start a plan</Link>.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {bowlStyles.map((item) => (
              <button key={item.id} type="button" className={`chip ${styleId === item.id ? "chip-on" : ""}`} onClick={() => { setStyleId(item.id); setBowlId(""); }}>{item.name}</button>
            ))}
          </div>
          {(plan?.mix || "mixed") === "mixed" ? (
            <div className="mt-3 flex gap-2">
              {([["veg", "Vegetarian"], ["non_veg", "Non-veg"]] as const).map(([id, label]) => (
                <button key={id} type="button" className={`chip ${diet === id ? "chip-on" : ""}`} onClick={() => { setDiet(id); setBowlId(""); }}>{label}</button>
              ))}
            </div>
          ) : null}
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {menu.map((item) => {
              const on = item.id === bowl?.id;
              return (
                <li key={item.id}>
                  <button type="button" className={`flex w-full items-center gap-3 rounded-[22px] p-3 text-left ${on ? "bg-[#1A4A16] text-white" : "bg-white text-[#1A4A16]"}`} onClick={() => setBowlId(item.id)}>
                    <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                    <span>
                      <span className="block font-semibold leading-5">{item.name}</span>
                      <span className={`mt-1 block text-xs ${on ? "text-white/70" : "text-[#6A5A4E]"}`}>{item.protein}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button className="btn btn-accent" type="button" disabled={!ready} onClick={send}>Send {dayBits(pick.date).label} on WhatsApp</button>
            <button className="btn btn-line" type="button" disabled={!sheet} onClick={copySheet}>{copied ? "Sheet copied" : "Copy sheet"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
