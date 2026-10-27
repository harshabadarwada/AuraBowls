import { execSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";
import { CapacityError } from "./capacity";

let ready = false;

beforeAll(() => {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: process.cwd(),
    env: process.env,
    stdio: "pipe",
  });
  ready = true;
});

async function fixture(portions = 5) {
  const { db } = await import("@/lib/db");
  const prisma = db();
  await prisma.creditNote.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.packingRecord.deleteMany();
  await prisma.deliveryItem.deleteMany();
  await prisma.scheduledDelivery.deleteMany();
  await prisma.paymentAttempt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.reservationLine.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.order.deleteMany();
  await prisma.idempotencyRecord.deleteMany();
  await prisma.mealDateCapacity.deleteMany();
  await prisma.slotDateCapacity.deleteMany();
  await prisma.phoneVerification.deleteMany();
  await prisma.savedAddress.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.mealAddon.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.deliverySlot.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.planTemplate.deleteMany();
  await prisma.mealCategory.deleteMany();
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: { taxMode: "none", taxRateBps: 0, reservationMinutes: 10, cutoffHours: 24, sheetsSyncEnabled: false },
    create: { id: "default", taxMode: "none", reservationMinutes: 10 },
  });
  const category = await prisma.mealCategory.create({ data: { slug: "lunch", name: "Lunch", mealType: "lunch" } });
  const meal = await prisma.meal.create({
    data: {
      slug: "test-bowl",
      name: "Test Bowl",
      description: "Test",
      categoryId: category.id,
      mealType: "lunch",
      pricePaise: 17900,
      published: true,
      available: true,
      defaultPortions: portions,
      nutritionStatus: "missing",
    },
  });
  const slot = await prisma.deliverySlot.create({
    data: { mealType: "lunch", label: "12:00–1:30", startTime: "12:00", endTime: "13:30", capacity: portions },
  });
  await prisma.serviceArea.create({ data: { pinCode: "500081", label: "Test", deliveryFeePaise: 0, weekdays: "1,2,3,4,5,6" } });
  const plan = await prisma.planTemplate.create({
    data: {
      slug: "test-daily",
      name: "Test daily",
      description: "One lunch",
      mealType: "lunch",
      cadence: "daily",
      scheduleRule: "all_days",
      fixedDeliveryCount: 1,
      defaultMealSlug: meal.slug,
      discountBps: 0,
    },
  });
  return { prisma, meal, slot, plan };
}

async function verifiedPhone(phone: string) {
  const { sendOtp, verifyOtp } = await import("./otp");
  const sent = await sendOtp(phone, "whatsapp", "ip");
  expect(sent.ok).toBe(true);
  if (!sent.ok || !sent.devCode) throw new Error("dev code missing");
  const verified = await verifyOtp(sent.verificationId, phone, sent.devCode);
  expect(verified.ok).toBe(true);
  if (!verified.ok) throw new Error("otp failed");
  return verified;
}

describe.sequential("order lifecycle", () => {
  it("creates a pending order, then marks it paid without accepting it", async () => {
    expect(ready).toBe(true);
    const { meal, slot, plan, prisma } = await fixture();
    const otp = await verifiedPhone("9876543210");
    const { previewSchedule, placeOrder } = await import("./ordering");
    const { completeSimulatorPayment } = await import("./payments");
    const preview = await previewSchedule({ mode: "plan", planSlug: plan.slug, mealType: "lunch", startDate: "2026-10-23", pinCode: "500081", slotId: slot.id });
    const quote = await (await import("./ordering")).quoteDraft({
      mode: "plan",
      planSlug: plan.slug,
      mealType: "lunch",
      startDate: "2026-10-23",
      pinCode: "500081",
      couponCode: "",
      selections: preview.dates.map((date) => ({ date, mealId: meal.id, addonIds: [], quantity: 1, note: "", slotId: slot.id })),
    });
    const placed = await placeOrder({
      mode: "plan",
      planSlug: plan.slug,
      mealType: "lunch",
      startDate: "2026-10-23",
      pinCode: "500081",
      couponCode: "",
      selections: preview.dates.map((date) => ({ date, mealId: meal.id, addonIds: [], quantity: 1, note: "", slotId: slot.id })),
      idempotencyKey: `test-${Date.now()}`,
      expectedTotalPaise: quote.quote.totalPaise,
      verificationId: (await prisma.phoneVerification.findFirst({ where: { phone: "+919876543210" } }))!.id,
      grant: otp.grant,
      customer: { name: "Test Customer", phone: "9876543210", line1: "12 Test Street", line2: "", landmark: "", city: "Hyderabad", instructions: "", allergies: "Nuts", dietary: "", saveAddress: true },
    });
    const pending = await prisma.order.findUniqueOrThrow({ where: { reference: placed.reference }, include: { payments: true } });
    expect(pending.status).toBe("pending_payment");
    expect(pending.payments[0].status).toBe("pending");
    const started = await (await import("./payments")).startPayment(placed.token);
    expect(started.mode).toBe("simulator");
    if (started.mode !== "simulator") return;
    const paid = await completeSimulatorPayment(placed.token, started.nonce);
    expect(paid.reconciliation).toBe(false);
    const accepted = await prisma.order.findUniqueOrThrow({ where: { id: pending.id } });
    expect(accepted.status).toBe("paid_pending_acceptance");
    expect(accepted.acceptanceStatus).toBe("pending");
    const again = await completeSimulatorPayment(placed.token, started.nonce);
    expect(again.already).toBe(true);
    const invoiceCount = await prisma.invoice.count({ where: { orderId: pending.id } });
    expect(invoiceCount).toBe(1);
    const secondInvoice = await (await import("./invoices")).ensureInvoice(pending.id);
    expect(secondInvoice?.number).toBe((await prisma.invoice.findFirst({ where: { orderId: pending.id } }))?.number);
  });

  it("lets only one customer reserve the last portion", async () => {
    const { meal, slot, plan, prisma } = await fixture(1);
    const first = await verifiedPhone("9876543211");
    const second = await verifiedPhone("9876543212");
    const { previewSchedule, placeOrder } = await import("./ordering");
    const preview = await previewSchedule({ mode: "plan", planSlug: plan.slug, mealType: "lunch", startDate: "2026-10-23", pinCode: "500081", slotId: slot.id });
    const selection = preview.dates.map((date) => ({ date, mealId: meal.id, addonIds: [], quantity: 1, note: "", slotId: slot.id }));
    const quote = await (await import("./ordering")).quoteDraft({ mode: "plan", planSlug: plan.slug, mealType: "lunch", startDate: "2026-10-23", pinCode: "500081", couponCode: "", selections: selection });
    const body = {
      mode: "plan" as const,
      planSlug: plan.slug,
      mealType: "lunch" as const,
      startDate: "2026-10-23",
      pinCode: "500081",
      couponCode: "",
      selections: selection,
      expectedTotalPaise: quote.quote.totalPaise,
      customer: { name: "Capacity", phone: "", line1: "1 Street", line2: "", landmark: "", city: "Hyderabad", instructions: "", allergies: "", dietary: "", saveAddress: false },
    };
    const results = await Promise.allSettled([
      placeOrder({ ...body, idempotencyKey: `a-${Date.now()}`, verificationId: (await prisma.phoneVerification.findFirst({ where: { phone: "+919876543211" }, orderBy: { createdAt: "desc" } }))!.id, grant: first.grant, customer: { ...body.customer, name: "A", phone: "9876543211" } }),
      placeOrder({ ...body, idempotencyKey: `b-${Date.now()}`, verificationId: (await prisma.phoneVerification.findFirst({ where: { phone: "+919876543212" }, orderBy: { createdAt: "desc" } }))!.id, grant: second.grant, customer: { ...body.customer, name: "B", phone: "9876543212" } }),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(CapacityError);
  });

  it("flags a payment that arrives after the reservation expires", async () => {
    const { meal, slot, plan, prisma } = await fixture();
    const otp = await verifiedPhone("9876543213");
    const { previewSchedule, placeOrder } = await import("./ordering");
    const preview = await previewSchedule({ mode: "plan", planSlug: plan.slug, mealType: "lunch", startDate: "2026-10-23", pinCode: "500081", slotId: slot.id });
    const selections = preview.dates.map((date) => ({ date, mealId: meal.id, addonIds: [], quantity: 1, note: "", slotId: slot.id }));
    const quote = await (await import("./ordering")).quoteDraft({ mode: "plan", planSlug: plan.slug, mealType: "lunch", startDate: "2026-10-23", pinCode: "500081", couponCode: "", selections });
    const placed = await placeOrder({
      mode: "plan", planSlug: plan.slug, mealType: "lunch", startDate: "2026-10-23", pinCode: "500081", couponCode: "", selections,
      idempotencyKey: `late-${Date.now()}`, expectedTotalPaise: quote.quote.totalPaise,
      verificationId: (await prisma.phoneVerification.findFirst({ where: { phone: "+919876543213" }, orderBy: { createdAt: "desc" } }))!.id,
      grant: otp.grant,
      customer: { name: "Late", phone: "9876543213", line1: "2 Street", line2: "", landmark: "", city: "Hyderabad", instructions: "", allergies: "", dietary: "", saveAddress: false },
    });
    const { startPayment, completeSimulatorPayment } = await import("./payments");
    const started = await startPayment(placed.token);
    await prisma.reservation.updateMany({ data: { expiresAt: new Date(Date.now() - 60_000) } });
    expect(started.mode).toBe("simulator");
    if (started.mode !== "simulator") return;
    const paid = await completeSimulatorPayment(placed.token, started.nonce);
    expect(paid.reconciliation).toBe(true);
    const order = await prisma.order.findFirstOrThrow({ where: { reference: placed.reference }, include: { refunds: true, deliveries: true } });
    expect(order.status).toBe("needs_reconciliation");
    expect(order.refunds[0]?.status).toBe("pending_approval");
    expect(order.deliveries.every((delivery) => delivery.status === "scheduled")).toBe(true);
  });

  it("rejects a wrong OTP and does not treat sending as verification", async () => {
    await fixture();
    const { sendOtp, verifyOtp } = await import("./otp");
    const sent = await sendOtp("9876543299", "sms", "ip2");
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    const wrong = await verifyOtp(sent.verificationId, "9876543299", sent.devCode === "111111" ? "000000" : "111111");
    expect(wrong.ok).toBe(false);
  });
});
