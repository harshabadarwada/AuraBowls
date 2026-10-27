import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { applyMealReply } from "@/server/meal-check";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!token || url.searchParams.get("hub.verify_token") !== token) {
    return new NextResponse("Not allowed", { status: 403 });
  }
  return new NextResponse(url.searchParams.get("hub.challenge") || "", { status: 200 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256") || "";
    const expected = `sha256=${createHmac("sha256", appSecret).update(raw).digest("hex")}`;
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      return NextResponse.json({ message: "Bad signature." }, { status: 401 });
    }
  }
  let body: {
    entry?: { changes?: { value?: { messages?: { from?: string; id?: string; type?: string; text?: { body?: string } }[] } }[] }[];
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      for (const message of change.value?.messages || []) {
        if (message.type !== "text" || !message.from || !message.id || !message.text?.body) continue;
        await applyMealReply(message.from, message.text.body, message.id);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
