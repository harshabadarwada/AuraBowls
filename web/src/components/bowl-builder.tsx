"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { readPerson, SERVED_PIN, writePerson } from "@/components/draft";
import {
  allowed,
  bases,
  extras,
  MAX_BOWLS,
  MAX_PORTIONS,
  MAX_VEGGIES,
  missingStep,
  PORTION_PAISE,
  priceCustomBowl,
  proteins,
  sauces,
  veggies,
  BASE_BOWL_PAISE,
  type Choice,
  type CustomBowl,
  type Diet,
} from "@/lib/custom-bowl";
import { formatInr } from "@/lib/format";
import { customBowlText, deliveryChargeNote, outsideAreaText, whatsappHref } from "@/lib/order-message";

const steps = [
  { id: "diet", label: "Veg or non-veg" },
  { id: "base", label: "Base" },
  { id: "protein", label: "Protein" },
  { id: "veggies", label: "Veggies" },
  { id: "sauce", label: "Sauce" },
  { id: "extras", label: "Extras" },
  { id: "details", label: "Your details" },
] as const;

type StepId = (typeof steps)[number]["id"];

const start: CustomBowl = { diet: "veg", base: "", protein: "", portions: 1, veggies: [], sauce: "", extras: [], quantity: 1 };

export function BowlBuilder({ whatsapp }: { whatsapp: string }) {
  const [bowl, setBowl] = useState<CustomBowl>(start);
  const [step, setStep] = useState(0);
  const [person, setPerson] = useState({ name: "", address: "", pin: "" });
  const [notice, setNotice] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const priced = priceCustomBowl(bowl);
  const current = steps[step].id;
  const pinChecked = /^\d{6}$/.test(person.pin.trim());
  const outside = pinChecked && person.pin.trim() !== SERVED_PIN;

  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const shownStep = useRef(step);

  useEffect(() => setPerson(readPerson()), []);

  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chip = stepsRef.current?.children[step] as HTMLElement | undefined;
    chip?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "center" });
    const top = sectionRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 80 || top > window.innerHeight * 0.5) stepsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [step]);

  const update = (patch: Partial<CustomBowl>) => {
    setNotice("");
    setBowl((value) => ({ ...value, ...patch }));
  };

  const chooseDiet = (diet: Diet) => {
    setBowl((value) => {
      const protein = proteins.find((item) => item.id === value.protein);
      return {
        ...value,
        diet,
        protein: protein && allowed(protein, diet) ? value.protein : "",
        extras: value.extras.filter((id) => {
          const extra = extras.find((item) => item.id === id);
          return extra ? allowed(extra, diet) : false;
        }),
      };
    });
    setStep(1);
  };

  const toggle = (key: "veggies" | "extras", id: string, limit?: number) => {
    const list = bowl[key];
    if (list.includes(id)) return update({ [key]: list.filter((item) => item !== id) });
    if (limit && list.length >= limit) return setNotice(`Pick up to ${limit}. Remove one to swap.`);
    update({ [key]: [...list, id] });
  };

  const goTo = (id: StepId) => setStep(steps.findIndex((item) => item.id === id));

  const send = () => {
    const missing = missingStep(bowl);
    if (missing) {
      setNotice(`Choose a ${missing} first.`);
      goTo(missing as StepId);
      return;
    }
    const fields = [
      [person.name.trim(), nameRef, "Add your name."],
      [person.address.trim(), addressRef, "Add your delivery address."],
      [pinChecked ? "ok" : "", pinRef, "Add a 6-digit PIN code."],
    ] as const;
    const empty = fields.find(([value]) => !value);
    if (empty) {
      goTo("details");
      setNotice(empty[2]);
      setTimeout(() => empty[1].current?.focus(), 50);
      return;
    }
    writePerson(person);
    const text = outside ? outsideAreaText(person) : customBowlText({ ...person, bowl });
    const href = whatsappHref(whatsapp, text);
    if (href) window.open(href, "_blank", "noopener");
  };

  const last = step === steps.length - 1;
  const next = () => (last ? send() : setStep((value) => Math.min(steps.length - 1, value + 1)));

  return (
    <div className="grid gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_22rem] lg:pb-0">
      <div className="min-w-0">
        <ol ref={stepsRef} className="-mx-5 flex scroll-mt-24 snap-x scroll-px-5 gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0" aria-label="Steps">
          {steps.map((item, index) => (
            <li key={item.id} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => setStep(index)}
                aria-current={index === step ? "step" : undefined}
                className={`flex min-h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition motion-reduce:transition-none ${
                  index === step ? "bg-[#1A4A16] text-white" : index < step ? "bg-[#EAF6DC] text-[#1A4A16]" : "bg-white text-[#6A5A4E] ring-1 ring-[#EAE4DD]"
                }`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${index === step ? "bg-white/20" : index < step ? "bg-[#1A4A16] text-white" : "bg-[#F6F2EC]"}`}>
                  {index < step ? "✓" : index + 1}
                </span>
                {item.label}
              </button>
            </li>
          ))}
        </ol>

        <section ref={sectionRef} className="mt-5 rounded-[28px] bg-white p-5 shadow-[0_18px_40px_rgba(26,74,22,0.06)] ring-1 ring-[#EAE4DD]/70 sm:p-7" aria-live="polite">
          {current === "diet" ? (
            <Step title="Veg or non-veg?" hint="This decides which proteins and extras you see.">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {([
                  ["veg", "Vegetarian", "Paneer, tofu, soya chunks or chickpeas", "/cutouts/paneer-power-bowl.webp", "#2E7D32"],
                  ["non_veg", "Non-veg", "Grilled chicken, crispy chicken or boiled eggs", "/cutouts/fiery-peri-chicken-bowl.webp", "#A0391E"],
                ] as const).map(([id, title, copy, image, color]) => {
                  const on = bowl.diet === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => chooseDiet(id)}
                      aria-pressed={on}
                      className={`group relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_50%_30%,#FFFFFF,#F6F2EC_70%)] p-3 text-left sm:p-5 transition motion-reduce:transition-none ${on ? "ring-2 ring-[#1A4A16]" : "ring-1 ring-[#EAE4DD] hover:ring-[#1A4A16]/40"}`}
                    >
                      <img src={image} alt="" className="mx-auto h-20 w-auto object-contain drop-shadow-[0_16px_18px_rgba(34,37,31,0.2)] transition duration-500 group-hover:-translate-y-1 motion-reduce:transition-none sm:h-40" />
                      <span className="mt-3 flex items-center gap-2 sm:mt-4">
                        <span className="grid h-4 w-4 place-items-center rounded-[3px] border-[1.5px]" style={{ borderColor: color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                        </span>
                        <span className="display text-xl text-[#1A4A16] sm:text-2xl">{title}</span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#6A5A4E] sm:text-sm">{copy}</span>
                    </button>
                  );
                })}
              </div>
            </Step>
          ) : null}

          {current === "base" ? (
            <Step title="Pick a base" hint="Included in the ₹120 bowl.">
              <Options items={bases} isOn={(id) => bowl.base === id} onPick={(id) => update({ base: id })} tag="Included" />
            </Step>
          ) : null}

          {current === "protein" ? (
            <Step title="Pick your protein" hint={`Priced by portion: ${formatInr(PORTION_PAISE)} each, up to ${MAX_PORTIONS}.`}>
              <Options items={proteins.filter((item) => allowed(item, bowl.diet))} isOn={(id) => bowl.protein === id} onPick={(id) => update({ protein: id })} tag={`${formatInr(PORTION_PAISE)} per portion`} />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#6A5A4E]">Portions</p>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:max-w-md">
                {Array.from({ length: MAX_PORTIONS }, (_, index) => index + 1).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => update({ portions: count })}
                    aria-pressed={bowl.portions === count}
                    className={`rounded-2xl px-3 py-3 text-center transition motion-reduce:transition-none ${bowl.portions === count ? "bg-[#1A4A16] text-white" : "bg-[#F6F2EC] text-[#1A4A16] hover:bg-[#EAF6DC]"}`}
                  >
                    <span className="block text-sm font-semibold">{count} portion{count > 1 ? "s" : ""}</span>
                    <span className={`block text-xs ${bowl.portions === count ? "text-white/80" : "text-[#F15C00]"}`}>+ {formatInr(count * PORTION_PAISE)}</span>
                  </button>
                ))}
              </div>
            </Step>
          ) : null}

          {current === "veggies" ? (
            <Step title="Add veggies" hint={`Included. Pick up to ${MAX_VEGGIES} (${bowl.veggies.length} of ${MAX_VEGGIES}).`}>
              <Options items={veggies} isOn={(id) => bowl.veggies.includes(id)} onPick={(id) => toggle("veggies", id, MAX_VEGGIES)} tag="Included" multi />
            </Step>
          ) : null}

          {current === "sauce" ? (
            <Step title="Choose a sauce" hint="One sauce is included. Add more in extras.">
              <Options items={sauces} isOn={(id) => bowl.sauce === id} onPick={(id) => update({ sauce: id })} tag="Included" />
            </Step>
          ) : null}

          {current === "extras" ? (
            <Step title="Any extras?" hint="Optional. Each one adds to the bowl price.">
              <Options items={extras.filter((item) => allowed(item, bowl.diet))} isOn={(id) => bowl.extras.includes(id)} onPick={(id) => toggle("extras", id)} multi />
            </Step>
          ) : null}

          {current === "details" ? (
            <Step title="Where should we deliver?" hint={`We deliver to PIN ${SERVED_PIN}. Your details go into the WhatsApp message.`}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#1A4A16]">
                  Name
                  <input ref={nameRef} className="field mt-1.5" value={person.name} autoComplete="name" onChange={(event) => setPerson({ ...person, name: event.target.value })} />
                </label>
                <label className="block text-sm font-semibold text-[#1A4A16]">
                  PIN code
                  <input ref={pinRef} className="field mt-1.5" value={person.pin} inputMode="numeric" maxLength={6} autoComplete="postal-code" onChange={(event) => setPerson({ ...person, pin: event.target.value.replace(/\D/g, "") })} />
                </label>
                <label className="block text-sm font-semibold text-[#1A4A16] sm:col-span-2">
                  Delivery address
                  <textarea ref={addressRef} className="field mt-1.5 min-h-24" value={person.address} autoComplete="street-address" onChange={(event) => setPerson({ ...person, address: event.target.value })} />
                </label>
              </div>
              {outside ? (
                <p className="mt-4 rounded-2xl bg-[#FFF1E8] p-4 text-sm leading-6 text-[#8A3A00]">
                  We only deliver to PIN {SERVED_PIN} right now. Send us a message with your name and location and we will reply if we can reach you.
                </p>
              ) : null}
            </Step>
          ) : null}

          {notice ? <p className="mt-4 text-sm font-semibold text-[#B44100]" role="alert">{notice}</p> : null}

          <div className="mt-7 hidden items-center justify-between gap-3 lg:flex">
            <button type="button" className="btn btn-line" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>Back</button>
            <button type="button" className="btn btn-accent" onClick={next}>
              {last ? (outside ? "Ask on WhatsApp" : "Send order on WhatsApp") : `Next: ${steps[step + 1].label}`}
            </button>
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-[28px] bg-[#10291D] p-6 text-white shadow-[0_24px_48px_rgba(16,41,29,0.22)] lg:sticky lg:top-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F15C00]">Your bowl</p>
        <h2 className="display mt-1 text-3xl">{bowl.diet === "veg" ? "Vegetarian" : "Non-veg"} custom bowl</h2>
        <ul className="mt-5 space-y-2.5 text-sm">
          <Row label="Base bowl" detail={bases.find((item) => item.id === bowl.base)?.name || "Pick a base"} price={BASE_BOWL_PAISE} onEdit={() => goTo("base")} />
          <Row
            label="Protein"
            detail={priced.protein && allowed(priced.protein, bowl.diet) ? `${priced.protein.name} × ${priced.portions}` : "Pick a protein"}
            price={priced.proteinPaise}
            onEdit={() => goTo("protein")}
          />
          <Row label="Veggies" detail={bowl.veggies.map((id) => veggies.find((item) => item.id === id)?.name).join(", ") || "None yet"} onEdit={() => goTo("veggies")} />
          <Row label="Sauce" detail={sauces.find((item) => item.id === bowl.sauce)?.name || "Pick a sauce"} onEdit={() => goTo("sauce")} />
          {priced.extras.map((item) => (
            <Row key={item.id} label="Extra" detail={item.name} price={item.pricePaise} onEdit={() => goTo("extras")} />
          ))}
        </ul>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm text-white/75">Bowls</span>
          <span className="flex items-center gap-2">
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-lg" aria-label="Fewer bowls" onClick={() => update({ quantity: Math.max(1, bowl.quantity - 1) })}>−</button>
            <span className="w-6 text-center font-semibold">{priced.quantity}</span>
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-[#F15C00] text-lg" aria-label="More bowls" onClick={() => update({ quantity: Math.min(MAX_BOWLS, bowl.quantity + 1) })}>+</button>
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <span className="text-sm text-white/75">{formatInr(priced.bowlPaise)} per bowl</span>
          <span className="text-3xl font-semibold">{formatInr(priced.totalPaise)}</span>
        </div>
        <p className="mt-3 text-xs leading-5 text-white/60">{deliveryChargeNote} You pay after the kitchen sends the QR on WhatsApp.</p>
      </aside>

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-[#EAE4DD] bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(34,37,31,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {step > 0 ? (
            <button type="button" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F6F2EC] text-[#1A4A16]" aria-label="Back" onClick={() => setStep((value) => value - 1)}>←</button>
          ) : null}
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-[#6A5A4E]">{priced.quantity} × {formatInr(priced.bowlPaise)}</span>
            <span className="block text-lg font-semibold text-[#1A4A16]">{formatInr(priced.totalPaise)}</span>
          </span>
          <button type="button" className="btn btn-accent shrink-0" onClick={next}>
            {last ? (outside ? "Ask on WhatsApp" : "Send on WhatsApp") : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="display text-3xl text-[#1A4A16] sm:text-4xl">{title}</h2>
      <p className="mt-1 text-sm text-[#6A5A4E]">{hint}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Options({ items, isOn, onPick, tag, multi = false }: { items: Choice[]; isOn: (id: string) => boolean; onPick: (id: string) => void; tag?: string; multi?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const on = isOn(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item.id)}
            aria-pressed={on}
            className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition motion-reduce:transition-none ${
              on ? "bg-[#1A4A16] text-white shadow-[0_12px_24px_rgba(26,74,22,0.2)]" : "bg-[#F6F2EC] text-[#1A4A16] hover:bg-[#EAF6DC]"
            }`}
          >
            <span className="min-w-0">
              <span className="block font-semibold">{item.name}</span>
              <span className={`block text-xs ${on ? "text-white/75" : item.pricePaise ? "text-[#F15C00]" : "text-[#6A5A4E]"}`}>
                {item.pricePaise ? `+ ${formatInr(item.pricePaise)}` : tag || "Choose"}
              </span>
            </span>
            <span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center ${multi ? "rounded-md" : "rounded-full"} text-xs ${on ? "bg-[#F15C00] text-white" : "bg-white ring-1 ring-[#EAE4DD]"}`}>
              {on ? "✓" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Row({ label, detail, price, onEdit }: { label: string; detail: string; price?: number; onEdit: () => void }) {
  return (
    <li className="flex items-start justify-between gap-3">
      <button type="button" onClick={onEdit} className="min-w-0 text-left">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-white/55">{label}</span>
        <span className="block text-white/90 underline-offset-4 hover:underline">{detail}</span>
      </button>
      {price !== undefined ? <span className="shrink-0 font-semibold">{price === 0 ? "—" : formatInr(price)}</span> : <span className="shrink-0 text-xs text-white/55">Included</span>}
    </li>
  );
}
