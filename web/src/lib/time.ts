const OFFSET_MINUTES: Record<string, number> = {
  "Asia/Kolkata": 330,
};

export function timezoneOffsetMinutes(timezone: string): number {
  const offset = OFFSET_MINUTES[timezone];
  if (offset === undefined) {
    throw new Error(`Timezone ${timezone} is not configured. AuraBowls currently supports Asia/Kolkata.`);
  }
  return offset;
}

export function businessToday(now = new Date(), timezone = "Asia/Kolkata"): string {
  const shifted = new Date(now.getTime() + timezoneOffsetMinutes(timezone) * 60_000);
  return shifted.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekdayOf(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function zonedToUtc(isoDate: string, time: string, timezone = "Asia/Kolkata"): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcMillis = Date.UTC(year, month - 1, day, hour, minute) - timezoneOffsetMinutes(timezone) * 60_000;
  return new Date(utcMillis);
}

export function cutoffUtc(isoDate: string, slotStart: string, cutoffHours: number, timezone = "Asia/Kolkata"): Date {
  return new Date(zonedToUtc(isoDate, slotStart, timezone).getTime() - cutoffHours * 3_600_000);
}

export function isStillChangeable(
  isoDate: string,
  slotStart: string,
  now: Date,
  cutoffHours = 24,
  timezone = "Asia/Kolkata",
): boolean {
  return now.getTime() < cutoffUtc(isoDate, slotStart, cutoffHours, timezone).getTime();
}

export function parseWeekdays(value: string): number[] {
  return value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}

export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
