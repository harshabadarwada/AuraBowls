import { db } from "@/lib/db";
import { guard } from "@/server/guard";

export default async function CustomersPage() {
  const session = await guard();
  const customers = await db().customer.findMany({ include: { orders: true }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div>
      <h1 className="text-3xl text-[#1A4A16]">Customers</h1>
      {customers.map((customer) => (
        <form key={customer.id} className="store-card mt-3 flex flex-wrap items-center justify-between gap-3 p-4" method="post" action="/api/admin/actions">
          <div>
            <p className="font-semibold text-[#1A4A16]">{customer.name}</p>
            <p className="text-sm text-[#6A5A4E]">{customer.phone} · {customer.orders.length} orders</p>
          </div>
          <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="anonymize_customer" /><input type="hidden" name="customerId" value={customer.id} /><input type="hidden" name="returnTo" value="/admin/customers" />
          <button className="btn btn-line">Anonymize</button>
        </form>
      ))}
    </div>
  );
}
