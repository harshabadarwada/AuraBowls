import { areaLine } from "@/lib/area";
import { formatInr } from "@/lib/format";

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
  },
] as const;

export const lunchSlots = ["12:00–1:30", "1:30–3:00"] as const;
export const DAILY_CUTOFF = "8:00 AM";
export const PLAN_KEY = "aurabowls.plan.v2";

type Diet = "veg" | "non_veg";
type StyleId = (typeof bowlStyles)[number]["id"];
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

export function bowlsFor(style: StyleId, mix: MixId, diet: Diet) {
  const all = byStyle[style];
  if (mix === "veg") return all.filter((bowl) => bowl.diet === "veg");
  if (mix === "non_veg") return all.filter((bowl) => bowl.diet === "non_veg");
  return all.filter((bowl) => bowl.diet === diet);
}

export function findBowl(id: string) {
  return [...proteinBowls, ...balancedBowls, ...carbBowls].find((bowl) => bowl.id === id) || null;
}

export function bowlPricePaise(bowl: PowerBowl, style: StyleId) {
  const styleExtra = bowlStyles.find((item) => item.id === style)?.extraPaise || 0;
  const base = bowl.diet === "non_veg" ? chickenPaise : bowl.protein.toLowerCase().includes("paneer") ? paneerPaise : vegPaise;
  return base + styleExtra;
}

export function planPricePaise(lengthId: LengthId, mix: MixId) {
  return subscriptionPrices[lengthId][mix];
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

export function dayBits(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  return {
    weekday: date.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }),
    label: date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
    day: iso.slice(8),
  };
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
};

const WA_LIMIT = 1800;

export function fillPicks(dates: string[], bowlId: string, current: DayPick[] = []): DayPick[] {
  const kept = new Map(current.map((pick) => [pick.date, pick.bowlId]));
  return dates.map((date) => ({ date, bowlId: kept.get(date) || bowlId }));
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
      totalPaise: plan.totalPaise || planPricePaise(plan.lengthId || "5", plan.mix || "veg"),
    };
  } catch {
    return null;
  }
}

export function writeSavedPlan(plan: SavedPlan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

function sheetIdentity(input: Pick<SavedPlan, "name" | "phone" | "address" | "pin">) {
  return [
    "Hello AuraBowls,",
    `Name: ${input.name.trim()}`,
    input.phone.trim() ? `Phone: ${input.phone.trim()}` : "",
    `Address: ${input.address.trim()}`,
    areaLine(input.pin),
  ].filter(Boolean);
}

function sheetMoney(input: { days: number; mix: MixId; totalPaise: number }) {
  return [
    `Mix: ${mixLabel(input.mix)}`,
    `Subscription price (after discount): ${formatInr(input.totalPaise)}`,
    `${input.days} lunch bowls are included in this price.`,
    "Delivery charges vary by location and are not included in this total. The kitchen will confirm the charge.",
  ];
}

export const orderProcess = [
  "Kitchen confirms this unpaid sheet and sends the payment QR on this chat.",
  "I pay on that QR. Do not cook until payment is confirmed.",
  "Cook the bowl written for each date. Sunday is closed.",
  `A DAILY KITCHEN SHEET before ${DAILY_CUTOFF} Asia/Kolkata replaces that date only.`,
  `If no daily message arrives by ${DAILY_CUTOFF}, cook the bowl already written here.`,
];

export const dailyProcess = [
  `Cook this bowl if the message arrives before ${DAILY_CUTOFF} Asia/Kolkata.`,
  "This replaces only this date. The rest of the plan stays on the order sheet.",
  `If this arrives after ${DAILY_CUTOFF}, keep today's order-sheet bowl.`,
];

function sheetProcess() {
  return ["HOW TO PROCESS", ...orderProcess.map((line, index) => `${index + 1}. ${line}`), "I have not paid yet."];
}

export function subscriptionSheet(input: SavedPlan) {
  const style = bowlStyles.find((item) => item.id === input.style);
  const defaultBowl = findBowl(input.bowlId);
  const defaultName = defaultBowl?.name || "the default bowl";
  const picks = input.picks.length ? input.picks : fillPicks(planDates(input.startDate, input.days), input.bowlId);
  const dayLines = picks.map((pick) => `${dayBits(pick.date).label}: ${findBowl(pick.bowlId)?.name || defaultName}`);
  const changed = picks.filter((pick) => pick.bowlId !== input.bowlId);
  const money = sheetMoney({ days: input.days, mix: input.mix, totalPaise: input.totalPaise });
  const head = [
    "AURABOWLS — MEAL PLAN ORDER SHEET",
    "",
    ...sheetIdentity(input),
    "",
    `Plan: ${input.lengthLabel} (${input.days} days)`,
    `Mix: ${mixLabel(input.mix)}`,
    `Style: ${style?.name}`,
    `Default bowl: ${defaultName}`,
    `First day: ${dayBits(picks[0]?.date || input.startDate).label}`,
    `Lunch slot: ${input.slot}`,
    input.note.trim() ? `Note: ${input.note.trim()}` : "",
    "",
  ].filter((line) => line !== undefined);
  const process = sheetProcess();
  const full = [...head, "ORDER SHEET", ...dayLines, "", ...money, "", ...process].filter((line) => line !== undefined).join("\n");
  if (encodeURIComponent(full).length <= WA_LIMIT) return full;
  const compactDays = changed.length
    ? ["ORDER SHEET", `Default bowl on every other day: ${defaultName}`, "Changes:", ...changed.map((pick) => `${dayBits(pick.date).label}: ${findBowl(pick.bowlId)?.name || defaultName}`)]
    : ["ORDER SHEET", `Cook ${defaultName} on each of the ${picks.length} lunch days.`, `Days: ${dayBits(picks[0]?.date || input.startDate).label} to ${dayBits(picks[picks.length - 1]?.date || input.startDate).label}. Sunday closed.`];
  return [...head, ...compactDays, "", ...money, "", ...process].filter((line) => line !== undefined).join("\n");
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
