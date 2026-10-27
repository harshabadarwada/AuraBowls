import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/server/otp";

const schema = z.object({ phone: z.string(), channel: z.enum(["whatsapp", "sms"]).default("whatsapp") });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Enter a mobile number." }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const result = await sendOtp(parsed.data.phone, parsed.data.channel, createHash("sha256").update(ip).digest("hex"));
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
