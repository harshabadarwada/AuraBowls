import { areaLine, isServedArea } from "@/lib/area";
import { formatInrCompact } from "@/lib/format";

export const planLengths = [
  { id: "3", days: 3, label: "3-day plan", copy: "Three lunch deliveries." },
  { id: "5", days: 5, label: "5-day plan", copy: "Five lunch deliveries." },
  { id: "10", days: 10, label: "10-day plan", copy: "Ten lunch deliveries." },
  { id: "20", days: 20, label: "20-day plan", copy: "Twenty lunch deliveries." },
  { id: "22", days: 22, label: "22-day plan", copy: "Twenty-two lunch deliveries." },
] as const;

export const planMixes = [
  { id: "veg", name: "Pure Veg", short: "Veg", copy: "Vegetarian bowls only." },
  { id: "non_veg", name: "Pure Non-Veg", short: "Non-veg", copy: "Chicken bowls only." },
  { id: "mixed", name: "Mixed", short: "Mixed", copy: "Veg and non-veg bowls on the same plan." },
] as const;

export const subscriptionPrices = {
  "3": { veg: 63000, non_veg: 72000, mixed: 69000 },
  "5": { veg: 102500, non_veg: 117500, mixed: 110000 },
  "10": { veg: 195000, non_veg: 225000, mixed: 210000 },
  "20": { veg: 370000, non_veg: 430000, mixed: 400000 },
  "22": { veg: 400000, non_veg: 465000, mixed: 432500 },
} as const;

export const bowlStyles = [
  {
    id: "balanced",
    name: "Balanced",
    hint: "Regular",
    who: "Customers wanting an everyday meal",
    copy: "Standard protein, base and vegetables.",
    protein: 0.34,
    base: 0.36,
    veg: 0.3,
    extraPaise: 0,
    planDailyPaise: 0,
  },
  {
    id: "protein",
    name: "Power Protein",
    hint: "High protein",
    who: "Customers prioritising protein intake",
    copy: "Extra protein, filling base, less salad. Chicken bowls use a 200 g chicken portion.",
    protein: 0.52,
    base: 0.3,
    veg: 0.18,
    extraPaise: 5000,
    planDailyPaise: 2000,
  },
  {
    id: "carb",
    name: "Carb Load",
    hint: "Large",
    who: "Customers with a bigger appetite",
    copy: "More protein and a larger rice or grain base.",
    protein: 0.3,
    base: 0.5,
    veg: 0.2,
    extraPaise: 3000,
    planDailyPaise: 500,
  },
] as const;

export const lunchSlots = ["12:00–1:30", "1:30–3:00"] as const;
export const DAILY_CUTOFF = "8:00 AM";
export const PLAN_KEY = "aurabowls.plan.v2";

type Diet = "veg" | "non_veg";
export type StyleId = (typeof bowlStyles)[number]["id"];
export type MixId = (typeof planMixes)[number]["id"];
export type LengthId = (typeof planLengths)[number]["id"];

export type PowerBowl = {
  id: string;
  name: string;
  diet: Diet;
  protein: string;
  image: string;
};

const vegPaise = 24900;
const chickenPaise = 27100;
const paneerPaise = 26000;

const photos = {
  chicken: "/bowls/fiery-peri-chicken-bowl.jpg",
  peri: "/bowls/fiery-peri-chicken-bowl.jpg",
  grilled: "/bowls/mediterranean-chicken-bowl.jpg",
  tikka: "/bowls/tandoori-chicken-biryani-bowl.jpg",
  paneer: "/bowls/paneer-power-bowl.jpg",
  mushroom: "/bowls/pepper-mushroom-bowl.jpg",
  mix: "/bowls/paneer-power-bowl.jpg",
  chickpea: "/bowls/falafel-hummus-bowl.jpg",
  rajma: "/bowls/soya-crunch-power-bowl.jpg",
  veg: "/bowls/mixed-veg-biryani-bowl.jpg",
};

function group(diet: Diet, rows: [string, string, string, string][]): PowerBowl[] {
  return rows.map(([id, name, protein, image]) => ({ id, name, diet, protein, image }));
}

export const proteinBowls: PowerBowl[] = [
  ...group("non_veg", [
    ["classic-chicken-power", "Classic Chicken Power Bowl", "Chicken", photos.chicken],
    ["peri-chicken-power", "Peri Peri Chicken Power Bowl", "Peri peri chicken", photos.peri],
    ["grilled-chicken-power", "Grilled Chicken Power Bowl", "Grilled chicken", photos.grilled],
    ["tikka-chicken-power", "Chicken Tikka Power Bowl", "Tikka-style chicken", photos.tikka],
  ]),
  ...group("veg", [
    ["paneer-power", "Paneer Power Bowl", "Paneer", photos.paneer],
    ["mushroom-power", "Mushroom Power Bowl", "Mushroom", photos.mushroom],
    ["paneer-mushroom-power", "Paneer Mushroom Power Bowl", "Paneer and mushrooms", photos.mix],
    ["chickpea-power", "Chickpea Power Bowl", "Chickpeas", photos.chickpea],
    ["rajma-power", "Rajma Power Bowl", "Kidney beans", photos.rajma],
    ["mixed-veg-power", "Mixed Veg Power Bowl", "Mixed vegetables", photos.veg],
  ]),
];

export const balancedBowls: PowerBowl[] = [
  ...group("non_veg", [
    ["classic-chicken-meal", "Classic Chicken Meal Bowl", "Chicken", photos.chicken],
    ["peri-chicken-meal", "Peri Peri Chicken Meal Bowl", "Peri peri chicken", photos.peri],
    ["grilled-chicken-meal", "Grilled Chicken Meal Bowl", "Grilled chicken", photos.grilled],
    ["tikka-chicken-meal", "Chicken Tikka Meal Bowl", "Tikka-style chicken", photos.tikka],
  ]),
  ...group("veg", [
    ["paneer-meal", "Paneer Meal Bowl", "Paneer", photos.paneer],
    ["mushroom-meal", "Mushroom Meal Bowl", "Mushroom", photos.mushroom],
    ["paneer-mushroom-meal", "Paneer Mushroom Meal Bowl", "Paneer and mushrooms", photos.mix],
    ["rajma-meal", "Rajma Meal Bowl", "Kidney beans", photos.rajma],
    ["chickpea-meal", "Chickpea Meal Bowl", "Chickpeas", photos.chickpea],
    ["mixed-veg-meal", "Mixed Veg Meal Bowl", "Mixed vegetables", photos.veg],
    ["paneer-chickpea-meal", "Paneer Chickpea Meal Bowl", "Paneer and chickpeas", photos.mix],
    ["paneer-rajma-meal", "Paneer Rajma Meal Bowl", "Paneer and kidney beans", photos.mix],
  ]),
];

export const carbBowls: PowerBowl[] = [
  ...group("non_veg", [
    ["classic-chicken-carb", "Classic Chicken Carb Bowl", "Chicken", photos.chicken],
    ["peri-chicken-carb", "Peri Peri Chicken Carb Bowl", "Peri peri chicken", photos.peri],
    ["grilled-chicken-carb", "Grilled Chicken Carb Bowl", "Grilled chicken", photos.grilled],
    ["tikka-chicken-carb", "Chicken Tikka Carb Bowl", "Tikka-style chicken", photos.tikka],
  ]),
  ...group("veg", [
    ["paneer-carb", "Paneer Carb Bowl", "Paneer", photos.paneer],
    ["mushroom-carb", "Mushroom Carb Bowl", "Mushroom", photos.mushroom],
    ["paneer-mushroom-carb", "Paneer Mushroom Carb Bowl", "Paneer and mushrooms", photos.mix],
    ["rajma-carb", "Rajma Carb Bowl", "Kidney beans", photos.rajma],
    ["chickpea-carb", "Chickpea Carb Bowl", "Chickpeas", photos.chickpea],
    ["mixed-veg-carb", "Mixed Veg Carb Bowl", "Mixed vegetables", photos.veg],
  ]),
];

const byStyle: Record<StyleId, PowerBowl[]> = {
  protein: proteinBowls,
  balanced: balancedBowls,
  carb: carbBowls,
};

export function planBowls(style: StyleId, mix: MixId) {
  const all = byStyle[style];
  const veg = all.filter((bowl) => bowl.diet === "veg");
  const nonVeg = all.filter((bowl) => bowl.diet === "non_veg");
  if (mix === "veg") return veg;
  if (mix === "non_veg") return nonVeg;
  const mixed: PowerBowl[] = [];
  const longest = Math.max(veg.length, nonVeg.length);
  for (let index = 0; index < longest; index += 1) {
    if (veg[index]) mixed.push(veg[index]);
    if (nonVeg[index]) mixed.push(nonVeg[index]);
  }
  return mixed;
}

export function bowlsFor(style: StyleId, mix: MixId, diet: Diet) {
  const menu = planBowls(style, mix);
  if (mix === "mixed") return menu.filter((bowl) => bowl.diet === diet);
  return menu;
}

export function findBowl(id: string) {
  return [...proteinBowls, ...balancedBowls, ...carbBowls].find((bowl) => bowl.id === id) || null;
}

export function bowlPricePaise(bowl: PowerBowl, style: StyleId) {
  const styleExtra = bowlStyles.find((item) => item.id === style)?.extraPaise || 0;
  const base = bowl.diet === "non_veg" ? chickenPaise : bowl.protein.toLowerCase().includes("paneer") ? paneerPaise : vegPaise;
  return base + styleExtra;
}

export function charmPaise(paise: number) {
  const safe = Math.trunc(paise);
  const rupees = Math.floor(Math.abs(safe) / 100);
  if (rupees > 0 && rupees % 10 === 0) return safe < 0 ? safe + 100 : safe - 100;
  return safe;
}

export function planPricePaise(lengthId: LengthId, mix: MixId, style: StyleId = "balanced") {
  const base = subscriptionPrices[lengthId][mix];
  const days = planLengths.find((item) => item.id === lengthId)?.days || 1;
  const extra = (bowlStyles.find((item) => item.id === style)?.planDailyPaise || 0) * days;
  if (extra <= 0) return base;
  return charmPaise(base + extra);
}

export function lunchPaise(lengthId: LengthId, mix: MixId, style: StyleId = "balanced") {
  const days = planLengths.find((item) => item.id === lengthId)?.days || 1;
  return Math.round(planPricePaise(lengthId, mix, style) / days);
}

export function planDeltaPaise(lengthId: LengthId, mix: MixId, style: StyleId) {
  return planPricePaise(lengthId, mix, style) - planPricePaise(lengthId, mix, "balanced");
}

export function mixLabel(mix: MixId) {
  return planMixes.find((item) => item.id === mix)?.name || "Pure Veg";
}

export function addIsoDays(iso: string, count: number) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + count)).toISOString().slice(0, 10);
}

export function planDates(start: string, count: number) {
  const dates: string[] = [];
  let cursor = start;
  for (let step = 0; step < 90 && dates.length < count; step += 1) {
    const weekday = new Date(`${cursor}T00:00:00Z`).getUTCDay();
    if (weekday !== 0) dates.push(cursor);
    cursor = addIsoDays(cursor, 1);
  }
  return dates;
}

export function weekGroups(dates: string[]) {
  const groups: { start: string; dates: string[] }[] = [];
  for (const date of dates) {
    const weekday = isoWeekday(date);
    const start = addIsoDays(date, weekday === 0 ? -6 : 1 - weekday);
    const last = groups[groups.length - 1];
    if (last?.start === start) last.dates.push(date);
    else groups.push({ start, dates: [date] });
  }
  return groups.map((group) => ({
    title: `${dayBits(group.dates[0]).label} – ${dayBits(group.dates[group.dates.length - 1]).label}`,
    dates: group.dates,
  }));
}

export function dayBits(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  return {
    weekday: date.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }),
    label: date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
    long: date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
    day: iso.slice(8),
  };
}

export function slotPretty(slot: string) {
  if (slot.startsWith("12:00")) return "12:00 PM – 1:30 PM";
  if (slot.startsWith("1:30")) return "1:30 PM – 3:00 PM";
  return slot.replace("–", " – ");
}

export function mealSchedule(picks: DayPick[], fallback = "") {
  return picks.map((pick) => ({
    date: pick.date,
    weekday: dayBits(pick.date).weekday,
    bowl: findBowl(pick.bowlId)?.name || fallback,
  }));
}

export function kolkataParts(at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const take = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "0";
  const hour = Number(take("hour")) % 24;
  return {
    date: `${take("year")}-${take("month")}-${take("day")}`,
    hour,
    minute: Number(take("minute")),
    beforeCutoff: hour < 8,
  };
}

export function isoWeekday(iso: string) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

export function nextOperatingDay(iso: string) {
  let cursor = iso;
  for (let step = 0; step < 8; step += 1) {
    if (isoWeekday(cursor) !== 0) return cursor;
    cursor = addIsoDays(cursor, 1);
  }
  return iso;
}

export function kolkataTomorrow(at = new Date()) {
  return addIsoDays(kolkataParts(at).date, 1);
}

export function kitchenPickDate(at = new Date()) {
  const clock = kolkataParts(at);
  const lockedToday = !clock.beforeCutoff && isoWeekday(clock.date) !== 0;
  const date = nextOperatingDay(clock.beforeCutoff ? clock.date : addIsoDays(clock.date, 1));
  return {
    date,
    beforeCutoff: clock.beforeCutoff,
    lockedToday,
    when: date === clock.date ? "today" : "the next lunch day",
  };
}

export type DayPick = { date: string; bowlId: string };

export type SavedPlan = {
  name: string;
  phone: string;
  address: string;
  pin: string;
  style: StyleId;
  mix: MixId;
  diet: Diet;
  bowlId: string;
  days: number;
  lengthId: LengthId;
  lengthLabel: string;
  startDate: string;
  slot: string;
  note: string;
  picks: DayPick[];
  totalPaise: number;
  mapUrl?: string;
  orderId?: string;
};

export const WA_LIMIT = 4000;

export function fillPicks(dates: string[], bowlId: string, current: DayPick[] = []): DayPick[] {
  const kept = new Map(current.map((pick) => [pick.date, pick.bowlId]));
  return dates.map((date) => ({ date, bowlId: kept.get(date) || bowlId }));
}

export function rotatePicks(dates: string[], bowlIds: string[], current: DayPick[] = []): DayPick[] {
  if (!dates.length) return [];
  if (!bowlIds.length) return dates.map((date) => ({ date, bowlId: "" }));
  const allowed = new Set(bowlIds);
  const kept = new Map(
    current
      .filter((pick) => dates.includes(pick.date) && allowed.has(pick.bowlId))
      .map((pick) => [pick.date, pick.bowlId]),
  );
  let cursor = 0;
  const picks: DayPick[] = [];
  for (let index = 0; index < dates.length; index += 1) {
    const date = dates[index];
    const existing = kept.get(date);
    if (existing) {
      picks.push({ date, bowlId: existing });
      const found = bowlIds.indexOf(existing);
      cursor = found === -1 ? cursor : (found + 1) % bowlIds.length;
      continue;
    }
    let bowlId = bowlIds[cursor % bowlIds.length];
    const previous = picks[index - 1]?.bowlId;
    if (bowlIds.length > 1 && bowlId === previous) {
      cursor += 1;
      bowlId = bowlIds[cursor % bowlIds.length];
    }
    picks.push({ date, bowlId });
    cursor += 1;
  }
  return picks;
}

export function readSavedPlan(): SavedPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    const plan = raw ? JSON.parse(raw) as Partial<SavedPlan> : null;
    if (!plan?.name || !plan.bowlId) return null;
    return {
      name: plan.name,
      phone: plan.phone || "",
      address: plan.address || "",
      pin: plan.pin || "",
      style: plan.style || "balanced",
      mix: plan.mix || (plan.diet === "non_veg" ? "non_veg" : "veg"),
      diet: plan.diet || "veg",
      bowlId: plan.bowlId,
      days: plan.days || plan.picks?.length || 0,
      lengthId: plan.lengthId || "5",
      lengthLabel: plan.lengthLabel || "",
      startDate: plan.startDate || "",
      slot: plan.slot || lunchSlots[0],
      note: plan.note || "",
      picks: Array.isArray(plan.picks) ? plan.picks : [],
      totalPaise: planPricePaise(plan.lengthId || "5", plan.mix || "veg", plan.style || "balanced"),
      mapUrl: plan.mapUrl || "",
      orderId: plan.orderId || "",
    };
  } catch {
    return null;
  }
}

export function writeSavedPlan(plan: SavedPlan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

function areaDisplay(pin: string) {
  if (!pin.trim() || isServedArea(pin)) return "Madhapur (within 7 km)";
  return pin.trim();
}

export const orderProcess = [
  "Kitchen reviews and confirms the order.",
  "AuraBowls shares the payment QR code here.",
  "Customer completes payment.",
  "Kitchen verifies payment and activates the subscription.",
];

export const dailyProcess = [
  `Cook this bowl if the message arrives before ${DAILY_CUTOFF} Asia/Kolkata.`,
  "This replaces only this date. The rest of the plan stays on the order sheet.",
  `If this arrives after ${DAILY_CUTOFF}, keep today's order-sheet bowl.`,
];

function kitchenNotes() {
  return [
    "⚠️ IMPORTANT – KITCHEN INSTRUCTIONS",
    "",
    "• Do not prepare any meal before payment confirmation.",
    "• Follow the meal schedule below. Sunday is a kitchen holiday.",
    `• A revised daily message before ${DAILY_CUTOFF} IST replaces that day's bowl only.`,
    `• If no revised instruction arrives by ${DAILY_CUTOFF}, cook the scheduled bowl.`,
  ];
}

function billingBlock(days: number, totalPaise: number) {
  const total = formatInrCompact(totalPaise);
  return [
    "💰 SUBSCRIPTION BILLING",
    `• ${days} Lunch Bowls: ${total}`,
    "• Discount: Applied",
    "• Delivery Charges: Extra (based on location)",
    "",
    `Total: ${total} + Delivery Charges`,
    "",
    "💳 PAYMENT STATUS: PENDING",
  ];
}

function confirmBlock() {
  return [
    "✅ ORDER CONFIRMATION REQUIRED",
    "",
    "Please confirm meal plan availability, delivery for this location, delivery charges, and the final payment amount.",
    "",
    "Thank you!",
    "AURABOWLS – Power Your Day, One Bowl at a Time.",
  ];
}

export function subscriptionSheet(input: SavedPlan) {
  const style = bowlStyles.find((item) => item.id === input.style);
  const defaultBowl = findBowl(input.bowlId);
  const defaultName = defaultBowl?.name || "the default bowl";
  const menuIds = planBowls(input.style, input.mix).map((item) => item.id);
  const picks = input.picks.length ? input.picks : rotatePicks(planDates(input.startDate, input.days), menuIds.length ? menuIds : [input.bowlId]);
  const uniqueIds = [...new Set(picks.map((pick) => pick.bowlId))];
  const matchingDefault = picks.filter((pick) => pick.bowlId === input.bowlId).length;
  const rotated = uniqueIds.length > 1 && matchingDefault < Math.max(2, Math.ceil(picks.length / 2));
  const changed = picks.filter((pick) => pick.bowlId !== input.bowlId);
  const orderId = input.orderId?.trim() || "AB-pending";
  const first = dayBits(picks[0]?.date || input.startDate);
  const last = dayBits(picks[picks.length - 1]?.date || input.startDate);
  const menuLine = rotated
    ? `• Bowls: rotated from the ${style?.name} ${mixLabel(input.mix)} menu`
    : `• Default Bowl: ${defaultName}`;
  const head = [
    "🥗 AURABOWLS | MEAL PLAN ORDER",
    "",
    `Order ID: ${orderId}`,
    "",
    "Hello AuraBowls Team!",
    "",
    "I'd like to confirm my meal subscription with the following details.",
    "",
    "👤 CUSTOMER DETAILS",
    `• Name: ${input.name.trim()}`,
    input.phone.trim() ? `• Phone: ${input.phone.trim()}` : "",
    `• Address: ${input.address.trim()}`,
    `• Area: ${areaDisplay(input.pin)}`,
    input.mapUrl?.trim() ? `• Map: ${input.mapUrl.trim()}` : "",
    input.note.trim() ? `• Note: ${input.note.trim()}` : "",
    "",
    "📦 SUBSCRIPTION DETAILS",
    `• Plan: ${input.days}-Day Lunch Plan`,
    `• Food Preference: ${mixLabel(input.mix)}`,
    `• Meal Style: ${style?.name}`,
    menuLine,
    `• Start Date: ${first.long}`,
    `• Delivery Slot: ${slotPretty(input.slot)}`,
    "",
  ].filter((line) => line !== undefined);
  const dayLine = (pick: DayPick) => `🔹 ${dayBits(pick.date).label} – ${findBowl(pick.bowlId)?.name || defaultName}`;
  const fullDays = ["🍱 MY WEEKLY MEAL SCHEDULE", "", ...picks.map(dayLine)];
  const shortLine = picks.map((pick) => {
    const name = (findBowl(pick.bowlId)?.name || defaultName).replace(/ (Power|Meal|Carb) Bowl$/, "");
    return `${dayBits(pick.date).weekday} ${Number(dayBits(pick.date).day)}: ${name}`;
  }).join(" · ");
  const compactDays = rotated
    ? ["🍱 MY WEEKLY MEAL SCHEDULE", "", `Rotated from the ${style?.name} ${mixLabel(input.mix)} menu.`, `Days: ${first.label} to ${last.label}. Sunday closed.`, shortLine]
    : changed.length
      ? ["🍱 MY WEEKLY MEAL SCHEDULE", "", `Default bowl: ${defaultName}`, `Days: ${first.label} to ${last.label}. Sunday closed.`, "Changes:", ...changed.map(dayLine)]
      : ["🍱 MY WEEKLY MEAL SCHEDULE", "", `Cook ${defaultName} on each of the ${picks.length} lunch days.`, `Days: ${first.label} to ${last.label}. Sunday closed.`];
  const tinyDays = ["🍱 MY WEEKLY MEAL SCHEDULE", "", `Day-wise bowls from the ${style?.name} ${mixLabel(input.mix)} menu.`, `Days: ${first.label} to ${last.label}. Sunday closed.`, "Full day-wise list is on the order tab."];
  const payment = [
    "",
    ...billingBlock(input.days, input.totalPaise),
    "",
    "Please follow these steps:",
    ...orderProcess.map((line, index) => `${["1️⃣", "2️⃣", "3️⃣", "4️⃣"][index] || `${index + 1}.`} ${line}`),
    "",
    ...kitchenNotes(),
    "",
    ...confirmBlock(),
  ];
  const full = [...head, ...fullDays, ...payment].filter((line) => line !== undefined).join("\n");
  if (encodeURIComponent(full).length <= WA_LIMIT) return full;
  const compact = [...head, ...compactDays, ...payment].filter((line) => line !== undefined).join("\n");
  if (encodeURIComponent(compact).length <= WA_LIMIT) return compact;
  return [...head, ...tinyDays, ...payment].filter((line) => line !== undefined).join("\n");
}

export function tomorrowSheet(input: {
  name: string;
  address?: string;
  pin?: string;
  date: string;
  style: string;
  slot?: string;
  bowlName: string;
  defaultBowlName?: string;
}) {
  return [
    "AURABOWLS — DAILY KITCHEN SHEET",
    "",
    `Name: ${input.name}`,
    input.address ? `Address: ${input.address}` : "",
    input.pin ? areaLine(input.pin) : "",
    `Date: ${dayBits(input.date).label}`,
    input.slot ? `Lunch slot: ${input.slot}` : "",
    `Style: ${input.style}`,
    `Bowl: ${input.bowlName}`,
    input.defaultBowlName && input.defaultBowlName !== input.bowlName ? `Plan default was: ${input.defaultBowlName}` : "",
    "",
    "HOW TO PROCESS",
    ...dailyProcess.map((line, index) => `${index + 1}. ${line}`),
  ].filter(Boolean).join("\n");
}
