import type { Metadata } from "next";
import { BowlBuilder } from "@/components/bowl-builder";
import { Stage } from "@/components/stage";
import { businessWhatsapp } from "@/lib/order-message";
import { JsonLd, breadcrumbJsonLd, howToBuildJsonLd, pageMeta } from "@/lib/seo";
import { getSettings } from "@/server/catalog";

export const metadata: Metadata = pageMeta({
  title: "Build Your Own Bowl in Madhapur from ₹120",
  description: "Custom veg or non-veg bowls in Madhapur from ₹120. Pick a base, protein portions from ₹40 to ₹120, veggies, a sauce, and extras at ₹40 or ₹50. The order goes to Aura Bowls on WhatsApp.",
  path: "/bowls/build",
});

export default async function BuildBowlPage() {
  const settings = await getSettings().catch(() => null);
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Menu", path: "/menu" }, { name: "Build your bowl", path: "/bowls/build" }])} />
      <JsonLd data={howToBuildJsonLd()} />
      <Stage
        eyebrow="From ₹120 · Madhapur"
        title="Build Your Own Bowl"
        copy="Choose veg or non-veg, then a base, protein, veggies, sauce and extras. The price updates as you pick, and the order goes to us on WhatsApp in PIN 500081."
      />
      <BowlBuilder whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />
    </div>
  );
}
