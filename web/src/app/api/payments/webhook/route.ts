import { NextResponse } from "next/server";
import { handleRazorpayWebhook, PaymentError } from "@/server/payments";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  try {
    return NextResponse.json(await handleRazorpayWebhook(raw, signature));
  } catch (error) {
    if (error instanceof PaymentError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
