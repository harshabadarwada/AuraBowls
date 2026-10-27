import { db } from "@/lib/db";
import { guard } from "@/server/guard";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await guard();
  const settings = await db().businessSettings.findUniqueOrThrow({ where: { id: "default" } });
  const error = (await searchParams).error;
  return (
    <form className="store-card grid gap-3 p-5" method="post" action="/api/admin/actions">
      <h1 className="text-3xl text-[#1A4A16]">Settings</h1>
      {error ? <p className="text-sm text-[#7a3410]">{error}</p> : null}
      <input type="hidden" name="csrf" value={session.csrf} /><input type="hidden" name="type" value="save_settings" /><input type="hidden" name="returnTo" value="/admin/settings" />
      <label className="text-sm">Legal name<input className="field mt-1" name="legalName" defaultValue={settings.legalName} /></label>
      <label className="text-sm">Brand name<input className="field mt-1" name="brandName" defaultValue={settings.brandName} /></label>
      <label className="text-sm">Business address<textarea className="field mt-1" name="address" defaultValue={settings.address} /></label>
      <label className="text-sm">Support email<input className="field mt-1" name="email" defaultValue={settings.email} /></label>
      <label className="text-sm">Support phone<input className="field mt-1" name="supportPhone" defaultValue={settings.supportPhone} /></label>
      <label className="text-sm">WhatsApp number<input className="field mt-1" name="supportWhatsapp" defaultValue={settings.supportWhatsapp} placeholder="91XXXXXXXXXX" /></label>
      <label className="text-sm">High-protein threshold (grams)<input className="field mt-1" name="proteinGoalMinG" defaultValue={settings.proteinGoalMinG} /></label>
      <label className="text-sm">Operating weekdays, 0=Sun<input className="field mt-1" name="operatingWeekdays" defaultValue={settings.operatingWeekdays} /></label>
      <label className="text-sm"><input type="checkbox" name="dinnerEnabled" defaultChecked={settings.dinnerEnabled} /> Dinner is open</label>
      <label className="text-sm"><input type="checkbox" name="sheetsSyncEnabled" defaultChecked={settings.sheetsSyncEnabled} /> Export new paid orders to Google Sheets</label>
      <p className="text-xs text-[#6A5A4E]">New orders are saved without a tax line. Older paid orders keep the amounts already recorded. Confirm the business tax position separately before launch. Sheets export is one-way from this database.</p>
      <button className="btn btn-accent w-fit">Save settings</button>
    </form>
  );
}
