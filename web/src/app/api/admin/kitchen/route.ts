import { NextResponse } from "next/server";
import { currentAdmin } from "@/server/auth";
import { db } from "@/lib/db";
import { businessToday } from "@/lib/time";

export async function GET(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  const date = new URL(request.url).searchParams.get("date") || businessToday();
  const deliveries = await db().scheduledDelivery.findMany({
    where: { date, status: { notIn: ["cancelled", "rescheduled"] } },
    include: { items: true, order: true },
    orderBy: { slotStart: "asc" },
  });
  const header = ["order", "customer", "slot", "meal", "qty", "addons", "notes", "allergies", "status"];
  const lines = deliveries.flatMap((delivery) =>
    delivery.items.map((item) =>
      [delivery.order.reference, delivery.order.customerName, delivery.slotLabel, item.nameSnapshot, String(item.quantity), item.addonsJson, item.customizationNote, delivery.order.allergyNotes, delivery.status]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    ),
  );
  return new NextResponse([header.join(","), ...lines].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="kitchen-${date}.csv"` },
  });
}
