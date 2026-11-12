"use client";

import { useEffect, useState } from "react";
import { readPerson, SERVED_PIN, writePerson, type MenuLine } from "@/components/draft";
import { isServedArea } from "@/lib/area";
import { formatInr } from "@/lib/format";
import { isWithinServedRadius, mapsUrl } from "@/lib/geo";
import { newOrderId, queueSingleOrder } from "@/lib/kitchen-sheet";
import { menuOrderText, outsideAreaText, whatsappHref } from "@/lib/order-message";
import { dayBits, kitchenPickDate, lunchSlots, slotPretty } from "@/lib/power-bowls";

export function SingleCheckout({
  lines,
  whatsapp,
  onClose,
  showItems = true,
}: {
  lines: MenuLine[];
  whatsapp: string;
  onClose?: () => void;
  showItems?: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState("");
  const [inArea, setInArea] = useState<boolean | null>(null);
  const [slot, setSlot] = useState<(typeof lunchSlots)[number]>(lunchSlots[0]);
  const [mapUrl, setMapUrl] = useState("");
  const [place, setPlace] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [orderId] = useState(() => newOrderId());
  const startDate = kitchenPickDate().date;
  const when = dayBits(startDate);

  useEffect(() => {
    const person = readPerson();
    setName(person.name);
    setPhone((person.phone || "").replace(/\D/g, "").slice(0, 10));
    setAddress(person.address);
    setPin(person.pin);
    setInArea(person.pin ? isServedArea(person.pin) : null);
  }, [lines]);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  const mobile = phone.replace(/\D/g, "").slice(0, 10);
  const person = { name: name.trim(), address: address.trim(), pin: inArea ? SERVED_PIN : pin.trim(), phone: mobile };
  const ready = person.name.length >= 2 && mobile.length === 10 && person.address.length >= 4 && inArea !== null && (inArea || person.pin.length >= 3);
  const outside = inArea === false;
  const extras = { orderId, date: startDate, slot, mapUrl: mapUrl || undefined };
  const href = ready ? whatsappHref(whatsapp, outside ? outsideAreaText(person) : menuOrderText({ ...person, lines, ...extras })) : "";

  function remember(next: Partial<typeof person> = {}) {
    writePerson({ ...person, ...next });
  }

  function askForMissing() {
    if (person.name.length < 2) {
      setNotice("Add your name.");
      document.getElementById("single-name")?.focus();
      return;
    }
    if (mobile.length !== 10) {
      setNotice("Add your 10-digit mobile so you can track this order.");
      document.getElementById("single-phone")?.focus();
      return;
    }
    if (person.address.length < 4) {
      setNotice("Add the delivery address, or use current location.");
      document.getElementById("single-address")?.focus();
      return;
    }
    setNotice("Tap whether this address is within 7 km of Madhapur.");
  }

  function locate() {
    if (!navigator.geolocation) {
      setNotice("This phone cannot share a map location. Type the address.");
      return;
    }
    setGeoBusy(true);
    setNotice("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
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
        setNotice("Allow location once, or type the delivery address.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
    );
  }

  function placeOrder() {
    remember();
    queueSingleOrder({
      name: person.name,
      phone: mobile,
      address: person.address,
      items: lines,
      note: outside ? "Outside 7 km — reply first" : "",
      orderId,
      startDate,
      slot,
      mapUrl: mapUrl || undefined,
    });
  }

  const sendControl = href ? (
    <a className="btn btn-accent min-h-12 w-full" href={href} target="_blank" rel="noreferrer" onClick={placeOrder}>{outside ? "Send location on WhatsApp" : "Place order on WhatsApp"}</a>
  ) : (
    <button type="button" className="btn btn-accent min-h-12 w-full" onClick={askForMissing}>Place order on WhatsApp</button>
  );

  const form = (
    <>
      <div className={onClose ? "min-h-0 flex-1 overflow-y-auto pr-0.5" : ""}>
        <p className="text-sm font-semibold text-[#1A4A16]">Place this order</p>
        <p className="mt-1 text-xs text-[#6A5A4E]">Order {orderId} · lunch {when.label}</p>
        {showItems ? (
          <ul className="mt-3 space-y-2 rounded-2xl bg-[#F6F2EC] p-3 text-sm text-[#1A4A16]">
            {lines.map((line) => (
              <li key={line.slug} className="flex justify-between gap-3">
                <span>{line.quantity} × {line.name}</span>
                <span className="shrink-0 font-semibold">{formatInr(line.pricePaise * line.quantity)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 border-t border-[#EAE4DD] pt-2 font-semibold">
              <span>{count} {count === 1 ? "item" : "items"}</span>
              <span>{formatInr(total)}</span>
            </li>
          </ul>
        ) : null}
        <p className="mt-3 text-sm font-semibold text-[#1A4A16]">Lunch slot</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {lunchSlots.map((item) => (
            <button key={item} type="button" className={`chip min-h-11 ${slot === item ? "chip-on" : ""}`} onClick={() => setSlot(item)}>{slotPretty(item)}</button>
          ))}
        </div>
        <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Name
          <input id="single-name" className="field mt-1 min-h-12" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setNotice(""); }} />
        </label>
        <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Mobile
          <input id="single-phone" className="field mt-1 min-h-12" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} value={phone} placeholder="10-digit mobile" onChange={(event) => { setPhone(event.target.value.replace(/\D/g, "").slice(0, 10)); setNotice(""); }} />
        </label>
        <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Address
          <input id="single-address" className="field mt-1 min-h-12" autoComplete="street-address" value={address} onChange={(event) => { setAddress(event.target.value); setNotice(""); }} placeholder="Flat, street, area" />
        </label>
        <button type="button" className="chip mt-3 min-h-11" onClick={locate} disabled={geoBusy}>{geoBusy ? "Finding you…" : "Use current location"}</button>
        {place ? <p className="mt-2 text-xs leading-5 text-[#6A5A4E]">{place}{inArea === true ? " · within 7 km of Madhapur" : inArea === false ? " · farther than 7 km" : ""}</p> : null}
        <p className="mt-3 text-sm font-semibold text-[#1A4A16]">Where should we deliver?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={`chip min-h-11 ${inArea === true ? "chip-on" : ""}`} onClick={() => { setInArea(true); setNotice(""); remember({ pin: SERVED_PIN }); }}>Within 7 km of Madhapur</button>
          <button type="button" className={`chip min-h-11 ${inArea === false ? "chip-on" : ""}`} onClick={() => { setInArea(false); setNotice(""); }}>Farther than 7 km</button>
        </div>
        {inArea === false ? (
          <label className="mt-3 block text-sm font-semibold text-[#1A4A16]">Your area
            <input className="field mt-1 min-h-12" value={pin} onChange={(event) => { setPin(event.target.value); setNotice(""); }} placeholder="Neighbourhood or landmark" />
          </label>
        ) : null}
        <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">Delivery charges vary by location and are not included in {formatInr(total)}.</p>
        {outside ? <p className="mt-2 text-sm text-[#7a3410]">This is farther than 7 km from Madhapur. We still send your details so the kitchen can reply.</p> : null}
        {notice ? <p className="mt-3 text-sm text-[#7a3410]" role="alert">{notice}</p> : null}
      </div>
      {onClose ? (
        <div className="mt-3 shrink-0 border-t border-[#EAE4DD] pt-3">
          {sendControl}
          <p className="mt-2 text-center text-xs text-[#6A5A4E]">Opens WhatsApp to AuraBowls with this order. Payment stays pending until you pay the QR.</p>
          <button type="button" className="mt-3 w-full text-sm font-semibold text-[#1A4A16]" onClick={onClose}>Back to the menu</button>
        </div>
      ) : null}
    </>
  );

  if (!onClose) {
    return (
      <div className="mt-6">
        {form}
        <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">Opens WhatsApp to AuraBowls with this order. Payment stays pending until you pay the QR.</p>
        <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-full bg-[#1A4A16] px-4 py-2 text-white shadow-[0_12px_30px_rgba(26,74,22,0.2)] md:bottom-6">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-white/70">{count} {count === 1 ? "item" : "items"} · delivery extra</p>
            <p className="text-lg font-semibold">{formatInr(total)}</p>
          </div>
          {href ? (
            <a className="btn btn-accent min-h-12 shrink-0" href={href} target="_blank" rel="noreferrer" onClick={placeOrder}>{outside ? "Send location" : "Place order"}</a>
          ) : (
            <button type="button" className="btn btn-accent min-h-12 shrink-0" onClick={askForMissing}>Place order</button>
          )}
        </div>
        <div className="h-24" />
      </div>
    );
  }
  return (
    <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex max-h-[88vh] flex-col overflow-hidden rounded-[28px] bg-white p-4 text-[#1A4A16] shadow-[0_16px_40px_rgba(26,74,22,0.18)] md:bottom-6">
      {form}
    </div>
  );
}
