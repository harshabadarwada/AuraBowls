/** Ask while a delivery is still more than 11 hours away, and no later than 12 hours ahead. */
export const MEAL_ASK_HOURS = 12;
export const MEAL_LOCK_HOURS = 11;

export function mealCheckAction(hoursLeft: number, status: string): "skip" | "ask" | "lock" | "wait" {
  if (status === "same" || status === "changed" || status === "locked") return "skip";
  if (!(hoursLeft > 0) || hoursLeft > MEAL_ASK_HOURS) return "skip";
  if (hoursLeft <= MEAL_LOCK_HOURS) return "lock";
  if (status === "asked") return "wait";
  return "ask";
}

export function parseMealReply(text: string, meals: { id: string; name: string }[]) {
  const cleaned = text.trim().toLowerCase().replace(/[!.]/g, "");
  if (/^(same|yes|ok|okay|haan|haan ji|ha|same dish|same meal|keep it|no change)$/.test(cleaned)) {
    return { kind: "same" as const };
  }
  const match = meals.find((meal) => cleaned === meal.name.toLowerCase() || cleaned.includes(meal.name.toLowerCase()));
  if (match) return { kind: "meal" as const, id: match.id, name: match.name };
  return { kind: "unclear" as const };
}
