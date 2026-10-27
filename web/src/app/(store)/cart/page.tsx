import type { Metadata } from "next";
import { MenuCart } from "@/components/menu-cart";
import { businessWhatsapp } from "@/lib/order-message";
import { getSettings } from "@/server/catalog";

export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };

export default async function CartPage() {
  const settings = await getSettings().catch(() => null);
  return <MenuCart whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />;
}
