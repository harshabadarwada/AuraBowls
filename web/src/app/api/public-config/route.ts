import { NextResponse } from "next/server";
import { otpDevReveal, paymentMode, smsConfigured, whatsappConfigured } from "@/lib/config";
import { getSettings } from "@/server/catalog";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    paymentMode: paymentMode(),
    otpDevReveal: otpDevReveal(),
    whatsappOtp: whatsappConfigured(),
    smsOtp: smsConfigured(),
    supportWhatsapp: settings?.supportWhatsapp || "",
    brandName: settings?.brandName || "AuraBowls",
    dinnerEnabled: settings?.dinnerEnabled || false,
  });
}
