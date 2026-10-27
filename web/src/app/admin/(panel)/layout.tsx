import Link from "next/link";
import { databaseWarning } from "@/lib/db";
import { paymentMode } from "@/lib/config";
import { guard } from "@/server/guard";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/orders", "Orders"],
  ["/admin/deliveries", "Deliveries"],
  ["/admin/menu", "Menu"],
  ["/admin/plans", "Plans"],
  ["/admin/delivery-settings", "Delivery"],
  ["/admin/customers", "Customers"],
  ["/admin/payments", "Payments"],
  ["/admin/kitchen", "Kitchen"],
  ["/admin/inventory", "Inventory"],
  ["/admin/promotions", "Promotions"],
  ["/admin/invoices", "Invoices"],
  ["/admin/feedback", "Feedback"],
  ["/admin/reports", "Reports"],
  ["/admin/settings", "Settings"],
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await guard();
  const warning = databaseWarning();
  return (
    <div className="min-h-screen bg-[#FFF8F2]">
      <header className="border-b border-[#F3D7C2] bg-[#FFF8F2]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <Link href="/admin" className="inline-flex items-center gap-3">
            <img src="/aura-logo.png" alt="AuraBowls" className="h-10 w-10 object-contain" />
            <span className="font-[family-name:var(--font-heading)] text-lg text-[#1A4A16]">Admin</span>
          </Link>
          <form method="post" action="/api/admin/logout"><button className="text-sm font-semibold text-[#F15C00]" type="submit">Sign out</button></form>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Admin">
          {links.map(([href, label]) => <Link key={href} className="rounded-lg px-2 py-2 text-sm text-[#1A4A16] hover:bg-[#EAF6DC]" href={href}>{label}</Link>)}
        </nav>
        <div>
          {paymentMode() === "simulator" ? <p className="mb-4 rounded-xl bg-[#fff1e8] px-3 py-2 text-sm">Development payment simulator is on. No live money moves.</p> : null}
          {warning ? <p className="mb-4 rounded-xl bg-[#fff1e8] px-3 py-2 text-sm">{warning}</p> : null}
          <p className="sr-only">Signed in as {session.admin.email}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
