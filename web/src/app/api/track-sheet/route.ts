import { NextResponse } from "next/server";
import { z } from "zod";
import { KITCHEN_SHEET_WEBHOOK } from "@/lib/kitchen-sheet";
import { localDigits } from "@/lib/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ phone: z.string().trim().max(20) });

type SheetDay = { date: string; weekday: string; bowl: string; delivered: boolean; status: string };
type SheetOrder = { orderId: string; name: string; plan: string; startDate: string; payment: string; status: string; days: SheetDay[] };

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ message: "Enter the mobile number used on the order." }, { status: 400 });
    const phone = localDigits(parsed.data.phone);
    if (phone.length !== 10) return NextResponse.json({ message: "Enter a 10-digit mobile number." }, { status: 400 });
    const webhook = process.env.GOOGLE_SHEETS_WEBHOOK || KITCHEN_SHEET_WEBHOOK;
    const response = await fetch(`${webhook}?phone=${encodeURIComponent(phone)}`, { redirect: "follow" });
    const text = await response.text();
    const data = JSON.parse(text.trim() || "{}") as { status?: string; message?: string; orders?: SheetOrder[] };
    if (data.status === "error") return NextResponse.json({ message: data.message || "Orders could not be loaded." }, { status: 400 });
    return NextResponse.json({ orders: Array.isArray(data.orders) ? data.orders.slice(0, 12) : [] });
  } catch {
    return NextResponse.json({ message: "Orders could not be loaded from the kitchen tracker yet." }, { status: 502 });
  }
}
