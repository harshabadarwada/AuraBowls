import { describe, expect, it } from "vitest";
import { suggestIntake } from "./guidance";

describe("intake estimate", () => {
  it("uses a 20% deficit for fat loss in an adult", () => {
    const result = suggestIntake({
      goal: "fat_loss",
      sex: "female",
      age: 30,
      heightCm: 165,
      weightKg: 70,
      activity: "desk",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bmi).toBe(25.7);
    expect(result.kcal).toBe(1360);
    expect(result.proteinG).toBe(112);
    expect(result.fatG).toBe(56);
    expect(result.carbG).toBe(102);
  });

  it("does not suggest calories under 18", () => {
    const result = suggestIntake({
      goal: "weight_gain",
      sex: "male",
      age: 16,
      heightCm: 170,
      weightKg: 60,
      activity: "light",
    });
    expect(result.ok).toBe(false);
  });
});