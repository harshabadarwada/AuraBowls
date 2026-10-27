import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Stage } from "@/components/stage";
import { TrackPanel } from "@/components/track-panel";
import { formatInr } from "@/lib/format";
import { formatLongDate } from "@/lib/time";
import { getSettings } from "@/server/catalog";
import { orderByToken } from "@/server/ordering";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const order = await orderByToken(token);
  if (!order) notFound();
  const settings = await getSettings();
  const payment = order.payments[0];
  const firstName = order.customerName.split(" ")[0] || "there";
  const upcoming = order.deliveries.filter((delivery) => ["scheduled", "preparing", "packed", "assigned"].includes(delivery.status));
  return (
    <div className="space-y-6">
      <Stage eyebrow={order.reference} title={`Hello ${firstName}`} copy={`Payment: ${payment?.status || "pending"}. Kitchen acceptance: ${order.acceptanceStatus}. A paid order still waits for the kitchen to accept it.`} />
      {order.reconciliationFlag ? <p className="-mt-4 rounded-xl bg-[#fff1e8] px-4 py-3 text-sm">This payment needs a manual review. Deliveries are not confirmed.</p> : null}
      <p className="text-sm text-[#6A5A4E]">Total {formatInr(order.totalPaise)} · {upcoming.length} upcoming deliveries. The street address is not shown on this page.</p>
      <ol className="space-y-3">
        {order.deliveries.map((delivery) => (
          <li key={delivery.id} className="store-card story p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg text-[#1A4A16]">{formatLongDate(delivery.date)}</h2>
                <p className="text-sm text-[#6A5A4E]">{delivery.slotLabel} · {delivery.items.map((item) => `${item.quantity} × ${item.nameSnapshot}`).join(", ")}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${delivery.status === "delivered" ? "bg-[#EAF6DC] text-[#1A4A16]" : delivery.status === "failed" || delivery.status === "cancelled" ? "bg-[#fff1e8] text-[#7a3410]" : "bg-[#F6F2EC] text-[#6A5A4E]"}`}>{delivery.status.replaceAll("_", " ")}</span>
            </div>
          </li>
        ))}
      </ol>
      <TrackPanel
        token={token}
        whatsapp={settings?.supportWhatsapp || ""}
        deliveries={order.deliveries.map((delivery) => ({ id: delivery.id, date: delivery.date, status: delivery.status, meal: delivery.items.map((item) => item.nameSnapshot).join(", "), delivered: delivery.status === "delivered" }))}
      />
    </div>
  );
}
