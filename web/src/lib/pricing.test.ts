import { describe, expect, it } from "vitest";
import { allocatePaise, rupeesToPaise } from "./money";
import { priceOrder } from "./pricing";
import { refundEligibility } from "./refunds";
import { generateDates } from "./schedule";
import { cutoffUtc, isStillChangeable } from "./time";
import { mealCheckAction, parseMealReply } from "./meal-check";
import { razorpayCheckoutSignature, signaturesMatch } from "./payments-sign";

const delivery = (food: number, reference = food, addon = 0, fee = 0) => ({
  date: "2026-10-22",
  label: "Bowl",
  foodPaise: food,
  referenceFoodPaise: reference,
  addonPaise: addon,
  feePaise: fee,
});

describe("money", () => {
  it("parses rupees without binary float drift", () => {
    expect(rupeesToPaise("10.10")).toBe(1010);
    expect(rupeesToPaise("179")).toBe(17900);
  });

  it("allocates paise so the parts match the total", () => {
    const parts = allocatePaise(100, [1, 1, 1]);
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(100);
  });
});

describe("pricing", () => {
  it("applies a plan discount to the default meal price and adds a customization", () => {
    const result = priceOrder({
      deliveries: [delivery(19900, 17900, 2500, 4000)],
      planDiscountBps: 1000,
      coupon: null,
      taxMode: "none",
      taxRateBps: 0,
      taxLabel: "GST",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.planDiscountPaise).toBe(1790);
    expect(result.customizationDeltaPaise).toBe(2000);
    expect(result.totalPaise).toBe(19900 + 2500 + 4000 - 1790);
  });

  it("rejects a coupon that is larger than the payable amount", () => {
    const result = priceOrder({
      deliveries: [delivery(5000)],
      planDiscountBps: 0,
      coupon: { code: "BIG", type: "fixed", value: 9000, minOrderPaise: 0, stackable: true },
      taxMode: "none",
      taxRateBps: 0,
      taxLabel: "GST",
    });
    expect(result.ok).toBe(false);
  });

  it("blocks a non-stackable coupon when a plan discount exists", () => {
    const result = priceOrder({
      deliveries: [delivery(20000)],
      planDiscountBps: 500,
      coupon: { code: "SAVE10", type: "percent", value: 1000, minOrderPaise: 0, stackable: false },
      taxMode: "none",
      taxRateBps: 0,
      taxLabel: "GST",
    });
    expect(result).toMatchObject({ ok: false, code: "coupon_not_stackable" });
  });

  it("adds exclusive tax and extracts inclusive tax", () => {
    const exclusive = priceOrder({
      deliveries: [delivery(10000)],
      planDiscountBps: 0,
      coupon: null,
      taxMode: "exclusive",
      taxRateBps: 1800,
      taxLabel: "GST",
    });
    const inclusive = priceOrder({
      deliveries: [delivery(11800)],
      planDiscountBps: 0,
      coupon: null,
      taxMode: "inclusive",
      taxRateBps: 1800,
      taxLabel: "GST",
    });
    expect(exclusive.ok && exclusive.taxPaise).toBe(1800);
    expect(exclusive.ok && exclusive.totalPaise).toBe(11800);
    expect(inclusive.ok && inclusive.totalPaise).toBe(11800);
    expect(inclusive.ok && inclusive.taxPaise).toBe(1800);
  });

  it("keeps delivery totals equal to the order total", () => {
    const result = priceOrder({
      deliveries: [delivery(17900, 17900, 0, 0), delivery(16900, 17900, 3000, 0), delivery(17900, 17900, 0, 4000)],
      planDiscountBps: 500,
      coupon: { code: "WELCOME50", type: "fixed", value: 5000, minOrderPaise: 10000, stackable: true },
      taxMode: "exclusive",
      taxRateBps: 500,
      taxLabel: "GST",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const allocated = result.allocations.reduce((sum, line) => sum + line.totalPaise, 0);
    expect(allocated).toBe(result.totalPaise);
  });
});

describe("schedule and cutoff", () => {
  const now = new Date("2026-10-20T12:00:00.000Z");

  it("builds five weekdays and skips Sunday", () => {
    const result = generateDates({
      startDate: "2026-10-23",
      count: 5,
      rule: "weekdays",
      operatingWeekdays: [1, 2, 3, 4, 5, 6],
      closures: [],
      slotStart: "12:00",
      now,
      cutoffHours: 24,
    });
    expect(result.dates).toEqual(["2026-10-23", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"]);
    expect(result.shortfall).toBe(false);
  });

  it("skips a kitchen closure and a date inside the cutoff", () => {
    const result = generateDates({
      startDate: "2026-10-21",
      count: 2,
      rule: "all_days",
      operatingWeekdays: [1, 2, 3, 4, 5, 6],
      closures: ["2026-10-22"],
      slotStart: "12:00",
      now,
      cutoffHours: 24,
    });
    expect(result.dates[0]).toBe("2026-10-23");
    expect(result.skipped.some((skip) => skip.date === "2026-10-21")).toBe(true);
    expect(result.skipped.some((skip) => skip.date === "2026-10-22")).toBe(true);
  });

  it("places the cutoff 24 hours before the slot in Kolkata", () => {
    const cutoff = cutoffUtc("2026-10-22", "12:00", 24);
    expect(cutoff.toISOString()).toBe("2026-10-21T06:30:00.000Z");
    expect(isStillChangeable("2026-10-22", "12:00", new Date("2026-10-21T06:29:00.000Z"))).toBe(true);
    expect(isStillChangeable("2026-10-22", "12:00", new Date("2026-10-21T06:30:00.000Z"))).toBe(false);
  });
});

describe("refunds", () => {
  it("keeps delivered and cutoff-locked meals out of the suggested refund", () => {
    const result = refundEligibility(
      [
        { id: "a", date: "2026-10-22", slotStart: "12:00", status: "delivered", totalPaise: 1000 },
        { id: "b", date: "2026-10-21", slotStart: "12:00", status: "scheduled", totalPaise: 2000 },
        { id: "c", date: "2026-10-28", slotStart: "12:00", status: "scheduled", totalPaise: 3000 },
      ],
      new Date("2026-10-20T12:00:00.000Z"),
    );
    expect(result.amountPaise).toBe(3000);
    expect(result.locked.map((item) => item.id)).toEqual(["a", "b"]);
  });
});

describe("wellness bundle discount", () => {
  it("applies a bundle only when no plan or coupon discount is present", () => {
    const shots = [delivery(5900), delivery(5900), delivery(5900)];
    const bundled = priceOrder({ deliveries: shots, planDiscountBps: 0, coupon: null, taxMode: "none", taxRateBps: 0, taxLabel: "", bundleDiscountPaise: 5900 * 3 - 14900 });
    expect(bundled.ok && bundled.totalPaise).toBe(14900);
    expect(bundled.ok && bundled.taxPaise).toBe(0);
    const blocked = priceOrder({ deliveries: shots, planDiscountBps: 1000, coupon: null, taxMode: "none", taxRateBps: 0, taxLabel: "", bundleDiscountPaise: 2800 });
    expect(blocked.ok && blocked.bundleDiscountPaise).toBe(0);
  });
});

describe("12-hour meal check", () => {
  it("asks only between 11 and 12 hours, then locks the scheduled meal", () => {
    expect(mealCheckAction(12, "")).toBe("ask");
    expect(mealCheckAction(11.5, "")).toBe("ask");
    expect(mealCheckAction(11.5, "asked")).toBe("wait");
    expect(mealCheckAction(11, "asked")).toBe("lock");
    expect(mealCheckAction(10, "")).toBe("lock");
    expect(mealCheckAction(13, "")).toBe("skip");
    expect(mealCheckAction(8, "locked")).toBe("skip");
  });

  it("reads SAME and an exact meal name", () => {
    const meals = [{ id: "oats", name: "Mango Coconut Overnight Oats" }];
    expect(parseMealReply("SAME", meals).kind).toBe("same");
    expect(parseMealReply("Mango Coconut Overnight Oats", meals)).toMatchObject({ kind: "meal", id: "oats" });
    expect(parseMealReply("something else", meals).kind).toBe("unclear");
  });
});

describe("payment signatures", () => {
  it("matches a Razorpay-style signature and rejects a tampered one", () => {
    const signature = razorpayCheckoutSignature("order_1", "pay_1", "secret");
    expect(signaturesMatch(signature, signature)).toBe(true);
    expect(signaturesMatch(signature, "nope")).toBe(false);
  });
});
