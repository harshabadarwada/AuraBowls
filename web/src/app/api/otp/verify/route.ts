import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/server/otp";

const schema = z.object({ verificationId: z.string(), phone: z.string(), code: z.string().min(4).max(8) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Enter the code." }, { status: 400 });
  const result = await verifyOtp(parsed.data.verificationId, parsed.data.phone, parsed.data.code);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
