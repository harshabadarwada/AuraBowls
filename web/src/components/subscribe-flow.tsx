"use client";

import { useEffect, useMemo, useState } from "react";
import { readPerson, SERVED_PIN, writePerson } from "@/components/draft";
import { isServedArea } from "@/lib/area";
import { formatInrCompact } from "@/lib/format";
import { isWithinServedRadius, mapsUrl, type MapPoint } from "@/lib/geo";
import { newOrderId, queueKitchenSheet, trackerMealType } from "@/lib/kitchen-sheet";
import { outsideAreaText, whatsappHref } from "@/lib/order-message";
import {
  bowlStyles,
  bowlsFor,
  dayBits,
  fillPicks,
  findBowl,
  kitchenPickDate,
  lunchPaise,
  lunchSlots,
  mealSchedule,
  mixLabel,
  planBowls,
  planDates,
  planDeltaPaise,
  planLengths,
  planMixes,
  planPricePaise,
  rotatePicks,
  subscriptionSheet,
  weekGroups,
  writeSavedPlan,
  type DayPick,
  type LengthId,
  type MixId,
  type SavedPlan,
  type StyleId,
} from "@/lib/power-bowls";

const steps = ["plan", "meals", "checkout"] as const;
type Step = (typeof steps)[number];

export function SubscribeFlow({ whatsapp }: { whatsapp: string }) {
  const [step, setStep] = useState<Step>("plan");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState("");
  const [inArea, setInArea] = useState(true);
  const [lengthId, setLengthId] = useState<LengthId>("5");
  const [mix, setMix] = useState<MixId>("veg");
  const [styleId, setStyleId] = useState<StyleId>("balanced");
  const [diet, setDiet] = useState<"veg" | "non_veg">("veg");
  const [bowlId, setBowlId] = useState("");
  const [startDate, setStartDate] = useState(() => kitchenPickDate().date);
  const [slot, setSlot] = useState<(typeof lunchSlots)[number]>(lunchSlots[0]);
  const [note, setNote] = useState("");
  const [picks, setPicks] = useState<DayPick[]>([]);
  const [pickerDate, setPickerDate] = useState("");
  const [mapPoint, setMapPoint] = useState<MapPoint | null>(null);
  const [mapUrl, setMapUrl] = useState("");
  const [place, setPlace] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderId] = useState(() => newOrderId());

  useEffect(() => {
    const person = readPerson();
    setName(person.name);
    setPhone((person.phone || "").replace(/\D/g, "").slice(0, 10));
    setAddress(person.address);
    setPin(person.pin);
    if (person.pin) setInArea(isServedArea(person.pin));
  }, []);

  useEffect(() => {
    if (!pickerDate) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [pickerDate]);

  const length = planLengths.find((item) => item.id === lengthId) || planLengths[1];
  const style = bowlStyles.find((item) => item.id === styleId) || bowlStyles[0];
  const menuDiet = mix === "non_veg" ? "non_veg" : mix === "veg" ? "veg" : diet;
  const planMenu = useMemo(() => planBowls(styleId, mix), [styleId, mix]);
  const menuIds = useMemo(() => planMenu.map((item) => item.id), [planMenu]);
  const menu = mix === "mixed" ? bowlsFor(styleId, mix, menuDiet) : planMenu;
  const dates = useMemo(() => planDates(startDate, length.days), [startDate, length.days]);
  const weeks = useMemo(() => weekGroups(dates), [dates]);
  const suggested = useMemo(() => rotatePicks(dates, menuIds), [dates, menuIds]);
  const shownPicks = useMemo(() => rotatePicks(dates, menuIds, picks), [dates, menuIds, picks]);
  const totalPaise = planPricePaise(lengthId, mix, styleId);
  const perLunch = lunchPaise(lengthId, mix, styleId);
  const person = { name: name.trim(), address: address.trim(), pin: pin.trim() };
  const identified = person.name.length >= 2 && person.address.length >= 4 && phone.replace(/\D/g, "").length === 10;
  const confirmPerson = { name: person.name, address: person.address, pin: inArea ? SERVED_PIN : person.pin };
  const sendOutside = !inArea;
  const deliveryArea = person.address || place;

  const bowl = findBowl(bowlId) || findBowl(shownPicks[0]?.bowlId || "") || planMenu[0];
  const uniqueBowls = [...new Set(shownPicks.map((pick) => findBowl(pick.bowlId)?.name || bowl?.name).filter(Boolean))];
  const customized = shownPicks.some((pick, index) => pick.bowlId !== suggested[index]?.bowlId);

  const picksKey = shownPicks.map((pick) => `${pick.date}:${pick.bowlId}`).join("|");
  const saved: SavedPlan | null = bowl ? {
    name: confirmPerson.name || person.name,
    phone: phone.replace(/\D/g, "").slice(0, 10),
    address: deliveryArea,
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
    picks: shownPicks,
    totalPaise,
    mapUrl,
    orderId,
  } : null;

  const href = useMemo(() => {
    if (!bowl || !identified) return "";
    const plan: SavedPlan = {
      name: confirmPerson.name,
      phone: phone.replace(/\D/g, "").slice(0, 10),
      address: deliveryArea,
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
      picks: shownPicks,
      totalPaise,
      mapUrl,
      orderId,
    };
    return whatsappHref(whatsapp, sendOutside ? outsideAreaText({ name: plan.name, address: plan.address, pin: plan.pin }) : subscriptionSheet(plan));
  }, [bowl, identified, confirmPerson.name, confirmPerson.pin, phone, deliveryArea, styleId, mix, menuDiet, length, dates, startDate, slot, note, picksKey, totalPaise, mapUrl, whatsapp, sendOutside, orderId]);

  const pickerBowl = findBowl(shownPicks.find((pick) => pick.date === pickerDate)?.bowlId || "") || bowl;
  const stepIndex = steps.indexOf(step);

  function go(next: Step) {
    setError("");
    setPickerDate("");
    setStep(next);
  }

  function chooseMix(next: MixId) {
    setMix(next);
    setDiet(next === "non_veg" ? "non_veg" : "veg");
    setBowlId("");
    setPicks([]);
  }

  function chooseStyle(next: StyleId) {
    setStyleId(next);
    setBowlId("");
    setPicks([]);
  }

  function fillFromMenu() {
    setBowlId("");
    setPicks(rotatePicks(dates, menuIds));
  }

  function setUsualBowl(id: string) {
    setBowlId(id);
    setPicks(fillPicks(dates, id));
  }

  function setDayBowl(id: string, date = pickerDate) {
    if (!date) return;
    setBowlId((current) => current || id);
    setPicks((current) => rotatePicks(dates, menuIds, current).map((pick) => pick.date === date ? { ...pick, bowlId: id } : pick));
    setPickerDate("");
  }

  function openDay(date: string) {
    const item = findBowl(shownPicks.find((pick) => pick.date === date)?.bowlId || "");
    if (item) setDiet(item.diet);
    setPickerDate(date);
  }

  function locate() {
    if (!navigator.geolocation) {
      setError("This phone cannot share a map location. Type the address.");
      return;
    }
    setGeoBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        setMapPoint(point);
        setMapUrl(mapsUrl(point));
        setInArea(isWithinServedRadius(point));
        try {
          const response = await fetch(`/api/geo/reverse?lat=${point.lat}&lng=${point.lng}`);
          const data = (await response.json().catch(() => null)) as { label?: string; mapUrl?: string; inArea?: boolean } | null;
          if (data?.label) {
            setPlace(data.label);
            setAddress((current) => current.trim().length >= 4 ? current : data.label || "");
          }
          if (data?.mapUrl) setMapUrl(data.mapUrl);
          if (typeof data?.inArea === "boolean") setInArea(data.inArea);
        } finally {
          setGeoBusy(false);
        }
      },
      () => {
        setGeoBusy(false);
        setError("Allow location once, or type the delivery address.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
    );
  }

  function goCheckout() {
    locate();
    go("checkout");
  }

  function placeOrder() {
    if (!saved || !bowl || !identified) return;
    writePerson({ name: saved.name, address: saved.address, pin: saved.pin, phone: saved.phone });
    writeSavedPlan(saved);
    queueKitchenSheet({
      name: saved.name,
      phone: saved.phone,
      address: saved.address,
      area: deliveryArea,
      mealType: trackerMealType(saved.mix),
      days: saved.days,
      startDate: saved.startDate,
      totalPaise: saved.totalPaise,
      slot: saved.slot,
      style: style.name,
      defaultBowl: uniqueBowls.length === 1 ? uniqueBowls[0] || bowl.name : "Day-wise rotation",
      schedule: saved.picks.map((pick) => `${dayBits(pick.date).label}: ${findBowl(pick.bowlId)?.name || bowl.name}`).join(" | "),
      note: [saved.note, sendOutside ? "Outside 7 km — reply first" : ""].filter(Boolean).join(" | "),
      mapUrl,
      orderId,
      daysSchedule: mealSchedule(saved.picks, bowl.name),
    });
  }

  return (
    <div className="mx-auto max-w-lg pb-36 sm:max-w-2xl">
      <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Plan steps">
        {["Plan", "Bowls", "Order"].map((label, index) => (
          <li key={label} className="min-w-0">
            <span className={`block h-1.5 rounded-full ${index <= stepIndex ? "bg-[#1A4A16]" : "bg-[#1A4A16]/15"}`} />
            <span className={`mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] ${index <= stepIndex ? "text-[#1A4A16]" : "text-[#6A5A4E]"}`}>{label}</span>
          </li>
        ))}
      </ol>

      {step === "plan" ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F15C00]">Lunch subscriptions</p>
          <h1 className="display mt-2 text-[2.1rem] leading-[1.05] text-[#1A4A16] sm:text-5xl">Pick days, then pick how the bowl is built.</h1>
          <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">Prices already include the plan discount. Style changes the total. Delivery is extra.</p>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {planMixes.map((item) => (
              <button key={item.id} type="button" className={`chip min-h-11 shrink-0 ${mix === item.id ? "chip-on" : ""}`} onClick={() => chooseMix(item.id)}>{item.name}</button>
            ))}
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {planLengths.map((item) => (
              <button key={item.id} type="button" className={`chip min-h-11 shrink-0 ${lengthId === item.id ? "chip-on" : ""}`} onClick={() => setLengthId(item.id)}>{item.days} days</button>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            {bowlStyles.map((item) => {
              const price = planPricePaise(lengthId, mix, item.id);
              const delta = planDeltaPaise(lengthId, mix, item.id);
              const on = styleId === item.id;
              return (
                <button key={item.id} type="button" className={`flex min-h-[5.5rem] items-center justify-between gap-4 rounded-[24px] bg-white px-4 py-4 text-left shadow-[0_12px_28px_rgba(26,74,22,0.06)] ring-2 ${on ? "ring-[#1A4A16]" : "ring-transparent"}`} onClick={() => chooseStyle(item.id)}>
                  <span className="min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F15C00]">{item.hint}</span>
                    <span className="mt-1 block text-lg font-semibold leading-6 text-[#1A4A16]">{item.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#6A5A4E]">{item.copy}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xl font-semibold tabular-nums text-[#1A4A16]">{formatInrCompact(price)}</span>
                    <span className="mt-1 block text-[11px] font-semibold text-[#6A5A4E]">{delta > 0 ? `+${formatInrCompact(delta)}` : "Plan price"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === "meals" && bowl ? (
        <section>
          <button type="button" className="min-h-11 text-sm font-semibold text-[#1A4A16]" onClick={() => go("plan")}>Back</button>
          <h1 className="display mt-2 text-[2.1rem] leading-[1.05] text-[#1A4A16]">Your lunch calendar</h1>
          <p className="mt-2 text-sm leading-6 text-[#6A5A4E]">We filled each day from your {mixLabel(mix)} {style.name} menu, without repeating a bowl until the list starts over. Tap a day to change it. The plan stays {formatInrCompact(totalPaise)}.</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-[#1A4A16]">First lunch
              <input className="field mt-1" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <div>
              <p className="text-xs font-semibold text-[#1A4A16]">Lunch slot</p>
              <div className="mt-1 flex flex-col gap-1">
                {lunchSlots.map((item) => (
                  <button key={item} type="button" className={`chip min-h-11 w-full justify-center ${slot === item ? "chip-on" : ""}`} onClick={() => setSlot(item)}>{item}</button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-[#6A5A4E]">Sunday is closed.</p>
          {customized ? <button type="button" className="btn btn-line mt-4 min-h-12 w-full" onClick={fillFromMenu}>Reset to menu rotation</button> : null}

          <div className="mt-5 space-y-5">
            {weeks.map((week) => (
              <section key={week.title}>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6A5A4E]">{week.title}</h2>
                <ul className="mt-2 grid gap-2">
                  {week.dates.map((date) => {
                    const pick = shownPicks.find((item) => item.date === date);
                    const item = findBowl(pick?.bowlId || "") || bowl;
                    const suggestedId = suggested.find((entry) => entry.date === date)?.bowlId;
                    const changed = Boolean(pick && suggestedId && pick.bowlId !== suggestedId);
                    const bits = dayBits(date);
                    return (
                      <li key={date}>
                        <button type="button" className="flex min-h-[5.5rem] w-full items-center gap-3 rounded-[24px] bg-white p-3 text-left shadow-[0_10px_24px_rgba(26,74,22,0.05)]" onClick={() => openDay(date)}>
                          <img src={item.image} alt="" className="h-16 w-16 shrink-0 rounded-[18px] object-cover" />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F15C00]">{bits.weekday}</span>
                              <span className="text-sm font-semibold text-[#1A4A16]">{bits.label.replace(/^[A-Za-z]{3},?\s/, "")}</span>
                              {changed ? <span className="rounded-full bg-[#FFF3E8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#F15C00]">Changed</span> : null}
                            </span>
                            <span className="mt-1 block truncate text-sm font-semibold leading-5 text-[#1A4A16]">{item.name}</span>
                            <span className="mt-0.5 block text-xs text-[#6A5A4E]">Tap to change this day</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </section>
      ) : null}

      {step === "checkout" ? (
        <section>
          <button type="button" className="min-h-11 text-sm font-semibold text-[#1A4A16]" onClick={() => go("meals")}>Back</button>
          <h1 className="display mt-2 text-[2.1rem] leading-[1.05] text-[#1A4A16]">Place the order</h1>
          <p className="mt-2 text-sm leading-6 text-[#6A5A4E]">Place order opens WhatsApp and sends this address to the kitchen tracker in the same tap.</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 rounded-[22px] bg-white p-4 text-sm">
            <div><dt className="text-[11px] uppercase tracking-[0.12em] text-[#6A5A4E]">Order ID</dt><dd className="mt-1 font-semibold text-[#1A4A16]">{orderId}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.12em] text-[#6A5A4E]">Plan</dt><dd className="mt-1 font-semibold text-[#1A4A16]">{length.days} days · {mixLabel(mix)}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.12em] text-[#6A5A4E]">Style</dt><dd className="mt-1 font-semibold text-[#1A4A16]">{style.name}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.12em] text-[#6A5A4E]">Bowls</dt><dd className="mt-1 font-semibold text-[#1A4A16]">{uniqueBowls.length === 1 ? uniqueBowls[0] : `${uniqueBowls.length} different bowls`}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.12em] text-[#6A5A4E]">Total</dt><dd className="mt-1 font-semibold text-[#1A4A16]">{formatInrCompact(totalPaise)}</dd></div>
          </dl>

          <label className="mt-5 block text-sm font-semibold text-[#1A4A16]">Name
            <input className="field mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" />
          </label>
          <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Phone
            <input className="field mt-1 min-h-12" type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" autoComplete="tel" />
          </label>
          <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Delivery address
            <input className="field mt-1" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Flat, street, landmark" autoComplete="street-address" />
          </label>
          <button type="button" className="btn btn-line mt-3 min-h-12 w-full" onClick={locate} disabled={geoBusy}>
            {geoBusy ? "Finding your location…" : mapPoint ? "Refresh map location" : "Use current location"}
          </button>
          {place ? <p className="mt-2 text-xs leading-5 text-[#6A5A4E]">Map found: {place}</p> : null}
          {mapUrl ? <a className="mt-1 inline-block text-xs font-semibold text-[#1A4A16]" href={mapUrl} target="_blank" rel="noreferrer">Open in Google Maps</a> : null}

          <button
            type="button"
            className={`mt-4 flex min-h-12 w-full items-center justify-between rounded-[18px] px-4 text-left text-sm font-semibold ${inArea ? "bg-[#EAF6DC] text-[#1A4A16]" : "bg-[#FFF3E8] text-[#7a3410]"}`}
            onClick={() => {
              const next = !inArea;
              setInArea(next);
              if (next) setPin(SERVED_PIN);
              setError("");
            }}
          >
            <span>{inArea ? "This pin is within 7 km of Madhapur" : "Farther than 7 km — we will reply first"}</span>
            <span className="text-xs font-semibold uppercase tracking-wide">{inArea ? "Yes" : "No"}</span>
          </button>
          <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Note for the rider
            <input className="field mt-1" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Gate code, no coriander, leave with guard" />
          </label>
          {error ? <p className="mt-3 text-sm text-[#7a3410]" role="alert">{error}</p> : null}
        </section>
      ) : null}

      {pickerDate && bowl ? (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-[#1A4A16]/40" aria-label="Close bowl picker" onClick={() => setPickerDate("")} />
          <div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-[28px] bg-[#FFF8F2] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_40px_rgba(26,74,22,0.18)]">
            <span className="mx-auto block h-1 w-12 rounded-full bg-[#EAE4DD]" />
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F15C00]">{dayBits(pickerDate).weekday}</p>
                <h2 className="display mt-1 text-3xl text-[#1A4A16]">{dayBits(pickerDate).label}</h2>
                <p className="mt-1 text-sm text-[#6A5A4E]">Now: {pickerBowl?.name}</p>
              </div>
              <button type="button" className="chip min-h-11" onClick={() => setPickerDate("")}>Done</button>
            </div>
            {mix === "mixed" ? (
              <div className="mt-4 flex gap-2">
                {([["veg", "Vegetarian"], ["non_veg", "Non-veg"]] as const).map(([id, label]) => (
                  <button key={id} type="button" className={`chip min-h-11 ${diet === id ? "chip-on" : ""}`} onClick={() => setDiet(id)}>{label}</button>
                ))}
              </div>
            ) : null}
            <ul className="mt-4 grid gap-2">
              {menu.map((item) => {
                const on = item.id === pickerBowl?.id;
                return (
                  <li key={item.id}>
                    <button type="button" className={`flex min-h-16 w-full items-center gap-3 rounded-[22px] p-3 text-left ${on ? "bg-[#1A4A16] text-white" : "bg-white text-[#1A4A16]"}`} onClick={() => setDayBowl(item.id, pickerDate)}>
                      <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                      <span className="min-w-0">
                        <span className="block font-semibold leading-5">{item.name}</span>
                        <span className={`mt-1 block text-xs ${on ? "text-white/70" : "text-[#6A5A4E]"}`}>{item.protein} · included</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {pickerBowl ? (
              <button type="button" className="btn btn-line mt-4 min-h-12 w-full" onClick={() => { setUsualBowl(pickerBowl.id); setPickerDate(""); }}>
                Use {pickerBowl.name} every day instead
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-3 bottom-[calc(4.4rem+env(safe-area-inset-bottom))] z-30 rounded-[24px] bg-[#1A4A16] p-3 text-white shadow-[0_16px_40px_rgba(26,74,22,0.28)] md:bottom-6">
        <div className="flex items-end justify-between gap-3 px-1 pb-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-wide text-white/70">{length.days} days · {style.name} · {formatInrCompact(perLunch)} / lunch</p>
            <p className="text-lg font-semibold leading-6">{formatInrCompact(totalPaise)}</p>
          </div>
          <p className="shrink-0 text-xs text-white/70">after discount</p>
        </div>
        {step === "plan" ? <button type="button" className="btn btn-accent min-h-12 w-full" onClick={() => go("meals")}>Choose bowls</button> : null}
        {step === "meals" ? <button type="button" className="btn btn-accent min-h-12 w-full" disabled={!dates[0]} onClick={goCheckout}>Continue to order</button> : null}
        {step === "checkout" ? (
          href ? (
            <a className="btn btn-accent min-h-12 w-full" href={href} target="_blank" rel="noreferrer" onClick={placeOrder}>Place order</a>
          ) : (
            <button type="button" className="btn btn-accent min-h-12 w-full" onClick={() => setError("Enter your name, 10-digit mobile, and address so we can deliver and you can track.")}>Place order</button>
          )
        ) : null}
      </div>
    </div>
  );
}
