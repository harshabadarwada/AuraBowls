import { NextResponse } from "next/server";
import { z } from "zod";
import { completeSimulatorPayment, PaymentError } from "@/server/payments";

const schema = z.object({ token: z.string().min(20), nonce: z.string().min(10) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Simulator payment was incomplete." }, { status: 400 });
  try {
    return NextResponse.json(await completeSimulatorPayment(parsed.data.token, parsed.data.nonce));
  } catch (error) {
    if (error instanceof PaymentError) return NextResponse.json({ message: error.message, code: error.code }, { status: 409 });
    throw error;
  }
}
