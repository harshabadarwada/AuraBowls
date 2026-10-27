"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readDraft, readMenu, writeMenu, type MenuLine } from "@/components/draft";
import { formatInr } from "@/lib/format";
import { menuOrderText, whatsappHref } from "@/lib/order-message";

export function MenuCart({ whatsapp }: { whatsapp: string }) {
  const [lines, setLines] = useState<MenuLine[]>([]);
  const [hasPlan, setHasPlan] = useState(false);
  useEffect(() => {
    setLines(readMenu());
    setHasPlan((readDraft()?.selections.length || 0) > 0);
  }, []);

  function update(slug: string, quantity: number) {
    const next = lines.map((line) => line.slug === slug ? { ...line, quantity } : line).filter((line) => line.quantity > 0);
    writeMenu(next);
    setLines(next);
  }

  const total = lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  const href = lines.length > 0 ? whatsappHref(whatsapp, menuOrderText(lines)) : "";

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">AuraBowls</p>
      <h1 className="display mt-2 text-4xl text-[#1A4A16]">Your order</h1>
      <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">Send this from your WhatsApp. We reply on the same chat with the payment QR. The order is confirmed after that payment.</p>
      {lines.length === 0 ? (
        <p className="store-card mt-6 p-6 text-sm text-[#6A5A4E]">The basket is empty. <Link className="font-semibold text-[#1A4A16]" href="/menu">See the menu</Link></p>
      ) : (
        <ul className="mt-6 overflow-hidden rounded-[20px] border border-[#EAE4DD] bg-white">
          {lines.map((line) => (
            <li key={line.slug} className="flex items-center gap-3 border-b border-[#EAE4DD] p-4 last:border-b-0">
              <div className="min-w-0 flex-1">
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
          <p className="mt-1 text-xs text-[#6A5A4E]">Delivery is confirmed in the chat. This total is the menu price of the items above.</p>
          {href ? (
            <a className="btn btn-accent mt-4 w-full" href={href} target="_blank" rel="noreferrer">Send on WhatsApp</a>
          ) : (
            <p className="mt-4 rounded-2xl bg-[#fff1e8] px-3 py-2 text-sm text-[#7a3410]">Add the kitchen WhatsApp number in NEXT_PUBLIC_ORDER_WHATSAPP, then redeploy. The order stays in this basket.</p>
          )}
        </div>
      ) : null}
      {hasPlan ? <p className="mt-6 text-sm text-[#6A5A4E]">A meal plan is also saved on this device. <Link className="font-semibold text-[#1A4A16]" href="/checkout">Continue that plan</Link></p> : null}
    </div>
  );
}
