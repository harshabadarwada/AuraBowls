import { formatInr } from "@/lib/format";

type Line = {
  date: string;
  mealType: string;
  slotLabel: string;
  notes: string;
  items: { name: string; quantity: number; addons: { name: string }[] }[];
};

export function orderSummaryText(input: {
  reference: string;
  customerName: string;
  planName: string;
  totalPaise: number;
  mealsPaise: number;
  addonsPaise: number;
  deliveryPaise: number;
  discountPaise: number;
  paymentReference: string;
  pinCode: string;
  instructions: string;
  lines: Line[];
  detailsUrl: string;
}) {
  const day = (iso: string) => {
    const [year, month, dayNumber] = iso.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, dayNumber)).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  };
  const fullDays = input.lines.map((line) => {
    const item = line.items[0];
    const addons = item?.addons.map((addon) => addon.name).filter(Boolean) || [];
    return [
      `*${day(line.date)}*`,
      `${line.mealType === "breakfast" ? "Breakfast" : line.mealType === "lunch" ? "Lunch" : "Meal"}: ${item?.name || "Meal"}`,
      `Quantity: ${item?.quantity || 1}`,
      addons.length ? `Add-on: ${addons.join(", ")}` : "",
      `Delivery slot: ${line.slotLabel}`,
      line.notes ? `Note: ${line.notes}` : "",
    ].filter(Boolean).join("\n");
  });
  const money = [
    `Meals: ${formatInr(input.mealsPaise)}`,
    `Add-ons: ${formatInr(input.addonsPaise)}`,
    `Delivery: ${formatInr(input.deliveryPaise)}`,
    `Discount: -${formatInr(input.discountPaise)}`,
    `*Total paid: ${formatInr(input.totalPaise)}*`,
    input.paymentReference ? `Payment reference: ${input.paymentReference}` : "",
  ].filter(Boolean).join("\n");
  const head = [
    "*AURABOWLS — ORDER SUMMARY*",
    "",
    "Hello AuraBowls team,",
    "I've completed my payment and would like to share my meal order.",
    "",
    `*Order ID:* ${input.reference}`,
    `*Customer:* ${input.customerName}`,
    `*Plan:* ${input.planName}`,
    "*Payment status:* Paid — verified",
    `*Amount paid:* ${formatInr(input.totalPaise)}`,
  ].join("\n");
  const tail = [
    "*Delivery*",
    `Area PIN: ${input.pinCode || "On the order"}`,
    input.instructions ? `Instructions: ${input.instructions}` : "",
    "",
    "*Payment summary*",
    money,
    "",
    "Thank you. Please review the order and confirm the delivery schedule.",
    "AuraBowls — Fresh Food. Full of Life.",
  ].filter((line) => line !== undefined).join("\n");
  let body = `${head}\n\n*Day-wise meals*\n\n${fullDays.join("\n\n")}\n\n${tail}`;
  const encoded = encodeURIComponent(body);
  if (encoded.length > 1600) {
    const brief = input.lines.map((line) => {
      const item = line.items[0];
      return `${day(line.date)} — ${item?.quantity || 1} × ${item?.name || "Meal"} (${line.slotLabel})`;
    }).join("\n");
    body = `${head}\n\n*Schedule*\n${brief}\n\n${money}\n\nFull order: ${input.detailsUrl}\n\nAuraBowls — Fresh Food. Full of Life.`;
  }
  return body;
}

export function businessWhatsapp(stored = "") {
  const digits = (process.env.ORDER_WHATSAPP || process.env.NEXT_PUBLIC_ORDER_WHATSAPP || stored || "9652148800").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function identity(input: { name: string; address: string; pin: string }) {
  return [
    "Hello AuraBowls,",
    `Name: ${input.name.trim()}`,
    `Address: ${input.address.trim()}`,
    input.pin.trim() ? `PIN: ${input.pin.trim()}` : "",
  ].filter(Boolean);
}

export function outsideAreaText(input: { name: string; address: string; pin: string }) {
  return [
    ...identity(input),
    "",
    "I am interested in AuraBowls, but this address is outside PIN 500081.",
    "Please reply if you can deliver here.",
  ].join("\n");
}

export function guideOrderText(input: {
  name: string;
  address: string;
  pin: string;
  goalLabel: string;
  lines: { name: string; quantity: number; pricePaise: number }[];
  body?: string[];
}) {
  const total = input.lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  return [
    ...identity(input),
    `Goal: ${input.goalLabel}`,
    "",
    ...(input.body || []),
    ...(input.body?.length ? [""] : []),
    input.lines.length ? "Bowls:" : "Bowls: none added yet",
    ...input.lines.map((line) => `${line.quantity} × ${line.name} — ${formatInr(line.pricePaise * line.quantity)}`),
    "",
    input.lines.length ? `Menu total: ${formatInr(total)}` : "",
    "Please send the payment QR on this chat. I will pay from this number.",
  ].filter((line) => line !== undefined).join("\n");
}

export function menuOrderText(input: { name: string; address: string; pin: string; lines: { name: string; quantity: number; pricePaise: number }[] }) {
  const total = input.lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  if (input.pin.trim() !== "500081") return outsideAreaText(input);
  return [
    ...identity(input),
    "",
    "I want to order these meals. Please send the payment QR on this chat.",
    "",
    ...input.lines.map((line) => `${line.quantity} × ${line.name} — ${formatInr(line.pricePaise * line.quantity)}`),
    "",
    `Menu total: ${formatInr(total)}`,
    "I will pay after you send the QR.",
  ].join("\n");
}

export function planOrderText(input: {
  name: string;
  address: string;
  pin: string;
  planName: string;
  lines: { date: string; mealName: string; slotLabel: string }[];
  totalPaise: number;
}) {
  if (input.pin.trim() !== "500081") return outsideAreaText(input);
  const day = (iso: string) => {
    const [year, month, dayNumber] = iso.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, dayNumber)).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  };
  return [
    ...identity(input),
    "",
    `Plan: ${input.planName}`,
    "I want this prepaid plan. Please send the payment QR on this chat. I have not paid yet.",
    "",
    ...input.lines.map((line) => `${day(line.date)}: ${line.mealName} (${line.slotLabel})`),
    "",
    `Total: ${formatInr(input.totalPaise)}`,
  ].join("\n");
}

export function whatsappHref(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
