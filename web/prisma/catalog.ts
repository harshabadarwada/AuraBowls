export type CatalogMeal = {
  slug: string;
  name: string;
  description: string;
  ingredients: string;
  price: number;
  compareAt: number;
  diet: "veg" | "non_veg";
  type: "breakfast" | "lunch";
  category: string;
  portion: string;
  image: string;
};

const photo = {
  bowl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
  rice: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80",
  oats: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=1200&q=80",
  salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  drink: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=80",
  bite: "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=80",
};

const pictured = new Set([
  "fiery-peri-chicken-bowl",
  "seoul-crunch-chicken-bowl",
  "smoky-bbq-chicken-bowl",
  "mediterranean-chicken-bowl",
  "paneer-power-bowl",
  "pepper-mushroom-bowl",
  "soya-crunch-power-bowl",
  "asian-sesame-veg-bowl",
  "tofu-power-bowl",
  "falafel-hummus-bowl",
  "sweet-potato-power-bowl",
  "protein-punch-egg-bowl",
  "masala-egg-power-bowl",
  "korean-fried-chicken-biryani-bowl",
  "tandoori-chicken-biryani-bowl",
  "paneer-biryani-bowl",
  "soya-biryani-bowl",
  "mushroom-biryani-bowl",
  "mixed-veg-biryani-bowl",
  "egg-biryani-bowl",
  "mango-coconut-overnight-oats",
  "strawberry-cream-oats",
  "choco-banana-protein-oats",
  "apple-cinnamon-oats",
  "dates-almond-energy-oats",
  "pomegranate-overnight-oats",
  "kiwi-overnight-oats",
  "mediterranean-breakfast-salad",
  "egg-avocado-breakfast-salad",
  "mango-crunch-breakfast-salad",
]);

function row(slug: string, name: string, ingredients: string, price: number, type: CatalogMeal["type"], category: string, image: string, portion: string, compareAt = 0, diet?: CatalogMeal["diet"]): CatalogMeal {
  return {
    slug,
    name,
    description: ingredients,
    ingredients,
    price: price * 100,
    compareAt: compareAt ? compareAt * 100 : 0,
    diet: diet || (/\b(chicken|egg)\b/i.test(`${name} ${ingredients}`) ? "non_veg" : "veg"),
    type,
    category,
    portion,
    image: pictured.has(slug) ? `/bowls/${slug}.jpg` : image,
  };
}

export const catalog: CatalogMeal[] = [
  row("fiery-peri-chicken-bowl", "Fiery Peri Chicken Bowl", "Grilled chicken, signature base, peri-peri yogurt", 271, "lunch", "signature-bowls", photo.bowl, "1 bowl", 301),
  row("seoul-crunch-chicken-bowl", "Seoul Crunch Chicken Bowl", "Chicken, signature base, Korean gochujang", 283, "lunch", "signature-bowls", photo.bowl, "1 bowl", 314),
  row("smoky-bbq-chicken-bowl", "Smoky BBQ Chicken Bowl", "Chicken, signature base, smoky BBQ sauce", 283, "lunch", "signature-bowls", photo.bowl, "1 bowl", 314),
  row("mediterranean-chicken-bowl", "Mediterranean Chicken Bowl", "Chicken, signature base, lemon herb dressing", 283, "lunch", "signature-bowls", photo.bowl, "1 bowl", 314),
  row("paneer-power-bowl", "Paneer Power Bowl", "Grilled paneer, signature base, mint yogurt", 260, "lunch", "signature-bowls", photo.bowl, "1 bowl", 289),
  row("pepper-mushroom-bowl", "Pepper Mushroom Bowl", "Sautéed mushrooms, signature base, herb yogurt", 249, "lunch", "signature-bowls", photo.bowl, "1 bowl", 277),
  row("soya-crunch-power-bowl", "Soya Crunch Power Bowl", "Soya chunks, signature base, Asian peanut sauce", 249, "lunch", "signature-bowls", photo.bowl, "1 bowl", 277),
  row("asian-sesame-veg-bowl", "Asian Sesame Veg Bowl", "Soya chunks, signature base, sesame peanut sauce", 249, "lunch", "signature-bowls", photo.bowl, "1 bowl", 277),
  row("tofu-power-bowl", "Tofu Power Bowl", "Grilled tofu, signature base, sesame ginger dressing", 249, "lunch", "signature-bowls", photo.bowl, "1 bowl", 277),
  row("falafel-hummus-bowl", "Falafel & Hummus Bowl", "Falafel, hummus, signature base", 249, "lunch", "signature-bowls", photo.bowl, "1 bowl", 277),
  row("sweet-potato-power-bowl", "Sweet Potato Power Bowl", "Roasted sweet potato, signature base, herb yogurt", 249, "lunch", "signature-bowls", photo.bowl, "1 bowl", 277),
  row("protein-punch-egg-bowl", "Protein Punch Egg Bowl", "Two boiled eggs, signature base, lemon vinaigrette", 217, "lunch", "signature-bowls", photo.bowl, "1 bowl", 241),
  row("masala-egg-power-bowl", "Masala Egg Power Bowl", "Two boiled eggs, signature base, mint yogurt", 228, "lunch", "signature-bowls", photo.bowl, "1 bowl", 253),
  row("korean-fried-chicken-biryani-bowl", "Korean Fried Chicken Biryani Bowl", "Korean fried chicken, healthy biryani rice, cucumber, carrot", 310, "lunch", "aura-biryani", photo.rice, "1 bowl"),
  row("tandoori-chicken-biryani-bowl", "Tandoori Chicken Biryani Bowl", "Grilled tandoori chicken, rice, cucumber, carrot", 330, "lunch", "aura-biryani", photo.rice, "1 bowl"),
  row("paneer-biryani-bowl", "Paneer Biryani Bowl", "Paneer, rice, cucumber, carrot", 280, "lunch", "aura-biryani", photo.rice, "1 bowl"),
  row("soya-biryani-bowl", "Soya Biryani Bowl", "Soya chunks, rice, cucumber, carrot", 260, "lunch", "aura-biryani", photo.rice, "1 bowl"),
  row("mushroom-biryani-bowl", "Mushroom Biryani Bowl", "Mushroom, rice, cucumber, carrot", 260, "lunch", "aura-biryani", photo.rice, "1 bowl"),
  row("mixed-veg-biryani-bowl", "Mixed Veg Biryani Bowl", "Seasonal vegetables, rice, cucumber, carrot", 250, "lunch", "aura-biryani", photo.rice, "1 bowl"),
  row("egg-biryani-bowl", "Egg Biryani Bowl", "Boiled egg, rice, cucumber, carrot", 250, "lunch", "aura-biryani", photo.rice, "1 bowl"),
  row("mango-coconut-overnight-oats", "Mango Coconut Overnight Oats", "Mango, coconut flakes, chia seeds, honey", 220, "breakfast", "morning-aura", photo.oats, "1 jar"),
  row("strawberry-cream-oats", "Strawberry Cream Oats", "Strawberries, yogurt, honey, white chocolate", 240, "breakfast", "morning-aura", photo.oats, "1 jar"),
  row("choco-banana-protein-oats", "Choco Banana Protein Oats", "Chocolate oats, banana, peanut butter, granola", 240, "breakfast", "morning-aura", photo.oats, "1 jar"),
  row("apple-cinnamon-oats", "Apple Cinnamon Oats", "Apple, cinnamon, honey, walnuts", 220, "breakfast", "morning-aura", photo.oats, "1 jar"),
  row("dates-almond-energy-oats", "Dates & Almond Energy Oats", "Dates, almonds, chia seeds, honey", 230, "breakfast", "morning-aura", photo.oats, "1 jar"),
  row("pomegranate-overnight-oats", "Pomegranate Overnight Oats", "Pomegranate, banana, chia, almonds, honey", 240, "breakfast", "morning-aura", photo.oats, "1 jar"),
  row("kiwi-overnight-oats", "Kiwi Overnight Oats", "Kiwi, banana, chia, pumpkin seeds, honey", 240, "breakfast", "morning-aura", photo.oats, "1 jar"),
  row("mediterranean-breakfast-salad", "Mediterranean Breakfast Salad", "Lettuce, cucumber, cherry tomato, chickpeas, feta", 220, "breakfast", "morning-aura", photo.salad, "1 bowl"),
  row("egg-avocado-breakfast-salad", "Egg & Avocado Breakfast Salad", "Greens, boiled eggs, avocado, corn, tomato", 249, "breakfast", "morning-aura", photo.salad, "1 bowl"),
  row("mango-crunch-breakfast-salad", "Mango Crunch Breakfast Salad", "Mango, lettuce, corn, cucumber, pumpkin seeds", 230, "breakfast", "morning-aura", photo.salad, "1 bowl"),
  row("turmeric-ginger-shot", "Turmeric Ginger Shot", "Ginger, fresh turmeric, orange, lemon, honey, black pepper", 59, "breakfast", "wellness-shots", photo.drink, "1 shot"),
  row("amla-vitamin-c-shot", "Amla Vitamin C Shot", "Amla, orange, lemon, ginger, honey", 59, "breakfast", "wellness-shots", photo.drink, "1 shot"),
  row("green-wellness-shot", "Green Wellness Shot", "Cucumber, green apple, mint, ginger, lemon, honey", 49, "breakfast", "wellness-shots", photo.drink, "1 shot"),
  row("pineapple-ginger-shot", "Pineapple Ginger Shot", "Pineapple, ginger, fresh turmeric, lemon, honey, black pepper", 59, "breakfast", "wellness-shots", photo.drink, "1 shot"),
  row("glow-green", "Glow Green", "Green apple, cucumber, spinach, lemon, mint. 200 ml.", 199, "breakfast", "fresh-sips", photo.drink, "200 ml"),
  row("beet-boost", "Beet Boost", "Beetroot, apple, carrot, lemon, ginger. 200 ml.", 199, "breakfast", "fresh-sips", photo.drink, "200 ml"),
  row("citrus-charge", "Citrus Charge", "Orange, lemon, ginger. 200 ml.", 199, "breakfast", "fresh-sips", photo.drink, "200 ml"),
  row("mango-turmeric", "Mango Turmeric", "Mango, turmeric, lemon, ginger. 200 ml.", 219, "breakfast", "fresh-sips", photo.drink, "200 ml"),
  row("watermelon-mint", "Watermelon Mint", "Watermelon, mint, lime. 200 ml.", 169, "breakfast", "fresh-sips", photo.drink, "200 ml"),
  row("beetroot-buttermilk", "Beetroot Buttermilk", "Freshly churned beetroot buttermilk. 200 ml glass bottle.", 60, "breakfast", "fresh-sips", photo.drink, "200 ml"),
  row("carrot-buttermilk", "Carrot Buttermilk", "Sweet carrot, lightly spiced. 200 ml glass bottle.", 50, "breakfast", "fresh-sips", photo.drink, "200 ml"),
  row("spicy-buttermilk", "Spicy Buttermilk", "Green chilli and herbs. 200 ml glass bottle.", 50, "breakfast", "fresh-sips", photo.drink, "200 ml"),
  row("plain-buttermilk", "Plain Buttermilk", "Classic, creamy and cooling. 200 ml glass bottle.", 50, "breakfast", "fresh-sips", photo.drink, "200 ml"),
  row("egg-bejo", "Egg Bejo", "Six boiled eggs, signature spice blend, coriander", 210, "lunch", "guilt-free-bites", photo.bite, "6 eggs"),
  row("chicken-crispy-roll", "Chicken Crispy Roll", "Chicken, fresh vegetables, herbs, rice paper", 200, "lunch", "guilt-free-bites", photo.bite, "1 roll"),
  row("egg-crispy-roll", "Egg Crispy Roll", "Spiced egg, vegetables, herbs, rice paper", 185, "lunch", "guilt-free-bites", photo.bite, "1 roll"),
  row("mushroom-crispy-roll", "Mushroom Crispy Roll", "Sautéed mushrooms, vegetables, herbs, rice paper", 165, "lunch", "guilt-free-bites", photo.bite, "1 roll"),
  row("paneer-crispy-roll", "Paneer Crispy Roll", "Spicy paneer, crunchy vegetables, herbs, rice paper", 175, "lunch", "guilt-free-bites", photo.bite, "1 roll"),
  row("build-your-own-bowl", "Build Your Own Bowl", "Base bowl. Add components only after the kitchen publishes them.", 120, "lunch", "build-your-own", photo.bowl, "1 bowl"),
];

export const categories = [
  ["signature-bowls", "Signature Bowls", "lunch", "Lunch bowls. Shown for dinner only when dinner service is open.", 1],
  ["aura-biryani", "Aura Biryani", "lunch", "Biryani bowls. Nutrition is shown only when the kitchen records it.", 2],
  ["morning-aura", "Morning Aura", "breakfast", "Overnight oats and breakfast salads.", 3],
  ["wellness-shots", "Wellness Shots", "breakfast", "Any 3 shots are ₹149 and any 5 are ₹229. The discount is checked on the server and does not stack with a plan or coupon.", 4],
  ["fresh-sips", "Fresh Sips & Wellness", "breakfast", "Cold-pressed juices and buttermilk. No health claims are made from the names.", 5],
  ["guilt-free-bites", "Guilt-Free Bites", "lunch", "Rolls and egg bites. Vegetarian and non-vegetarian labels come from the recipe, not the title alone.", 6],
  ["build-your-own", "Build Your Own Bowl", "lunch", "Starts at ₹120 for the base bowl. Components stay empty until the kitchen adds them.", 7],
] as const;
