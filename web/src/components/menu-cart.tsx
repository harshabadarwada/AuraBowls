"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readDraft, readMenu, readPerson, SERVED_PIN, writeMenu, writePerson, type MenuLine } from "@/components/draft";
import { formatInr } from "@/lib/format";
import { menuOrderText, whatsappHref } from "@/lib/order-message";

export function MenuCart({ whatsapp }: { whatsapp: string }) {
  const [lines, setLines] = useState<MenuLine[]>([]);
  const [hasPlan, setHasPlan] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState("");
  useEffect(() => {
    setLines(readMenu());
    setHasPlan((readDraft()?.selections.length || 0) > 0);
    const person = readPerson();
    setName(person.name);
    setAddress(person.address);
    setPin(person.pin);
  }, []);

  function update(slug: string, quantity: number) {
    const next = lines.map((line) => line.slug === slug ? { ...line, quantity } : line).filter((line) => line.quantity > 0);
    writeMenu(next);
    setLines(next);
  }

  const [notice, setNotice] = useState("");
  const total = lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  const person = { name: name.trim(), address: address.trim(), pin: pin.trim() };
  const ready = person.name.length >= 2 && person.address.length >= 4 && person.pin.length >= 6;
  const href = ready ? whatsappHref(whatsapp, menuOrderText({ ...person, lines })) : "";
  const outside = person.pin.length >= 6 && person.pin !== SERVED_PIN;
  function askForMissing() {
    if (person.name.length < 2) {
      setNotice("Add your name. Then Place order opens WhatsApp.");
      document.getElementById("order-name")?.focus();
      return;
    }
    if (person.address.length < 4) {
      setNotice("Add the address. Then Place order opens WhatsApp.");
      document.getElementById("order-address")?.focus();
      return;
    }
    setNotice("Enter the 6-digit PIN. 500081 continues the order. Any other PIN sends your location.");
    document.getElementById("order-pin")?.focus();
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">AuraBowls</p>
      <h1 className="display mt-2 text-4xl text-[#1A4A16]">Your order</h1>
      <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">We deliver in PIN 500081. Your name and address are written into the WhatsApp message before it opens.</p>
      <label className="mt-5 block text-sm font-semibold text-[#1A4A16]">Name
        <input id="order-name" className="field mt-1" value={name} onChange={(event) => { setName(event.target.value); setNotice(""); writePerson({ name: event.target.value, address, pin }); }} />
      </label>
      <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Address
        <input id="order-address" className="field mt-1" value={address} onChange={(event) => { setAddress(event.target.value); setNotice(""); writePerson({ name, address: event.target.value, pin }); }} placeholder="Flat, street, area" />
      </label>
      <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">PIN
        <input id="order-pin" className="field mt-1" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => { const next = event.target.value.replace(/\D/g, "").slice(0, 6); setPin(next); setNotice(""); writePerson({ name, address, pin: next }); }} placeholder="500081" />
      </label>
      {notice ? <p className="mt-3 text-sm text-[#7a3410]" role="alert">{notice}</p> : null}
      {lines.length === 0 ? (
        <p className="store-card mt-6 p-6 text-sm text-[#6A5A4E]">The basket is empty. <Link className="font-semibold text-[#1A4A16]" href="/menu">See the menu</Link></p>
      ) : (
        <ul className="mt-6 overflow-hidden rounded-[20px] border border-[#EAE4DD] bg-white">
          {lines.map((line) => (
            <li key={line.slug} className="flex flex-wrap items-center gap-3 border-b border-[#EAE4DD] p-4 last:border-b-0">
              <div className="min-w-0 flex-1 basis-36">
                <p className="font-semibold text-[#1A4A16]">{line.name}</p>
                <p className="text-xs capitalize text-[#6A5A4E]">{line.mealType}</p>
              </div>
              <span className="flex items-center gap-2">
                <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF6DC]" aria-label={`Fewer ${line.name}`} onClick={() => update(line.slug, line.quantity - 1)}>−</button>
                <span className="w-4 text-center text-sm font-semibold">{line.quantity}</span>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-[#F15C00] text-white" aria-label={`More ${line.name}`} onClick={() => update(line.slug, Math.min(6, line.quantity + 1))}>+</button>
              </span>
              <p className="w-20 text-right text-sm font-semibold text-[#F15C00]">{formatInr(line.pricePaise * line.quantity)}</p>
            </li>
          ))}
        </ul>
      )}
      {lines.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm text-[#6A5A4E]">Menu total</p>
          <p className="display text-4xl text-[#1A4A16]">{formatInr(total)}</p>
          <p className="mt-1 text-xs text-[#6A5A4E]">Delivery charges vary by location and are not included in this total. The kitchen confirms the charge.</p>
          {outside && ready ? <p className="mt-2 text-sm text-[#6A5A4E]">This PIN is outside 500081. The message tells us where you are so we can reply.</p> : null}
        </div>
      ) : null}
      {lines.length > 0 ? (
        <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-full bg-[#1A4A16] px-4 py-2 text-white shadow-[0_12px_30px_rgba(26,74,22,0.2)] md:bottom-6">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-white/70">{lines.length} {lines.length === 1 ? "item" : "items"} · delivery extra</p>
            <p className="text-lg font-semibold">{formatInr(total)}</p>
          </div>
          {href ? (
            <a className="btn btn-accent" href={href} target="_blank" rel="noreferrer">{outside ? "Send location" : "Place order"}</a>
          ) : (
            <button type="button" className="btn btn-accent" onClick={askForMissing}>Place order</button>
          )}
        </div>
      ) : null}
      {hasPlan ? <p className="mt-6 text-sm text-[#6A5A4E]">A meal plan is also saved on this device. <Link className="font-semibold text-[#1A4A16]" href="/checkout">Continue that plan</Link></p> : null}
      {lines.length > 0 ? <div className="h-24" /> : null}
    </div>
  );
}
