import type { Metadata } from "next";
import { Stage } from "@/components/stage";

export const metadata: Metadata = { title: "Track order", robots: { index: false, follow: false } };

export default function TrackLookupPage() {
  return (
    <Stage eyebrow="Orders" title="Track an order" copy="Open the private link from your payment confirmation. Order numbers alone do not unlock an order. If you lost the link, message AuraBowls on WhatsApp and the team can issue a new one after confirming it is you." />
  );
}
