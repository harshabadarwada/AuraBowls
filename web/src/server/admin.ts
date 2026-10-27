import { createHash, randomBytes } from "crypto";
import { paymentMode } from "@/lib/config";
import { db } from "@/lib/db";
import { rupeesToPaise } from "@/lib/money";
import { refundEligibility } from "@/lib/refunds";
import { nextOpenDate } from "@/lib/schedule";
import { addDays, businessToday, isStillChangeable, parseWeekdays } from "@/lib/time";
import { moveSold, releaseReserved, releaseSold } from "./capacity";
import { ensureCreditNote, ensureInvoice } from "./invoices";

export class AdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminError";
  }
}

async function audit(actor: string, action: string, entity: string, entityId: string, detail = "") {
  await db().auditLog.create({ data: { actor, action, entity, entityId, detail: detail.slice(0, 500) } });
}

function history(current: string, status: string, actor: string) {
  const parsed = JSON.parse(current || "[]") as { status: string; at: string; actor: string }[];
  parsed.push({ status, at: new Date().toISOString(), actor });
  return JSON.stringify(parsed);
}

export async function acceptOrder(actor: string, orderId: string) {
  const updated = await db().order.updateMany({
    where: { id: orderId, status: "paid_pending_acceptance" },
    data: { status: "accepted", acceptanceStatus: "accepted" },
  });
  if (updated.count !== 1) throw new AdminError("Only a paid order that is waiting for the kitchen can be accepted.");
  await audit(actor, "order_accepted", "order", orderId);
}

export async function rejectOrder(actor: string, orderId: string, reason: string) {
  const order = await db().order.findUnique({
    where: { id: orderId },
    include: { deliveries: { include: { items: true } }, payments: true, reservation: { include: { lines: true } } },
  });
  if (!order) throw new AdminError("Order not found.");
  await db().$transaction(async (tx) => {
    const fresh = await tx.order.findUnique({
      where: { id: order.id },
      include: { deliveries: { include: { items: true } }, reservation: { include: { lines: true } } },
    });
    if (!fresh) throw new AdminError("Order not found.");
    if (fresh.reservation?.status === "active") {
      for (const line of fresh.reservation.lines) {
        if (!line.released) await releaseReserved(tx, line);
      }
      await tx.reservation.update({ where: { id: fresh.reservation.id }, data: { status: "released" } });
    }
    if (["paid_pending_acceptance", "accepted"].includes(fresh.status)) {
      for (const delivery of fresh.deliveries) {
        for (const item of delivery.items) {
          if (!item.mealId || ["cancelled", "rescheduled"].includes(delivery.status)) continue;
          await releaseSold(tx, { date: delivery.date, mealId: item.mealId, slotId: delivery.slotId, mealQty: item.quantity, slotQty: 1 });
        }
      }
    }
    await tx.order.update({ where: { id: order.id }, data: { status: "rejected", acceptanceStatus: "rejected" } });
    await tx.scheduledDelivery.updateMany({
      where: { orderId: order.id, status: { notIn: ["delivered", "cancelled"] } },
      data: { status: "cancelled" },
    });
  });
  const paid = order.payments.some((payment) => ["paid", "partially_refunded"].includes(payment.status));
  if (paid) {
    const already = order.payments[0];
    const refunded = await db().refund.aggregate({ where: { orderId, status: { in: ["refunded", "refund_pending", "pending_approval"] } }, _sum: { amountPaise: true } });
    const amount = Math.max(0, (already?.amountPaise || order.totalPaise) - (refunded._sum.amountPaise || 0));
    if (amount > 0) {
      await db().refund.create({
        data: {
          orderId,
          amountPaise: amount,
          reason: reason || "Paid order rejected by the kitchen",
          status: "pending_approval",
          idempotencyKey: `reject-${orderId}-${amount}`,
        },
      });
    }
  }
  await audit(actor, "order_rejected", "order", orderId, reason);
}

export async function setDeliveryStatus(actor: string, deliveryId: string, status: string) {
  const allowed = ["scheduled", "preparing", "packed", "assigned", "out_for_delivery", "delivered", "cancelled"];
  if (!allowed.includes(status)) throw new AdminError("That delivery status is not available.");
  const delivery = await db().scheduledDelivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) throw new AdminError("Delivery not found.");
  await db().scheduledDelivery.update({
    where: { id: deliveryId },
    data: {
      status,
      packingStatus: status === "packed" || status === "assigned" || status === "out_for_delivery" || status === "delivered" ? "packed" : delivery.packingStatus,
      statusHistoryJson: history(delivery.statusHistoryJson, status, actor),
    },
  });
  if (status === "packed") {
    await db().packingRecord.upsert({
      where: { deliveryId },
      create: { deliveryId, status: "packed", packedBy: actor, packedAt: new Date() },
      update: { status: "packed", packedBy: actor, packedAt: new Date() },
    });
  }
  await audit(actor, "delivery_status", "delivery", deliveryId, status);
}

export async function assignDelivery(actor: string, deliveryId: string, assignee: string) {
  await db().scheduledDelivery.update({
    where: { id: deliveryId },
    data: { assignedTo: assignee.trim(), status: "assigned" },
  });
  await audit(actor, "delivery_assigned", "delivery", deliveryId, assignee.trim());
}

export async function failDelivery(actor: string, deliveryId: string, input: { reason: string; attemptedAt: string; contactOutcome: string; resolution: string }) {
  const delivery = await db().scheduledDelivery.findUnique({ where: { id: deliveryId }, include: { order: true } });
  if (!delivery) throw new AdminError("Delivery not found.");
  const resolution = input.resolution;
  if (!["redelivery", "reschedule", "refund_review", "closed_without_refund"].includes(resolution)) {
    throw new AdminError("Choose a resolution.");
  }
  await db().scheduledDelivery.update({
    where: { id: deliveryId },
    data: {
      status: resolution === "redelivery" ? "out_for_delivery" : "failed",
      failureReason: input.reason,
      attemptedAt: input.attemptedAt,
      contactOutcome: input.contactOutcome,
      resolution,
      statusHistoryJson: history(delivery.statusHistoryJson, resolution === "redelivery" ? "out_for_delivery" : "failed", actor),
    },
  });
  if (resolution === "refund_review") {
    await db().refund.create({
      data: {
        orderId: delivery.orderId,
        amountPaise: delivery.totalPaise,
        reason: `Failed delivery ${delivery.date}: ${input.reason}`,
        status: "pending_approval",
        idempotencyKey: `fail-${deliveryId}`,
      },
    }).catch(() => undefined);
  }
  await audit(actor, "delivery_failed", "delivery", deliveryId, resolution);
}

export async function rescheduleDelivery(actor: string, deliveryId: string, requestedDate: string) {
  const delivery = await db().scheduledDelivery.findUnique({
    where: { id: deliveryId },
    include: { items: true, order: { include: { deliveries: true } } },
  });
  if (!delivery) throw new AdminError("Delivery not found.");
  if (!["accepted", "paid_pending_acceptance"].includes(delivery.order.status)) {
    throw new AdminError("Only an active paid plan can be rescheduled.");
  }
  if (["delivered", "cancelled", "rescheduled"].includes(delivery.status)) {
    throw new AdminError("This delivery can no longer be moved.");
  }
  const settings = await db().businessSettings.findUniqueOrThrow({ where: { id: "default" } });
  const closures = await db().kitchenClosure.findMany({ where: { OR: [{ mealType: "all" }, { mealType: delivery.mealType }] } });
  const areaPin = JSON.parse(delivery.addressSnapshotJson).pinCode as string;
  const area = await db().serviceArea.findUnique({ where: { pinCode: areaPin } });
  const existing = delivery.order.deliveries.filter((item) => item.status !== "cancelled" && item.status !== "rescheduled").map((item) => item.date);
  const date = nextOpenDate(existing.filter((item) => item !== delivery.date), requestedDate, {
    rule: "all_days",
    operatingWeekdays: parseWeekdays(settings.operatingWeekdays),
    areaWeekdays: area ? parseWeekdays(area.weekdays) : undefined,
    closures: closures.map((closure) => closure.date),
    slotStart: delivery.slotStart,
    cutoffHours: settings.cutoffHours,
    timezone: settings.timezone,
  });
  if (!date) throw new AdminError("No eligible replacement date was found.");
  const slot = await db().deliverySlot.findUnique({ where: { id: delivery.slotId } });
  if (!slot) throw new AdminError("The delivery slot no longer exists.");
  await db().$transaction(async (tx) => {
    const claimed = await tx.scheduledDelivery.updateMany({
      where: { id: delivery.id, status: delivery.status },
      data: { status: "rescheduled", originalDate: delivery.originalDate || delivery.date },
    });
    if (claimed.count !== 1) throw new AdminError("This delivery was already changed.");
    for (const item of delivery.items) {
      if (!item.mealId) continue;
      await moveSold(
        tx,
        { date: delivery.date, mealId: item.mealId, slotId: delivery.slotId, mealQty: item.quantity, slotQty: 1 },
        { date, mealId: item.mealId, slotId: delivery.slotId, mealQty: item.quantity, slotQty: 1, mealLimit: 40, slotLimit: slot.capacity },
      );
    }
    await tx.scheduledDelivery.create({
      data: {
        orderId: delivery.orderId,
        date,
        mealType: delivery.mealType,
        slotId: delivery.slotId,
        slotLabel: delivery.slotLabel,
        slotStart: delivery.slotStart,
        status: "scheduled",
        addressSnapshotJson: delivery.addressSnapshotJson,
        foodPaise: delivery.foodPaise,
        addonPaise: delivery.addonPaise,
        feePaise: delivery.feePaise,
        discountPaise: delivery.discountPaise,
        taxPaise: delivery.taxPaise,
        totalPaise: delivery.totalPaise,
        notes: delivery.notes,
        originalDate: delivery.date,
        items: {
          create: delivery.items.map((item) => ({
            mealId: item.mealId,
            nameSnapshot: item.nameSnapshot,
            quantity: item.quantity,
            unitPricePaise: item.unitPricePaise,
            addonsJson: item.addonsJson,
            customizationNote: item.customizationNote,
          })),
        },
      },
    });
  });
  await audit(actor, "delivery_rescheduled", "delivery", deliveryId, `${delivery.date} -> ${date}`);
}

export async function replaceMeal(actor: string, deliveryId: string, mealId: string, customerAgreed: boolean) {
  const delivery = await db().scheduledDelivery.findUnique({ where: { id: deliveryId }, include: { items: true, order: true } });
  if (!delivery || delivery.items.length === 0) throw new AdminError("Delivery not found.");
  const settings = await db().businessSettings.findUniqueOrThrow({ where: { id: "default" } });
  if (!isStillChangeable(delivery.date, delivery.slotStart, new Date(), settings.cutoffHours, settings.timezone)) {
    throw new AdminError("This delivery is inside the cutoff. Handle it manually and do not promise an automatic change.");
  }
  const meal = await db().meal.findUnique({ where: { id: mealId } });
  if (!meal || !meal.published || meal.mealType !== delivery.mealType) throw new AdminError("That meal is not available for this delivery.");
  const item = delivery.items[0];
  const previous = item.unitPricePaise * item.quantity;
  const next = meal.pricePaise * item.quantity;
  const delta = next - previous;
  if (delta > 0 && !customerAgreed) {
    throw new AdminError("The replacement costs more. Record the customer's agreement before changing it. The extra is collected manually.");
  }
  await db().$transaction(async (tx) => {
    if (item.mealId && item.mealId !== meal.id) {
      const slot = await tx.deliverySlot.findUnique({ where: { id: delivery.slotId } });
      await moveSold(
        tx,
        { date: delivery.date, mealId: item.mealId, slotId: delivery.slotId, mealQty: item.quantity, slotQty: 1 },
        { date: delivery.date, mealId: meal.id, slotId: delivery.slotId, mealQty: item.quantity, slotQty: 1, mealLimit: meal.defaultPortions, slotLimit: slot?.capacity || 20 },
      );
    }
    await tx.deliveryItem.update({
      where: { id: item.id },
      data: { mealId: meal.id, nameSnapshot: meal.name, unitPricePaise: meal.pricePaise },
    });
  });
  if (delta < 0) {
    await db().refund.create({
      data: {
        orderId: delivery.orderId,
        amountPaise: Math.abs(delta),
        reason: `Meal change on ${delivery.date} from ${item.nameSnapshot} to ${meal.name}`,
        status: "pending_approval",
        idempotencyKey: `meal-${deliveryId}-${meal.id}`,
      },
    }).catch(() => undefined);
  }
  await audit(actor, "meal_replaced", "delivery", deliveryId, `${item.nameSnapshot} -> ${meal.name}; delta ${delta}`);
}

export async function changeAddress(actor: string, orderId: string, input: { line1: string; pinCode: string; city: string; instructions: string; customerAgreed: boolean }) {
  const order = await db().order.findUnique({ where: { id: orderId }, include: { deliveries: true } });
  if (!order) throw new AdminError("Order not found.");
  const area = await db().serviceArea.findUnique({ where: { pinCode: input.pinCode } });
  if (!area || !area.active) throw new AdminError("The new PIN is outside the current service area.");
  const settings = await db().businessSettings.findUniqueOrThrow({ where: { id: "default" } });
  const future = order.deliveries.filter((delivery) => ["scheduled", "preparing", "packed", "assigned"].includes(delivery.status) && isStillChangeable(delivery.date, delivery.slotStart, new Date(), settings.cutoffHours, settings.timezone));
  if (future.length === 0) throw new AdminError("There are no future deliveries that can still be changed.");
  const currentFee = future[0]?.feePaise ?? 0;
  const feeDelta = area.deliveryFeePaise - currentFee;
  if (feeDelta > 0 && !input.customerAgreed) {
    throw new AdminError("The new area has a higher delivery fee. Get the customer's agreement before applying it. The difference is collected manually.");
  }
  for (const delivery of future) {
    const previous = JSON.parse(delivery.addressSnapshotJson) as Record<string, string>;
    await db().scheduledDelivery.update({
      where: { id: delivery.id },
      data: {
        addressSnapshotJson: JSON.stringify({ ...previous, line1: input.line1, pinCode: input.pinCode, city: input.city, instructions: input.instructions }),
      },
    });
  }
  if (feeDelta < 0) {
    await db().refund.create({
      data: {
        orderId,
        amountPaise: Math.abs(feeDelta) * future.length,
        reason: "Delivery fee reduced after an approved address change",
        status: "pending_approval",
        idempotencyKey: `address-fee-${orderId}-${input.pinCode}`,
      },
    }).catch(() => undefined);
  }
  await audit(actor, "address_changed", "order", orderId, `${future.length} future deliveries`);
}

export async function createRefund(actor: string, orderId: string, amountInput: string, reason: string) {
  const order = await db().order.findUnique({ where: { id: orderId }, include: { payments: true, refunds: true, deliveries: true } });
  if (!order) throw new AdminError("Order not found.");
  const amountPaise = rupeesToPaise(amountInput);
  const captured = order.payments.filter((payment) => ["paid", "partially_refunded", "refunded"].includes(payment.status)).reduce((sum, payment) => sum + payment.amountPaise, 0);
  const reserved = order.refunds.filter((refund) => ["pending_approval", "refund_pending", "refunded"].includes(refund.status)).reduce((sum, refund) => sum + refund.amountPaise, 0);
  if (amountPaise <= 0 || amountPaise > captured - reserved) throw new AdminError("That refund amount is not available on the captured payment.");
  const refund = await db().refund.create({
    data: { orderId, amountPaise, reason, status: "pending_approval", idempotencyKey: `manual-${orderId}-${randomBytes(6).toString("hex")}` },
  });
  await audit(actor, "refund_requested", "refund", refund.id, reason);
}

export async function decideRefund(actor: string, refundId: string, approve: boolean) {
  const refund = await db().refund.findUnique({ where: { id: refundId }, include: { order: { include: { payments: true } } } });
  if (!refund) throw new AdminError("Refund not found.");
  if (!approve) {
    const updated = await db().refund.updateMany({ where: { id: refundId, status: "pending_approval" }, data: { status: "rejected" } });
    if (updated.count !== 1) throw new AdminError("This refund is no longer waiting for a decision.");
    await audit(actor, "refund_rejected", "refund", refundId);
    return;
  }
  const claimed = await db().refund.updateMany({ where: { id: refundId, status: "pending_approval" }, data: { status: "refund_pending" } });
  if (claimed.count !== 1) throw new AdminError("This refund was already submitted.");
  const payment = refund.order.payments.find((item) => item.gatewayPaymentId);
  if (!payment) throw new AdminError("There is no captured gateway payment to refund.");

  if (payment.gateway === "simulator" || paymentMode() === "simulator") {
    await db().refund.update({ where: { id: refundId }, data: { status: "refunded", gatewayRefundId: `sim_refund_${refundId.slice(-8)}` } });
    await refreshRefundStatus(refund.orderId);
    await ensureCreditNote(refundId);
    await audit(actor, "refund_simulated", "refund", refundId, "No live gateway money moved.");
    return;
  }

  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret || !payment.gatewayPaymentId.startsWith("pay_")) {
    await db().refund.update({ where: { id: refundId }, data: { status: "pending_approval" } });
    throw new AdminError("Razorpay is not configured, so the refund was left waiting for approval.");
  }
  const response = await fetch(`https://api.razorpay.com/v1/payments/${payment.gatewayPaymentId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: refund.amountPaise, speed: "normal", notes: { refundId, key: refund.idempotencyKey } }),
  });
  const body = (await response.json().catch(() => ({}))) as { id?: string; status?: string; error?: { description?: string } };
  if (!response.ok || !body.id) {
    await db().refund.update({ where: { id: refundId }, data: { status: "pending_approval" } });
    throw new AdminError(body.error?.description || "Razorpay did not accept the refund. It is still waiting for approval.");
  }
  const status = body.status === "processed" ? "refunded" : "refund_pending";
  await db().refund.update({ where: { id: refundId }, data: { status, gatewayRefundId: body.id } });
  if (status === "refunded") {
    await refreshRefundStatus(refund.orderId);
    await ensureCreditNote(refundId);
  }
  await audit(actor, "refund_submitted", "refund", refundId, body.id);
}

async function refreshRefundStatus(orderId: string) {
  const order = await db().order.findUnique({ where: { id: orderId }, include: { payments: true, refunds: true } });
  if (!order) return;
  const refunded = order.refunds.filter((refund) => refund.status === "refunded").reduce((sum, refund) => sum + refund.amountPaise, 0);
  const payment = order.payments[0];
  if (!payment) return;
  const status = refunded <= 0 ? payment.status : refunded >= payment.amountPaise ? "refunded" : "partially_refunded";
  await db().payment.update({ where: { id: payment.id }, data: { status } });
}

export async function saveMeal(actor: string, input: Record<string, string>) {
  const pricePaise = rupeesToPaise(input.price || "0");
  const data = {
    name: input.name.trim(),
    description: input.description.trim(),
    pricePaise,
    compareAtPaise: input.compareAt ? rupeesToPaise(input.compareAt) : 0,
    portionLabel: input.portionLabel.trim(),
    dietTags: input.dietTags.trim(),
    ingredients: input.ingredients.trim(),
    allergens: input.allergens.trim(),
    imageUrl: input.imageUrl.trim(),
    imageIsPlaceholder: input.imageIsPlaceholder === "on" || input.imageIsPlaceholder === "true",
    published: input.published === "on" || input.published === "true",
    available: input.available === "on" || input.available === "true",
    isPopular: input.popular === "on" || input.popular === "true",
    nutritionStatus: ["verified", "estimated", "missing"].includes(input.nutritionStatus) ? input.nutritionStatus : "missing",
    calories: input.calories ? Number(input.calories) : null,
    proteinTenths: input.protein ? Math.round(Number(input.protein) * 10) : null,
    carbsTenths: input.carbs ? Math.round(Number(input.carbs) * 10) : null,
    fatTenths: input.fat ? Math.round(Number(input.fat) * 10) : null,
    fiberTenths: input.fiber ? Math.round(Number(input.fiber) * 10) : null,
    nutritionSource: input.nutritionSource.trim(),
    mealType: input.mealType,
    defaultPortions: Number(input.defaultPortions || 40),
  };
  if (!data.name) throw new AdminError("A meal needs a name.");
  if (input.id) {
    await db().meal.update({ where: { id: input.id }, data });
    await audit(actor, "meal_updated", "meal", input.id);
    return;
  }
  const category = await db().mealCategory.findFirst({ where: { mealType: data.mealType } });
  if (!category) throw new AdminError("Create the meal category first.");
  const slug = input.slug.trim() || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const meal = await db().meal.create({ data: { ...data, slug, categoryId: category.id } });
  await audit(actor, "meal_created", "meal", meal.id);
}

export async function saveBowlComponent(actor: string, input: Record<string, string>) {
  const meal = await db().meal.findUnique({ where: { slug: "build-your-own-bowl" } });
  if (!meal) throw new AdminError("Publish Build Your Own Bowl before adding components.");
  const group = input.group;
  if (!["base", "protein", "vegetable", "sauce", "extra"].includes(group)) throw new AdminError("Choose a component group.");
  if (!input.name.trim()) throw new AdminError("A component needs a name.");
  const addon = await db().addon.create({
    data: { name: input.name.trim(), description: group, pricePaise: rupeesToPaise(input.price || "0"), active: true },
  });
  await db().mealAddon.create({ data: { mealId: meal.id, addonId: addon.id } });
  await audit(actor, "bowl_component_added", "addon", addon.id, group);
}

export async function saveSettings(actor: string, input: Record<string, string>) {
  await db().businessSettings.update({
    where: { id: "default" },
    data: {
      legalName: input.legalName.trim(),
      brandName: input.brandName.trim() || "AuraBowls",
      address: input.address.trim(),
      supportPhone: input.supportPhone.trim(),
      supportWhatsapp: input.supportWhatsapp.trim(),
      email: input.email.trim(),
      taxMode: "none",
      taxRateBps: 0,
      taxLabel: "",
      dinnerEnabled: input.dinnerEnabled === "on" || input.dinnerEnabled === "true",
      proteinGoalMinG: Number(input.proteinGoalMinG || 25),
      sheetsSyncEnabled: input.sheetsSyncEnabled === "on" || input.sheetsSyncEnabled === "true",
      operatingWeekdays: input.operatingWeekdays.trim() || "1,2,3,4,5,6",
    },
  });
  await audit(actor, "settings_updated", "settings", "default");
}

export async function saveArea(actor: string, input: Record<string, string>) {
  const data = {
    pinCode: input.pinCode.trim(),
    label: input.label.trim(),
    deliveryFeePaise: rupeesToPaise(input.deliveryFee || "0"),
    active: input.active === "on" || input.active === "true",
    coverage: input.coverage === "locality" ? "locality" : "pin",
    localityNote: input.localityNote.trim(),
    weekdays: input.weekdays.trim() || "1,2,3,4,5,6",
  };
  if (!/^\d{6}$/.test(data.pinCode)) throw new AdminError("Enter a 6 digit PIN.");
  await db().serviceArea.upsert({ where: { pinCode: data.pinCode }, create: data, update: data });
  await audit(actor, "area_saved", "service_area", data.pinCode);
}

export async function saveSlot(actor: string, input: Record<string, string>) {
  const data = {
    mealType: input.mealType,
    label: input.label.trim(),
    startTime: input.startTime.trim(),
    endTime: input.endTime.trim(),
    capacity: Number(input.capacity || 20),
    active: input.active === "on" || input.active === "true",
    sortOrder: Number(input.sortOrder || 0),
  };
  if (input.id) await db().deliverySlot.update({ where: { id: input.id }, data });
  else await db().deliverySlot.create({ data });
  await audit(actor, "slot_saved", "slot", input.id || data.label);
}

export async function createClosure(actor: string, date: string, reason: string, mealType: string) {
  await db().kitchenClosure.upsert({
    where: { date_mealType: { date, mealType: mealType || "all" } },
    create: { date, reason, mealType: mealType || "all" },
    update: { reason },
  });
  await audit(actor, "closure_created", "closure", date, reason);
}

export async function saveCoupon(actor: string, input: Record<string, string>) {
  const data = {
    code: input.code.trim().toUpperCase(),
    type: input.type === "percent" ? "percent" : "fixed",
    value: input.type === "percent" ? Math.round(Number(input.value) * 100) : rupeesToPaise(input.value || "0"),
    minOrderPaise: rupeesToPaise(input.minOrder || "0"),
    maxUses: Number(input.maxUses || 0),
    startsOn: input.startsOn.trim(),
    endsOn: input.endsOn.trim(),
    active: input.active === "on" || input.active === "true",
    stackable: input.stackable === "on" || input.stackable === "true",
  };
  if (!data.code) throw new AdminError("A coupon needs a code.");
  await db().coupon.upsert({ where: { code: data.code }, create: data, update: data });
  await audit(actor, "coupon_saved", "coupon", data.code);
}

export async function savePromotion(actor: string, input: Record<string, string>) {
  const data = { title: input.title.trim(), body: input.body.trim(), active: input.active === "on" || input.active === "true", startsOn: input.startsOn || "", endsOn: input.endsOn || "" };
  if (input.id) await db().promotion.update({ where: { id: input.id }, data });
  else await db().promotion.create({ data });
  await audit(actor, "promotion_saved", "promotion", input.id || data.title);
}

export async function adjustInventory(actor: string, itemId: string, delta: string, reason: string) {
  const deltaTenths = Math.round(Number(delta) * 10);
  if (!Number.isFinite(deltaTenths) || deltaTenths === 0) throw new AdminError("Enter a stock change.");
  await db().$transaction(async (tx) => {
    await tx.inventoryItem.update({ where: { id: itemId }, data: { quantityTenths: { increment: deltaTenths } } });
    await tx.stockAdjustment.create({ data: { itemId, deltaTenths, reason } });
  });
  await audit(actor, "inventory_adjusted", "inventory", itemId, reason);
}

export async function addInventoryItem(actor: string, name: string, unit: string, quantity: string) {
  const item = await db().inventoryItem.create({
    data: { name: name.trim(), unit: unit.trim() || "unit", quantityTenths: Math.round(Number(quantity || 0) * 10) },
  });
  await audit(actor, "inventory_created", "inventory", item.id);
}

export async function anonymizeCustomer(actor: string, customerId: string) {
  const customer = await db().customer.findUnique({ where: { id: customerId }, include: { orders: { include: { deliveries: true } } } });
  if (!customer) throw new AdminError("Customer not found.");
  const today = businessToday();
  const hasFuture = customer.orders.some((order) => order.deliveries.some((delivery) => delivery.date >= today && !["delivered", "cancelled", "rescheduled", "failed"].includes(delivery.status)));
  if (hasFuture) throw new AdminError("Finish or cancel future deliveries before deleting personal data. Invoices stay in the admin record.");
  await db().$transaction(async (tx) => {
    await tx.savedAddress.deleteMany({ where: { customerId } });
    await tx.customer.update({
      where: { id: customerId },
      data: { name: "Removed customer", phone: `removed-${customerId}`, allergyNotes: "", dietaryNotes: "", preferences: "", anonymizedAt: new Date() },
    });
    for (const order of customer.orders) {
      await tx.order.update({ where: { id: order.id }, data: { customerName: "Customer", customerPhone: "" } });
      for (const delivery of order.deliveries) {
        await tx.scheduledDelivery.update({ where: { id: delivery.id }, data: { addressSnapshotJson: JSON.stringify({ redacted: true }) } });
      }
    }
    await tx.dataRequest.create({ data: { customerId, phone: "redacted", type: "deletion", status: "completed", notes: "Profile anonymized. Issued invoices were retained." } });
  });
  await audit(actor, "customer_anonymized", "customer", customerId);
}

export async function rotateTracking(actor: string, orderId: string) {
  const token = randomBytes(32).toString("base64url");
  await db().order.update({ where: { id: orderId }, data: { trackingTokenHash: createHash("sha256").update(token).digest("hex") } });
  await audit(actor, "tracking_rotated", "order", orderId);
  return token;
}

export async function logChangeRequest(actor: string, orderId: string, type: string, message: string) {
  const request = await db().changeRequest.create({ data: { orderId, type, message, status: "pending" } });
  await audit(actor, "change_logged", "change_request", request.id);
}

export async function resolveChangeRequest(actor: string, id: string) {
  await db().changeRequest.update({ where: { id }, data: { status: "done" } });
  await audit(actor, "change_resolved", "change_request", id);
}

export function suggestedRefund(deliveries: { id: string; date: string; slotStart: string; status: string; totalPaise: number }[], cutoffHours: number, timezone: string) {
  return refundEligibility(deliveries, new Date(), cutoffHours, timezone);
}

export { addDays };
