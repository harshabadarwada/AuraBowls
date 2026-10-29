import type { Metadata } from "next";
import { BowlBuilder } from "@/components/bowl-builder";
import { Stage } from "@/components/stage";
import { businessWhatsapp } from "@/lib/order-message";
import { getSettings } from "@/server/catalog";

export const metadata: Metadata = { title: "Build your bowl" };

export default async function BuildBowlPage() {
  const settings = await getSettings().catch(() => null);
  return (
    <div>
      <Stage
        eyebrow="From ₹120"
        title="Build Your Own Bowl"
        copy="Choose veg or non-veg, then a base, protein, veggies, sauce and extras. The price updates as you pick, and the order goes to us on WhatsApp."
      />
      <BowlBuilder whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />
    </div>
  );
}
