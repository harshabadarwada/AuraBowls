import { NextResponse } from "next/server";
import { z } from "zod";
import { PaymentError, startPayment } from "@/server/payments";
import { sweepExpired } from "@/server/ordering";

const schema = z.object({ token: z.string().min(20) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Missing payment token." }, { status: 400 });
  try {
    await sweepExpired();
    return NextResponse.json(await startPayment(parsed.data.token));
  } catch (error) {
    if (error instanceof PaymentError) return NextResponse.json({ message: error.message, code: error.code }, { status: 409 });
    throw error;
  }
}
