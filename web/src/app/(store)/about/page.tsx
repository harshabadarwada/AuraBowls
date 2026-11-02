import type { Metadata } from "next";
import { Stage } from "@/components/stage";
import { JsonLd, breadcrumbJsonLd, businessPhoneDisplay, pageMeta, servedPin } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "About Aura Bowls Hyderabad",
  description: "Aura Bowls is a healthy meal kitchen in Madhapur, Hyderabad. We cook protein bowls, oats, salads and juices for PIN 500081, including Hitech City. We are not the singing-bowl shop at aurabowls.com.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <article className="space-y-4">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <Stage eyebrow="AuraBowls · Madhapur" title="About" copy="Fresh breakfast and lunch bowls for everyday living in Madhapur. Dinner stays closed until the kitchen opens it." />
      <p className="max-w-2xl leading-7 text-[#6A5A4E]">
        Aura Bowls cooks veg and non-veg protein bowls, healthy biryani bowls, overnight oats, salads, juices, buttermilk and bites, then delivers them in Madhapur and nearby PIN {servedPin}, including Hitech City. You can browse the menu before sharing a phone number. A PIN check happens when an order starts, and the full address is checked again before the kitchen confirms.
      </p>
      <p className="max-w-2xl leading-7 text-[#6A5A4E]">
        Breakfast arrives between 7:30 and 10:30 am and lunch between 12:00 and 3:00 pm, Monday to Saturday. Custom bowls start at ₹120. Meal plans cover one day, five weekdays, or twenty weekdays. Orders go to us on WhatsApp at {businessPhoneDisplay}. Delivery charges vary by location and are not included in menu prices.
      </p>
      <p className="max-w-2xl leading-7 text-[#6A5A4E]">
        We are a food kitchen in Hyderabad. We are not AuraBowls the Tibetan singing-bowl shop, and we are not Aura Cafe in Jubilee Hills.
      </p>
      <p className="leading-7 text-[#6A5A4E]">Meals are food, not medical advice. Nutrition numbers appear only when the kitchen has entered them, and estimates are labelled as estimates.</p>
    </article>
  );
}
