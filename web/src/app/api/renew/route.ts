import { NextResponse } from "next/server";
import { z } from "zod";
import { orderByToken } from "@/server/ordering";

const schema = z.object({ token: z.string().min(20) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Tracking link required." }, { status: 400 });
  const order = await orderByToken(parsed.data.token);
  if (!order) return NextResponse.json({ message: "Tracking link not found." }, { status: 404 });
  const active = order.deliveries.filter((delivery) => !["cancelled", "rescheduled"].includes(delivery.status));
  return NextResponse.json({
    planSlug: order.planSlug,
    planName: order.planName,
    mealType: order.mealType,
    cadence: order.cadence,
    remaining: active.filter((delivery) => delivery.status === "scheduled" || delivery.status === "preparing").length,
    pattern: active.map((delivery) => ({
      mealId: delivery.items[0]?.mealId,
      quantity: delivery.items[0]?.quantity || 1,
      addonNames: JSON.parse(delivery.items[0]?.addonsJson || "[]").map((addon: { name: string }) => addon.name),
      note: delivery.notes,
      slotId: delivery.slotId,
    })),
  });
}
