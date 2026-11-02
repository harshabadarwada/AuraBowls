import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { brand, shareImage } from "@/lib/seo";
import { publicSiteUrl } from "@/lib/site";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-display" });

const description =
  "Aura Bowls delivers healthy protein bowls, biryani bowls, overnight oats, salads and juices in Madhapur and nearby PIN 500081, Hyderabad. Veg and non-veg. Custom bowls from ₹120. Order on WhatsApp.";

export const metadata: Metadata = {
  metadataBase: publicSiteUrl(),
  applicationName: brand,
  title: { default: "Protein Bowls Delivered in Madhapur | Aura Bowls Hyderabad", template: "%s · AuraBowls" },
  description,
  category: "food",
  keywords: [
    "protein bowls Madhapur",
    "healthy food delivery Hyderabad",
    "salad bowl Hitech City",
    "custom bowl Madhapur",
    "meal plan Madhapur",
    "overnight oats Hyderabad",
    "Aura Bowls",
  ],
  authors: [{ name: brand }],
  creator: brand,
  publisher: brand,
  openGraph: { type: "website", siteName: brand, locale: "en_IN", images: [{ url: shareImage, alt: "AuraBowls Paneer Power Bowl, delivered in Madhapur" }] },
  twitter: { card: "summary_large_image", images: [shareImage] },
  icons: { icon: "/aura-logo.png", apple: "/aura-logo.png" },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = { themeColor: "#1A4A16" };

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className={`${sans.variable} ${display.variable} antialiased`}>{children}</body>
    </html>
  );
}
