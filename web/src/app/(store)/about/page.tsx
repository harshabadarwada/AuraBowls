import type { Metadata } from "next";
import { Stage } from "@/components/stage";

export const metadata: Metadata = { title: "About", description: "AuraBowls makes fresh breakfast and lunch for everyday routines." };

export default function AboutPage() {
  return (
    <article className="space-y-4">
      <Stage eyebrow="AuraBowls" title="About" copy="Fresh, balanced meals for everyday living. Breakfast and lunch are open. Dinner stays closed until the kitchen opens it." />
      <p className="max-w-2xl leading-7 text-[#6A5A4E]">You can look through the menu before entering a phone number or address. A delivery PIN is checked when an order starts, and the full address is checked again before the order is created.</p>
      <p className="leading-7 text-[#6A5A4E]">Meals are food, not medical advice. Nutrition numbers appear only when the kitchen has entered them, and estimates are labelled as estimates.</p>
    </article>
  );
}
