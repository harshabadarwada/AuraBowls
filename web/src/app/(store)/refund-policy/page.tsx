import type { Metadata } from "next";
import { Stage } from "@/components/stage";
export const metadata: Metadata = { title: "Cancellation and refunds" };
export default function RefundPolicyPage() {
  return (
    <article className="space-y-3 text-sm leading-7 text-[#6A5A4E]">
      <Stage eyebrow="Policies" title="Cancellation and refunds" copy="This is a starter policy. Confirm it against the business's legal and payment obligations before production use." />
      <p>Meal changes and skips need to be requested at least 24 hours before the delivery slot, in Asia/Kolkata. Later changes are manual and are not promised automatically.</p>
      <p>Skipping a day moves that delivery to a later eligible date when the kitchen approves it. A skip is not automatically turned into a refund or store credit.</p>
      <p>Refunds are calculated from the prices stored on the order. Completed deliveries and deliveries inside the cutoff are not automatically refundable. An admin reviews every refund before it is sent to the payment gateway.</p>
    </article>
  );
}
