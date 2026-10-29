import { describe, expect, it } from "vitest";
import { missingStep, priceCustomBowl, type CustomBowl } from "@/lib/custom-bowl";
import { customBowlText } from "@/lib/order-message";

const bowl: CustomBowl = {
  diet: "non_veg",
  base: "signature-base",
  protein: "grilled-chicken",
  portions: 2,
  veggies: ["cucumber", "corn"],
  sauce: "peri-peri-yogurt",
  extras: ["cheese", "avocado"],
  quantity: 2,
};

describe("custom bowl pricing", () => {
  it("adds ₹40 per protein portion and each extra to the ₹120 base", () => {
    const priced = priceCustomBowl(bowl);
    expect(priced.proteinPaise).toBe(8_000);
    expect(priced.extrasPaise).toBe(9_000);
    expect(priced.bowlPaise).toBe(29_000);
    expect(priced.totalPaise).toBe(58_000);
  });

  it("caps portions between 1 and 3 and ignores non-veg extras on a veg bowl", () => {
    const priced = priceCustomBowl({ ...bowl, diet: "veg", protein: "paneer", portions: 9, extras: ["extra-chicken", "sprouts"], quantity: 1 });
    expect(priced.proteinPaise).toBe(12_000);
    expect(priced.extras.map((item) => item.id)).toEqual(["sprouts"]);
    expect(priced.totalPaise).toBe(12_000 + 12_000 + 4_000);
  });

  it("asks for a protein that matches the diet", () => {
    expect(missingStep({ ...bowl, diet: "veg" })).toBe("protein");
    expect(missingStep(bowl)).toBeNull();
  });

  it("writes an unpaid WhatsApp order with name, address and delivery note", () => {
    const text = customBowlText({ name: "Asha", address: "Flat 2, Madhapur", pin: "500081", bowl });
    expect(text).toContain("Name: Asha");
    expect(text).toContain("Address: Flat 2, Madhapur");
    expect(text).toContain("Protein: Grilled chicken × 2 portions");
    expect(text).toContain("Total: ₹580.00");
    expect(text).toContain("I have not paid yet.");
    expect(text).toContain("Delivery charges vary");
  });

  it("sends outside-area visitors the enquiry message", () => {
    expect(customBowlText({ name: "Ravi", address: "Kukatpally", pin: "500072", bowl })).toContain("outside PIN 500081");
  });
});
