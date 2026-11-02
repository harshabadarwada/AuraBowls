import type { Metadata } from "next";
import { Stage } from "@/components/stage";
import { JsonLd, breadcrumbJsonLd, businessPhoneDisplay, pageMeta, servedPin } from "@/lib/seo";
import { getSettings } from "@/server/catalog";

export const metadata: Metadata = pageMeta({
  title: "Contact Aura Bowls Madhapur",
  description: `Message Aura Bowls on WhatsApp at ${businessPhoneDisplay} for menu, meal-plan and delivery questions in Madhapur PIN ${servedPin}, Hyderabad. Opening the chat does not send a message.`,
  path: "/contact",
});

export default async function ContactPage() {
  const settings = await getSettings();
  const phone = settings?.supportWhatsapp || "";
  const href = phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent("Hello AuraBowls, I need some help.")}` : "";
  return (
    <article>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <Stage eyebrow="Support · Madhapur" title="Contact" copy="WhatsApp is the support channel for order questions, meal changes, delivery changes, and data requests. Opening the link does not send a message." />
      <dl className="mt-6 max-w-xl space-y-3 text-sm leading-6 text-[#6A5A4E]">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">Kitchen</dt>
          <dd>AuraBowls, Madhapur, Hyderabad, Telangana {servedPin}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">WhatsApp</dt>
          <dd>{businessPhoneDisplay}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">Hours</dt>
          <dd>Monday to Saturday. Breakfast 7:30–10:30 am. Lunch 12:00–3:00 pm.</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">Delivery</dt>
          <dd>PIN {servedPin} only. Madhapur and nearby, including Hitech City. Other PINs get an enquiry, not an order.</dd>
        </div>
      </dl>
      {href ? <a className="btn btn-accent mt-6" href={href}>Open WhatsApp</a> : <p className="mt-6 text-sm">Add a WhatsApp number in Admin → Settings before this button can open a chat.</p>}
      {settings?.email ? <p className="mt-4 text-sm">{settings.email}</p> : null}
    </article>
  );
}
