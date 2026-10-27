import { createSign } from "crypto";
import { sheetsConfigured } from "@/lib/config";
import { db } from "@/lib/db";

/**
 * Source of truth is the application database.
 * Sheets receive a one-way operational export after a captured payment.
 * Edits made in the sheet are not imported back.
 */
export async function exportOrderRow(orderId: string) {
  const order = await db().order.findUnique({
    where: { id: orderId },
    include: { deliveries: { include: { items: true }, orderBy: { date: "asc" } } },
  });
  if (!order) return { status: "skipped" as const };
  const settings = await db().businessSettings.findUnique({ where: { id: "default" } });
  if (!sheetsConfigured() || !settings?.sheetsSyncEnabled) {
    await db().sheetsSyncLog.create({
      data: {
        direction: "db_to_sheet",
        entity: order.reference,
        status: "skipped",
        detail: "Sheets export is off, or the service account is not configured. The database remains the source of truth.",
      },
    });
    return { status: "skipped" as const };
  }
  try {
    const token = await googleAccessToken();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const row = [
      order.reference,
      order.createdAt.toISOString(),
      order.status,
      order.customerName,
      order.customerPhone,
      order.planName,
      (order.totalPaise / 100).toFixed(2),
      String(order.deliveries.length),
      order.deliveries.map((delivery) => `${delivery.date} ${delivery.items.map((item) => item.nameSnapshot).join("/")}`).join(" | "),
    ];
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] }),
      },
    );
    if (!response.ok) throw new Error(`Sheets responded ${response.status}`);
    await db().sheetsSyncLog.create({
      data: { direction: "db_to_sheet", entity: order.reference, status: "exported", detail: "Appended to Orders." },
    });
    return { status: "exported" as const };
  } catch (error) {
    await db().sheetsSyncLog.create({
      data: {
        direction: "db_to_sheet",
        entity: order.reference,
        status: "failed",
        detail: error instanceof Error ? error.message : "Sync failed",
      },
    });
    return { status: "failed" as const };
  }
}

export async function exportConfirmationRow(input: {
  delivery: { date: string; slotLabel: string; order: { reference: string; customerName: string; customerPhone: string } };
  meal: string;
  decision: string;
  reply: string;
  detail: string;
}) {
  const entity = `${input.delivery.order.reference} ${input.delivery.date}`;
  const settings = await db().businessSettings.findUnique({ where: { id: "default" } });
  if (!sheetsConfigured() || !settings?.sheetsSyncEnabled) {
    await db().sheetsSyncLog.create({
      data: { direction: "db_to_sheet", entity, status: "skipped", detail: `${input.decision}. ${input.detail} Sheets export is off.` },
    });
    return;
  }
  try {
    const token = await googleAccessToken();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const row = [input.delivery.date, input.delivery.slotLabel, input.delivery.order.reference, input.delivery.order.customerName, input.delivery.order.customerPhone, input.meal, input.decision, input.reply, input.detail, new Date().toISOString()];
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Confirmations!A1:append?valueInputOption=USER_ENTERED`,
      { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ values: [row] }) },
    );
    if (!response.ok) throw new Error(`Sheets responded ${response.status}`);
    await db().sheetsSyncLog.create({ data: { direction: "db_to_sheet", entity, status: "exported", detail: input.decision } });
  } catch (error) {
    await db().sheetsSyncLog.create({
      data: { direction: "db_to_sheet", entity, status: "failed", detail: error instanceof Error ? error.message : "Confirmation sync failed" },
    });
  }
}

async function googleAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const key = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const assertion = `${unsigned}.${signer.sign(key).toString("base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const json = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !json.access_token) throw new Error(json.error || "Google authentication failed");
  return json.access_token;
}
