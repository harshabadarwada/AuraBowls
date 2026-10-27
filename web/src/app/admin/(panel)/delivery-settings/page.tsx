import { db } from "@/lib/db";
import { paiseToRupeesInput } from "@/lib/money";
import { guard } from "@/server/guard";

export default async function DeliverySettingsPage() {
  const session = await guard();
  const [areas, slots, closures] = await Promise.all([
    db().serviceArea.findMany({ orderBy: { pinCode: "asc" } }),
    db().deliverySlot.findMany({ orderBy: { sortOrder: "asc" } }),
    db().kitchenClosure.findMany({ orderBy: { date: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-[#1A4A16]">Delivery settings</h1>
      {areas.map((area) => (
        <form key={area.id} className="store-card grid gap-2 p-4 md:grid-cols-2" method="post" action="/api/admin/actions">
          <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="save_area" /><input type="hidden" name="returnTo" value="/admin/delivery-settings" />
          <input className="field" name="pinCode" defaultValue={area.pinCode} />
          <input className="field" name="label" defaultValue={area.label} />
          <input className="field" name="deliveryFee" defaultValue={paiseToRupeesInput(area.deliveryFeePaise)} />
          <input className="field" name="weekdays" defaultValue={area.weekdays} />
          <select className="field" name="coverage" defaultValue={area.coverage}><option value="pin">Whole PIN</option><option value="locality">Specific localities</option></select>
          <input className="field" name="localityNote" defaultValue={area.localityNote} />
          <label className="text-sm"><input type="checkbox" name="active" defaultChecked={area.active} /> Active</label>
          <button className="btn btn-line">Save PIN</button>
        </form>
      ))}
      <form className="store-card grid gap-2 p-4" method="post" action="/api/admin/actions">
        <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="save_area" /><input type="hidden" name="returnTo" value="/admin/delivery-settings" /><input type="hidden" name="active" value="on" />
        <h2 className="text-xl text-[#1A4A16]">Add PIN</h2>
        <input className="field" name="pinCode" placeholder="PIN" /><input className="field" name="label" placeholder="Label" /><input className="field" name="deliveryFee" defaultValue="0" /><input className="field" name="weekdays" defaultValue="1,2,3,4,5,6" /><input className="field" name="localityNote" placeholder="Coverage note" /><input type="hidden" name="coverage" value="pin" />
        <button className="btn btn-forest w-fit">Add</button>
      </form>
      <div>
        <h2 className="text-xl text-[#1A4A16]">Slots</h2>
        {slots.map((slot) => (
          <form key={slot.id} className="mt-2 flex flex-wrap gap-2" method="post" action="/api/admin/actions">
            <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="save_slot" /><input type="hidden" name="id" value={slot.id} /><input type="hidden" name="returnTo" value="/admin/delivery-settings" /><input type="hidden" name="mealType" value={slot.mealType} />
            <input className="field" name="label" defaultValue={slot.label} /><input className="field max-w-[100px]" name="startTime" defaultValue={slot.startTime} /><input className="field max-w-[100px]" name="endTime" defaultValue={slot.endTime} /><input className="field max-w-[90px]" name="capacity" defaultValue={slot.capacity} />
            <label className="text-sm"><input type="checkbox" name="active" defaultChecked={slot.active} /> Active</label>
            <button className="btn btn-line">Save</button>
          </form>
        ))}
      </div>
      <form className="store-card grid gap-2 p-4" method="post" action="/api/admin/actions">
        <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="create_closure" /><input type="hidden" name="returnTo" value="/admin/delivery-settings" />
        <h2 className="text-xl text-[#1A4A16]">Kitchen closure</h2>
        <input className="field" type="date" name="date" required /><input className="field" name="reason" placeholder="Reason" /><select className="field" name="mealType"><option value="all">All meals</option><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option></select>
        <button className="btn btn-forest w-fit">Block date</button>
        <ul className="text-sm">{closures.map((closure) => <li key={closure.id}>{closure.date} · {closure.mealType} · {closure.reason}</li>)}</ul>
      </form>
    </div>
  );
}
