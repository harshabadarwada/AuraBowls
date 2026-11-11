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
  paymentStatus: "Unpaid" | "Paid";
  orderStatus: "Pending" | "Active";
  deliveryNotes: string;
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

export function trackerOrder(input: TrackerOrderInput, at = new Date()): TrackerOrder {
  const notes = [
    input.address.trim() ? `Address: ${input.address.trim()}` : "",
    input.slot?.trim() ? `Lunch slot: ${input.slot.trim()}` : "",
    input.style?.trim() ? `Style: ${input.style.trim()}` : "",
    input.defaultBowl?.trim() ? `Default bowl: ${input.defaultBowl.trim()}` : "",
    input.schedule?.trim() || "",
    input.note?.trim() || "",
  ].filter(Boolean);
  return {
    spreadsheetId: KITCHEN_SPREADSHEET_ID,
    orderId: newOrderId(),
    orderDate: kolkataIsoDate(at),
    customerName: input.name.trim(),
    phoneNumber: trackerPhone(input.phone),
    deliveryArea: input.area.trim(),
    mealType: input.mealType,
    planDuration: `${input.days} days`,
    startDate: input.startDate.trim(),
    totalAmount: input.totalPaise / 100,
    paymentStatus: "Unpaid",
    orderStatus: "Pending",
    deliveryNotes: notes.join(" | "),
  };
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
