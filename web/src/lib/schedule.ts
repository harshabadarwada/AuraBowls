import { addDays, isStillChangeable, weekdayOf } from "./time";

export type ScheduleInput = {
  startDate: string;
  count: number;
  rule: "weekdays" | "all_days" | "fixed_count";
  operatingWeekdays: number[];
  areaWeekdays?: number[];
  closures: string[];
  slotStart: string;
  now?: Date;
  cutoffHours?: number;
  timezone?: string;
  maxLookaheadDays?: number;
};

export type SkippedDate = { date: string; reason: string };

export function generateDates(input: ScheduleInput): { dates: string[]; skipped: SkippedDate[]; shortfall: boolean } {
  const dates: string[] = [];
  const skipped: SkippedDate[] = [];
  const now = input.now ?? new Date();
  const cutoffHours = input.cutoffHours ?? 24;
  const timezone = input.timezone ?? "Asia/Kolkata";
  const max = input.maxLookaheadDays ?? 80;
  let cursor = input.startDate;

  for (let step = 0; step < max && dates.length < input.count; step += 1) {
    const weekday = weekdayOf(cursor);
    let reason = "";
    if (!input.operatingWeekdays.includes(weekday)) reason = "The kitchen is closed";
    else if (input.rule === "weekdays" && (weekday === 0 || weekday === 6)) reason = "Outside this weekday plan";
    else if (input.areaWeekdays && !input.areaWeekdays.includes(weekday)) reason = "This PIN is not served that day";
    else if (input.closures.includes(cursor)) reason = "Kitchen closure";
    else if (!isStillChangeable(cursor, input.slotStart, now, cutoffHours, timezone)) reason = "Inside the change cutoff";

    if (reason) skipped.push({ date: cursor, reason });
    else dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return { dates, skipped, shortfall: dates.length < input.count };
}

export function nextOpenDate(existing: string[], candidate: string, input: Omit<ScheduleInput, "startDate" | "count">): string | null {
  const taken = new Set(existing);
  let cursor = candidate;
  for (let i = 0; i < 80; i += 1) {
    if (!taken.has(cursor)) {
      const result = generateDates({ ...input, startDate: cursor, count: 1 });
      if (result.dates[0] === cursor) return cursor;
      if (result.dates[0]) return result.dates[0];
    }
    cursor = addDays(cursor, 1);
  }
  return null;
}
