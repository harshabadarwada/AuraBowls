import { isStillChangeable } from "./time";

export type RefundDelivery = {
  id: string;
  date: string;
  slotStart: string;
  status: string;
  totalPaise: number;
};

const LOCKED_STATUSES = new Set(["delivered", "cancelled", "failed", "rescheduled"]);

export function refundEligibility(
  deliveries: RefundDelivery[],
  now: Date,
  cutoffHours = 24,
  timezone = "Asia/Kolkata",
) {
  const eligible: (RefundDelivery & { reason: string })[] = [];
  const locked: (RefundDelivery & { reason: string })[] = [];
  for (const delivery of deliveries) {
    if (LOCKED_STATUSES.has(delivery.status)) {
      locked.push({ ...delivery, reason: delivery.status });
      continue;
    }
    if (!isStillChangeable(delivery.date, delivery.slotStart, now, cutoffHours, timezone)) {
      locked.push({ ...delivery, reason: "cutoff" });
      continue;
    }
    eligible.push({ ...delivery, reason: "before_cutoff" });
  }
  return {
    eligible,
    locked,
    amountPaise: eligible.reduce((sum, delivery) => sum + delivery.totalPaise, 0),
  };
}
