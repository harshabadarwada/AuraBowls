import { NextResponse } from "next/server";
import { z } from "zod";
import { exportKitchenSheet } from "@/server/sheets";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().min(4).max(240),
  area: z.string().trim().max(120),
  mealType: z.enum(["Pure Veg", "Pure Non-Veg", "Mixed"]),
  days: z.number().int().min(1).max(31),
  startDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalPaise: z.number().int().nonnegative(),
  slot: z.string().trim().max(40).optional(),
  style: z.string().trim().max(40).optional(),
  defaultBowl: z.string().trim().max(80).optional(),
  schedule: z.string().trim().max(4000).optional(),
  note: z.string().trim().max(240).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "The kitchen sheet is missing order details." }, { status: 400 });
  const result = await exportKitchenSheet(parsed.data);
  return NextResponse.json({ ok: true, saved: result.status === "exported", status: result.status, orderId: result.orderId });
}
