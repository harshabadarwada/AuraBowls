/** Integer paise. Never parse money through binary floating point. */

export function rupeesToPaise(input: string): number {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("Enter a valid rupee amount");
  }
  const [rupees, fraction = ""] = trimmed.split(".");
  const frac = (fraction + "00").slice(0, 2);
  return Number(rupees) * 100 + Number(frac);
}

export function paiseToRupeesInput(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(paise));
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function formatInr(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(paise));
  const rupees = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  const grouped = rupees.toLocaleString("en-IN");
  return `${sign}₹${grouped}.${frac}`;
}

/** Largest-remainder split so the parts sum to `total`. */
export function allocatePaise(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const safeTotal = Math.trunc(total);
  const wsum = weights.reduce((sum, weight) => sum + weight, 0);
  if (safeTotal === 0 || wsum <= 0) return weights.map(() => 0);
  const raw = weights.map((weight) => (safeTotal * weight) / wsum);
  const floors = raw.map((value) => Math.floor(value));
  let left = safeTotal - floors.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);
  const out = [...floors];
  for (let i = 0; i < left; i += 1) out[order[i % order.length].index] += 1;
  return out;
}
