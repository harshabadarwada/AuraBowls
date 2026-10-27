import Link from "next/link";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";
import { guard } from "@/server/guard";

export default async function ReportsPage() {
  await guard();
  const [orders, payments, refunds, syncs] = await Promise.all([
    db().order.count(),
    db().payment.aggregate({ where: { status: { in: ["paid", "partially_refunded", "refunded"] } }, _sum: { amountPaise: true } }),
    db().refund.aggregate({ where: { status: "refunded" }, _sum: { amountPaise: true } }),
    db().sheetsSyncLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const gross = payments._sum.amountPaise || 0;
  const refunded = refunds._sum.amountPaise || 0;
  return (
    <div className="space-y-3">
      <h1 className="text-3xl text-[#1A4A16]">Reports</h1>
      <p>Orders recorded: {orders}</p>
      <p>Gross verified payments: {formatInr(gross)}</p>
      <p>Refunds marked refunded: {formatInr(refunded)}</p>
      <p>Net collections: {formatInr(gross - refunded)}</p>
      <p><Link href="/api/admin/kitchen">Kitchen CSV for today</Link></p>
      <h2 className="pt-4 text-xl text-[#1A4A16]">Sheets sync</h2>
      {syncs.length === 0 ? <p className="text-sm text-[#6A5A4E]">No sync attempts yet.</p> : syncs.map((sync) => <p key={sync.id} className="text-sm">{sync.status} · {sync.entity} · {sync.detail}</p>)}
    </div>
  );
}
