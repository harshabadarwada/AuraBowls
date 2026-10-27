import { NextResponse } from "next/server";
import { CapacityError } from "@/server/capacity";
import { checkoutSchema, OrderError, placeOrder } from "@/server/ordering";

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Check the delivery details and try again." }, { status: 400 });
  try {
    return NextResponse.json(await placeOrder(parsed.data));
  } catch (error) {
    if (error instanceof OrderError || error instanceof CapacityError) {
      const extra = error instanceof OrderError ? { code: error.code, quote: error.quote, dates: error.dates } : { code: "capacity" };
      return NextResponse.json({ message: error.message, ...extra }, { status: 409 });
    }
    throw error;
  }
}
