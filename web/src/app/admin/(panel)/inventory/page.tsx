import { db } from "@/lib/db";
import { guard } from "@/server/guard";

export default async function InventoryPage() {
  const session = await guard();
  const items = await db().inventoryItem.findMany({ include: { adjustments: { orderBy: { createdAt: "desc" }, take: 3 } } });
  return (
    <div>
      <h1 className="text-3xl text-[#1A4A16]">Inventory</h1>
      <p className="mt-2 text-sm text-[#6A5A4E]">Manual stock only. It does not reduce when an order is placed, and it does not control meal capacity.</p>
      {items.map((item) => (
        <form key={item.id} className="store-card mt-3 flex flex-wrap items-end gap-2 p-4" method="post" action="/api/admin/actions">
          <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="inventory_adjust" /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="returnTo" value="/admin/inventory" />
          <div><p className="font-semibold">{item.name}</p><p className="text-sm text-[#6A5A4E]">{(item.quantityTenths / 10).toFixed(1)} {item.unit}</p></div>
          <input className="field max-w-[120px]" name="delta" placeholder="+/- qty" /><input className="field" name="reason" placeholder="Reason" />
          <button className="btn btn-forest">Adjust</button>
        </form>
      ))}
      <form className="store-card mt-4 grid gap-2 p-4 md:grid-cols-3" method="post" action="/api/admin/actions">
        <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="add_inventory" /><input type="hidden" name="returnTo" value="/admin/inventory" />
        <input className="field" name="name" placeholder="Ingredient" /><input className="field" name="unit" placeholder="kg" /><input className="field" name="quantity" placeholder="Quantity" />
        <button className="btn btn-line">Add ingredient</button>
      </form>
    </div>
  );
}
