import { NextResponse } from "next/server";
import { draftSchema, OrderError, quoteDraft } from "@/server/ordering";

export async function POST(request: Request) {
  const parsed = draftSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "The order draft is incomplete." }, { status: 400 });
  try {
    return NextResponse.json(await quoteDraft(parsed.data));
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ message: error.message, code: error.code, dates: error.dates, quote: error.quote }, { status: 409 });
    }
    throw error;
  }
}
