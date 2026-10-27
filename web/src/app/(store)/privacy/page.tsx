import type { Metadata } from "next";
import { Stage } from "@/components/stage";
export const metadata: Metadata = { title: "Privacy" };
export default function PrivacyPage() {
  return (
    <article className="prose-page space-y-3 text-sm leading-7 text-[#6A5A4E]">
      <Stage eyebrow="Policies" title="Privacy" copy="This is a starter notice. Have it reviewed before production use." />
      <p className="max-w-2xl">AuraBowls collects your name, mobile number, delivery address, order details, and optional allergy notes so it can prepare and deliver meals. Phone verification codes are stored as hashes and expire. Tracking links are unguessable secrets. They are not sequential order numbers.</p>
      <p>Payment card details are handled by the payment gateway. AuraBowls stores the gateway reference, amount, and status. Addresses are not shown on the tracking page.</p>
      <p>To ask for a copy or deletion of eligible personal data, message the WhatsApp support number and include the phone number on the order. The team confirms it is you before changing records. Issued invoices may be retained. Future deliveries must be finished or cancelled before a profile can be anonymized.</p>
    </article>
  );
}
