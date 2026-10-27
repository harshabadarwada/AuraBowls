import { NextResponse } from "next/server";
import { OrderError, previewSchedule, previewSchema } from "@/server/ordering";

export async function POST(request: Request) {
  const parsed = previewSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Choose a start date, PIN, and delivery slot." }, { status: 400 });
  try {
    return NextResponse.json(await previewSchedule(parsed.data));
  } catch (error) {
    if (error instanceof OrderError) return NextResponse.json({ message: error.message, code: error.code }, { status: 409 });
    throw error;
  }
}
