import Link from "next/link";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";
import { guard } from "@/server/guard";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  await guard();
  const { q = "", error } = await searchParams;
  const orders = await db().order.findMany({
    where: q ? { OR: [{ reference: { contains: q } }, { customerPhone: { contains: q } }, { customerName: { contains: q } }] } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { payments: true },
  });
  return (
    <div>
      <h1 className="text-3xl text-[#1A4A16]">Orders</h1>
      {error ? <p className="mt-3 text-sm text-[#7a3410]">{error}</p> : null}
      <form className="mt-4 flex gap-2"><input className="field" name="q" defaultValue={q} placeholder="Reference, name, or phone" /><button className="btn btn-forest">Search</button></form>
      <div className="mt-4 overflow-x-auto">
        <table className="admin">
          <thead><tr><th>Reference</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><Link href={`/admin/orders/${order.id}`}>{order.reference}</Link></td>
                <td>{order.customerName}<br />{order.customerPhone}</td>
                <td>{order.status}<br />{order.acceptanceStatus}</td>
                <td>{order.payments[0]?.status}</td>
                <td>{formatInr(order.totalPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
