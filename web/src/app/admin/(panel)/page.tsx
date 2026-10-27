import Link from "next/link";
import { db } from "@/lib/db";
import { businessToday, addDays } from "@/lib/time";
import { guard } from "@/server/guard";

function dayLabel(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function addonNames(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { name?: string }[];
    return parsed.map((item) => item.name).filter(Boolean).join(", ");
  } catch {
    return "";
  }
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string; date?: string; notice?: string }> }) {
  const session = await guard();
  const { error, date: focus, notice } = await searchParams;
  const today = businessToday();
  const until = addDays(today, 28);
  const deliveries = await db().scheduledDelivery.findMany({
    where: {
      date: focus && /^\d{4}-\d{2}-\d{2}$/.test(focus) ? focus : { gte: today, lte: until },
      status: { notIn: ["cancelled", "rescheduled"] },
      order: { status: { notIn: ["rejected", "cancelled"] } },
    },
    include: { order: { include: { payments: true } }, items: true },
    orderBy: [{ date: "asc" }, { mealType: "asc" }, { slotStart: "asc" }],
  });
  const byDate = new Map<string, typeof deliveries>();
  for (const delivery of deliveries) {
    const group = byDate.get(delivery.date) || [];
    group.push(delivery);
    byDate.set(delivery.date, group);
  }
  const waiting = deliveries.filter((delivery) => delivery.order.status === "paid_pending_acceptance").length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">Kitchen</p>
        <h1 className="mt-1 text-3xl text-[#1A4A16]">Day-wise orders</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6A5A4E]">Each date is a delivery day. Meals, slots, and payment status come from the saved order.</p>
      </header>
      {error ? <p className="rounded-xl bg-[#fff1e8] px-3 py-2 text-sm" role="alert">{error}</p> : null}
      {notice ? <p className="rounded-2xl bg-[#EAF6DC] px-4 py-3 text-sm text-[#1A4A16]">{notice}</p> : null}
      <form method="post" action="/api/admin/actions">
        <input type="hidden" name="csrf" value={session.csrf} />
        <input type="hidden" name="type" value="run_meal_check" />
        <input type="hidden" name="returnTo" value="/admin" />
        <button className="btn btn-forest" type="submit">Check the next 12 hours</button>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-[#6A5A4E]">Sends a WhatsApp question for deliveries that are between 11 and 12 hours away. Reply SAME or a meal name. At 11 hours with no reply, the scheduled meal is kept and the Confirmations sheet is updated. Nothing is asked once 11 hours or less remain.</p>
      </form>
      {waiting > 0 ? <p className="rounded-2xl bg-[#EAF6DC] px-4 py-3 text-sm text-[#1A4A16]">{waiting} paid {waiting === 1 ? "delivery is" : "deliveries are"} still waiting for acceptance.</p> : null}

      <form className="flex flex-wrap items-end gap-2" method="get">
        <label className="text-sm font-semibold text-[#1A4A16]">One day
          <input className="field mt-1" type="date" name="date" defaultValue={focus || ""} />
        </label>
        <button className="btn btn-forest" type="submit">Show</button>
        {focus ? <Link className="btn btn-line" href="/admin">Upcoming 28 days</Link> : null}
      </form>

      {byDate.size === 0 ? (
        <p className="store-card p-6 text-sm text-[#6A5A4E]">No deliveries are scheduled {focus ? `on ${dayLabel(focus)}` : `from ${dayLabel(today)} through ${dayLabel(until)}`}.</p>
      ) : (
        <div className="space-y-8">
          {[...byDate.entries()].map(([date, dayDeliveries]) => {
            const breakfast = dayDeliveries.filter((delivery) => delivery.mealType === "breakfast");
            const lunch = dayDeliveries.filter((delivery) => delivery.mealType !== "breakfast");
            return (
              <section key={date} id={date}>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <h2 className="text-2xl text-[#1A4A16]">{dayLabel(date)}{date === today ? " · Today" : ""}</h2>
                  <p className="text-sm text-[#6A5A4E]">{dayDeliveries.length} {dayDeliveries.length === 1 ? "order" : "orders"}</p>
                </div>
                <div className="mt-3 space-y-4">
                  {([{ label: "Breakfast", list: breakfast }, { label: "Lunch", list: lunch }]).map(({ label, list }) => {
                    if (list.length === 0) return null;
                    return (
                      <div key={String(label)}>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6A5A4E]">{label}</h3>
                        <ul className="mt-2 space-y-2">
                          {list.map((delivery) => {
                            const payment = delivery.order.payments[0]?.status || "none";
                            const address = JSON.parse(delivery.addressSnapshotJson || "{}") as { pinCode?: string };
                            return (
                              <li key={delivery.id} className="store-card p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-lg text-[#1A4A16]">{delivery.order.customerName}</p>
                                    <p className="text-sm text-[#6A5A4E]"><Link href={`/admin/orders/${delivery.orderId}`}>{delivery.order.reference}</Link> · {delivery.order.planName || delivery.order.cadence}</p>
                                  </div>
                                  <p className="text-sm font-semibold text-[#1A4A16]">{delivery.slotLabel}</p>
                                </div>
                                <ul className="mt-3 space-y-1 text-sm text-[#1A4A16]">
                                  {delivery.items.map((item) => {
                                    const addons = addonNames(item.addonsJson);
                                    return <li key={item.id}>{item.quantity} × {item.nameSnapshot}{addons ? ` · ${addons}` : ""}{item.customizationNote ? ` · ${item.customizationNote}` : ""}</li>;
                                  })}
                                </ul>
                                <p className="mt-3 text-xs text-[#6A5A4E]">
                                  Payment {payment} · Acceptance {delivery.order.acceptanceStatus} · Delivery {delivery.status}
                                  {delivery.confirmStatus ? ` · Meal check ${delivery.confirmStatus}` : ""}
                                  {address.pinCode ? ` · PIN ${address.pinCode}` : ""}
                                  {delivery.order.allergyNotes ? ` · Allergy: ${delivery.order.allergyNotes}` : ""}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
