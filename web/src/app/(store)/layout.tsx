import { Footer, Header, MobileNav } from "@/components/chrome";
import { businessWhatsapp } from "@/lib/order-message";
import { getSettings } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings().catch(() => null);
  return (
    <>
      <Header />
      <main id="content" className="mx-auto min-h-[70vh] min-w-0 max-w-7xl overflow-x-clip px-5 py-8 pb-24 sm:px-8 md:pb-16">{children}</main>
      <Footer whatsapp={businessWhatsapp(settings?.supportWhatsapp || "")} />
      <MobileNav />
    </>
  );
}
