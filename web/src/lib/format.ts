import { formatInr, formatInrCompact } from "./money";

export { formatInr, formatInrCompact };

export function dietLabel(tag: string) {
  if (tag === "non_veg") return "Non-veg";
  if (tag === "vegan") return "Vegan";
  if (tag === "veg") return "Vegetarian";
  return tag;
}
