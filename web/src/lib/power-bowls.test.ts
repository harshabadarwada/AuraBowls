import { describe, expect, it } from "vitest";
import {
  fillPicks,
  findBowl,
  kitchenPickDate,
  planDates,
  planPricePaise,
  subscriptionPrices,
  subscriptionSheet,
  tomorrowSheet,
} from "./power-bowls";

describe("subscription prices after discount", () => {
  it("uses the published veg, non-veg and mixed totals", () => {
    expect(planPricePaise("3", "veg")).toBe(63000);
    expect(planPricePaise("3", "non_veg")).toBe(72000);
    expect(planPricePaise("3", "mixed")).toBe(69000);
    expect(planPricePaise("5", "veg")).toBe(102500);
    expect(planPricePaise("5", "non_veg")).toBe(117500);
    expect(planPricePaise("5", "mixed")).toBe(110000);
    expect(planPricePaise("10", "veg")).toBe(195000);
    expect(planPricePaise("10", "non_veg")).toBe(225000);
    expect(planPricePaise("10", "mixed")).toBe(210000);
    expect(planPricePaise("20", "veg")).toBe(370000);
    expect(planPricePaise("20", "non_veg")).toBe(430000);
    expect(planPricePaise("20", "mixed")).toBe(400000);
    expect(planPricePaise("22", "veg")).toBe(400000);
    expect(planPricePaise("22", "non_veg")).toBe(465000);
    expect(planPricePaise("22", "mixed")).toBe(432500);
    expect(subscriptionPrices["5"].veg).toBe(102500);
  });
});

describe("kitchen schedule", () => {
  it("skips Sunday when counting delivery days", () => {
    expect(planDates("2026-11-06", 3)).toEqual(["2026-11-06", "2026-11-07", "2026-11-09"]);
  });

  it("uses today when the Kolkata clock is before 8:00", () => {
    const pick = kitchenPickDate(new Date("2026-11-03T02:00:00Z"));
    expect(pick.date).toBe("2026-11-03");
    expect(pick.beforeCutoff).toBe(true);
    expect(pick.when).toBe("today");
  });

  it("locks today after 8:00 and skips Sunday", () => {
    const tuesday = kitchenPickDate(new Date("2026-11-03T03:00:00Z"));
    expect(tuesday.date).toBe("2026-11-04");
    expect(tuesday.lockedToday).toBe(true);
    const saturdayEvening = kitchenPickDate(new Date("2026-11-07T03:00:00Z"));
    expect(saturdayEvening.date).toBe("2026-11-09");
    const sundayMorning = kitchenPickDate(new Date("2026-11-08T02:00:00Z"));
    expect(sundayMorning.date).toBe("2026-11-09");
  });
});

describe("order sheets", () => {
  const dates = planDates("2026-11-03", 5);
  const picks = fillPicks(dates, "paneer-meal");
  picks[1] = { date: dates[1], bowlId: "rajma-meal" };

  it("puts the customer name, mix and after-discount price on the sheet", () => {
    const text = subscriptionSheet({
      name: "Meera Rao",
      phone: "9876543210",
      address: "Flat 12, Madhapur",
      pin: "Madhapur 7km",
      style: "balanced",
      mix: "veg",
      diet: "veg",
      bowlId: "paneer-meal",
      days: 5,
      lengthId: "5",
      lengthLabel: "5-day plan",
      startDate: "2026-11-03",
      slot: "12:00–1:30",
      note: "Leave with the guard",
      picks,
      totalPaise: planPricePaise("5", "veg"),
    });
    expect(text.indexOf("Name: Meera Rao")).toBeLessThan(text.indexOf("Plan:"));
    expect(text).toContain("Phone: 9876543210");
    expect(text).toContain("ORDER SHEET");
    expect(text).toContain("Mix: Pure Veg");
    expect(text).toContain("Paneer Meal Bowl");
    expect(text).toContain("Rajma Meal Bowl");
    expect(text).toContain("5-day plan");
    expect(text).toContain("after discount");
    expect(text).toContain("₹1,025.00");
    expect(text).toContain("Leave with the guard");
    expect(text).toContain("HOW TO PROCESS");
    expect(text).toContain("payment QR");
    expect(text).toContain("DAILY KITCHEN SHEET");
    expect(text).toContain("before 8:00 AM");
    expect(text).toContain("I have not paid yet");
    expect(text).toContain("Area: Madhapur, within 7 km");
    expect(findBowl("paneer-meal")?.name).toBe("Paneer Meal Bowl");
  });

  it("compacts a long 22-day sheet so WhatsApp can open it", () => {
    const longDates = planDates("2026-11-03", 22);
    const longPicks = fillPicks(longDates, "classic-chicken-meal");
    longPicks[4] = { date: longDates[4], bowlId: "tikka-chicken-meal" };
    const text = subscriptionSheet({
      name: "Meera Rao",
      phone: "9876543210",
      address: "Flat 12, Madhapur Road, near the metro, Hitech City",
      pin: "Madhapur 7km",
      style: "balanced",
      mix: "non_veg",
      diet: "non_veg",
      bowlId: "classic-chicken-meal",
      days: 22,
      lengthId: "22",
      lengthLabel: "22-day plan",
      startDate: "2026-11-03",
      slot: "1:30–3:00",
      note: "Ring the bell twice and leave it if nobody answers.",
      picks: longPicks,
      totalPaise: planPricePaise("22", "non_veg"),
    });
    expect(encodeURIComponent(text).length).toBeLessThanOrEqual(1800);
    expect(text).toContain("Name: Meera Rao");
    expect(text).toContain("Pure Non-Veg");
    expect(text).toContain("₹4,650.00");
    expect(text).toContain("Chicken Tikka Meal Bowl");
    expect(text).toContain("I have not paid yet");
  });

  it("names the person on the daily kitchen sheet", () => {
    const text = tomorrowSheet({
      name: "Meera Rao",
      address: "Flat 12, Madhapur",
      pin: "Madhapur 7km",
      date: "2026-11-04",
      style: "Power Protein",
      slot: "12:00–1:30",
      bowlName: "Chicken Tikka Power Bowl",
      defaultBowlName: "Classic Chicken Power Bowl",
    });
    expect(text).toContain("DAILY KITCHEN SHEET");
    expect(text).toContain("Name: Meera Rao");
    expect(text).toContain("Bowl: Chicken Tikka Power Bowl");
    expect(text).toContain("HOW TO PROCESS");
    expect(text).toContain("only this date");
    expect(text).toContain("before 8:00 AM");
  });
});
