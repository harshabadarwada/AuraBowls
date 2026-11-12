"use client";

import { useEffect, useState } from "react";
import { readPerson } from "@/components/draft";
import { localDigits } from "@/lib/phone";

type SheetDay = { date: string; weekday: string; bowl: string; delivered: boolean; status: string };
type SheetOrder = { orderId: string; name: string; plan: string; startDate: string; payment: string; status: string; days: SheetDay[] };

export function PhoneTrack() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<SheetOrder[] | null>(null);

  useEffect(() => {
    const saved = readPerson().phone || "";
    if (saved) setPhone(localDigits(saved));
  }, []);

  async function lookup(event?: { preventDefault(): void }) {
    event?.preventDefault();
    const mobile = localDigits(phone);
    if (mobile.length !== 10) {
      setError("Enter the 10-digit mobile used on the order.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/track-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile }),
      });
      const data = (await response.json().catch(() => null)) as { orders?: SheetOrder[]; message?: string } | null;
      if (!response.ok) {
        setOrders(null);
        setError(data?.message || "Orders could not be loaded.");
        return;
      }
      setOrders(data?.orders || []);
    } catch {
      setOrders(null);
      setError("Orders could not be loaded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F15C00]">Your orders</p>
      <h1 className="display mt-2 text-[2.1rem] leading-[1.05] text-[#1A4A16]">Track with your mobile</h1>
      <p className="mt-3 text-sm leading-6 text-[#6A5A4E]">Enter the number you gave when placing the order. Dates and delivery status come from the kitchen tracker.</p>
      <form className="mt-5" onSubmit={lookup}>
        <label className="block text-sm font-semibold text-[#1A4A16]">Mobile
          <input className="field mt-1 min-h-12" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} value={phone} placeholder="10-digit mobile" onChange={(event) => { setPhone(event.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }} />
        </label>
        <button className="btn btn-accent mt-4 min-h-12 w-full" type="submit" disabled={busy}>{busy ? "Looking up…" : "Show my orders"}</button>
      </form>
      {error ? <p className="mt-3 text-sm text-[#7a3410]" role="alert">{error}</p> : null}
      {orders && orders.length === 0 ? <p className="mt-5 text-sm text-[#6A5A4E]">No orders are on this number yet. Use the same mobile you typed at Place order.</p> : null}
      {orders?.map((order) => (
        <article key={order.orderId} className="store-card mt-5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F15C00]">{order.orderId}</p>
              <h2 className="mt-1 text-lg font-semibold text-[#1A4A16]">{order.plan || "Order"}</h2>
              {order.startDate ? <p className="mt-1 text-sm text-[#6A5A4E]">Starts {order.startDate}</p> : null}
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${order.payment.toLowerCase() === "paid" ? "bg-[#EAF6DC] text-[#1A4A16]" : "bg-[#FFF3E8] text-[#7a3410]"}`}>{order.payment}</span>
          </div>
          {order.days.length === 0 ? <p className="mt-3 text-sm text-[#6A5A4E]">Kitchen status: {order.status}</p> : (
            <ul className="mt-4 space-y-2">
              {order.days.map((day) => (
                <li key={`${order.orderId}-${day.date}-${day.bowl}`} className="flex items-start justify-between gap-3 rounded-2xl bg-[#FFF8F2] px-3 py-3">
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F15C00]">{day.weekday} {day.date}</span>
                    <span className="mt-1 block text-sm font-semibold leading-5 text-[#1A4A16]">{day.bowl}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${day.delivered ? "bg-[#EAF6DC] text-[#1A4A16]" : "bg-white text-[#6A5A4E]"}`}>{day.status}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}
