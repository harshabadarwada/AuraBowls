import { createSign } from "crypto";
import { sheetsConfigured } from "@/lib/config";
import { db } from "@/lib/db";
import { KITCHEN_SHEET_WEBHOOK, KITCHEN_SPREADSHEET_ID, trackerOrder, type TrackerOrder, type TrackerOrderInput } from "@/lib/kitchen-sheet";

/**
 * Subscription WhatsApp orders go to the bound Apps Script on Subscription Orders.
 * Paid checkout still exports separately when sheets sync is on.
 */
export function kitchenSpreadsheetId(stored = "") {
  return process.env.GOOGLE_SHEETS_SPREADSHEET_ID || stored || KITCHEN_SPREADSHEET_ID;
}

export async function exportKitchenSheet(input: TrackerOrderInput) {
  const order = trackerOrder(input);
  let webhook = process.env.GOOGLE_SHEETS_WEBHOOK || KITCHEN_SHEET_WEBHOOK;
  try {
    const settings = await db().businessSettings.findUnique({ where: { id: "default" } });
    webhook = process.env.GOOGLE_SHEETS_WEBHOOK || settings?.sheetsWebhookUrl || webhook;
  } catch {
    // Kitchen logging must not depend on the app database.
  }
  if (!webhook) return { status: "skipped" as const, orderId: order.orderId };
  try {
    await postWebhook(webhook, order);
    return { status: "exported" as const, orderId: order.orderId };
  } catch (error) {
    return { status: "failed" as const, orderId: order.orderId, error: error instanceof Error ? error.message : "Kitchen sheet sync failed" };
  }
}

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
    const spreadsheetId = kitchenSpreadsheetId(settings.sheetsSpreadsheetId);
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
    await appendRow(token, spreadsheetId, "Orders", row);
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
    const spreadsheetId = kitchenSpreadsheetId(settings.sheetsSpreadsheetId);
    const row = [input.delivery.date, input.delivery.slotLabel, input.delivery.order.reference, input.delivery.order.customerName, input.delivery.order.customerPhone, input.meal, input.decision, input.reply, input.detail, new Date().toISOString()];
    await appendRow(token, spreadsheetId, "Confirmations", row);
    await db().sheetsSyncLog.create({ data: { direction: "db_to_sheet", entity, status: "exported", detail: input.decision } });
  } catch (error) {
    await db().sheetsSyncLog.create({
      data: {
        direction: "db_to_sheet",
        entity,
        status: "failed",
        detail: error instanceof Error ? error.message : "Confirmation sync failed",
      },
    });
  }
}

function quotedRange(tab: string, cell = "A1") {
  return `'${tab.replace(/'/g, "''")}'!${cell}`;
}

async function postWebhook(url: string, body: TrackerOrder) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
    redirect: "manual",
  });
  if (response.status === 302 || response.status === 303 || response.status === 0 || response.ok) return;
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("<")) throw new Error(`Kitchen sheet webhook responded ${response.status}`);
  const data = JSON.parse(trimmed) as { status?: string; message?: string };
  if (data.status === "error") throw new Error(data.message || "Kitchen sheet webhook returned an error");
}

async function ensureTab(token: string, spreadsheetId: string, tab: string, headers: string[]) {
  const meta = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meta.ok) throw new Error(`Sheets responded ${meta.status}`);
  const data = (await meta.json()) as { sheets?: { properties?: { title?: string } }[] };
  const titles = (data.sheets || []).map((sheet) => sheet.properties?.title);
  if (!titles.includes(tab)) {
    const created = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab } } }] }),
    });
    if (!created.ok) throw new Error(`Sheets responded ${created.status}`);
  }
  const encoded = encodeURIComponent(quotedRange(tab, "A1:A1"));
  const existing = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encoded}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!existing.ok) throw new Error(`Sheets responded ${existing.status}`);
  const values = (await existing.json()) as { values?: string[][] };
  if (values.values?.[0]?.[0]) return;
  const wrote = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedRange(tab, "A1"))}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [headers] }),
    },
  );
  if (!wrote.ok) throw new Error(`Sheets responded ${wrote.status}`);
}

async function appendRow(token: string, spreadsheetId: string, tab: string, row: string[]) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedRange(tab, "A1"))}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [row] }),
    },
  );
  if (!response.ok) throw new Error(`Sheets responded ${response.status}`);
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
