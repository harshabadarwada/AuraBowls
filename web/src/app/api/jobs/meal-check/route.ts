import { NextResponse } from "next/server";
import { runMealChecks } from "@/server/meal-check";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Not allowed." }, { status: 401 });
  }
  const counts = await runMealChecks();
  return NextResponse.json(counts);
}
