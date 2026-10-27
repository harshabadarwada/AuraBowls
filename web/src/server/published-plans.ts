import { catalog } from "../../prisma/catalog";
import { priceOrder, type PricingSuccess } from "@/lib/pricing";
import { generateDates } from "@/lib/schedule";
import { parseWeekdays } from "@/lib/time";

export type PublishedPlan = {
  slug: string;
  name: string;
  description: string;
  mealType: "breakfast" | "lunch" | "both";
  cadence: "daily" | "weekly" | "monthly";
  scheduleRule: "all_days" | "weekdays";
  fixedDeliveryCount: number;
  defaultMealSlug: string;
  companionMealSlug: string;
  discountBps: number;
  active: true;
};

export type PublishedSlot = {
  id: string;
  mealType: "breakfast" | "lunch";
  label: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  active: true;
  capacity: number;
};

const plans: PublishedPlan[] = ([
  ["daily-breakfast", "Daily Breakfast", "One breakfast delivery on the next open day.", "breakfast", "daily", "all_days", 1, "mango-coconut-overnight-oats", "", 0],
  ["daily-lunch", "Daily Lunch", "One lunch delivery on the next open day.", "lunch", "daily", "all_days", 1, "paneer-power-bowl", "", 0],
  ["weekday-breakfast", "Weekday Breakfast", "Five weekday breakfasts. The discount is 5% off the current menu price of the default meal.", "breakfast", "weekly", "weekdays", 5, "mango-coconut-overnight-oats", "", 500],
  ["weekday-lunch", "Weekday Lunch", "Five weekday lunches. The discount is 5% off the current menu price of the default meal.", "lunch", "weekly", "weekdays", 5, "paneer-power-bowl", "", 500],
  ["monthly-breakfast", "Monthly Breakfast", "Twenty weekday breakfasts. The discount is 10% off the current menu price of the default meals.", "breakfast", "monthly", "weekdays", 20, "mango-coconut-overnight-oats", "", 1000],
  ["monthly-lunch", "Monthly Lunch", "Twenty weekday lunches. The discount is 10% off the current menu price of the default meals.", "lunch", "monthly", "weekdays", 20, "paneer-power-bowl", "", 1000],
  ["daily-both", "Daily Breakfast & Lunch", "One open day with breakfast and lunch. Both meals are charged at menu price. Paid once.", "both", "daily", "all_days", 1, "mango-coconut-overnight-oats", "paneer-power-bowl", 0],
  ["weekday-both", "Weekday Breakfast & Lunch", "Five weekdays. Breakfast and lunch each day. The discount is 5% off the current menu price of each default meal.", "both", "weekly", "weekdays", 5, "mango-coconut-overnight-oats", "paneer-power-bowl", 500],
  ["monthly-both", "Monthly Breakfast & Lunch", "Twenty weekdays. Breakfast and lunch each day. The discount is 10% off the current menu price of each default meal.", "both", "monthly", "weekdays", 20, "mango-coconut-overnight-oats", "paneer-power-bowl", 1000],
] as const).map(([slug, name, description, mealType, cadence, scheduleRule, fixedDeliveryCount, defaultMealSlug, companionMealSlug, discountBps]) => ({
  slug, name, description, mealType, cadence, scheduleRule, fixedDeliveryCount, defaultMealSlug, companionMealSlug, discountBps, active: true as const,
}));

export const publishedSlots: PublishedSlot[] = [
  { id: "breakfast-0730", mealType: "breakfast", label: "7:30–9:00", startTime: "07:30", endTime: "09:00", sortOrder: 1, active: true, capacity: 25 },
  { id: "breakfast-0900", mealType: "breakfast", label: "9:00–10:30", startTime: "09:00", endTime: "10:30", sortOrder: 2, active: true, capacity: 25 },
  { id: "lunch-1200", mealType: "lunch", label: "12:00–1:30", startTime: "12:00", endTime: "13:30", sortOrder: 1, active: true, capacity: 25 },
  { id: "lunch-1330", mealType: "lunch", label: "1:30–3:00", startTime: "13:30", endTime: "15:00", sortOrder: 2, active: true, capacity: 25 },
];

const servedArea = {
  pinCode: "500081",
  label: "Madhapur and Hitech City",
  deliveryFeePaise: 0,
  coverage: "pin",
  localityNote: "AuraBowls delivers in PIN 500081. A PIN match is not a promise that every building inside it is served.",
  weekdays: "1,2,3,4,5,6",
  active: true,
};

export function publishedPlans() {
  return plans;
}

export function publishedPlan(slug: string) {
  return plans.find((plan) => plan.slug === slug) || null;
}

export function planMealsFromPaise(pricePaise: number, count: number, discountBps: number) {
  const reference = pricePaise * count;
  const discount = Math.round((reference * discountBps) / 10_000);
  return reference - Math.min(discount, reference);
}

type DraftSelection = {
  date: string;
  mealId: string;
  addonIds: string[];
  quantity: number;
  slotId: string;
};

type Draft = {
  mode: "single" | "plan";
  planSlug?: string | null;
  mealType: "breakfast" | "lunch" | "both";
  startDate: string;
  pinCode: string;
  couponCode?: string;
  selections: DraftSelection[];
};

type Fail = { ok: false; code: string; message: string; dates?: string[] };

function mealBySlug(slug: string) {
  return catalog.find((meal) => meal.slug === slug) || null;
}

function scheduleFor(plan: PublishedPlan | null, mealType: Draft["mealType"], startDate: string, slotStart: string) {
  return generateDates({
    startDate,
    count: plan ? plan.fixedDeliveryCount : 1,
    rule: plan ? plan.scheduleRule : "all_days",
    operatingWeekdays: parseWeekdays("1,2,3,4,5,6"),
    areaWeekdays: parseWeekdays(servedArea.weekdays),
    closures: [],
    slotStart,
    cutoffHours: 24,
    timezone: "Asia/Kolkata",
  });
}

function areaOrFail(pinCode: string): Fail | null {
  if (pinCode !== servedArea.pinCode) return { ok: false, code: "outside_area", message: "AuraBowls does not deliver to this PIN yet." };
  return null;
}

export function catalogPreview(raw: { mode: "single" | "plan"; planSlug?: string | null; mealType: Draft["mealType"]; startDate: string; pinCode: string; slotId: string; lunchSlotId?: string }) {
  const outside = areaOrFail(raw.pinCode);
  if (outside) return outside;
  const plan = raw.mode === "plan" ? publishedPlan(raw.planSlug || "") : null;
  if (raw.mode === "plan" && !plan) return { ok: false, code: "plan_missing", message: "That meal plan is no longer available." } satisfies Fail;
  if (plan && plan.mealType !== raw.mealType) return { ok: false, code: "plan_mismatch", message: "That plan does not match the selected meal type." } satisfies Fail;
  const combined = plan?.mealType === "both";
  const slot = publishedSlots.find((item) => item.id === raw.slotId);
  const lunchSlot = combined ? publishedSlots.find((item) => item.id === (raw.lunchSlotId || "")) : null;
  const slotOk = combined ? slot?.mealType === "breakfast" : slot?.mealType === raw.mealType;
  if (!slot || !slotOk || (combined && lunchSlot?.mealType !== "lunch")) {
    return { ok: false, code: "slot_invalid", message: combined ? "Choose a breakfast slot and a lunch slot." : "Choose a current delivery slot." } satisfies Fail;
  }
  const schedule = scheduleFor(plan, raw.mealType, raw.startDate, slot.startTime);
  if (schedule.shortfall) return { ok: false, code: "schedule_short", message: "There are not enough open delivery days from that start date." } satisfies Fail;
  return {
    ok: true as const,
    dates: schedule.dates,
    skipped: schedule.skipped.slice(0, 8),
    defaultMealId: plan ? plan.defaultMealSlug : "",
    lunchMealId: combined ? plan?.companionMealSlug || "" : "",
    area: { label: servedArea.label, localityNote: servedArea.localityNote, coverage: servedArea.coverage, deliveryFeePaise: servedArea.deliveryFeePaise },
    orderOnWhatsapp: true as const,
  };
}

export function catalogQuote(input: Draft): Fail | {
  ok: true;
  quote: PricingSuccess;
  dates: string[];
  skipped: { date: string; reason: string }[];
  area: { label: string; coverage: string; localityNote: string; deliveryFeePaise: number };
  reservationMinutes: number;
  lines: { date: string; mealName: string; mealType: string; quantity: number; addons: string[]; slotLabel: string }[];
  orderOnWhatsapp: true;
} {
  const outside = areaOrFail(input.pinCode);
  if (outside) return outside;
  if (input.couponCode?.trim()) return { ok: false, code: "coupon_invalid", message: "That coupon is not active." };
  const plan = input.mode === "plan" ? publishedPlan(input.planSlug || "") : null;
  if (input.mode === "plan" && !plan) return { ok: false, code: "plan_missing", message: "That meal plan is no longer available." };
  if (plan && plan.mealType !== input.mealType) return { ok: false, code: "plan_mismatch", message: "That plan does not match the selected meal type." };
  const combined = plan?.mealType === "both";
  const slotById = new Map(publishedSlots.map((slot) => [slot.id, slot]));
  if (input.selections.some((selection) => !slotById.has(selection.slotId) || (selection.addonIds.length > 0))) {
    return { ok: false, code: "slot_invalid", message: "Choose a current delivery slot for this meal." };
  }
  const primary = input.selections.map((selection) => slotById.get(selection.slotId)).find((slot) => (combined ? slot?.mealType === "breakfast" : slot?.mealType === input.mealType));
  if (!primary) return { ok: false, code: "slot_invalid", message: combined ? "Choose a breakfast slot and a lunch slot." : "Choose a delivery slot." };
  const schedule = scheduleFor(plan, input.mealType, input.startDate, primary.startTime);
  if (schedule.shortfall) return { ok: false, code: "schedule_short", message: "There are not enough open delivery days for this plan. Try a different start date." };
  const requestedDates = input.selections.map((selection) => selection.date).sort();
  const expectedDates = (combined ? schedule.dates.flatMap((date) => [date, date]) : schedule.dates).slice().sort();
  if (requestedDates.join() !== expectedDates.join()) {
    return { ok: false, code: "schedule_changed", message: "The available delivery dates changed. Review the updated schedule before paying.", dates: schedule.dates };
  }
  const defaultMeal = plan ? mealBySlug(plan.defaultMealSlug) : null;
  const lunchDefault = combined && plan ? mealBySlug(plan.companionMealSlug) : null;
  if (plan && !defaultMeal) return { ok: false, code: "plan_missing", message: "The default meal for this plan is unavailable. Choose another plan." };
  if (combined && !lunchDefault) return { ok: false, code: "plan_missing", message: "The lunch for this plan is unavailable. Choose another plan." };
  const deliveries = input.selections.map((selection) => {
    const meal = mealBySlug(selection.mealId);
    const slot = slotById.get(selection.slotId);
    if (!meal || !slot || meal.type !== (combined ? slot.mealType : input.mealType)) {
      return null;
    }
    const reference = combined ? (meal.type === "lunch" ? lunchDefault : defaultMeal) : defaultMeal;
    return {
      date: selection.date,
      label: meal.name,
      foodPaise: meal.price * selection.quantity,
      referenceFoodPaise: (reference || meal).price * selection.quantity,
      addonPaise: 0,
      feePaise: servedArea.deliveryFeePaise,
      meal,
      slot,
      selection,
    };
  });
  if (deliveries.some((delivery) => !delivery)) return { ok: false, code: "meal_missing", message: "One of the selected meals is no longer on the menu." };
  const priced = priceOrder({
    deliveries: deliveries.filter((delivery) => delivery !== null),
    planDiscountBps: plan?.discountBps ?? 0,
    coupon: null,
    taxMode: "none",
    taxRateBps: 0,
    taxLabel: "",
    bundleDiscountPaise: 0,
  });
  if (!priced.ok) return { ok: false, code: priced.code, message: priced.message };
  return {
    ok: true,
    quote: priced,
    dates: schedule.dates,
    skipped: schedule.skipped.slice(0, 8),
    area: { label: servedArea.label, coverage: servedArea.coverage, localityNote: servedArea.localityNote, deliveryFeePaise: servedArea.deliveryFeePaise },
    reservationMinutes: 10,
    lines: deliveries.filter((delivery) => delivery !== null).map((delivery) => ({
      date: delivery.date,
      mealName: delivery.meal.name,
      mealType: delivery.meal.type,
      quantity: delivery.selection.quantity,
      addons: [],
      slotLabel: delivery.slot.label,
    })),
    orderOnWhatsapp: true,
  };
}

export function servedPinArea() {
  return servedArea;
}
