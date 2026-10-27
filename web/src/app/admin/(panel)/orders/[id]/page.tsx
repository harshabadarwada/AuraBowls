import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";
import { orderSummaryText, whatsappHref } from "@/lib/order-message";
import { guard } from "@/server/guard";
import { suggestedRefund } from "@/server/admin";

export default async function OrderAdminPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const session = await guard();
  const { id } = await params;
  const { error } = await searchParams;
  const order = await db().order.findUnique({
    where: { id },
    include: { deliveries: { include: { items: true }, orderBy: { date: "asc" } }, payments: true, refunds: true, invoices: true, changeRequests: true },
  });
  if (!order) notFound();
  const settings = await db().businessSettings.findUniqueOrThrow({ where: { id: "default" } });
  const meals = await db().meal.findMany({ where: { mealType: order.mealType === "both" ? { in: ["breakfast", "lunch"] } : order.mealType, published: true } });
  const suggestion = suggestedRefund(order.deliveries, settings.cutoffHours, settings.timezone);
  const csrf = session.csrf;
  const back = `/admin/orders/${order.id}`;
  const address = JSON.parse(order.deliveries[0]?.addressSnapshotJson || "{}") as { pinCode?: string; instructions?: string; line1?: string };
  const snapshot = JSON.parse(order.priceSnapshotJson || "{}") as { bundleDiscountPaise?: number };
  const payment = order.payments[0];
  const summary = orderSummaryText({
    reference: order.reference,
    customerName: order.customerName,
    planName: order.planName || order.cadence,
    totalPaise: order.totalPaise,
    mealsPaise: order.mealSubtotalPaise,
    addonsPaise: order.addonsPaise,
    deliveryPaise: order.deliveryFeePaise,
    discountPaise: order.planDiscountPaise + order.couponPaise + (snapshot.bundleDiscountPaise || 0),
    paymentReference: payment?.gatewayPaymentId || "",
    pinCode: address.pinCode || "",
    instructions: address.instructions || "",
    detailsUrl: "",
    lines: order.deliveries.map((delivery) => ({
      date: delivery.date,
      mealType: delivery.mealType,
      slotLabel: delivery.slotLabel,
      notes: delivery.notes,
      items: delivery.items.map((item) => ({
        name: item.nameSnapshot,
        quantity: item.quantity,
        addons: JSON.parse(item.addonsJson || "[]") as { name: string }[],
      })),
    })),
  });
  const whatsapp = whatsappHref(settings.supportWhatsapp, summary);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl text-[#1A4A16]">{order.reference}</h1>
        <p className="text-sm text-[#6A5A4E]">{order.customerName} · {order.customerPhone || "phone removed"} · {order.status} · {formatInr(order.totalPaise)}</p>
        <p className="mt-2 text-sm text-[#1A4A16]">Payment {payment?.status || "none"} · Acceptance {order.acceptanceStatus} · Plan {order.planName || order.cadence} · PIN {address.pinCode || "—"}</p>
        {address.line1 ? <p className="text-sm text-[#6A5A4E]">{address.line1}{address.instructions ? ` · ${address.instructions}` : ""}</p> : null}
        <p className="mt-1 text-xs text-[#6A5A4E]">This paid order is stored here whether or not WhatsApp is opened. Opening the link does not mark a message as sent.</p>
        {whatsapp ? <a className="btn btn-line mt-3" href={whatsapp} target="_blank" rel="noreferrer">Open WhatsApp summary</a> : <p className="mt-2 text-sm">Add the business WhatsApp number in settings to open a summary.</p>}
        {order.allergyNotes ? <p className="mt-2 rounded-xl bg-[#fff1e8] px-3 py-2 text-sm font-semibold">Allergy: {order.allergyNotes}</p> : null}
        {order.reconciliationFlag ? <p className="mt-2 text-sm">Reconciliation: {order.reconciliationFlag}</p> : null}
        {error ? <p className="mt-2 text-sm text-[#7a3410]" role="alert">{error}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Action csrf={csrf} returnTo={back} type="accept_order" orderId={order.id} label="Accept" />
        <Action csrf={csrf} returnTo={back} type="reject_order" orderId={order.id} label="Reject paid order" extra={<input className="field" name="reason" placeholder="Reason" />} />
        <Action csrf={csrf} returnTo={back} type="rotate_tracking" orderId={order.id} label="Issue new tracking link" />
      </div>
      <section className="space-y-3">
        {order.deliveries.map((delivery) => (
          <article key={delivery.id} className="store-card p-4">
            <h2 className="text-lg text-[#1A4A16]">{delivery.date} · {delivery.slotLabel} · {delivery.status}</h2>
            <p className="text-sm">{delivery.items.map((item) => `${item.quantity} × ${item.nameSnapshot}`).join(", ")} · {formatInr(delivery.totalPaise)}</p>
            <p className="text-xs text-[#6A5A4E]">{delivery.notes}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Action csrf={csrf} returnTo={back} type="delivery_status" label="Update status" extra={<><input type="hidden" name="deliveryId" value={delivery.id} /><select className="field" name="status">{["scheduled","preparing","packed","assigned","out_for_delivery","delivered","cancelled"].map((status) => <option key={status}>{status}</option>)}</select></>} />
              <Action csrf={csrf} returnTo={back} type="assign_delivery" label="Assign" extra={<><input type="hidden" name="deliveryId" value={delivery.id} /><input className="field" name="assignee" placeholder="Name" /></>} />
              <Action csrf={csrf} returnTo={back} type="reschedule_delivery" label="Reschedule" extra={<><input type="hidden" name="deliveryId" value={delivery.id} /><input className="field" type="date" name="date" required /></>} />
              <Action csrf={csrf} returnTo={back} type="replace_meal" label="Replace meal" extra={<><input type="hidden" name="deliveryId" value={delivery.id} /><select className="field" name="mealId">{meals.filter((meal) => meal.mealType === delivery.mealType).map((meal) => <option key={meal.id} value={meal.id}>{meal.name}</option>)}</select><label className="text-xs"><input type="checkbox" name="customerAgreed" /> Customer agreed to any extra charge</label></>} />
            </div>
            <form className="mt-3 grid gap-2 md:grid-cols-2" method="post" action="/api/admin/actions">
              <input type="hidden" name="csrf" value={csrf} /><input type="hidden" name="returnTo" value={back} /><input type="hidden" name="type" value="fail_delivery" /><input type="hidden" name="deliveryId" value={delivery.id} />
              <input className="field" name="reason" placeholder="Failure reason" />
              <input className="field" name="attemptedAt" placeholder="Attempted time" />
              <input className="field" name="contactOutcome" placeholder="Customer contact outcome" />
              <select className="field" name="resolution"><option value="redelivery">Same-day redelivery</option><option value="reschedule">Reschedule next</option><option value="refund_review">Refund review</option><option value="closed_without_refund">Close without refund</option></select>
              <button className="btn btn-line">Record failed delivery</button>
            </form>
          </article>
        ))}
      </section>
      <section className="store-card p-4">
        <h2 className="text-lg text-[#1A4A16]">Address change for future deliveries</h2>
        <p className="text-sm text-[#6A5A4E]">Suggested refund for deliveries still before cutoff: {formatInr(suggestion.amountPaise)}. Locked deliveries stay as they are.</p>
        <form className="mt-3 grid gap-2" method="post" action="/api/admin/actions">
          <input type="hidden" name="csrf" value={csrf} /><input type="hidden" name="returnTo" value={back} /><input type="hidden" name="type" value="address_change" /><input type="hidden" name="orderId" value={order.id} />
          <input className="field" name="line1" placeholder="New address" required />
          <input className="field" name="pinCode" placeholder="PIN" required />
          <input className="field" name="city" defaultValue="Hyderabad" />
          <label className="text-sm"><input type="checkbox" name="customerAgreed" /> Customer agreed to any higher delivery fee</label>
          <button className="btn btn-forest w-fit">Apply to future deliveries</button>
        </form>
      </section>
      <section className="store-card p-4">
        <h2 className="text-lg text-[#1A4A16]">Refund</h2>
        <form className="mt-3 flex flex-wrap gap-2" method="post" action="/api/admin/actions">
          <input type="hidden" name="csrf" value={csrf} /><input type="hidden" name="returnTo" value={back} /><input type="hidden" name="type" value="create_refund" /><input type="hidden" name="orderId" value={order.id} />
          <input className="field max-w-[140px]" name="amount" placeholder="Amount ₹" />
          <input className="field" name="reason" placeholder="Reason" />
          <button className="btn btn-line">Create request</button>
        </form>
        {order.refunds.map((refund) => (
          <p key={refund.id} className="mt-2 text-sm">{formatInr(refund.amountPaise)} · {refund.status} · {refund.reason}
            {refund.status === "pending_approval" ? <span className="ml-2 inline-flex gap-2"><Action csrf={csrf} returnTo={back} type="approve_refund" label="Approve" extra={<input type="hidden" name="refundId" value={refund.id} />} /><Action csrf={csrf} returnTo={back} type="reject_refund" label="Reject" extra={<input type="hidden" name="refundId" value={refund.id} />} /></span> : null}
          </p>
        ))}
      </section>
      <section>
        <h2 className="text-lg text-[#1A4A16]">Invoices</h2>
        {order.invoices.map((invoice) => <p key={invoice.id}><Link href={`/api/admin/invoice/${invoice.id}`}>{invoice.number}</Link></p>)}
        {order.invoices.length === 0 ? <p className="text-sm text-[#6A5A4E]">An invoice is created after a captured payment.</p> : null}
      </section>
      <form className="store-card space-y-2 p-4" method="post" action="/api/admin/actions">
        <input type="hidden" name="csrf" value={csrf} /><input type="hidden" name="returnTo" value={back} /><input type="hidden" name="type" value="log_change" /><input type="hidden" name="orderId" value={order.id} />
        <h2 className="text-lg text-[#1A4A16]">Log a WhatsApp request</h2>
        <input className="field" name="changeType" placeholder="meal, address, skip, cancellation" />
        <textarea className="field min-h-20" name="message" placeholder="What the customer asked" />
        <button className="btn btn-line">Log request</button>
        {order.changeRequests.map((request) => <p key={request.id} className="text-sm">{request.status}: {request.type} — {request.message}</p>)}
      </form>
    </div>
  );
}

function Action({ csrf, returnTo, type, label, orderId, extra }: { csrf: string; returnTo: string; type: string; label: string; orderId?: string; extra?: React.ReactNode }) {
  return (
    <form method="post" action="/api/admin/actions" className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="csrf" value={csrf} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="type" value={type} />
      {orderId ? <input type="hidden" name="orderId" value={orderId} /> : null}
      {extra}
      <button className="btn btn-line" type="submit">{label}</button>
    </form>
  );
}
