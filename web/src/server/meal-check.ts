import { whatsappConfigured } from "@/lib/config";
import { db } from "@/lib/db";
import { mealCheckAction, parseMealReply } from "@/lib/meal-check";
import { normalizeIndianMobile } from "@/lib/phone";
import { zonedToUtc } from "@/lib/time";
import { logChangeRequest } from "@/server/admin";
import { CapacityError, moveSold } from "@/server/capacity";
import { exportConfirmationRow } from "@/server/sheets";

function hoursUntil(date: string, slotStart: string, timezone: string, now: Date) {
  return (zonedToUtc(date, slotStart, timezone).getTime() - now.getTime()) / 3_600_000;
}

async function sendWhatsApp(phone: string, body: string) {
  if (!whatsappConfigured()) return { ok: false, detail: "WhatsApp is not configured." };
  const template = process.env.WHATSAPP_MEAL_CHECK_TEMPLATE;
  const payload = template
    ? {
        messaging_product: "whatsapp",
        to: phone.replace("+", ""),
        type: "template",
        template: {
          name: template,
          language: { code: "en" },
          components: [{ type: "body", parameters: [{ type: "text", text: body.slice(0, 900) }] }],
        },
      }
    : {
        messaging_product: "whatsapp",
        to: phone.replace("+", ""),
        type: "text",
        text: { body },
      };
  const response = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return { ok: false, detail: `WhatsApp responded ${response.status}` };
  return { ok: true, detail: "sent" };
}

export async function runMealChecks(now = new Date()) {
  const settings = await db().businessSettings.findUniqueOrThrow({ where: { id: "default" } });
  const deliveries = await db().scheduledDelivery.findMany({
    where: {
      status: { in: ["scheduled", "preparing", "packed", "assigned"] },
      order: { status: { in: ["paid_pending_acceptance", "accepted"] } },
      confirmStatus: { notIn: ["same", "changed", "locked"] },
    },
    include: { items: true, order: true },
  });
  const counts = { asked: 0, locked: 0, skipped: 0, failed: 0 };
  for (const delivery of deliveries) {
    const meal = delivery.items.map((item) => `${item.quantity} × ${item.nameSnapshot}`).join(", ") || "your meal";
    const left = hoursUntil(delivery.date, delivery.slotStart, settings.timezone, now);
    const action = mealCheckAction(left, delivery.confirmStatus);
    if (action === "skip" || action === "wait") {
      counts.skipped += 1;
      continue;
    }
    if (action === "lock") {
      await db().scheduledDelivery.update({ where: { id: delivery.id }, data: { confirmStatus: "locked", confirmReply: delivery.confirmReply || "No reply before 11 hours. Scheduled meal kept." } });
      const notice = `AuraBowls will deliver ${meal} in the ${delivery.slotLabel} slot. Changes are closed for this delivery.`;
      const sent = await sendWhatsApp(delivery.order.customerPhone, notice);
      await exportConfirmationRow({ delivery, meal, decision: "locked", reply: delivery.confirmReply || "No reply. Scheduled meal kept.", detail: sent.detail });
      counts.locked += 1;
      continue;
    }
    const question = `Hello ${delivery.order.customerName}, your AuraBowls delivery is coming up (${delivery.date}, ${delivery.slotLabel}): ${meal}. Reply SAME to keep it, or reply with the other meal name. We stop taking changes 11 hours before the slot.`;
    const sent = await sendWhatsApp(delivery.order.customerPhone, question);
    if (!sent.ok) {
      counts.failed += 1;
      await exportConfirmationRow({ delivery, meal, decision: "not sent", reply: "", detail: sent.detail });
      continue;
    }
    await db().scheduledDelivery.update({ where: { id: delivery.id }, data: { confirmStatus: "asked" } });
    await exportConfirmationRow({ delivery, meal, decision: "asked", reply: "", detail: "Waiting for a WhatsApp reply." });
    counts.asked += 1;
  }
  return counts;
}

export async function applyMealReply(fromPhone: string, text: string, messageId: string) {
  const existing = await db().gatewayEvent.findUnique({ where: { eventId: `wa:${messageId}` } });
  if (existing) return { duplicate: true };
  await db().gatewayEvent.create({ data: { eventId: `wa:${messageId}`, type: "whatsapp.message", payloadHash: text.slice(0, 120) } });
  const phone = normalizeIndianMobile(fromPhone);
  if (!phone) return { matched: 0 };
  const settings = await db().businessSettings.findUniqueOrThrow({ where: { id: "default" } });
  const now = new Date();
  const deliveries = await db().scheduledDelivery.findMany({
    where: { confirmStatus: "asked", order: { customerPhone: phone }, status: { in: ["scheduled", "preparing", "packed", "assigned"] } },
    include: { items: true, order: true },
    orderBy: { date: "asc" },
  });
  const open = deliveries.filter((delivery) => hoursUntil(delivery.date, delivery.slotStart, settings.timezone, now) > 11);
  const target = open[0];
  if (!target) {
    await sendWhatsApp(phone, "This AuraBowls delivery is already inside 11 hours, so the scheduled meal stays as it is.");
    return { matched: 0 };
  }
  const meals = await db().meal.findMany({ where: { published: true, available: true, mealType: target.mealType }, select: { id: true, name: true } });
  const parsed = parseMealReply(text, meals);
  const meal = target.items.map((item) => item.nameSnapshot).join(", ");
  if (parsed.kind === "same") {
    await db().scheduledDelivery.update({ where: { id: target.id }, data: { confirmStatus: "same", confirmReply: text.slice(0, 240) } });
    await exportConfirmationRow({ delivery: target, meal, decision: "same", reply: text, detail: "Customer kept the scheduled meal." });
    await sendWhatsApp(phone, `Thank you. We will keep ${meal} for ${target.date}, ${target.slotLabel}.`);
    return { matched: 1 };
  }
  if (parsed.kind === "meal") {
    const nextMeal = await db().meal.findUnique({ where: { id: parsed.id } });
    const item = target.items[0];
    if (!nextMeal || !item) return { matched: 0 };
    try {
      await db().$transaction(async (tx) => {
        if (item.mealId && item.mealId !== nextMeal.id) {
          const slot = await tx.deliverySlot.findUnique({ where: { id: target.slotId } });
          await moveSold(
            tx,
            { date: target.date, mealId: item.mealId, slotId: target.slotId, mealQty: item.quantity, slotQty: 1 },
            { date: target.date, mealId: nextMeal.id, slotId: target.slotId, mealQty: item.quantity, slotQty: 1, mealLimit: nextMeal.defaultPortions, slotLimit: slot?.capacity || 20 },
          );
        }
        await tx.deliveryItem.update({ where: { id: item.id }, data: { mealId: nextMeal.id, nameSnapshot: nextMeal.name, unitPricePaise: nextMeal.pricePaise } });
        await tx.scheduledDelivery.update({ where: { id: target.id }, data: { confirmStatus: "changed", confirmReply: text.slice(0, 240) } });
      });
      const delta = nextMeal.pricePaise * item.quantity - item.unitPricePaise * item.quantity;
      if (delta > 0) await logChangeRequest("whatsapp", target.orderId, "meal", `Extra ${delta} paise for ${nextMeal.name} on ${target.date} is collected manually.`);
      if (delta < 0) {
        await db().refund.create({
          data: { orderId: target.orderId, amountPaise: Math.abs(delta), reason: `WhatsApp meal change on ${target.date}`, status: "pending_approval", idempotencyKey: `wa-meal-${target.id}-${nextMeal.id}` },
        }).catch(() => undefined);
      }
      await exportConfirmationRow({ delivery: target, meal: nextMeal.name, decision: "changed", reply: text, detail: `Changed from ${meal}.` });
      await sendWhatsApp(phone, `Updated. ${target.date} will be ${nextMeal.name}, ${target.slotLabel}.`);
    } catch (error) {
      const message = error instanceof CapacityError ? error.message : error instanceof Error ? error.message : "The meal could not be changed.";
      await logChangeRequest("whatsapp", target.orderId, "meal", `${text} — ${message}`);
      await exportConfirmationRow({ delivery: target, meal, decision: "change requested", reply: text, detail: message });
      await sendWhatsApp(phone, "We received that meal name. The kitchen will confirm it because that portion is not available.");
    }
    return { matched: 1 };
  }
  await logChangeRequest("whatsapp", target.orderId, "meal", text.slice(0, 500));
  await exportConfirmationRow({ delivery: target, meal, decision: "waiting for a meal name", reply: text, detail: "Reply was not SAME and did not match a published meal." });
  await sendWhatsApp(phone, "Reply SAME to keep this meal, or reply with the exact meal name from the menu. This stays open until 11 hours before the slot.");
  return { matched: 1 };
}
