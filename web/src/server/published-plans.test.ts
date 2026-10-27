import { describe, expect, it } from "vitest";
import { catalogPreview, catalogQuote, planMealsFromPaise, publishedPlan } from "./published-plans";

describe("weekday breakfast without a database", () => {
  it("prices five breakfasts at 5% off", () => {
    expect(publishedPlan("weekday-breakfast")?.fixedDeliveryCount).toBe(5);
    expect(planMealsFromPaise(22000, 5, 500)).toBe(104500);
  });

  it("lays out five days in PIN 500081", () => {
    const preview = catalogPreview({
      mode: "plan",
      planSlug: "weekday-breakfast",
      mealType: "breakfast",
      startDate: "2026-11-02",
      pinCode: "500081",
      slotId: "breakfast-0730",
    });
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    expect(preview.dates).toHaveLength(5);
    expect(preview.orderOnWhatsapp).toBe(true);
    const quote = catalogQuote({
      mode: "plan",
      planSlug: "weekday-breakfast",
      mealType: "breakfast",
      startDate: "2026-11-02",
      pinCode: "500081",
      selections: preview.dates.map((date) => ({ date, mealId: "mango-coconut-overnight-oats", addonIds: [], quantity: 1, slotId: "breakfast-0730" })),
    });
    expect(quote.ok).toBe(true);
    if (!quote.ok) return;
    expect(quote.quote.totalPaise).toBe(104500);
  });
});