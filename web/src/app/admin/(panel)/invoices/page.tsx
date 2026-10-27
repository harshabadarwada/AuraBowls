import Link from "next/link";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";
import { guard } from "@/server/guard";

export default async function InvoicesPage() {
  await guard();
  const invoices = await db().invoice.findMany({ include: { order: true, creditNotes: true }, orderBy: { issuedAt: "desc" } });
  return (
    <div>
      <h1 className="text-3xl text-[#1A4A16]">Invoices</h1>
      <p className="mt-2 text-sm text-[#6A5A4E]">Issued invoices are not overwritten. Refunds add a credit note.</p>
      <table className="admin mt-4"><thead><tr><th>Number</th><th>Order</th><th>Total</th><th>Credit notes</th></tr></thead><tbody>
        {invoices.map((invoice) => <tr key={invoice.id}><td><Link href={`/api/admin/invoice/${invoice.id}`}>{invoice.number}</Link></td><td>{invoice.order.reference}</td><td>{formatInr(invoice.totalPaise)}</td><td>{invoice.creditNotes.map((note) => note.number).join(", ") || "—"}</td></tr>)}
      </tbody></table>
    </div>
  );
}
