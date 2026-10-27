import { createHash, randomBytes } from "crypto";
import { paymentMode } from "@/lib/config";
import { db } from "@/lib/db";
import { razorpayCheckoutSignature, razorpayWebhookSignature, signaturesMatch } from "@/lib/payments-sign";
import { commitReserved, releaseReserved } from "./capacity";
import { ensureInvoice } from "./invoices";
import { orderByToken } from "./ordering";
import { exportOrderRow } from "./sheets";

export class PaymentError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "PaymentError";
  }
}

async function openRefundForReconciliation(orderId: string, amountPaise: number, reason: string) {
  const key = `reconcile-${orderId}`;
  await db().refund.upsert({
    where: { idempotencyKey: key },
    update: {},
    create: {
      orderId,
      amountPaise,
      reason,
      status: "pending_approval",
      idempotencyKey: key,
    },
  });
}

async function flagReconciliation(orderId: string, gatewayPaymentId: string, source: string, amountPaise: number) {
  await db().$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { payments: true, reservation: { include: { lines: true } } },
    });
    if (!order || order.payments.length === 0) return;
    const payment = order.payments[0];
    if (!["paid", "partially_refunded", "refunded"].includes(payment.status)) {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "paid", gatewayPaymentId } });
    }
    await tx.paymentAttempt.create({ data: { paymentId: payment.id, status: "paid", detail: `${source}:needs_reconciliation` } });
    if (order.reservation && order.reservation.status === "active") {
      for (const line of order.reservation.lines) {
        if (!line.released) {
          await releaseReserved(tx, line);
          await tx.reservationLine.update({ where: { id: line.id }, data: { released: true } });
        }
      }
      await tx.reservation.update({ where: { id: order.reservation.id }, data: { status: "expired" } });
    }
    await tx.order.update({
      where: { id: order.id },
      data: {
        reconciliationFlag: "payment_after_expiry",
        paidAt: order.paidAt ?? new Date(),
        status: order.status === "cancelled" || order.status === "pending_payment" ? "needs_reconciliation" : order.status,
      },
    });
  });
  await openRefundForReconciliation(
    orderId,
    amountPaise,
    "Payment was confirmed after the delivery reservation expired. Review before keeping or refunding it.",
  );
}

export async function applyCapturedPayment(orderId: string, gatewayPaymentId: string, source: string) {
  const current = await db().order.findUnique({
    where: { id: orderId },
    include: { reservation: { include: { lines: true } }, payments: true },
  });
  if (!current || current.payments.length === 0) throw new PaymentError("missing", "Order not found.");
  const payment = current.payments[0];
  if (["paid", "partially_refunded", "refunded"].includes(payment.status)) {
    return { already: true, reconciliation: Boolean(current.reconciliationFlag) };
  }

  const holdReady =
    current.status === "pending_payment" &&
    current.reservation &&
    current.reservation.status === "active" &&
    current.reservation.expiresAt.getTime() > Date.now();

  if (!holdReady || !current.reservation) {
    await flagReconciliation(orderId, gatewayPaymentId, source, current.totalPaise);
    await ensureInvoice(orderId).catch(() => undefined);
    return { already: false, reconciliation: true };
  }

  try {
    await db().$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { reservation: { include: { lines: true } }, payments: true },
      });
      if (!order?.reservation || order.status !== "pending_payment") throw new Error("HOLD_LOST");
      for (const line of order.reservation.lines) {
        const committed = await commitReserved(tx, line);
        if (!committed) throw new Error("HOLD_LOST");
        await tx.reservationLine.update({ where: { id: line.id }, data: { released: true } });
      }
      await tx.reservation.update({ where: { id: order.reservation.id }, data: { status: "consumed" } });
      await tx.payment.update({ where: { id: order.payments[0].id }, data: { status: "paid", gatewayPaymentId } });
      await tx.paymentAttempt.create({ data: { paymentId: order.payments[0].id, status: "paid", detail: source } });
      const moved = await tx.order.updateMany({
        where: { id: order.id, status: "pending_payment" },
        data: { status: "paid_pending_acceptance", paidAt: new Date(), acceptanceStatus: "pending" },
      });
      if (moved.count !== 1) throw new Error("HOLD_LOST");
      await tx.auditLog.create({
        data: { actor: source, action: "payment_captured", entity: "order", entityId: order.id, detail: gatewayPaymentId },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "HOLD_LOST") {
      await flagReconciliation(orderId, gatewayPaymentId, source, current.totalPaise);
      await ensureInvoice(orderId).catch(() => undefined);
      return { already: false, reconciliation: true };
    }
    throw error;
  }

  await ensureInvoice(orderId).catch(() => undefined);
  void exportOrderRow(orderId);
  return { already: false, reconciliation: false };
}

async function razorpay(path: string, init?: RequestInit) {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) throw new PaymentError("unconfigured", "Razorpay is not configured.");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new PaymentError("gateway", "Razorpay could not complete that request. Nothing was marked as paid.");
  }
  return body as Record<string, unknown>;
}

export async function startPayment(token: string) {
  const order = await orderByToken(token);
  if (!order) throw new PaymentError("missing", "This payment link is not valid.");
  const payment = order.payments[0];
  if (!payment) throw new PaymentError("missing", "This order has no payment record.");
  if (payment.status === "paid" || order.status === "paid_pending_acceptance" || order.status === "accepted") {
    return { mode: "already_paid" as const, reference: order.reference, status: payment.status };
  }
  if (order.status !== "pending_payment") {
    throw new PaymentError("closed", "This order is no longer waiting for payment.");
  }
  if (order.reservation?.expiresAt && order.reservation.expiresAt.getTime() < Date.now()) {
    throw new PaymentError("expired", "The 10 minute reservation expired. Start checkout again.");
  }

  const mode = paymentMode();
  if (mode === "unconfigured") {
    throw new PaymentError("unconfigured", "Online payment is not configured yet.");
  }

  if (mode === "razorpay" && payment.gatewayOrderId) {
    const remote = await razorpay(`/orders/${payment.gatewayOrderId}/payments`);
    const items = (remote.items as { id: string; status: string; amount: number; order_id: string }[]) || [];
    const captured = items.find((item) => item.status === "captured" && item.amount === order.totalPaise);
    if (captured) {
      await applyCapturedPayment(order.id, captured.id, "reconcile");
      return { mode: "already_paid" as const, reference: order.reference, status: "paid" };
    }
  }

  if (mode === "simulator") {
    const nonce = randomBytes(24).toString("base64url");
    await db().payment.update({
      where: { id: payment.id },
      data: { status: "initiated", gateway: "simulator", gatewayOrderId: `sim_${nonce.slice(0, 12)}`, simulatorNonce: nonce },
    });
    return {
      mode: "simulator" as const,
      reference: order.reference,
      amountPaise: order.totalPaise,
      nonce,
      warning: "Development payment simulator. No money moves, and this cannot be used in production.",
    };
  }

  const created = await razorpay("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: order.totalPaise,
      currency: "INR",
      receipt: order.reference,
      notes: { reference: order.reference },
    }),
  });
  const gatewayOrderId = String(created.id || "");
  await db().payment.update({
    where: { id: payment.id },
    data: { status: "initiated", gateway: "razorpay", gatewayOrderId },
  });
  await db().paymentAttempt.create({ data: { paymentId: payment.id, status: "initiated", detail: gatewayOrderId } });
  return {
    mode: "razorpay" as const,
    reference: order.reference,
    amountPaise: order.totalPaise,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    gatewayOrderId,
    customerName: order.customerName,
    description: `AuraBowls ${order.reference}`,
  };
}

export async function completeSimulatorPayment(token: string, nonce: string) {
  if (paymentMode() !== "simulator") throw new PaymentError("unconfigured", "The payment simulator is turned off.");
  const order = await orderByToken(token);
  if (!order) throw new PaymentError("missing", "This payment link is not valid.");
  const payment = order.payments[0];
  if (!payment || payment.simulatorNonce !== nonce || !nonce) {
    throw new PaymentError("invalid", "This simulator payment does not match the server record.");
  }
  return applyCapturedPayment(order.id, `sim_${nonce.slice(0, 18)}`, "simulator");
}

export async function verifyRazorpayPayment(token: string, payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new PaymentError("unconfigured", "Razorpay is not configured.");
  const expected = razorpayCheckoutSignature(payload.razorpay_order_id, payload.razorpay_payment_id, secret);
  if (!signaturesMatch(expected, payload.razorpay_signature)) {
    throw new PaymentError("signature", "The payment signature did not match. The order was not marked paid.");
  }
  const order = await orderByToken(token);
  if (!order) throw new PaymentError("missing", "This payment link is not valid.");
  const payment = order.payments[0];
  if (!payment || payment.gatewayOrderId !== payload.razorpay_order_id) {
    throw new PaymentError("mismatch", "This payment does not belong to this order.");
  }
  const remote = (await razorpay(`/payments/${payload.razorpay_payment_id}`)) as {
    status?: string;
    amount?: number;
    order_id?: string;
  };
  if (remote.order_id !== payload.razorpay_order_id || remote.amount !== order.totalPaise) {
    throw new PaymentError("mismatch", "The gateway amount did not match this order.");
  }
  if (remote.status === "authorized") {
    await db().payment.update({ where: { id: payment.id }, data: { status: "authorized", gatewayPaymentId: payload.razorpay_payment_id } });
    return { status: "authorized" as const };
  }
  if (remote.status !== "captured") {
    await db().payment.update({ where: { id: payment.id }, data: { status: "failed" } });
    throw new PaymentError("failed", "The payment was not captured.");
  }
  await applyCapturedPayment(order.id, payload.razorpay_payment_id, "checkout_verify");
  return { status: "paid" as const };
}

export async function handleRazorpayWebhook(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new PaymentError("unconfigured", "The webhook secret is not configured.");
  const expected = razorpayWebhookSignature(rawBody, secret);
  if (!signaturesMatch(expected, signature)) throw new PaymentError("signature", "Webhook signature mismatch.");
  const event = JSON.parse(rawBody) as {
    event?: string;
    id?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } };
      refund?: { entity?: { id?: string; payment_id?: string; amount?: number; status?: string } };
    };
  };
  const eventId = event.id || `${event.event}:${event.payload?.payment?.entity?.id || event.payload?.refund?.entity?.id || randomBytes(6).toString("hex")}`;
  const seen = await db().gatewayEvent.findUnique({ where: { eventId } });
  if (seen) return { duplicate: true };
  await db().gatewayEvent.create({
    data: { eventId, type: event.event || "unknown", payloadHash: createHashSafe(rawBody) },
  });

  if (event.event === "payment.captured") {
    const entity = event.payload?.payment?.entity;
    if (!entity?.order_id || !entity.id) return { ignored: true };
    const payment = await db().payment.findFirst({ where: { gatewayOrderId: entity.order_id }, include: { order: true } });
    if (!payment) return { ignored: true };
    if (entity.amount !== payment.order.totalPaise) {
      await db().auditLog.create({
        data: { actor: "webhook", action: "amount_mismatch", entity: "payment", entityId: payment.id, detail: String(entity.amount) },
      });
      return { mismatch: true };
    }
    await applyCapturedPayment(payment.orderId, entity.id, "webhook");
  }

  if (event.event === "refund.processed" || event.event === "refund.failed") {
    const refundEntity = event.payload?.refund?.entity;
    if (!refundEntity?.id) return { ignored: true };
    await db().refund.updateMany({
      where: { gatewayRefundId: refundEntity.id },
      data: { status: event.event === "refund.processed" ? "refunded" : "failed" },
    });
  }
  return { ok: true };
}

function createHashSafe(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 40);
}
