import { db } from "@/lib/db";
import { paiseToRupeesInput } from "@/lib/money";
import { guard } from "@/server/guard";

export default async function MenuAdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await guard();
  const { error } = await searchParams;
  const meals = await db().meal.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-3xl text-[#1A4A16]">Menu</h1>
      <p className="mt-2 text-sm text-[#6A5A4E]">Price changes apply to new orders. Existing orders keep their saved prices. Leave nutrition blank when it has not been measured.</p>
      {error ? <p className="mt-3 text-sm text-[#7a3410]">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {meals.map((meal) => (
          <details key={meal.id} className="store-card p-4">
            <summary className="cursor-pointer text-[#1A4A16]">{meal.name} · ₹{paiseToRupeesInput(meal.pricePaise)} · {meal.published ? "published" : "hidden"}</summary>
            <form className="mt-3 grid gap-2 md:grid-cols-2" method="post" action="/api/admin/actions">
              <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="save_meal" /><input type="hidden" name="id" value={meal.id} /><input type="hidden" name="returnTo" value="/admin/menu" /><input type="hidden" name="mealType" value={meal.mealType} />
              <input className="field" name="name" defaultValue={meal.name} />
              <input className="field" name="price" defaultValue={paiseToRupeesInput(meal.pricePaise)} />
              <input className="field" name="compareAt" defaultValue={meal.compareAtPaise ? paiseToRupeesInput(meal.compareAtPaise) : ""} placeholder="Original price ₹, optional" />
              <textarea className="field min-h-20 md:col-span-2" name="description" defaultValue={meal.description} />
              <input className="field md:col-span-2" name="imageUrl" defaultValue={meal.imageUrl} placeholder="Image URL" />
              <label className="text-sm"><input type="checkbox" name="imageIsPlaceholder" defaultChecked={meal.imageIsPlaceholder} /> Placeholder photo</label>
              <input className="field" name="portionLabel" defaultValue={meal.portionLabel} />
              <input className="field" name="dietTags" defaultValue={meal.dietTags} />
              <input className="field" name="ingredients" defaultValue={meal.ingredients} />
              <input className="field" name="allergens" defaultValue={meal.allergens} />
              <select className="field" name="nutritionStatus" defaultValue={meal.nutritionStatus}><option value="missing">Missing</option><option value="estimated">Estimated</option><option value="verified">Verified</option></select>
              <input className="field" name="calories" defaultValue={meal.calories ?? ""} placeholder="kcal" />
              <input className="field" name="protein" defaultValue={meal.proteinTenths != null ? meal.proteinTenths / 10 : ""} placeholder="Protein g" />
              <input className="field" name="carbs" defaultValue={meal.carbsTenths != null ? meal.carbsTenths / 10 : ""} placeholder="Carbs g" />
              <input className="field" name="fat" defaultValue={meal.fatTenths != null ? meal.fatTenths / 10 : ""} placeholder="Fat g" />
              <input className="field" name="fiber" defaultValue={meal.fiberTenths != null ? meal.fiberTenths / 10 : ""} placeholder="Fibre g" />
              <input className="field md:col-span-2" name="nutritionSource" defaultValue={meal.nutritionSource} />
              <input className="field" name="defaultPortions" defaultValue={meal.defaultPortions} />
              <label className="text-sm"><input type="checkbox" name="published" defaultChecked={meal.published} /> Published</label>
              <label className="text-sm"><input type="checkbox" name="available" defaultChecked={meal.available} /> Available</label>
              <label className="text-sm"><input type="checkbox" name="popular" defaultChecked={meal.isPopular} /> Popular</label>
              <button className="btn btn-forest">Save meal</button>
            </form>
          </details>
        ))}
      </div>
      <form className="store-card mt-6 grid gap-2 p-4 md:grid-cols-2" method="post" action="/api/admin/actions">
        <h2 className="md:col-span-2 text-xl text-[#1A4A16]">Build Your Own Bowl component</h2>
        <p className="md:col-span-2 text-sm text-[#6A5A4E]">Add only components the kitchen has priced. The base bowl stays ₹120 until you change that meal.</p>
        <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="save_bowl_component" /><input type="hidden" name="returnTo" value="/admin/menu" />
        <input className="field" name="name" placeholder="Component name" required />
        <input className="field" name="price" placeholder="Extra price ₹" required />
        <select className="field" name="group"><option value="base">Base</option><option value="protein">Protein</option><option value="vegetable">Vegetables</option><option value="sauce">Sauce</option><option value="extra">Add-on</option></select>
        <button className="btn btn-forest">Add component</button>
      </form>
      <form className="store-card mt-6 grid gap-2 p-4 md:grid-cols-2" method="post" action="/api/admin/actions">
        <h2 className="md:col-span-2 text-xl text-[#1A4A16]">New meal</h2>
        <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="save_meal" /><input type="hidden" name="returnTo" value="/admin/menu" />
        <input className="field" name="name" placeholder="Name" required />
        <input className="field" name="price" placeholder="Price ₹" required />
        <select className="field" name="mealType"><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option></select>
        <input className="field" name="description" placeholder="Description" />
        <input className="field md:col-span-2" name="imageUrl" placeholder="Image URL" />
        <label className="text-sm"><input type="checkbox" name="imageIsPlaceholder" defaultChecked /> Placeholder photo</label>
        <label className="text-sm"><input type="checkbox" name="published" defaultChecked /> Published</label>
        <label className="text-sm"><input type="checkbox" name="available" defaultChecked /> Available</label>
        <button className="btn btn-accent">Add meal</button>
      </form>
    </div>
  );
}
