import { describe, expect, it } from "vitest";
import {
  fillPicks,
  findBowl,
  kitchenPickDate,
  lunchPaise,
  planBowls,
  planDates,
  planDeltaPaise,
  weekGroups,
  planPricePaise,
  rotatePicks,
  subscriptionPrices,
  subscriptionSheet,
  tomorrowSheet,
  WA_LIMIT,
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
    expect(lunchPaise("5", "veg")).toBe(20500);
    expect(lunchPaise("3", "non_veg")).toBe(24000);
    expect(lunchPaise("10", "mixed")).toBe(21000);
  });

  it("raises Power Protein and Carb Load against Balanced", () => {
    expect(planPricePaise("10", "mixed", "balanced")).toBe(210000);
    expect(planPricePaise("10", "mixed", "protein")).toBe(229900);
    expect(planPricePaise("10", "mixed", "carb")).toBe(214900);
    expect(planPricePaise("5", "mixed", "protein")).toBe(119900);
    expect(planPricePaise("3", "veg", "protein")).toBe(68900);
    expect(planPricePaise("20", "non_veg", "carb")).toBe(439900);
    expect(planDeltaPaise("10", "mixed", "protein")).toBe(19900);
    expect(planDeltaPaise("10", "mixed", "carb")).toBe(4900);
  });
});

describe("kitchen schedule", () => {
  it("skips Sunday when counting delivery days", () => {
    expect(planDates("2026-11-06", 3)).toEqual(["2026-11-06", "2026-11-07", "2026-11-09"]);
  });

  it("groups lunches into Monday weeks", () => {
    const groups = weekGroups(["2026-11-06", "2026-11-07", "2026-11-09"]);
    expect(groups).toHaveLength(2);
    expect(groups[0].dates).toEqual(["2026-11-06", "2026-11-07"]);
    expect(groups[1].dates).toEqual(["2026-11-09"]);
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

describe("menu rotation", () => {
  it("fills days from the selected menu without repeating until the list starts over", () => {
    const dates = planDates("2026-11-03", 5);
    const ids = planBowls("balanced", "veg").map((bowl) => bowl.id);
    const picks = rotatePicks(dates, ids);
    expect(picks.map((pick) => pick.bowlId)).toEqual(ids.slice(0, 5));
    expect(new Set(picks.map((pick) => pick.bowlId)).size).toBe(5);
  });

  it("interleaves veg and chicken on mixed plans", () => {
    const bowls = planBowls("balanced", "mixed");
    expect(bowls[0]?.diet).toBe("veg");
    expect(bowls[1]?.diet).toBe("non_veg");
    const picks = rotatePicks(planDates("2026-11-03", 4), bowls.map((bowl) => bowl.id));
    expect(findBowl(picks[0]?.bowlId || "")?.diet).toBe("veg");
    expect(findBowl(picks[1]?.bowlId || "")?.diet).toBe("non_veg");
  });

  it("keeps a day the customer already changed", () => {
    const dates = planDates("2026-11-03", 3);
    const ids = planBowls("balanced", "veg").map((bowl) => bowl.id);
    const picks = rotatePicks(dates, ids, [{ date: dates[1] || "", bowlId: ids[4] || ids[0] }]);
    expect(picks[1]?.bowlId).toBe(ids[4]);
    expect(picks[0]?.bowlId).toBe(ids[0]);
  });

  it("cycles after the menu runs out", () => {
    const dates = planDates("2026-11-03", 5);
    const ids = planBowls("balanced", "non_veg").map((bowl) => bowl.id);
    expect(ids).toHaveLength(4);
    expect(rotatePicks(dates, ids).map((pick) => pick.bowlId)).toEqual([ids[0], ids[1], ids[2], ids[3], ids[0]]);
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
      orderId: "AB-123456",
    });
    expect(text).toContain("Order ID: AB-123456");
    expect(text).toContain("Name: Meera Rao");
    expect(text).toContain("Phone: 9876543210");
    expect(text).toContain("AURABOWLS | MEAL PLAN ORDER");
    expect(text).toContain("Pure Veg");
    expect(text).toContain("Paneer Meal Bowl");
    expect(text).toContain("Rajma Meal Bowl");
    expect(text).toContain("5-Day Lunch Plan");
    expect(text).toContain("₹1,025");
    expect(text).toContain("Leave with the guard");
    expect(text).toContain("payment QR");
    expect(text).toContain("PAYMENT STATUS: PENDING");
    expect(text).toContain("before 8:00 AM");
    expect(text).toContain("Address: Flat 12, Madhapur");
    expect(text).toContain("Madhapur (within 7 km)");
    expect(findBowl("paneer-meal")?.name).toBe("Paneer Meal Bowl");
    expect(encodeURIComponent(text).length).toBeLessThanOrEqual(WA_LIMIT);
  });

  it("lists the rotated menu when bowls differ by day", () => {
    const dates = planDates("2026-11-03", 5);
    const ids = planBowls("balanced", "veg").map((bowl) => bowl.id);
    const text = subscriptionSheet({
      name: "Meera Rao",
      phone: "9876543210",
      address: "Flat 12, Madhapur",
      pin: "Madhapur 7km",
      style: "balanced",
      mix: "veg",
      diet: "veg",
      bowlId: ids[0] || "paneer-meal",
      days: 5,
      lengthId: "5",
      lengthLabel: "5-day plan",
      startDate: "2026-11-03",
      slot: "12:00–1:30",
      note: "",
      picks: rotatePicks(dates, ids),
      totalPaise: planPricePaise("5", "veg"),
      orderId: "AB-777111",
    });
    expect(text).toContain("rotated from the Balanced Pure Veg menu");
    expect(text).toContain("Paneer Meal Bowl");
    expect(text).toContain("Mushroom Meal Bowl");
    expect(text).not.toContain("Cook Paneer Meal Bowl on each");
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
      orderId: "AB-654321",
    });
    expect(encodeURIComponent(text).length).toBeLessThanOrEqual(WA_LIMIT);
    expect(text).toContain("Order ID: AB-654321");
    expect(text).toContain("Name: Meera Rao");
    expect(text).toContain("Pure Non-Veg");
    expect(text).toContain("₹4,650");
    expect(text).toContain("Chicken Tikka Meal Bowl");
    expect(text).toContain("PAYMENT STATUS: PENDING");
  });

  it("keeps a rotated 22-day mixed sheet inside the WhatsApp limit", () => {
    const dates = planDates("2026-11-03", 22);
    const ids = planBowls("balanced", "mixed").map((bowl) => bowl.id);
    const text = subscriptionSheet({
      name: "Meera Rao",
      phone: "9876543210",
      address: "Flat 12, Madhapur Road, near the metro, Hitech City",
      pin: "Madhapur 7km",
      style: "balanced",
      mix: "mixed",
      diet: "veg",
      bowlId: ids[0] || "paneer-meal",
      days: 22,
      lengthId: "22",
      lengthLabel: "22-day plan",
      startDate: "2026-11-03",
      slot: "1:30–3:00",
      note: "Ring the bell twice.",
      picks: rotatePicks(dates, ids),
      totalPaise: planPricePaise("22", "mixed"),
      orderId: "AB-888222",
    });
    expect(encodeURIComponent(text).length).toBeLessThanOrEqual(WA_LIMIT);
    expect(text).toContain("Order ID: AB-888222");
    expect(text).toContain("Mixed");
    expect(text).toContain("PAYMENT STATUS: PENDING");
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
