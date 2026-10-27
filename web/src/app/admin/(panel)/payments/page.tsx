import Link from "next/link";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";
import { guard } from "@/server/guard";

export default async function PaymentsPage() {
  const session = await guard();
  const payments = await db().payment.findMany({ include: { order: true }, orderBy: { createdAt: "desc" }, take: 40 });
  const refunds = await db().refund.findMany({ include: { order: true }, orderBy: { createdAt: "desc" }, take: 40 });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-[#1A4A16]">Payments and refunds</h1>
      <table className="admin"><thead><tr><th>Order</th><th>Status</th><th>Amount</th><th>Gateway</th></tr></thead><tbody>
        {payments.map((payment) => <tr key={payment.id}><td><Link href={`/admin/orders/${payment.orderId}`}>{payment.order.reference}</Link></td><td>{payment.status}</td><td>{formatInr(payment.amountPaise)}</td><td>{payment.gateway} {payment.gatewayPaymentId}</td></tr>)}
      </tbody></table>
      <h2 className="text-xl text-[#1A4A16]">Refunds</h2>
      {refunds.map((refund) => (
        <form key={refund.id} className="mt-2 flex flex-wrap items-center gap-2 text-sm" method="post" action="/api/admin/actions">
          <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="returnTo" value="/admin/payments" /><input type="hidden" name="refundId" value={refund.id} />
          <span>{refund.order.reference} · {formatInr(refund.amountPaise)} · {refund.status}</span>
          {refund.status === "pending_approval" ? <><button className="btn btn-forest" name="type" value="approve_refund">Approve</button><button className="btn btn-line" name="type" value="reject_refund">Reject</button></> : null}
        </form>
      ))}
    </div>
  );
}
