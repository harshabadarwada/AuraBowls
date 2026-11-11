import type { Metadata } from "next";
import { TomorrowBowl } from "@/components/tomorrow-bowl";
import { businessWhatsapp } from "@/lib/order-message";
import { DAILY_CUTOFF } from "@/lib/power-bowls";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { getSettings } from "@/server/catalog";

export const metadata: Metadata = pageMeta({
  title: `Change a lunch before ${DAILY_CUTOFF}`,
  description: `Already on an Aura Bowls lunch plan? Send a different bowl before ${DAILY_CUTOFF} Asia/Kolkata. If we do not hear from you, we cook the bowl on your plan.`,
  path: "/plans/tomorrow",
});

export default async function TomorrowPage() {
  const settings = await getSettings().catch(() => null);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Meal plans", path: "/plans" }, { name: "Change a lunch", path: "/plans/tomorrow" }])} />
      <TomorrowBowl whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />
    </>
  );
}
