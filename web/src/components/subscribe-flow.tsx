"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BowlStage } from "@/components/bowl-stage";
import { readPerson, SERVED_PIN, writePerson } from "@/components/draft";
import { SHEET_UPDATE_PATH, isServedArea, servedAreaLabel } from "@/lib/area";
import { formatInr } from "@/lib/format";
import { postKitchenSheet, trackerMealType } from "@/lib/kitchen-sheet";
import { outsideAreaText, whatsappHref } from "@/lib/order-message";
import {
  DAILY_CUTOFF,
  bowlStyles,
  bowlsFor,
  dayBits,
  fillPicks,
  findBowl,
  kitchenPickDate,
  lunchSlots,
  mixLabel,
  orderProcess,
  planDates,
  planLengths,
  planMixes,
  planPricePaise,
  subscriptionSheet,
  writeSavedPlan,
  type DayPick,
  type LengthId,
  type MixId,
  type SavedPlan,
} from "@/lib/power-bowls";

const steps = ["place", "plan", "style", "bowl", "sheet"] as const;
type Step = (typeof steps)[number];

export function SubscribeFlow({ whatsapp }: { whatsapp: string }) {
  const [step, setStep] = useState<Step>("place");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState("");
  const [inArea, setInArea] = useState<boolean | null>(null);
  const [lengthId, setLengthId] = useState<LengthId>("5");
  const [mix, setMix] = useState<MixId>("veg");
  const [styleId, setStyleId] = useState<(typeof bowlStyles)[number]["id"]>("balanced");
  const [diet, setDiet] = useState<"veg" | "non_veg">("veg");
  const [bowlId, setBowlId] = useState("");
  const [startDate, setStartDate] = useState(() => kitchenPickDate().date);
  const [slot, setSlot] = useState<(typeof lunchSlots)[number]>(lunchSlots[0]);
  const [note, setNote] = useState("");
  const [picks, setPicks] = useState<DayPick[]>([]);
  const [activeDate, setActiveDate] = useState("");
  const [askSend, setAskSend] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sheetBusy, setSheetBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const person = readPerson();
    setName(person.name);
    setAddress(person.address);
    setPin(person.pin);
    setInArea(person.pin ? isServedArea(person.pin) : null);
  }, []);

  const length = planLengths.find((item) => item.id === lengthId) || planLengths[1];
  const style = bowlStyles.find((item) => item.id === styleId) || bowlStyles[0];
  const mixMeta = planMixes.find((item) => item.id === mix) || planMixes[0];
  const menuDiet = mix === "non_veg" ? "non_veg" : mix === "veg" ? "veg" : diet;
  const menu = bowlsFor(styleId, mix, menuDiet);
  const bowl = findBowl(bowlId) || menu[0];
  const dates = useMemo(() => planDates(startDate, length.days), [startDate, length.days]);
  const totalPaise = planPricePaise(lengthId, mix);
  const person = { name: name.trim(), address: address.trim(), pin: pin.trim() };
  const identified = person.name.length >= 2 && person.address.length >= 4;
  const outsideHref = identified ? whatsappHref(whatsapp, outsideAreaText(person)) : "";
  const confirmPerson = { name: person.name, address: person.address, pin: inArea ? SERVED_PIN : person.pin };
  const sendOutside = !inArea;

  const saved: SavedPlan | null = bowl ? {
    name: confirmPerson.name || person.name,
    phone: phone.replace(/\D/g, "").slice(0, 10),
    address: confirmPerson.address || person.address,
    pin: confirmPerson.pin,
    style: styleId,
    mix,
    diet: menuDiet,
    bowlId: bowl.id,
    days: length.days,
    lengthId,
    lengthLabel: length.label,
    startDate: dates[0] || startDate,
    slot,
    note: note.trim(),
    picks,
    totalPaise,
  } : null;

  const sheet = saved ? subscriptionSheet(saved) : "";
  const href = sheet ? whatsappHref(whatsapp, sendOutside ? outsideAreaText(confirmPerson) : sheet) : "";
  const readyDays = picks.length === dates.length && picks.every((pick) => findBowl(pick.bowlId));
  const activePick = picks.find((pick) => pick.date === activeDate) || picks[0];
  const activeBowl = findBowl(activePick?.bowlId || "") || bowl;

  function go(next: Step) {
    setError("");
    setAskSend(false);
    setStep(next);
  }

  function savePlace(nextInArea: boolean) {
    if (!identified) return setError("Enter your name and address so the order sheet has them.");
    setError("");
    const next = { name: person.name, address: person.address, pin: nextInArea ? SERVED_PIN : pin.trim() };
    writePerson(next);
    setPin(next.pin);
    setInArea(nextInArea);
    if (nextInArea) go("plan");
  }

  function pickPlan(nextLength: LengthId, nextMix: MixId) {
    setLengthId(nextLength);
    setMix(nextMix);
    setDiet(nextMix === "non_veg" ? "non_veg" : "veg");
    setBowlId("");
    go("style");
  }

  function pickStyle(id: typeof styleId) {
    setStyleId(id);
    setBowlId("");
    go("bowl");
  }

  function openSheet() {
    if (!bowl || !dates[0]) return;
    const next = fillPicks(dates, bowl.id);
    setStartDate(dates[0]);
    setPicks(next);
    setActiveDate(dates[0]);
    go("sheet");
  }

  function setDayBowl(id: string) {
    setPicks((current) => current.map((pick) => pick.date === activeDate ? { ...pick, bowlId: id } : pick));
  }

  function fillAll() {
    if (!bowl) return;
    setPicks((current) => current.map((pick) => ({ ...pick, bowlId: bowl.id })));
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

  async function send() {
    if (!saved || !href || !bowl) return;
    if (confirmPerson.name.length < 2 || confirmPerson.address.length < 4) return;
    writePerson({ name: saved.name, address: saved.address, pin: saved.pin });
    writeSavedPlan(saved);
    if (!sendOutside) {
      setSheetBusy(true);
      try {
        await postKitchenSheet({
          name: saved.name,
          phone: saved.phone,
          address: saved.address,
          area: inArea ? servedAreaLabel : saved.pin,
          mealType: trackerMealType(saved.mix),
          days: saved.days,
          startDate: saved.startDate,
          totalPaise: saved.totalPaise,
          slot: saved.slot,
          style: style.name,
          defaultBowl: bowl.name,
          schedule: saved.picks.map((pick) => `${dayBits(pick.date).label}: ${findBowl(pick.bowlId)?.name || bowl.name}`).join(" | "),
          note: saved.note,
        });
      } finally {
        setSheetBusy(false);
      }
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  const stepIndex = steps.indexOf(step);

  return (
    <div className="mx-auto max-w-5xl pb-28">
      <ol className="mb-8 flex gap-2" aria-label="Plan steps">
        {["Place", "Plan", "Style", "Bowl", "Sheet"].map((label, index) => (
          <li key={label} className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-[#1A4A16]" : "bg-[#1A4A16]/15"}`} title={label} />
        ))}
      </ol>
      {step === "place" ? (
        <section className="mx-auto max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">Lunch subscriptions · Madhapur</p>
          <h1 className="display mt-3 text-4xl leading-[1.05] text-[#1A4A16] sm:text-5xl">Pick a subscription. Fill the order sheet. Send it on WhatsApp.</h1>
          <p className="mt-3 text-sm leading-7 text-[#6A5A4E]">Prices below are after discount. We deliver within 7 km of Madhapur. The kitchen cooks from the named sheet. Daily bowl changes show on Sheet update.</p>
          <ol className="mt-6 space-y-3 text-sm leading-6 text-[#6A5A4E]">
            <li><span className="font-semibold text-[#1A4A16]">1. Subscription.</span> Choose 3, 5, 10, 20 or 22 days as Pure Veg, Pure Non-Veg or Mixed.</li>
            <li><span className="font-semibold text-[#1A4A16]">2. Order sheet.</span> Name, address, each lunch bowl and the after-discount total.</li>
            <li><span className="font-semibold text-[#1A4A16]">3. WhatsApp.</span> The unpaid sheet opens on chat. Pay after the kitchen sends the QR.</li>
            <li><span className="font-semibold text-[#1A4A16]">4. Sheet update.</span> Open <Link className="font-semibold text-[#1A4A16]" href={SHEET_UPDATE_PATH}>Sheet update</Link> before {DAILY_CUTOFF} only if that day should change.</li>
          </ol>
          <label className="mt-6 block text-sm font-semibold text-[#1A4A16]">Name
            <input className="field mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" />
          </label>
          <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Phone
            <input className="field mt-1" inputMode="numeric" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" autoComplete="tel" />
          </label>
          <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Address
            <input className="field mt-1" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Flat, street, area" autoComplete="street-address" />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={`chip ${inArea === true ? "chip-on" : ""}`} onClick={() => savePlace(true)}>I am within 7 km of Madhapur</button>
            <button type="button" className={`chip ${inArea === false ? "chip-on" : ""}`} onClick={() => { setInArea(false); setError(""); }}>I am farther than 7 km</button>
          </div>
          {inArea === false ? (
            <label className="mt-4 block text-sm font-semibold text-[#1A4A16]">Your area
              <input className="field mt-1" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Neighbourhood or landmark" />
            </label>
          ) : null}
          {error ? <p className="mt-3 text-sm text-[#7a3410]" role="alert">{error}</p> : null}
          {inArea === false ? (
            outsideHref ? <a className="btn btn-accent mt-5" href={outsideHref} target="_blank" rel="noreferrer" onClick={() => writePerson({ name: person.name, address: person.address, pin: pin.trim() })}>Send my location on WhatsApp</a> : <p className="mt-4 text-sm text-[#6A5A4E]">Add your name and address first.</p>
          ) : null}
          <p className="mt-8 text-sm text-[#6A5A4E]"><Link className="font-semibold text-[#1A4A16]" href={SHEET_UPDATE_PATH}>Already on a plan? Open sheet update</Link></p>
        </section>
      ) : null}

      {step === "plan" ? (
        <section>
          <button type="button" className="text-sm font-semibold text-[#1A4A16]" onClick={() => go("place")}>Back</button>
          <h1 className="display mt-3 text-4xl text-[#1A4A16]">Subscription prices</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6A5A4E]">{person.name}, these are the after-discount totals we charge. Tap a price to lock days and veg, non-veg or mixed.</p>
          <div className="kitchen-sheet mt-8 overflow-x-auto rounded-[28px] bg-white shadow-[0_16px_36px_rgba(26,74,22,0.06)]">
            <table>
              <thead>
                <tr>
                  <th>Duration</th>
                  {planMixes.map((item) => <th key={item.id}>{item.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {planLengths.map((item) => (
                  <tr key={item.id}>
                    <td className="font-semibold">{item.days} days</td>
                    {planMixes.map((mixItem) => {
                      const on = lengthId === item.id && mix === mixItem.id;
                      return (
                        <td key={mixItem.id}>
                          <button type="button" className={`rounded-full px-3 py-2 font-semibold ${on ? "bg-[#1A4A16] text-white" : "text-[#1A4A16] hover:bg-[#EAF6DC]"}`} onClick={() => pickPlan(item.id, mixItem.id)}>
                            {formatInr(planPricePaise(item.id, mixItem.id))}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-[#6A5A4E]">Delivery is extra. Balanced, Power Protein and Carb Load change the bowl build, not this subscription price.</p>
        </section>
      ) : null}

      {step === "style" ? (
        <section>
          <button type="button" className="text-sm font-semibold text-[#1A4A16]" onClick={() => go("plan")}>Back</button>
          <h1 className="display mt-3 text-4xl text-[#1A4A16]">What should the bowl be built for?</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#6A5A4E]">{length.label} · {mixMeta.name} · {formatInr(totalPaise)} after discount. Portion style does not change that price.</p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {bowlStyles.map((item) => (
              <button key={item.id} type="button" className={`rounded-[28px] bg-white p-6 text-left shadow-[0_16px_36px_rgba(26,74,22,0.06)] ring-1 ${styleId === item.id ? "ring-[#1A4A16]" : "ring-transparent"}`} onClick={() => pickStyle(item.id)}>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F15C00]">{item.hint}</span>
                <span className="display mt-2 block text-3xl text-[#1A4A16]">{item.name}</span>
                <span className="mt-3 block text-sm font-semibold text-[#1A4A16]">{item.who}</span>
                <span className="mt-2 block text-sm leading-6 text-[#6A5A4E]">{item.copy}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === "bowl" && bowl ? (
        <section>
          <button type="button" className="text-sm font-semibold text-[#1A4A16]" onClick={() => go("style")}>Back</button>
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
            <BowlStage key={`${styleId}-${bowl.id}`} styleId={styleId} protein={bowl.protein} name={bowl.name} />
            <div>
              <h1 className="display text-4xl text-[#1A4A16]">{style.name} bowls</h1>
              <p className="mt-2 text-sm leading-6 text-[#6A5A4E]">{mixMeta.copy} This bowl fills every row on the order sheet. You can still change individual days next. Subscription stays {formatInr(totalPaise)}.</p>
              {mix === "mixed" ? (
                <div className="mt-4 flex gap-2">
                  {([["veg", "Vegetarian"], ["non_veg", "Non-veg"]] as const).map(([id, label]) => (
                    <button key={id} type="button" className={`chip ${diet === id ? "chip-on" : ""}`} onClick={() => { setDiet(id); setBowlId(""); }}>{label}</button>
                  ))}
                </div>
              ) : null}
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {menu.map((item) => {
                  const on = item.id === bowl.id;
                  return (
                    <li key={item.id}>
                      <button type="button" className={`flex w-full items-center gap-3 rounded-[22px] p-3 text-left ${on ? "bg-[#1A4A16] text-white" : "bg-white text-[#1A4A16]"}`} onClick={() => setBowlId(item.id)}>
                        <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                        <span>
                          <span className="block font-semibold leading-5">{item.name}</span>
                          <span className={`mt-1 block text-xs ${on ? "text-white/70" : "text-[#6A5A4E]"}`}>{item.protein} · included</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <label className="mt-5 block text-sm font-semibold text-[#1A4A16]">First lunch
                <input className="field mt-1" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <p className="mt-2 text-xs text-[#6A5A4E]">Sunday is closed. If you pick a Sunday, the first delivery moves to Monday.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {lunchSlots.map((item) => (
                  <button key={item} type="button" className={`chip ${slot === item ? "chip-on" : ""}`} onClick={() => setSlot(item)}>{item}</button>
                ))}
              </div>
              <p className="mt-4 text-sm text-[#6A5A4E]">{length.label} · {mixMeta.name} · {formatInr(totalPaise)} after discount · lunch {slot}</p>
              <button className="btn btn-accent mt-4" type="button" disabled={!dates[0]} onClick={openSheet}>Build the order sheet</button>
            </div>
          </div>
        </section>
      ) : null}

      {step === "sheet" && saved && bowl ? (
        <section>
          <button type="button" className="text-sm font-semibold text-[#1A4A16]" onClick={() => go("bowl")}>Back</button>
          <h1 className="display mt-3 text-4xl text-[#1A4A16]">Order sheet</h1>
          <p className="mt-2 max-w-xl text-sm text-[#6A5A4E]">This is what WhatsApp sends. Kitchen cooks these bowls. Message before {DAILY_CUTOFF} only to change a day. The subscription total does not change.</p>

          <article className="kitchen-sheet mt-6 overflow-hidden rounded-[28px] bg-[#FFFAF3] text-[#1A4A16] shadow-[0_24px_48px_rgba(26,74,22,0.08)]">
            <header className="flex flex-wrap items-start justify-between gap-4 bg-[#111] px-5 py-5 text-[#F4F1EA] sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F15C00]">AuraBowls · lunch subscription</p>
                <h2 className="display mt-2 text-3xl">{saved.name}</h2>
                <p className="mt-1 text-sm text-white/70">{saved.address}</p>
                <p className="text-sm text-white/70">{inArea ? servedAreaLabel : person.pin || "Area on confirm"}{saved.phone ? ` · ${saved.phone}` : ""}</p>
              </div>
              <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/80">Unpaid</p>
            </header>
            <dl className="grid grid-cols-2 gap-4 px-5 py-5 text-sm sm:grid-cols-4 sm:px-6">
              <div><dt className="text-[11px] uppercase tracking-[0.14em] text-[#6A5A4E]">Plan</dt><dd className="mt-1 font-semibold">{length.label}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-[0.14em] text-[#6A5A4E]">Mix</dt><dd className="mt-1 font-semibold">{mixLabel(mix)}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-[0.14em] text-[#6A5A4E]">Style</dt><dd className="mt-1 font-semibold">{style.name}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-[0.14em] text-[#6A5A4E]">Slot</dt><dd className="mt-1 font-semibold">{slot}</dd></div>
            </dl>
            <p className="px-5 text-sm text-[#6A5A4E] sm:px-6">Default: {bowl.name}. Days with a change are marked. Price after discount: {formatInr(totalPaise)}.</p>
            <div className="mt-4 overflow-x-auto px-2 pb-2 sm:px-4">
              <table>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Bowl</th>
                    <th>On plan</th>
                  </tr>
                </thead>
                <tbody>
                  {picks.map((pick) => {
                    const item = findBowl(pick.bowlId);
                    const on = pick.date === activeDate;
                    const changed = pick.bowlId !== bowl.id;
                    return (
                      <tr key={pick.date}>
                        <td>
                          <button type="button" className={`rounded-full px-3 py-1 text-left ${on ? "bg-[#1A4A16] text-white" : ""}`} onClick={() => setActiveDate(pick.date)}>
                            <span className="block text-[10px] uppercase tracking-wide opacity-70">{dayBits(pick.date).weekday}</span>
                            {dayBits(pick.date).label.replace(/^[A-Za-z]{3}\s/, "")}
                          </button>
                        </td>
                        <td>
                          <button type="button" className="text-left font-semibold" onClick={() => setActiveDate(pick.date)}>
                            {item?.name || "Pick a bowl"}
                            {changed ? <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[#F15C00]">Changed</span> : null}
                          </button>
                        </td>
                        <td>Included</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[#EAE4DD] px-5 py-5 sm:px-6">
              <div>
                <p className="text-xs text-[#6A5A4E]">{length.days} days · {mixLabel(mix)} · after discount</p>
                <p className="mt-1 text-2xl font-semibold">{formatInr(totalPaise)}</p>
                <p className="text-xs text-[#6A5A4E]">Delivery extra. Kitchen confirms the charge on WhatsApp.</p>
              </div>
              <button type="button" className="btn btn-line" onClick={fillAll}>Use {bowl.name} every day</button>
            </div>
            <div className="border-t border-[#EAE4DD] bg-[#FFF3E8] px-5 py-5 sm:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F15C00]">How to process</p>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-[#1A4A16]">
                {orderProcess.map((line, index) => (
                  <li key={line}><span className="font-semibold">{index + 1}.</span> {line}</li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-[#6A5A4E]">This block is copied into the WhatsApp message with the unpaid sheet.</p>
            </div>
          </article>

          <aside className="mt-6 rounded-[28px] bg-[#1A4A16] px-5 py-5 text-white sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F15C00]">Where sheet updates show</p>
            <h2 className="display mt-2 text-3xl">Sheet update</h2>
            <p className="mt-2 text-sm leading-6 text-white/80">Daily bowl changes are not edited on this plan sheet after you send it. They show on the Sheet update page, then go to WhatsApp as a daily kitchen sheet before {DAILY_CUTOFF}.</p>
            <Link className="btn btn-accent mt-4" href={SHEET_UPDATE_PATH}>Open sheet update</Link>
          </aside>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
            {activeBowl ? <BowlStage key={`${styleId}-${activeBowl.id}-${activeDate}`} styleId={styleId} protein={activeBowl.protein} name={`${dayBits(activeDate || dates[0]).label} · ${activeBowl.name}`} /> : null}
            <div>
              <p className="text-sm font-semibold text-[#1A4A16]">Change {activeDate ? dayBits(activeDate).label : "a day"}</p>
              <p className="mt-1 text-sm text-[#6A5A4E]">This updates that row on the sheet and in the WhatsApp message. A later daily chat before {DAILY_CUTOFF} can still replace it.</p>
              {mix === "mixed" ? (
                <div className="mt-3 flex gap-2">
                  {([["veg", "Vegetarian"], ["non_veg", "Non-veg"]] as const).map(([id, label]) => (
                    <button key={id} type="button" className={`chip ${diet === id ? "chip-on" : ""}`} onClick={() => setDiet(id)}>{label}</button>
                  ))}
                </div>
              ) : null}
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {menu.map((item) => {
                  const on = item.id === activePick?.bowlId;
                  return (
                    <li key={item.id}>
                      <button type="button" className={`flex w-full items-center gap-3 rounded-[22px] p-3 text-left ${on ? "bg-[#1A4A16] text-white" : "bg-white text-[#1A4A16]"}`} onClick={() => setDayBowl(item.id)}>
                        <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover" />
                        <span className="block font-semibold leading-5">{item.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <label className="mt-5 block text-sm font-semibold text-[#1A4A16]">Kitchen note
                <input className="field mt-1" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Gate code, no coriander, leave with guard" />
              </label>
            </div>
          </div>

          {askSend ? (
            <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 rounded-[28px] bg-white p-4 text-[#1A4A16] shadow-[0_16px_40px_rgba(26,74,22,0.18)] md:bottom-6">
              <p className="text-sm font-semibold">Check this before WhatsApp opens</p>
              <label className="mt-3 block text-sm font-semibold">Name
                <input className="field mt-1" value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label className="mt-3 block text-sm font-semibold">Address
                <input className="field mt-1" value={address} onChange={(event) => setAddress(event.target.value)} />
              </label>
              <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">WhatsApp gets the named order sheet. The Subscription Order Tracker gets an unpaid row. {mixLabel(mix)} {length.label} at {formatInr(totalPaise)} after discount.</p>
              {sendOutside ? <p className="mt-2 text-sm text-[#7a3410]">This address is marked farther than 7 km from Madhapur. This sends your name and address so we can reply.</p> : null}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button className="btn btn-accent flex-1" type="button" disabled={sheetBusy || !href || confirmPerson.name.length < 2 || confirmPerson.address.length < 4} onClick={send}>{sheetBusy ? "Saving the kitchen sheet…" : "Place order on WhatsApp"}</button>
                <button className="btn btn-line" type="button" onClick={copySheet}>{copied ? "Sheet copied" : "Copy sheet"}</button>
              </div>
              <button type="button" className="mt-3 text-sm font-semibold text-[#1A4A16]" onClick={() => setAskSend(false)}>Back to the sheet</button>
            </div>
          ) : (
            <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-full bg-[#1A4A16] px-4 py-2 text-white md:bottom-6">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/70">{length.days} days · {mixLabel(mix)} · {formatInr(totalPaise)}</p>
                <p className="text-sm">{readyDays ? "Name and address are checked next" : "Put a bowl on every day"}</p>
              </div>
              <button type="button" className="btn btn-accent" disabled={!readyDays} onClick={() => setAskSend(true)}>Place the order</button>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
