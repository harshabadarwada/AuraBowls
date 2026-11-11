export const SERVED_AREA = "Madhapur 7km";
export const servedRadiusKm = 7;
export const servedAreaLabel = "Madhapur, within 7 km";
export const SHEET_UPDATE_PATH = "/plans/tomorrow";

export function isServedArea(value: string) {
  const text = value.trim().toLowerCase();
  return text === SERVED_AREA.toLowerCase() || text === "madhapur 7km" || text === "500081";
}

export function areaLine(value: string) {
  const text = value.trim();
  if (!text) return "";
  if (isServedArea(text)) return `Area: ${servedAreaLabel}`;
  return `Area: ${text}`;
}
