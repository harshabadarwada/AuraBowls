import { Prisma } from "@prisma/client";

export class CapacityError extends Error {
  readonly code = "capacity";
  constructor(message: string) {
    super(message);
    this.name = "CapacityError";
  }
}

type Tx = Prisma.TransactionClient;

export type CapacityLine = {
  date: string;
  mealId: string;
  slotId: string;
  mealQty: number;
  slotQty: number;
  mealLimit: number;
  slotLimit: number;
};

async function ensureMeal(tx: Tx, line: CapacityLine) {
  const existing = await tx.mealDateCapacity.findUnique({
    where: { mealId_date: { mealId: line.mealId, date: line.date } },
  });
  if (existing) return;
  await tx.mealDateCapacity.create({
    data: { mealId: line.mealId, date: line.date, portionLimit: line.mealLimit },
  });
}

async function ensureSlot(tx: Tx, line: CapacityLine) {
  const existing = await tx.slotDateCapacity.findUnique({
    where: { slotId_date: { slotId: line.slotId, date: line.date } },
  });
  if (existing) return;
  await tx.slotDateCapacity.create({
    data: { slotId: line.slotId, date: line.date, slotLimit: line.slotLimit },
  });
}

export async function holdCapacity(tx: Tx, lines: CapacityLine[]) {
  for (const line of lines) {
    await ensureMeal(tx, line);
    await ensureSlot(tx, line);
    const mealUpdated = await tx.$executeRaw`
      UPDATE "MealDateCapacity"
      SET "reserved" = "reserved" + ${line.mealQty}
      WHERE "mealId" = ${line.mealId} AND "date" = ${line.date}
        AND ("portionLimit" - "reserved" - "sold") >= ${line.mealQty}
    `;
    if (Number(mealUpdated) !== 1) {
      throw new CapacityError(`Only a limited number of portions are left on ${line.date}.`);
    }
    const slotUpdated = await tx.$executeRaw`
      UPDATE "SlotDateCapacity"
      SET "reserved" = "reserved" + ${line.slotQty}
      WHERE "slotId" = ${line.slotId} AND "date" = ${line.date}
        AND ("slotLimit" - "reserved" - "sold") >= ${line.slotQty}
    `;
    if (Number(slotUpdated) !== 1) {
      throw new CapacityError(`That delivery slot is full on ${line.date}.`);
    }
  }
}

export async function releaseReserved(tx: Tx, line: { date: string; mealId: string; slotId: string; mealQty: number; slotQty: number }) {
  const meal = await tx.$executeRaw`
    UPDATE "MealDateCapacity"
    SET "reserved" = "reserved" - ${line.mealQty}
    WHERE "mealId" = ${line.mealId} AND "date" = ${line.date} AND "reserved" >= ${line.mealQty}
  `;
  const slot = await tx.$executeRaw`
    UPDATE "SlotDateCapacity"
    SET "reserved" = "reserved" - ${line.slotQty}
    WHERE "slotId" = ${line.slotId} AND "date" = ${line.date} AND "reserved" >= ${line.slotQty}
  `;
  return Number(meal) === 1 && Number(slot) === 1;
}

export async function commitReserved(tx: Tx, line: { date: string; mealId: string; slotId: string; mealQty: number; slotQty: number }) {
  const meal = await tx.$executeRaw`
    UPDATE "MealDateCapacity"
    SET "reserved" = "reserved" - ${line.mealQty}, "sold" = "sold" + ${line.mealQty}
    WHERE "mealId" = ${line.mealId} AND "date" = ${line.date} AND "reserved" >= ${line.mealQty}
  `;
  const slot = await tx.$executeRaw`
    UPDATE "SlotDateCapacity"
    SET "reserved" = "reserved" - ${line.slotQty}, "sold" = "sold" + ${line.slotQty}
    WHERE "slotId" = ${line.slotId} AND "date" = ${line.date} AND "reserved" >= ${line.slotQty}
  `;
  return Number(meal) === 1 && Number(slot) === 1;
}

export async function releaseSold(tx: Tx, line: { date: string; mealId: string; slotId: string; mealQty: number; slotQty: number }) {
  const meal = await tx.$executeRaw`
    UPDATE "MealDateCapacity"
    SET "sold" = "sold" - ${line.mealQty}
    WHERE "mealId" = ${line.mealId} AND "date" = ${line.date} AND "sold" >= ${line.mealQty}
  `;
  const slot = await tx.$executeRaw`
    UPDATE "SlotDateCapacity"
    SET "sold" = "sold" - ${line.slotQty}
    WHERE "slotId" = ${line.slotId} AND "date" = ${line.date} AND "sold" >= ${line.slotQty}
  `;
  return Number(meal) === 1 && Number(slot) === 1;
}

export async function moveSold(
  tx: Tx,
  from: { date: string; mealId: string; slotId: string; mealQty: number; slotQty: number },
  to: CapacityLine,
) {
  const released = await releaseSold(tx, from);
  if (!released) throw new CapacityError("The original delivery capacity could not be released.");
  await ensureMeal(tx, to);
  await ensureSlot(tx, to);
  const meal = await tx.$executeRaw`
    UPDATE "MealDateCapacity"
    SET "sold" = "sold" + ${to.mealQty}
    WHERE "mealId" = ${to.mealId} AND "date" = ${to.date}
      AND ("portionLimit" - "reserved" - "sold") >= ${to.mealQty}
  `;
  const slot = await tx.$executeRaw`
    UPDATE "SlotDateCapacity"
    SET "sold" = "sold" + ${to.slotQty}
    WHERE "slotId" = ${to.slotId} AND "date" = ${to.date}
      AND ("slotLimit" - "reserved" - "sold") >= ${to.slotQty}
  `;
  if (Number(meal) !== 1 || Number(slot) !== 1) {
    throw new CapacityError("The replacement date does not have enough kitchen or slot capacity.");
  }
}
