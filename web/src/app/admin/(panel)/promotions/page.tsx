import { db } from "@/lib/db";
import { paiseToRupeesInput } from "@/lib/money";
import { guard } from "@/server/guard";

export default async function PromotionsPage() {
  const session = await guard();
  const [coupons, promotions] = await Promise.all([db().coupon.findMany(), db().promotion.findMany()]);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl text-[#1A4A16]">Promotions</h1>
      {coupons.map((coupon) => (
        <form key={coupon.id} className="store-card grid gap-2 p-4 md:grid-cols-2" method="post" action="/api/admin/actions">
          <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="save_coupon" /><input type="hidden" name="returnTo" value="/admin/promotions" />
          <input className="field" name="code" defaultValue={coupon.code} />
          <select className="field" name="type" defaultValue={coupon.type}><option value="fixed">Fixed rupees</option><option value="percent">Percent</option></select>
          <input className="field" name="value" defaultValue={coupon.type === "percent" ? coupon.value / 100 : paiseToRupeesInput(coupon.value)} />
          <input className="field" name="minOrder" defaultValue={paiseToRupeesInput(coupon.minOrderPaise)} />
          <input className="field" name="maxUses" defaultValue={coupon.maxUses} />
          <input className="field" name="startsOn" defaultValue={coupon.startsOn} /><input className="field" name="endsOn" defaultValue={coupon.endsOn} />
          <label className="text-sm"><input type="checkbox" name="active" defaultChecked={coupon.active} /> Active</label>
          <label className="text-sm"><input type="checkbox" name="stackable" defaultChecked={coupon.stackable} /> Can combine with a plan discount</label>
          <p className="text-xs text-[#6A5A4E]">Used {coupon.usedCount}</p>
          <button className="btn btn-forest w-fit">Save coupon</button>
        </form>
      ))}
      {promotions.map((promotion) => (
        <form key={promotion.id} className="store-card grid gap-2 p-4" method="post" action="/api/admin/actions">
          <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="save_promotion" /><input type="hidden" name="id" value={promotion.id} /><input type="hidden" name="returnTo" value="/admin/promotions" />
          <input className="field" name="title" defaultValue={promotion.title} /><textarea className="field" name="body" defaultValue={promotion.body} />
          <label className="text-sm"><input type="checkbox" name="active" defaultChecked={promotion.active} /> Show</label>
          <button className="btn btn-line w-fit">Save banner</button>
        </form>
      ))}
    </div>
  );
}
