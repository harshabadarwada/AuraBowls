import type { Metadata } from "next";
import { TomorrowBowl } from "@/components/tomorrow-bowl";
import { businessWhatsapp } from "@/lib/order-message";
import { DAILY_CUTOFF } from "@/lib/power-bowls";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { getSettings } from "@/server/catalog";

export const metadata: Metadata = pageMeta({
  title: `Sheet update before ${DAILY_CUTOFF}`,
  description: `Sheet update is where daily bowl changes show. Send Aura Bowls the lunch bowl you want before ${DAILY_CUTOFF} Asia/Kolkata. If the kitchen does not get a message, they cook your default plan bowl.`,
  path: "/plans/tomorrow",
});

export default async function TomorrowPage() {
  const settings = await getSettings().catch(() => null);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Meal plans", path: "/plans" }, { name: "Sheet update", path: "/plans/tomorrow" }])} />
      <TomorrowBowl whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />
    </>
  );
}
