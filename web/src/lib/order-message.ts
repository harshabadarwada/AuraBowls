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

export const deliveryChargeNote = "Delivery charges vary by location and are not included in this total. The kitchen will confirm the charge.";

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

function dayLabel(iso: string) {
  const [year, month, dayNumber] = iso.split("-").map(Number);
  if (!year || !month || !dayNumber) return iso;
  return new Date(Date.UTC(year, month - 1, dayNumber)).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export function subscriptionTotal(perDayPaise: number, days: number, discountBps: number) {
  const reference = perDayPaise * days;
  const discount = Math.min(reference, Math.round((reference * discountBps) / 10_000));
  return { perDayPaise, referencePaise: reference, discountPaise: discount, totalPaise: reference - discount };
}

export function guideOrderText(input: {
  name: string;
  address: string;
  pin: string;
  goalLabel: string;
  lines: { name: string; quantity: number; pricePaise: number }[];
  body?: string[];
  days?: { date: string; note: string; items: { mealLabel: string; name: string; pricePaise: number }[] }[];
  subscription?: {
    days: number;
    lengthLabel: string;
    mealsLabel: string;
    startDate: string;
    slots: string[];
    discountBps: number;
  };
}) {
  const perDay = input.lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  const dayItems = input.days?.flatMap((day) => day.items) || [];
  const dayReference = dayItems.reduce((sum, item) => sum + item.pricePaise, 0);
  const priced = input.subscription
    ? dayItems.length
      ? subscriptionTotal(dayReference, 1, input.subscription.discountBps)
      : subscriptionTotal(perDay, input.subscription.days, input.subscription.discountBps)
    : null;
  const plan = input.subscription ? [
    `Subscription: ${input.subscription.lengthLabel}`,
    `Meals: ${input.subscription.mealsLabel}`,
    `First day: ${dayLabel(input.subscription.startDate)}`,
    ...input.subscription.slots.map((slot) => `Delivery: ${slot}`),
    input.subscription.discountBps > 0 ? `Discount: ${input.subscription.discountBps / 100}% off the menu price` : "Discount: none",
  ] : [];
  return [
    ...identity(input),
    `Goal: ${input.goalLabel}`,
    "",
    ...(input.body || []),
    ...(input.body?.length ? [""] : []),
    ...plan,
    ...(plan.length ? [""] : []),
    input.days?.length ? "Each day:" : input.lines.length ? "Bowls each day:" : "Bowls: none added yet",
    ...(input.days?.length
      ? input.days.flatMap((day) => [
        `${dayLabel(day.date)}${day.note ? ` (${day.note})` : ""}`,
        ...day.items.map((item) => `${item.mealLabel}: ${item.name} — ${formatInr(item.pricePaise)}`),
      ])
      : input.lines.map((line) => `${line.quantity} × ${line.name} — ${formatInr(line.pricePaise * line.quantity)}`)),
    "",
    priced && !dayItems.length ? `Per day: ${formatInr(priced.perDayPaise)}` : undefined,
    priced && input.subscription && !dayItems.length ? `${input.subscription.days} days: ${formatInr(priced.referencePaise)}` : undefined,
    priced && dayItems.length ? `Meals total: ${formatInr(priced.referencePaise)}` : undefined,
    priced && priced.discountPaise > 0 ? `Plan discount: -${formatInr(priced.discountPaise)}` : undefined,
    priced ? `Total: ${formatInr(priced.totalPaise)}` : input.lines.length ? `Menu total: ${formatInr(perDay)}` : undefined,
    deliveryChargeNote,
    "Please send the payment QR on this chat. I have not paid yet.",
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
    deliveryChargeNote,
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
    deliveryChargeNote,
  ].join("\n");
}

export function whatsappHref(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
