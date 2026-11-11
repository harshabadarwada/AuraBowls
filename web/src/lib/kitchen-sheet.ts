export const KITCHEN_SPREADSHEET_ID = "1uG40XeadQAXW_QAsTob4zbsBuKUYajjLyJLYW0V_i-A";
export const KITCHEN_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbwZ4n2qicW5jZeCZNHRN6oqRHWwts7vB18zXJ66Xmz7aF9yVv_nVB8r4LF23GVPXZHVFA/exec";

export type TrackerOrder = {
  spreadsheetId: string;
  orderId: string;
  orderDate: string;
  customerName: string;
  phoneNumber: string;
  deliveryArea: string;
  mealType: "Pure Veg" | "Pure Non-Veg" | "Mixed";
  planDuration: string;
  startDate: string;
  totalAmount: number;
  paymentStatus: "Pending" | "Paid" | "Failed";
  orderStatus: "Pending" | "Active";
  deliveryNotes: string;
  style?: string;
  slot?: string;
  defaultBowl?: string;
  daysSchedule?: { date: string; weekday: string; bowl: string }[];
  mapUrl?: string;
};

export type TrackerOrderInput = {
  name: string;
  phone?: string;
  address: string;
  area: string;
  mealType: TrackerOrder["mealType"];
  days: number;
  startDate: string;
  totalPaise: number;
  slot?: string;
  style?: string;
  defaultBowl?: string;
  schedule?: string;
  note?: string;
  mapUrl?: string;
  orderId?: string;
  daysSchedule?: { date: string; weekday: string; bowl: string }[];
};

export function kolkataIsoDate(at = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function newOrderId() {
  return `AB-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function trackerPhone(phone = "") {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
  return phone.trim();
}

export function trackerMealType(mix: string): TrackerOrder["mealType"] {
  const text = mix.toLowerCase();
  if (text.includes("non")) return "Pure Non-Veg";
  if (text.includes("mix")) return "Mixed";
  return "Pure Veg";
}

export function trackerLocation(input: Pick<TrackerOrderInput, "address" | "area">) {
  const address = input.address.trim();
  const area = input.area.trim();
  if (address) return address;
  return area;
}

export function trackerOrder(input: TrackerOrderInput, at = new Date()): TrackerOrder {
  const notes = [
    input.mapUrl?.trim() ? `Map: ${input.mapUrl.trim()}` : "",
    input.slot?.trim() ? `Lunch slot: ${input.slot.trim()}` : "",
    input.style?.trim() ? `Style: ${input.style.trim()}` : "",
    input.defaultBowl?.trim() ? `Default bowl: ${input.defaultBowl.trim()}` : "",
    input.schedule?.trim() || "",
    input.note?.trim() || "",
  ].filter(Boolean);
  return {
    spreadsheetId: KITCHEN_SPREADSHEET_ID,
    orderId: input.orderId?.trim() || newOrderId(),
    orderDate: kolkataIsoDate(at),
    customerName: input.name.trim(),
    phoneNumber: trackerPhone(input.phone),
    deliveryArea: trackerLocation(input),
    mealType: input.mealType,
    planDuration: input.days <= 1 ? "Single" : `${input.days} days`,
    startDate: input.startDate.trim(),
    totalAmount: input.totalPaise / 100,
    paymentStatus: "Pending",
    orderStatus: "Pending",
    deliveryNotes: notes.join(" | "),
    style: input.style,
    slot: input.slot,
    defaultBowl: input.defaultBowl,
    daysSchedule: input.daysSchedule,
    mapUrl: input.mapUrl,
  };
}

export function queueKitchenSheet(input: TrackerOrderInput) {
  const body = JSON.stringify(trackerOrder(input));
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(KITCHEN_SHEET_WEBHOOK, new Blob([body], { type: "text/plain;charset=UTF-8" }));
      if (sent) return true;
    }
  } catch {
    // Fall through to fetch.
  }
  void fetch(KITCHEN_SHEET_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body,
    mode: "no-cors",
    keepalive: true,
  }).catch(() => false);
  return true;
}

export function queueSingleOrder(input: {
  name: string;
  phone?: string;
  address: string;
  items: { name: string; quantity: number; pricePaise: number; mealType?: string }[];
  note?: string;
  orderId?: string;
  startDate?: string;
}) {
  const start = input.startDate?.trim() || kolkataIsoDate();
  const names = input.items.map((item) => `${item.quantity > 1 ? `${item.quantity} × ` : ""}${item.name}`);
  const labels = input.items.map((item) => `${item.mealType || ""} ${item.name}`.toLowerCase());
  const hasNon = labels.some((text) => text.includes("non") || text.includes("chicken"));
  const hasVeg = labels.some((text) => !text.includes("non") && !text.includes("chicken"));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(`${start}T00:00:00Z`).getUTCDay()] || "";
  return queueKitchenSheet({
    name: input.name,
    phone: input.phone,
    address: input.address,
    area: input.address,
    mealType: hasNon && hasVeg ? "Mixed" : hasNon ? "Pure Non-Veg" : "Pure Veg",
    days: 1,
    startDate: start,
    totalPaise: input.items.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0),
    defaultBowl: names.join(", ").slice(0, 80),
    schedule: names.join(" | "),
    note: input.note,
    orderId: input.orderId,
    daysSchedule: [{ date: start, weekday, bowl: names.join(", ").slice(0, 80) }],
  });
}

export async function postKitchenSheet(input: TrackerOrderInput) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch("/api/kitchen-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
      keepalive: true,
    });
    if (!response.ok) return false;
    const data = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    return data?.ok === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
