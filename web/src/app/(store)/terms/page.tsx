import type { Metadata } from "next";
import { Stage } from "@/components/stage";
export const metadata: Metadata = { title: "Terms" };
export default function TermsPage() {
  return (
    <article className="space-y-3 text-sm leading-7 text-[#6A5A4E]">
      <Stage eyebrow="Policies" title="Terms" copy="This is a starter agreement. Have it reviewed before production use." />
      <p>An order is created as pending. Payment confirmation and kitchen acceptance are separate. A successful payment does not by itself mean the kitchen has accepted every delivery.</p>
      <p>Menu prices can change for future orders. An order keeps the prices confirmed at checkout. Plan discounts are calculated from current menu prices of the default meals and are shown before payment.</p>
      <p>Delivery is limited to configured service areas. A PIN match follows the coverage rule stored for that PIN. It is not a promise that every address inside a broader area is served when coverage is more specific.</p>
    </article>
  );
}
