import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PaymentPanel } from "@/components/payment-panel";
import { formatInr } from "@/lib/format";
import { orderSummaryText, whatsappHref } from "@/lib/order-message";
import { getSettings } from "@/server/catalog";
import { orderByToken } from "@/server/ordering";

export const metadata: Metadata = { title: "Payment", robots: { index: false, follow: false } };

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const order = await orderByToken(token);
  if (!order) notFound();
  const payment = order.payments[0];
  const settings = await getSettings();
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") || "http";
  const address = JSON.parse(order.deliveries[0]?.addressSnapshotJson || "{}") as { pinCode?: string; instructions?: string };
  const snapshot = JSON.parse(order.priceSnapshotJson || "{}") as { bundleDiscountPaise?: number };
  const summary = orderSummaryText({
    reference: order.reference,
    customerName: order.customerName,
    planName: order.planName,
    totalPaise: order.totalPaise,
    mealsPaise: order.mealSubtotalPaise,
    addonsPaise: order.addonsPaise,
    deliveryPaise: order.deliveryFeePaise,
    discountPaise: order.planDiscountPaise + order.couponPaise + (snapshot.bundleDiscountPaise || 0),
    paymentReference: payment?.gatewayPaymentId || "",
    pinCode: address.pinCode || "",
    instructions: address.instructions || "",
    detailsUrl: `${proto}://${host}/track/${token}`,
    lines: order.deliveries.map((delivery) => ({
      date: delivery.date,
      mealType: delivery.mealType,
      slotLabel: delivery.slotLabel,
      notes: delivery.notes,
      items: delivery.items.map((item) => ({
        name: item.nameSnapshot,
        quantity: item.quantity,
        addons: (JSON.parse(item.addonsJson || "[]") as { name?: string }[]).map((addon) => ({ name: addon.name || "" })),
      })),
    })),
  });
  return (
    <PaymentPanel
      token={token}
      reference={order.reference}
      totalLabel={formatInr(order.totalPaise)}
      status={payment?.status || order.status}
      reconciliation={Boolean(order.reconciliationFlag)}
      whatsappHref={whatsappHref(settings?.supportWhatsapp || "", summary)}
      summary={summary}
      deliveryCount={order.deliveries.length}
      planName={order.planName || order.cadence}
    />
  );
}
