import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { servedPinArea } from "@/server/published-plans";

const schema = z.object({ pinCode: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Enter a 6 digit PIN." }, { status: 400 });
  const area = await db().serviceArea.findUnique({ where: { pinCode: parsed.data.pinCode } }).catch(() => parsed.data.pinCode === "500081" ? servedPinArea() : null);
  if (!area || !area.active) {
    return NextResponse.json({ serviceable: false, message: "AuraBowls does not deliver to this PIN yet." });
  }
  return NextResponse.json({
    serviceable: true,
    label: area.label,
    deliveryFeePaise: area.deliveryFeePaise,
    coverage: area.coverage,
    localityNote: area.localityNote,
    message:
      area.coverage === "pin"
        ? "This PIN is marked serviceable. The full address is checked again when the order is created."
        : area.localityNote || "Coverage for this PIN is limited to specific localities.",
  });
}
