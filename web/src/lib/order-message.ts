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

export function whatsappHref(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
