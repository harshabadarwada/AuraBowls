import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const slots = await db().deliverySlot.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return <CheckoutForm slots={slots.map((slot) => ({ id: slot.id, label: slot.label, mealType: slot.mealType }))} />;
}
