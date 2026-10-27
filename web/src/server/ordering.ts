import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { paymentMode } from "@/lib/config";
import { db } from "@/lib/db";
import { priceOrder, type PricingCoupon, type PricingResult } from "@/lib/pricing";
import { normalizeIndianMobile } from "@/lib/phone";
import { generateDates } from "@/lib/schedule";
import { parseWeekdays } from "@/lib/time";
import { Prisma } from "@prisma/client";
import { CapacityError, holdCapacity, releaseReserved } from "./capacity";
import { grantMatches } from "./otp";
import { catalogPreview, catalogQuote } from "./published-plans";

const selectionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealId: z.string().min(1),
  addonIds: z.array(z.string()).max(8),
  quantity: z.number().int().min(1).max(3),
  note: z.string().max(240).optional().default(""),
  slotId: z.string().min(1),
});

export const draftSchema = z.object({
  mode: z.enum(["single", "plan"]),
  planSlug: z.string().nullable().optional(),
  mealType: z.enum(["breakfast", "lunch", "both"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pinCode: z.string().regex(/^\d{6}$/),
  couponCode: z.string().max(40).optional().default(""),
  selections: z.array(selectionSchema).min(1).max(40),
});

export const checkoutSchema = draftSchema.extend({
  idempotencyKey: z.string().min(8).max(80),
  expectedTotalPaise: z.number().int().nonnegative(),
  verificationId: z.string().min(1),
  grant: z.string().min(20),
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().min(8).max(20),
    line1: z.string().trim().min(4).max(200),
    line2: z.string().max(200).optional().default(""),
    landmark: z.string().max(120).optional().default(""),
    city: z.string().trim().min(2).max(60),
    instructions: z.string().max(240).optional().default(""),
    allergies: z.string().max(300).optional().default(""),
    dietary: z.string().max(300).optional().default(""),
    saveAddress: z.boolean().optional().default(true),
  }),
});

export type DraftInput = z.infer<typeof draftSchema>;

export class OrderError extends Error {
  constructor(
    public code: string,
    message: string,
    public quote?: Extract<PricingResult, { ok: true }>,
    public dates?: string[],
  ) {
    super(message);
    this.name = "OrderError";
  }
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function sweepExpired() {
  const prisma = db();
  const expired = await prisma.reservation.findMany({
    where: { status: "active", expiresAt: { lt: new Date() } },
    include: { lines: true, order: true },
  });
  for (const reservation of expired) {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.reservation.updateMany({
        where: { id: reservation.id, status: "active" },
        data: { status: "expired" },
      });
      if (claimed.count !== 1) return;
      for (const line of reservation.lines) {
        if (line.released) continue;
        await releaseReserved(tx, line);
        await tx.reservationLine.update({ where: { id: line.id }, data: { released: true } });
      }
      if (!reservation.order || reservation.order.status !== "pending_payment") return;
      const cancelled = await tx.order.updateMany({
        where: { id: reservation.order.id, status: "pending_payment" },
        data: { status: "cancelled", acceptanceStatus: "cancelled" },
      });
      if (cancelled.count !== 1) return;
      await tx.scheduledDelivery.updateMany({
        where: { orderId: reservation.order.id, status: "scheduled" },
        data: { status: "cancelled" },
      });
      await tx.payment.updateMany({
        where: { orderId: reservation.order.id, status: { in: ["pending", "initiated"] } },
        data: { status: "failed" },
      });
      await returnCoupon(tx, reservation.order.couponId, reservation.order.id);
    });
  }
}

async function returnCoupon(tx: Prisma.TransactionClient, couponId: string, orderId: string) {
  if (!couponId) return;
  const order = await tx.order.updateMany({
    where: { id: orderId, couponReturned: false },
    data: { couponReturned: true },
  });
  if (order.count !== 1) return;
  await tx.$executeRaw`
    UPDATE "Coupon" SET "usedCount" = "usedCount" - 1
    WHERE "id" = ${couponId} AND "usedCount" > 0
  `;
}

export async function prepareQuote(input: DraftInput) {
  const settings = await db().businessSettings.findUnique({ where: { id: "default" } });
  if (!settings) throw new OrderError("not_ready", "AuraBowls is not ready to take orders yet.");
  const area = await db().serviceArea.findUnique({ where: { pinCode: input.pinCode } });
  if (!area || !area.active) {
    throw new OrderError("outside_area", "AuraBowls does not deliver to this PIN yet.");
  }

  const plan = input.mode === "plan" ? await db().planTemplate.findUnique({ where: { slug: input.planSlug || "" } }) : null;
  if (input.mode === "plan" && (!plan || !plan.active)) throw new OrderError("plan_missing", "That meal plan is no longer available.");
  if (plan && plan.mealType !== input.mealType) throw new OrderError("plan_mismatch", "That plan does not match the selected meal type.");
  if (plan?.mealType === "dinner" && !settings.dinnerEnabled) {
    throw new OrderError("dinner_closed", "Dinner is not open for orders yet.");
  }
  const combined = plan?.mealType === "both";

  const slotIds = [...new Set(input.selections.map((selection) => selection.slotId))];
  const slots = await db().deliverySlot.findMany({ where: { id: { in: slotIds }, active: true } });
  const slotById = new Map(slots.map((slot) => [slot.id, slot]));
  const slotFits = (slot: { mealType: string }) => (combined ? slot.mealType === "breakfast" || slot.mealType === "lunch" : slot.mealType === input.mealType);
  if (slots.some((slot) => !slotFits(slot)) || slots.length !== slotIds.length) {
    throw new OrderError("slot_invalid", "Choose a current delivery slot for this meal.");
  }
  const breakfastSlot = input.selections.map((selection) => slotById.get(selection.slotId)).find((slot) => slot?.mealType === "breakfast");
  const primarySlot = combined ? breakfastSlot : slotById.get(input.selections[0]?.slotId || "");
  if (!primarySlot) throw new OrderError("slot_invalid", combined ? "Choose a breakfast slot and a lunch slot." : "Choose a delivery slot.");

  const closures = await db().kitchenClosure.findMany({
    where: { OR: combined ? [{ mealType: "all" }, { mealType: "breakfast" }, { mealType: "lunch" }] : [{ mealType: "all" }, { mealType: input.mealType }] },
  });
  const schedule = generateDates({
    startDate: input.startDate,
    count: plan ? plan.fixedDeliveryCount : 1,
    rule: plan ? (plan.scheduleRule as "weekdays" | "all_days" | "fixed_count") : "all_days",
    operatingWeekdays: parseWeekdays(settings.operatingWeekdays),
    areaWeekdays: parseWeekdays(area.weekdays),
    closures: [...new Set(closures.map((closure) => closure.date))],
    slotStart: primarySlot.startTime,
    cutoffHours: settings.cutoffHours,
    timezone: settings.timezone,
  });
  if (schedule.shortfall) {
    throw new OrderError("schedule_short", "There are not enough open delivery days for this plan. Try a different start date.");
  }

  const requestedDates = input.selections.map((selection) => selection.date).sort();
  const expectedDates = (combined ? schedule.dates.flatMap((date) => [date, date]) : schedule.dates).slice().sort();
  if (requestedDates.join() !== expectedDates.join()) {
    throw new OrderError(
      "schedule_changed",
      "The available delivery dates changed. Review the updated schedule before paying.",
      undefined,
      schedule.dates,
    );
  }
  if (combined) {
    for (const date of schedule.dates) {
      const types = input.selections.filter((selection) => selection.date === date).map((selection) => slotById.get(selection.slotId)?.mealType);
      if (types.length !== 2 || !types.includes("breakfast") || !types.includes("lunch")) {
        throw new OrderError("schedule_changed", "Each day needs one breakfast and one lunch. Review the schedule before paying.", undefined, schedule.dates);
      }
    }
  }

  const meals = await db().meal.findMany({
    where: { id: { in: input.selections.map((selection) => selection.mealId) } },
    include: { addons: { include: { addon: true } }, category: true },
  });
  const mealById = new Map(meals.map((meal) => [meal.id, meal]));
  const defaultMeal = plan ? await db().meal.findUnique({ where: { slug: plan.defaultMealSlug } }) : null;
  const lunchDefault = combined ? await db().meal.findUnique({ where: { slug: plan?.companionMealSlug || "" } }) : null;
  if (plan && (!defaultMeal || !defaultMeal.published)) {
    throw new OrderError("plan_missing", "The default meal for this plan is unavailable. Choose another plan.");
  }
  if (combined && (!lunchDefault || !lunchDefault.published)) {
    throw new OrderError("plan_missing", "The lunch for this plan is unavailable. Choose another plan.");
  }

  const deliveries = input.selections.map((selection) => {
    const meal = mealById.get(selection.mealId);
    const slot = slotById.get(selection.slotId);
    if (!meal || !slot) throw new OrderError("meal_missing", "One of the selected meals is no longer on the menu.");
    const expectedType = combined ? slot?.mealType : input.mealType;
    if (!meal.published || !meal.available || meal.mealType !== expectedType) {
      throw new OrderError("meal_unavailable", `${meal.name} is not available for this order.`);
    }
    const addonIds = new Set(selection.addonIds);
    const addons = meal.addons.map((link) => link.addon).filter((addon) => addonIds.has(addon.id) && addon.active);
    if (addons.length !== addonIds.size) throw new OrderError("addon_invalid", "One of the add-ons is not available for that meal.");
    const reference = combined ? (meal.mealType === "lunch" ? lunchDefault : defaultMeal) ?? meal : defaultMeal ?? meal;
    return {
      date: selection.date,
      label: meal.name,
      foodPaise: meal.pricePaise * selection.quantity,
      referenceFoodPaise: reference.pricePaise * selection.quantity,
      addonPaise: addons.reduce((sum, addon) => sum + addon.pricePaise, 0) * selection.quantity,
      feePaise: area.deliveryFeePaise,
      meal,
      addons,
      selection,
      slot,
      mealLimit: meal.defaultPortions,
      slotLimit: slot.capacity,
    };
  });

  let coupon: PricingCoupon | null = null;
  let couponRecord: { id: string } | null = null;
  const code = input.couponCode.trim().toUpperCase();
  if (code) {
    const found = await db().coupon.findUnique({ where: { code } });
    const today = schedule.dates[0];
    if (!found || !found.active || (found.startsOn && today < found.startsOn) || (found.endsOn && today > found.endsOn)) {
      throw new OrderError("coupon_invalid", "That coupon is not active.");
    }
    if (found.maxUses > 0 && found.usedCount >= found.maxUses) {
      throw new OrderError("coupon_invalid", "That coupon has reached its usage limit.");
    }
    coupon = {
      code: found.code,
      type: found.type === "percent" ? "percent" : "fixed",
      value: found.value,
      minOrderPaise: found.minOrderPaise,
      stackable: found.stackable,
    };
    couponRecord = found;
  }

  const priced = priceOrder({
    deliveries,
    planDiscountBps: plan?.discountBps ?? 0,
    coupon,
    taxMode: "none",
    taxRateBps: 0,
    taxLabel: "",
    bundleDiscountPaise: plan || coupon ? 0 : await shotBundleDiscount(deliveries),
  });
  if (!priced.ok) throw new OrderError(priced.code, priced.message);

  return { settings, area, plan, priced, deliveries, couponRecord, schedule };
}

const previewSchema = z.object({
  mode: z.enum(["single", "plan"]),
  planSlug: z.string().nullable().optional(),
  mealType: z.enum(["breakfast", "lunch", "both"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pinCode: z.string().regex(/^\d{6}$/),
  slotId: z.string().min(1),
  lunchSlotId: z.string().optional(),
});

export async function previewSchedule(raw: z.infer<typeof previewSchema>) {
  try {
    return await previewScheduleFromDatabase(raw);
  } catch (error) {
    if (error instanceof OrderError) throw error;
    const fallback = catalogPreview(raw);
    if (!fallback.ok) throw new OrderError(fallback.code, fallback.message);
    return fallback;
  }
}

async function previewScheduleFromDatabase(raw: z.infer<typeof previewSchema>) {
  const settings = await db().businessSettings.findUnique({ where: { id: "default" } });
  if (!settings) throw new OrderError("not_ready", "AuraBowls is not ready to take orders yet.");
  const area = await db().serviceArea.findUnique({ where: { pinCode: raw.pinCode } });
  if (!area || !area.active) throw new OrderError("outside_area", "AuraBowls does not deliver to this PIN yet.");
  const plan = raw.mode === "plan" ? await db().planTemplate.findUnique({ where: { slug: raw.planSlug || "" } }) : null;
  if (raw.mode === "plan" && (!plan || !plan.active)) throw new OrderError("plan_missing", "That meal plan is no longer available.");
  if (plan && plan.mealType !== raw.mealType) throw new OrderError("plan_mismatch", "That plan does not match the selected meal type.");
  const combined = plan?.mealType === "both";
  const slot = await db().deliverySlot.findUnique({ where: { id: raw.slotId } });
  const lunchSlot = combined ? await db().deliverySlot.findUnique({ where: { id: raw.lunchSlotId || "" } }) : null;
  const slotOk = combined ? slot?.mealType === "breakfast" : slot?.mealType === raw.mealType;
  if (!slot || !slot.active || !slotOk || (combined && (!lunchSlot || !lunchSlot.active || lunchSlot.mealType !== "lunch"))) {
    throw new OrderError("slot_invalid", combined ? "Choose a breakfast slot and a lunch slot." : "Choose a current delivery slot.");
  }
  const closures = await db().kitchenClosure.findMany({
    where: { OR: combined ? [{ mealType: "all" }, { mealType: "breakfast" }, { mealType: "lunch" }] : [{ mealType: "all" }, { mealType: raw.mealType }] },
  });
  const schedule = generateDates({
    startDate: raw.startDate,
    count: plan ? plan.fixedDeliveryCount : 1,
    rule: plan ? (plan.scheduleRule as "weekdays" | "all_days" | "fixed_count") : "all_days",
    operatingWeekdays: parseWeekdays(settings.operatingWeekdays),
    areaWeekdays: parseWeekdays(area.weekdays),
    closures: [...new Set(closures.map((closure) => closure.date))],
    slotStart: slot.startTime,
    cutoffHours: settings.cutoffHours,
    timezone: settings.timezone,
  });
  if (schedule.shortfall) throw new OrderError("schedule_short", "There are not enough open delivery days from that start date.");
  const defaultMeal = plan ? await db().meal.findUnique({ where: { slug: plan.defaultMealSlug } }) : null;
  const lunchMeal = combined ? await db().meal.findUnique({ where: { slug: plan?.companionMealSlug || "" } }) : null;
  return {
    dates: schedule.dates,
    skipped: schedule.skipped.slice(0, 8),
    defaultMealId: defaultMeal?.id || "",
    lunchMealId: lunchMeal?.id || "",
    area: { label: area.label, localityNote: area.localityNote, coverage: area.coverage, deliveryFeePaise: area.deliveryFeePaise },
    orderOnWhatsapp: false as const,
  };
}

export { previewSchema };

async function shotBundleDiscount(deliveries: { meal: { category?: { slug: string } | null }; selection: { quantity: number }; foodPaise: number }[]) {
  const rules = await db().offerRule.findMany({ where: { active: true }, orderBy: { quantity: "desc" } });
  const units: { slug: string; price: number }[] = [];
  for (const delivery of deliveries) {
    const slug = delivery.meal.category?.slug || "";
    const unit = Math.round(delivery.foodPaise / Math.max(1, delivery.selection.quantity));
    for (let index = 0; index < delivery.selection.quantity; index += 1) units.push({ slug, price: unit });
  }
  let discount = 0;
  for (const slug of [...new Set(rules.map((rule) => rule.categorySlug))]) {
    const prices = units.filter((unit) => unit.slug === slug).map((unit) => unit.price).sort((left, right) => right - left);
    const packs = rules.filter((rule) => rule.categorySlug === slug && rule.quantity > 1 && rule.pricePaise > 0);
    if (prices.length === 0 || packs.length === 0) continue;
    let index = 0;
    let payable = 0;
    for (const pack of packs) {
      while (prices.length - index >= pack.quantity) {
        payable += pack.pricePaise;
        index += pack.quantity;
      }
    }
    payable += prices.slice(index).reduce((sum, price) => sum + price, 0);
    const retail = prices.reduce((sum, price) => sum + price, 0);
    discount += Math.max(0, retail - payable);
  }
  return discount;
}

export async function quoteDraft(input: DraftInput) {
  try {
    await sweepExpired();
    const prepared = await prepareQuote(input);
    return {
      quote: prepared.priced,
      dates: prepared.schedule.dates,
      skipped: prepared.schedule.skipped.slice(0, 8),
      area: {
        label: prepared.area.label,
        coverage: prepared.area.coverage,
        localityNote: prepared.area.localityNote,
        deliveryFeePaise: prepared.area.deliveryFeePaise,
      },
      reservationMinutes: prepared.settings.reservationMinutes,
      lines: prepared.deliveries.map((delivery) => ({
        date: delivery.date,
        mealName: delivery.meal.name,
        mealType: delivery.meal.mealType,
        quantity: delivery.selection.quantity,
        addons: delivery.addons.map((addon) => addon.name),
        slotLabel: delivery.slot.label,
      })),
      orderOnWhatsapp: false as const,
    };
  } catch (error) {
    if (error instanceof OrderError) throw error;
    const fallback = catalogQuote(input);
    if (!fallback.ok) throw new OrderError(fallback.code, fallback.message, undefined, fallback.dates);
    return fallback;
  }
}

export async function placeOrder(raw: z.infer<typeof checkoutSchema>) {
  await sweepExpired();
  const existing = await db().idempotencyRecord.findUnique({ where: { key: raw.idempotencyKey } });
  if (existing) return JSON.parse(existing.response) as { reference: string; token: string; totalPaise: number; expiresAt: string };

  const phone = normalizeIndianMobile(raw.customer.phone);
  if (!phone) throw new OrderError("invalid_phone", "Enter a valid Indian mobile number.");
  const prepared = await prepareQuote(raw);
  if (prepared.priced.totalPaise !== raw.expectedTotalPaise) {
    throw new OrderError(
      "price_changed",
      "The price changed before the order was created. Review the updated total.",
      prepared.priced,
      prepared.schedule.dates,
    );
  }

  const token = randomBytes(32).toString("base64url");
  const reference = `AB-${randomBytes(4).toString("hex").toUpperCase()}`;
  const address = {
    fullName: raw.customer.name.trim(),
    line1: raw.customer.line1.trim(),
    line2: raw.customer.line2?.trim() || "",
    landmark: raw.customer.landmark?.trim() || "",
    pinCode: raw.pinCode,
    city: raw.customer.city.trim(),
    instructions: raw.customer.instructions?.trim() || "",
  };
  const expiresAt = new Date(Date.now() + prepared.settings.reservationMinutes * 60 * 1000);

  try {
    await db().$transaction(async (tx) => {
      const grant = await tx.phoneVerification.updateMany({
        where: {
          id: raw.verificationId,
          phone,
          grantHash: grantMatches(raw.grant),
          grantUsedAt: null,
          consumedAt: { gt: new Date(Date.now() - 30 * 60 * 1000) },
        },
        data: { grantUsedAt: new Date() },
      });
      if (grant.count !== 1) throw new OrderError("otp_required", "Verify your mobile number again before placing the order.");

      if (prepared.couponRecord) {
        const couponTaken = await tx.$executeRaw`
          UPDATE "Coupon" SET "usedCount" = "usedCount" + 1
          WHERE "id" = ${prepared.couponRecord.id}
            AND ("maxUses" = 0 OR "usedCount" < "maxUses")
        `;
        if (Number(couponTaken) !== 1) throw new OrderError("coupon_invalid", "That coupon has reached its usage limit.");
      }

      const customer = await tx.customer.upsert({
        where: { phone },
        create: {
          phone,
          name: raw.customer.name.trim(),
          phoneVerifiedAt: new Date(),
          allergyNotes: raw.customer.allergies?.trim() || "",
          dietaryNotes: raw.customer.dietary?.trim() || "",
        },
        update: {
          name: raw.customer.name.trim(),
          phoneVerifiedAt: new Date(),
          allergyNotes: raw.customer.allergies?.trim() || "",
          dietaryNotes: raw.customer.dietary?.trim() || "",
          anonymizedAt: null,
        },
      });
      if (raw.customer.saveAddress !== false) {
        await tx.savedAddress.upsert({
          where: { customerId: customer.id },
          create: { customerId: customer.id, ...address },
          update: address,
        });
      }

      const reservation = await tx.reservation.create({
        data: {
          token: randomBytes(16).toString("base64url"),
          status: "active",
          expiresAt,
          lines: {
            create: prepared.deliveries.map((delivery) => ({
              date: delivery.date,
              mealId: delivery.meal.id,
              slotId: delivery.slot.id,
              mealQty: delivery.selection.quantity,
              slotQty: 1,
            })),
          },
        },
        include: { lines: true },
      });

      await holdCapacity(
        tx,
        prepared.deliveries.map((delivery) => ({
          date: delivery.date,
          mealId: delivery.meal.id,
          slotId: delivery.slot.id,
          mealQty: delivery.selection.quantity,
          slotQty: 1,
          mealLimit: delivery.mealLimit,
          slotLimit: delivery.slotLimit,
        })),
      );

      const order = await tx.order.create({
        data: {
          reference,
          trackingTokenHash: tokenHash(token),
          customerId: customer.id,
          planSlug: prepared.plan?.slug || "",
          planName: prepared.plan?.name || "Single delivery",
          cadence: prepared.plan?.cadence || "daily",
          mealType: raw.mealType,
          status: "pending_payment",
          acceptanceStatus: "pending",
          mealSubtotalPaise: prepared.priced.foodPaise,
          referenceMealPaise: prepared.priced.referenceFoodPaise,
          customizationDeltaPaise: prepared.priced.customizationDeltaPaise,
          addonsPaise: prepared.priced.addonPaise,
          deliveryFeePaise: prepared.priced.deliveryFeePaise,
          planDiscountPaise: prepared.priced.planDiscountPaise,
          couponCode: prepared.priced.couponCode,
          couponId: prepared.couponRecord?.id || "",
          couponPaise: prepared.priced.couponPaise,
          taxPaise: prepared.priced.taxPaise,
          taxRateBps: prepared.priced.taxRateBps,
          taxMode: prepared.priced.taxMode,
          taxLabel: prepared.priced.taxLabel,
          totalPaise: prepared.priced.totalPaise,
          priceSnapshotJson: JSON.stringify(prepared.priced),
          customerName: raw.customer.name.trim(),
          customerPhone: phone,
          allergyNotes: raw.customer.allergies?.trim() || "",
          dietaryNotes: raw.customer.dietary?.trim() || "",
          reservation: { connect: { id: reservation.id } },
          payments: {
            create: {
              status: "pending",
              amountPaise: prepared.priced.totalPaise,
              gateway: paymentMode() === "razorpay" ? "razorpay" : "simulator",
            },
          },
          deliveries: {
            create: prepared.deliveries.map((delivery, index) => {
              const money = prepared.priced.allocations[index];
              return {
                date: delivery.date,
                mealType: delivery.meal.mealType,
                slotId: delivery.slot.id,
                slotLabel: delivery.slot.label,
                slotStart: delivery.slot.startTime,
                status: "scheduled",
                addressSnapshotJson: JSON.stringify(address),
                foodPaise: money.foodPaise,
                addonPaise: money.addonPaise,
                feePaise: money.feePaise,
                discountPaise: money.discountPaise,
                taxPaise: money.taxPaise,
                totalPaise: money.totalPaise,
                notes: delivery.selection.note || "",
                items: {
                  create: {
                    mealId: delivery.meal.id,
                    nameSnapshot: delivery.meal.name,
                    quantity: delivery.selection.quantity,
                    unitPricePaise: delivery.meal.pricePaise,
                    addonsJson: JSON.stringify(delivery.addons.map((addon) => ({ name: addon.name, pricePaise: addon.pricePaise }))),
                    customizationNote: delivery.selection.note || "",
                  },
                },
              };
            }),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actor: "customer",
          action: "order_created",
          entity: "order",
          entityId: order.id,
          detail: reference,
        },
      });
    });
  } catch (error) {
    if (error instanceof CapacityError || error instanceof OrderError) throw error;
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      throw new CapacityError("Those meals were just reserved by another order. Review the dates and try again.");
    }
    throw error;
  }

  const response = { reference, token, totalPaise: prepared.priced.totalPaise, expiresAt: expiresAt.toISOString() };
  await db().idempotencyRecord.create({ data: { key: raw.idempotencyKey, response: JSON.stringify(response) } }).catch(() => undefined);
  return response;
}

export async function orderByToken(token: string) {
  return db().order.findUnique({
    where: { trackingTokenHash: tokenHash(token) },
    include: {
      deliveries: { include: { items: true, feedback: true }, orderBy: { date: "asc" } },
      payments: { include: { attempts: true }, orderBy: { createdAt: "desc" } },
      reservation: true,
      refunds: true,
      invoices: true,
    },
  });
}

export { tokenHash };
