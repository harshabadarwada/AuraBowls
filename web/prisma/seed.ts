import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { catalog, categories } from "./catalog";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  const email = (process.env.ADMIN_EMAIL || "admin@aurabowls.local").toLowerCase();
  if (!password) throw new Error("Set ADMIN_PASSWORD before seeding.");

  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: { taxMode: "none", taxRateBps: 0, taxLabel: "" },
    create: {
      id: "default",
      legalName: "AuraBowls",
      brandName: "AuraBowls",
      address: "",
    },
  });

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: { email, name: "AuraBowls owner", passwordHash: await bcrypt.hash(password, 10), role: "owner" },
    });
  }

  const categoryBySlug = new Map<string, { id: string }>();
  for (const [slug, name, mealType, description, sortOrder] of categories) {
    const saved = await prisma.mealCategory.upsert({
      where: { slug },
      update: { name, description, mealType, sortOrder, comingSoon: false },
      create: { slug, name, mealType, description, sortOrder },
    });
    categoryBySlug.set(slug, saved);
  }
  await prisma.mealCategory.upsert({
    where: { slug: "dinner" },
    update: {},
    create: { slug: "dinner", name: "Dinner", mealType: "dinner", description: "Dinner is not open yet.", comingSoon: true, sortOrder: 9 },
  });

  const highProtein = await prisma.goal.upsert({
    where: { slug: "high-protein" },
    update: {},
    create: { slug: "high-protein", name: "High Protein", description: "Shown only when recorded protein meets the kitchen threshold. Estimates are labelled as estimates." },
  });
  await prisma.goal.upsert({
    where: { slug: "balanced" },
    update: {},
    create: { slug: "balanced", name: "Balanced Eating", description: "A kitchen browsing group for everyday plates. It is not a medical or diet claim." },
  });
  const convenience = await prisma.goal.upsert({
    where: { slug: "everyday" },
    update: {},
    create: { slug: "everyday", name: "Everyday Convenience", description: "Meals that can be placed on a scheduled delivery." },
  });

  for (const meal of catalog) {
    const saved = await prisma.meal.upsert({
      where: { slug: meal.slug },
      update: {
        name: meal.name,
        description: meal.description,
        pricePaise: meal.price,
        compareAtPaise: meal.compareAt,
        portionLabel: meal.portion,
        dietTags: meal.diet,
        ingredients: meal.ingredients,
        allergens: "",
        allergenVerified: false,
        imageUrl: meal.image,
        imageIsPlaceholder: true,
        categoryId: categoryBySlug.get(meal.category)!.id,
        mealType: meal.type,
        published: true,
        available: true,
        nutritionStatus: "missing",
        calories: null,
        proteinTenths: null,
        carbsTenths: null,
        fatTenths: null,
        fiberTenths: null,
        nutritionSource: "",
      },
      create: {
        slug: meal.slug,
        name: meal.name,
        description: meal.description,
        categoryId: categoryBySlug.get(meal.category)!.id,
        mealType: meal.type,
        pricePaise: meal.price,
        compareAtPaise: meal.compareAt,
        portionLabel: meal.portion,
        dietTags: meal.diet,
        ingredients: meal.ingredients,
        allergens: "",
        allergenVerified: false,
        imageUrl: meal.image,
        imageIsPlaceholder: true,
        nutritionStatus: "missing",
        published: true,
        available: true,
      },
    });
    const goalIds = [convenience.id];
    if (meal.slug === "paneer-power-bowl" || meal.slug === "protein-punch-egg-bowl") goalIds.push(highProtein.id);
    for (const goalId of goalIds) {
      await prisma.mealGoal.upsert({ where: { mealId_goalId: { mealId: saved.id, goalId } }, update: {}, create: { mealId: saved.id, goalId } });
    }
  }

  await prisma.meal.updateMany({
    where: { slug: { notIn: catalog.map((meal) => meal.slug) } },
    data: { published: false, available: false },
  });
  await prisma.offerRule.upsert({ where: { slug: "shots-3" }, update: { pricePaise: 14900, quantity: 3, active: true }, create: { slug: "shots-3", name: "Any 3 wellness shots", categorySlug: "wellness-shots", quantity: 3, pricePaise: 14900 } });
  await prisma.offerRule.upsert({ where: { slug: "shots-5" }, update: { pricePaise: 22900, quantity: 5, active: true }, create: { slug: "shots-5", name: "Any 5 wellness shots", categorySlug: "wellness-shots", quantity: 5, pricePaise: 22900 } });

  const plans = [
    ["daily-breakfast", "Daily Breakfast", "One breakfast delivery on the next open day.", "breakfast", "daily", "all_days", 1, "mango-coconut-overnight-oats", "", 0],
    ["daily-lunch", "Daily Lunch", "One lunch delivery on the next open day.", "lunch", "daily", "all_days", 1, "paneer-power-bowl", "", 0],
    ["weekday-breakfast", "Weekday Breakfast", "Five weekday breakfasts. The discount is 5% off the current menu price of the default meal.", "breakfast", "weekly", "weekdays", 5, "mango-coconut-overnight-oats", "", 500],
    ["weekday-lunch", "Weekday Lunch", "Five weekday lunches. The discount is 5% off the current menu price of the default meal.", "lunch", "weekly", "weekdays", 5, "paneer-power-bowl", "", 500],
    ["monthly-breakfast", "Monthly Breakfast", "Twenty weekday breakfasts. The discount is 10% off the current menu price of the default meals.", "breakfast", "monthly", "weekdays", 20, "mango-coconut-overnight-oats", "", 1000],
    ["monthly-lunch", "Monthly Lunch", "Twenty weekday lunches. The discount is 10% off the current menu price of the default meals.", "lunch", "monthly", "weekdays", 20, "paneer-power-bowl", "", 1000],
    ["daily-both", "Daily Breakfast & Lunch", "One open day with breakfast and lunch. Both meals are charged at menu price. Paid once.", "both", "daily", "all_days", 1, "mango-coconut-overnight-oats", "paneer-power-bowl", 0],
    ["weekday-both", "Weekday Breakfast & Lunch", "Five weekdays. Breakfast and lunch each day. The discount is 5% off the current menu price of each default meal.", "both", "weekly", "weekdays", 5, "mango-coconut-overnight-oats", "paneer-power-bowl", 500],
    ["monthly-both", "Monthly Breakfast & Lunch", "Twenty weekdays. Breakfast and lunch each day. The discount is 10% off the current menu price of each default meal.", "both", "monthly", "weekdays", 20, "mango-coconut-overnight-oats", "paneer-power-bowl", 1000],
  ] as const;
  for (const [slug, name, description, mealType, cadence, rule, count, meal, companion, discount] of plans) {
    await prisma.planTemplate.upsert({
      where: { slug },
      update: { description, discountBps: discount, fixedDeliveryCount: count, defaultMealSlug: meal, companionMealSlug: companion, active: true },
      create: { slug, name, description, mealType, cadence, scheduleRule: rule, fixedDeliveryCount: count, defaultMealSlug: meal, companionMealSlug: companion, discountBps: discount, promoText: discount ? "Discount is calculated from current menu prices." : "" },
    });
  }

  const areas = [
    ["500081", "Madhapur and Hitech City"],
    ["500084", "Kondapur"],
    ["500032", "Gachibowli"],
    ["500033", "Jubilee Hills"],
    ["500034", "Banjara Hills"],
    ["500075", "Financial District"],
  ];
  for (const [pinCode, label] of areas) {
    await prisma.serviceArea.upsert({
      where: { pinCode },
      update: {},
      create: {
        pinCode,
        label,
        deliveryFeePaise: 0,
        coverage: "pin",
        localityNote: "Starter PIN from the previous Hyderabad delivery list. Confirm it before accepting live orders. A PIN match is not a promise that every building inside it is served.",
        weekdays: "1,2,3,4,5,6",
      },
    });
  }

  const slots = [
    ["breakfast", "7:30–9:00", "07:30", "09:00", 1],
    ["breakfast", "9:00–10:30", "09:00", "10:30", 2],
    ["lunch", "12:00–1:30", "12:00", "13:30", 1],
    ["lunch", "1:30–3:00", "13:30", "15:00", 2],
  ] as const;
  for (const [mealType, label, startTime, endTime, sortOrder] of slots) {
    const existing = await prisma.deliverySlot.findFirst({ where: { mealType, label } });
    if (!existing) await prisma.deliverySlot.create({ data: { mealType, label, startTime, endTime, capacity: 25, sortOrder } });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME50" },
    update: {},
    create: { code: "WELCOME50", type: "fixed", value: 5000, minOrderPaise: 15000, maxUses: 100, startsOn: "2026-01-01", endsOn: "2027-12-31", stackable: true, active: true },
  });
  await prisma.coupon.upsert({
    where: { code: "SAVE10" },
    update: {},
    create: { code: "SAVE10", type: "percent", value: 1000, minOrderPaise: 20000, maxUses: 50, startsOn: "2026-01-01", endsOn: "2027-12-31", stackable: false, active: true },
  });
  const banner = await prisma.promotion.findFirst({ where: { title: "Menu-price plan discounts" } });
  if (!banner) {
    await prisma.promotion.create({
      data: { title: "Menu-price plan discounts", body: "Weekly and monthly plans show a discount against the current menu price of the default meals. You will see the amount before payment.", active: true },
    });
  }

  const stock = [
    ["Eggs", "piece", 3600],
    ["Rice", "kg", 2500],
    ["Paneer", "kg", 800],
    ["Vegetables", "kg", 1500],
  ] as const;
  for (const [name, unit, quantityTenths] of stock) {
    const found = await prisma.inventoryItem.findFirst({ where: { name } });
    if (!found) await prisma.inventoryItem.create({ data: { name, unit, quantityTenths, notes: "Manual stock. This does not reserve customer orders." } });
  }

  console.log("AuraBowls seed completed. No sample orders were created.");
}

main().finally(() => prisma.$disconnect());
