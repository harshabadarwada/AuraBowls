import type { Metadata } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-display" });

function siteUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: "AuraBowls", template: "%s · AuraBowls" },
  description: "Fresh, balanced meals for everyday living. Choose breakfast or lunch, set a delivery schedule, and pay only after you review the total.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} antialiased`}>{children}</body>
    </html>
  );
}
