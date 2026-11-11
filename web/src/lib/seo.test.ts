import { describe, expect, it } from "vitest";
import { mealBlurb } from "./seo";

describe("mealBlurb", () => {
  it("names the dish, diet, price and Madhapur delivery without inventing nutrition", () => {
    const text = mealBlurb({
      name: "Paneer Power Bowl",
      description: "Grilled paneer, signature base, mint yogurt",
      ingredients: "Grilled paneer, signature base, mint yogurt",
      mealType: "lunch",
      dietTags: ["veg"],
      pricePaise: 26000,
      portionLabel: "1 bowl",
    });
    expect(text).toContain("Paneer Power Bowl");
    expect(text).toContain("vegetarian lunch");
    expect(text).toContain("1 bowl, ₹260.00");
    expect(text).toContain("7 km");
    expect(text).toContain("Madhapur");
    expect(text.toLowerCase()).not.toMatch(/\d+\s*g protein|calories|weight loss|certified/);
  });
});
