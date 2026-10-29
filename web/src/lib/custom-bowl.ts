export type Diet = "veg" | "non_veg";

export type Choice = { id: string; name: string; diet?: Diet; pricePaise?: number };

export const BASE_BOWL_PAISE = 12_000;
export const PORTION_PAISE = 4_000;
export const MAX_PORTIONS = 3;
export const MAX_VEGGIES = 4;
export const MAX_BOWLS = 10;

export const bases: Choice[] = [
  { id: "signature-base", name: "Signature base" },
  { id: "biryani-rice", name: "Healthy biryani rice" },
  { id: "greens", name: "Greens" },
];

export const proteins: Choice[] = [
  { id: "paneer", name: "Paneer", diet: "veg" },
  { id: "tofu", name: "Tofu", diet: "veg" },
  { id: "soya", name: "Soya chunks", diet: "veg" },
  { id: "chickpeas", name: "Chickpeas", diet: "veg" },
  { id: "grilled-chicken", name: "Grilled chicken", diet: "non_veg" },
  { id: "crispy-chicken", name: "Crispy chicken", diet: "non_veg" },
  { id: "boiled-eggs", name: "Boiled eggs", diet: "non_veg" },
];

export const veggies: Choice[] = [
  { id: "cucumber", name: "Cucumber" },
  { id: "carrot", name: "Carrot" },
  { id: "cherry-tomato", name: "Cherry tomato" },
  { id: "corn", name: "Corn" },
  { id: "lettuce", name: "Lettuce" },
  { id: "mushroom", name: "Sautéed mushrooms" },
];

export const sauces: Choice[] = [
  { id: "mint-yogurt", name: "Mint yogurt" },
  { id: "herb-yogurt", name: "Herb yogurt" },
  { id: "peri-peri-yogurt", name: "Peri-peri yogurt" },
  { id: "lemon-herb", name: "Lemon herb dressing" },
  { id: "sesame-ginger", name: "Sesame ginger dressing" },
  { id: "peanut", name: "Asian peanut sauce" },
  { id: "gochujang", name: "Korean gochujang" },
  { id: "smoky-bbq", name: "Smoky BBQ sauce" },
];

export const extras: Choice[] = [
  { id: "cheese", name: "Cheese", pricePaise: 4_000 },
  { id: "sprouts", name: "Sprouts", pricePaise: 4_000 },
  { id: "extra-sauce", name: "Extra sauce or dip", pricePaise: 4_000 },
  { id: "extra-egg", name: "Extra boiled egg", pricePaise: 4_000, diet: "non_veg" },
  { id: "extra-paneer", name: "Extra paneer portion", pricePaise: 5_000 },
  { id: "avocado", name: "Avocado", pricePaise: 5_000 },
  { id: "extra-chicken", name: "Extra chicken portion", pricePaise: 5_000, diet: "non_veg" },
];

export type CustomBowl = {
  diet: Diet;
  base: string;
  protein: string;
  portions: number;
  veggies: string[];
  sauce: string;
  extras: string[];
  quantity: number;
};

export function allowed(choice: Choice, diet: Diet) {
  return !choice.diet || choice.diet === diet;
}

const find = (list: Choice[], id: string) => list.find((item) => item.id === id);

export function priceCustomBowl(bowl: CustomBowl) {
  const portions = Math.min(MAX_PORTIONS, Math.max(1, Math.round(bowl.portions || 1)));
  const quantity = Math.min(MAX_BOWLS, Math.max(1, Math.round(bowl.quantity || 1)));
  const protein = find(proteins, bowl.protein);
  const proteinPaise = protein && allowed(protein, bowl.diet) ? portions * PORTION_PAISE : 0;
  const pickedExtras = bowl.extras
    .map((id) => find(extras, id))
    .filter((item): item is Choice => Boolean(item && allowed(item, bowl.diet)));
  const extrasPaise = pickedExtras.reduce((sum, item) => sum + (item.pricePaise || 0), 0);
  const bowlPaise = BASE_BOWL_PAISE + proteinPaise + extrasPaise;
  return { portions, quantity, protein, proteinPaise, extras: pickedExtras, extrasPaise, bowlPaise, totalPaise: bowlPaise * quantity };
}

export function missingStep(bowl: CustomBowl): string | null {
  if (!find(bases, bowl.base)) return "base";
  const protein = find(proteins, bowl.protein);
  if (!protein || !allowed(protein, bowl.diet)) return "protein";
  if (!find(sauces, bowl.sauce)) return "sauce";
  return null;
}

export function describeCustomBowl(bowl: CustomBowl) {
  const priced = priceCustomBowl(bowl);
  const names = (list: Choice[], ids: string[]) => ids.map((id) => find(list, id)?.name).filter(Boolean).join(", ");
  return {
    priced,
    lines: [
      `Diet: ${bowl.diet === "veg" ? "Vegetarian" : "Non-veg"}`,
      `Base: ${find(bases, bowl.base)?.name || "Not chosen"}`,
      `Protein: ${priced.protein?.name || "Not chosen"} × ${priced.portions} portion${priced.portions > 1 ? "s" : ""}`,
      `Veggies: ${names(veggies, bowl.veggies) || "None"}`,
      `Sauce: ${find(sauces, bowl.sauce)?.name || "Not chosen"}`,
      `Extras: ${priced.extras.map((item) => item.name).join(", ") || "None"}`,
    ],
  };
}
