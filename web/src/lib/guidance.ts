export type Sex = "female" | "male";
export type Activity = "desk" | "light" | "regular" | "hard";
export type BodyGoal = "fat_loss" | "weight_gain" | "eat_healthy";

const activityFactor: Record<Activity, number> = {
  desk: 1.2,
  light: 1.375,
  regular: 1.55,
  hard: 1.725,
};

export function bodyMassIndex(weightKg: number, heightCm: number) {
  const metres = heightCm / 100;
  return Math.round((weightKg / (metres * metres)) * 10) / 10;
}

export function bodyMassLabel(bmi: number) {
  if (bmi < 18.5) return "Below the usual range";
  if (bmi < 25) return "Within the usual range";
  if (bmi < 30) return "Above the usual range";
  return "Well above the usual range";
}

export function suggestIntake(input: {
  goal: Exclude<BodyGoal, "eat_healthy">;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
}) {
  if (input.age < 18) {
    return { ok: false as const, message: "This estimate is for adults. We will not suggest calories for anyone under 18." };
  }
  const bmi = bodyMassIndex(input.weightKg, input.heightCm);
  const bmr = input.sex === "male"
    ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + 5
    : 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age - 161;
  const maintenance = bmr * activityFactor[input.activity];
  let kcal = maintenance;
  let note = "Around the estimated maintenance intake.";
  if (input.goal === "fat_loss") {
    if (bmi < 18.5) {
      note = "Fat loss is not suggested while BMI is below the usual range, so this stays near maintenance.";
    } else {
      kcal = maintenance * 0.8;
      note = "About 20% under the estimated maintenance intake.";
    }
  }
  if (input.goal === "weight_gain") {
    kcal = maintenance * 1.15;
    note = "About 15% over the estimated maintenance intake.";
  }
  const rounded = Math.round(kcal / 10) * 10;
  const proteinG = Math.round(input.weightKg * 1.6);
  const fatG = Math.round(input.weightKg * (input.goal === "weight_gain" ? 1 : 0.8));
  const carbG = Math.max(0, Math.round((rounded - proteinG * 4 - fatG * 9) / 4));
  return {
    ok: true as const,
    bmi,
    bmiLabel: bodyMassLabel(bmi),
    kcal: rounded,
    proteinG,
    fatG,
    carbG,
    note,
  };
}
