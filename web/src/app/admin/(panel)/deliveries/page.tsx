import Link from "next/link";
import { db } from "@/lib/db";
import { businessToday } from "@/lib/time";
import { guard } from "@/server/guard";

export default async function DeliveriesPage() {
  await guard();
  const today = businessToday();
  const deliveries = await db().scheduledDelivery.findMany({
    where: { date: { gte: today }, status: { notIn: ["cancelled", "rescheduled"] } },
    include: { order: true, items: true },
    orderBy: { date: "asc" },
    take: 80,
  });
  return (
    <div>
      <h1 className="text-3xl text-[#1A4A16]">Scheduled deliveries</h1>
      <div className="mt-4 overflow-x-auto"><table className="admin"><thead><tr><th>Date</th><th>Order</th><th>Meal</th><th>Slot</th><th>Status</th><th>Assignee</th></tr></thead><tbody>
        {deliveries.map((delivery) => <tr key={delivery.id}><td>{delivery.date}</td><td><Link href={`/admin/orders/${delivery.orderId}`}>{delivery.order.reference}</Link></td><td>{delivery.items.map((item) => item.nameSnapshot).join(", ")}</td><td>{delivery.slotLabel}</td><td>{delivery.status}</td><td>{delivery.assignedTo || "—"}</td></tr>)}
      </tbody></table></div>
    </div>
  );
}
