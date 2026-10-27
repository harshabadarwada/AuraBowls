import type { Metadata } from "next";
import { Stage } from "@/components/stage";
import { getSettings } from "@/server/catalog";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();
  const phone = settings?.supportWhatsapp || "";
  const href = phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent("Hello AuraBowls, I need some help.")}` : "";
  return (
    <article>
      <Stage eyebrow="Support" title="Contact" copy="WhatsApp is the support channel for order questions, meal changes, delivery changes, and data requests. Opening the link does not send a message." />
      {href ? <a className="btn btn-accent mt-6" href={href}>Open WhatsApp</a> : <p className="mt-6 text-sm">Add a WhatsApp number in Admin → Settings before this button can open a chat.</p>}
      {settings?.email ? <p className="mt-4 text-sm">{settings.email}</p> : null}
    </article>
  );
}
