import { db } from "@/lib/db";
import { guard } from "@/server/guard";

export default async function PlansAdminPage() {
  const session = await guard();
  const plans = await db().planTemplate.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-3xl text-[#1A4A16]">Meal plans</h1>
      <p className="mt-2 text-sm text-[#6A5A4E]">The discount is a percentage off the current menu price of the default meal. It is not a crossed-out price invented for the page.</p>
      {plans.map((plan) => (
        <form key={plan.id} className="store-card mt-3 grid gap-2 p-4" method="post" action="/api/admin/actions">
          <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="save_plan" /><input type="hidden" name="id" value={plan.id} /><input type="hidden" name="returnTo" value="/admin/plans" />
          <h2 className="text-xl text-[#1A4A16]">{plan.name}</h2>
          <p className="text-xs uppercase tracking-wide text-[#6A5A4E]">{plan.mealType}</p>
          <textarea className="field" name="description" defaultValue={plan.description} />
          <label className="text-sm">Discount percent<input className="field mt-1" name="discount" defaultValue={plan.discountBps / 100} /></label>
          <label className="text-sm">{plan.mealType === "both" ? "Days. Each day is one breakfast and one lunch." : "Deliveries"}<input className="field mt-1" name="count" defaultValue={plan.fixedDeliveryCount} /></label>
          <label className="text-sm"><input type="checkbox" name="active" defaultChecked={plan.active} /> Active</label>
          <button className="btn btn-forest w-fit">Save plan</button>
        </form>
      ))}
    </div>
  );
}
