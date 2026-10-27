import { NextResponse } from "next/server";
import { z } from "zod";
import { PaymentError, verifyRazorpayPayment } from "@/server/payments";

const schema = z.object({
  token: z.string().min(20),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Payment confirmation was incomplete." }, { status: 400 });
  try {
    const { token, ...payload } = parsed.data;
    return NextResponse.json(await verifyRazorpayPayment(token, payload));
  } catch (error) {
    if (error instanceof PaymentError) return NextResponse.json({ message: error.message, code: error.code }, { status: 409 });
    throw error;
  }
}
