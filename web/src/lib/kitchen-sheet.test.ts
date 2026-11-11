import { describe, expect, it } from "vitest";
import { trackerMealType, trackerOrder, trackerPhone } from "./kitchen-sheet";

describe("subscription tracker payload", () => {
  it("matches the Subscription Orders webhook columns", () => {
    const order = trackerOrder({
      name: "Pooja Sharma",
      phone: "9876543210",
      address: "Flat 12, Madhapur",
      area: "Madhapur, within 7 km",
      mealType: "Pure Veg",
      days: 10,
      startDate: "2026-11-15",
      totalPaise: 195000,
      slot: "12:00–1:30",
      style: "Balanced",
      defaultBowl: "Paneer Meal Bowl",
      schedule: "Sat, 15 Nov: Paneer Meal Bowl | Mon, 17 Nov: Rajma Meal Bowl",
      note: "Deliver before 12:30 PM",
    }, new Date("2026-11-11T10:00:00+05:30"));
    expect(order.spreadsheetId).toBe("1uG40XeadQAXW_QAsTob4zbsBuKUYajjLyJLYW0V_i-A");
    expect(order.orderId).toMatch(/^AB-\d{6}$/);
    expect(order.orderDate).toBe("2026-11-11");
    expect(order.customerName).toBe("Pooja Sharma");
    expect(order.phoneNumber).toBe("+91 9876543210");
    expect(order.deliveryArea).toBe("Madhapur, within 7 km");
    expect(order.mealType).toBe("Pure Veg");
    expect(order.planDuration).toBe("10 days");
    expect(order.startDate).toBe("2026-11-15");
    expect(order.totalAmount).toBe(1950);
    expect(order.paymentStatus).toBe("Unpaid");
    expect(order.orderStatus).toBe("Pending");
    expect(order.deliveryNotes).toContain("Address: Flat 12, Madhapur");
    expect(order.deliveryNotes).toContain("Rajma Meal Bowl");
    expect(order.deliveryNotes).toContain("Deliver before 12:30 PM");
  });

  it("maps mix labels to the pricing matrix names", () => {
    expect(trackerMealType("veg")).toBe("Pure Veg");
    expect(trackerMealType("Pure Non-Veg")).toBe("Pure Non-Veg");
    expect(trackerMealType("mixed")).toBe("Mixed");
    expect(trackerPhone("919876543210")).toBe("+91 9876543210");
  });
});
