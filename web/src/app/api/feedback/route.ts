import { NextResponse } from "next/server";
import { z } from "zod";
import { orderByToken } from "@/server/ordering";
import { db } from "@/lib/db";

const schema = z.object({
  token: z.string().min(20),
  deliveryId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(800).optional().default(""),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Choose a rating from 1 to 5." }, { status: 400 });
  const order = await orderByToken(parsed.data.token);
  const delivery = order?.deliveries.find((item) => item.id === parsed.data.deliveryId);
  if (!order || !delivery) return NextResponse.json({ message: "That delivery could not be found." }, { status: 404 });
  if (delivery.status !== "delivered") return NextResponse.json({ message: "You can rate a delivery after it is marked delivered." }, { status: 409 });
  if (delivery.feedback) return NextResponse.json({ message: "This delivery already has feedback." }, { status: 409 });
  await db().feedback.create({
    data: {
      orderId: order.id,
      deliveryId: delivery.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment?.trim() || "",
      mealName: delivery.items.map((item) => item.nameSnapshot).join(", "),
    },
  });
  return NextResponse.json({ ok: true });
}
