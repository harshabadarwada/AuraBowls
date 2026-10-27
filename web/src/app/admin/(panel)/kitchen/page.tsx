import Link from "next/link";
import { db } from "@/lib/db";
import { businessToday } from "@/lib/time";
import { guard } from "@/server/guard";

export default async function KitchenPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await guard();
  const date = (await searchParams).date || businessToday();
  const deliveries = await db().scheduledDelivery.findMany({
    where: { date, status: { notIn: ["cancelled", "rescheduled"] } },
    include: { items: true, order: true },
    orderBy: [{ mealType: "asc" }, { slotStart: "asc" }],
  });
  const totals = new Map<string, { name: string; qty: number; addons: string[]; notes: string[] }>();
  for (const delivery of deliveries) {
    for (const item of delivery.items) {
      const current = totals.get(item.nameSnapshot) || { name: item.nameSnapshot, qty: 0, addons: [], notes: [] };
      current.qty += item.quantity;
      if (item.addonsJson !== "[]") current.addons.push(item.addonsJson);
      if (item.customizationNote) current.notes.push(item.customizationNote);
      totals.set(item.nameSnapshot, current);
    }
  }
  return (
    <div>
      <h1 className="text-3xl text-[#1A4A16]">Kitchen · {date}</h1>
      <form className="mt-3 flex gap-2"><input className="field" type="date" name="date" defaultValue={date} /><button className="btn btn-forest">Show</button></form>
      <p className="mt-3 text-sm"><Link href={`/api/admin/kitchen?date=${date}`}>Download CSV</Link> · <Link href={`/admin/kitchen?date=${date}`}>Print this page</Link></p>
      <h2 className="mt-6 text-xl text-[#1A4A16]">Preparation summary</h2>
      <table className="admin mt-2"><thead><tr><th>Meal</th><th>Qty</th><th>Add-ons and notes</th></tr></thead><tbody>
        {[...totals.values()].map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.qty}</td><td>{row.addons.join(" ") } {row.notes.join("; ")}</td></tr>)}
      </tbody></table>
      <h2 className="mt-8 text-xl text-[#1A4A16]">Packing slips</h2>
      <div className="mt-3 space-y-4">
        {deliveries.map((delivery) => (
          <article key={delivery.id} className="store-card p-4">
            <p className="text-xs uppercase text-[#6A5A4E]">{delivery.order.reference} · {delivery.packingStatus}</p>
            <h3 className="text-xl text-[#1A4A16]">{delivery.order.customerName}</h3>
            <p>{delivery.date} · {delivery.slotLabel}</p>
            {delivery.items.map((item) => <p key={item.id}>{item.quantity} × {item.nameSnapshot} {item.addonsJson !== "[]" ? item.addonsJson : ""} {item.customizationNote}</p>)}
            <p className="mt-2 text-base font-semibold">Allergy: {delivery.order.allergyNotes || "None declared"}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
