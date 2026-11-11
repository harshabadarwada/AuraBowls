import { servedRadiusKm } from "@/lib/area";

export const MADHAPUR_CENTER = { lat: 17.4484, lng: 78.3908 };

export type MapPoint = { lat: number; lng: number };

export function mapsUrl(point: MapPoint) {
  return `https://maps.google.com/?q=${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}

export function distanceKm(from: MapPoint, to: MapPoint) {
  const earth = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function isWithinServedRadius(point: MapPoint, km = servedRadiusKm) {
  return distanceKm(point, MADHAPUR_CENTER) <= km;
}

export function placeLabel(input: {
  display_name?: string;
  address?: Record<string, string | undefined>;
}) {
  const parts = input.address || {};
  const road = [parts.house_number, parts.road].filter(Boolean).join(" ");
  const locality = parts.neighbourhood || parts.suburb || parts.village || parts.residential;
  const city = parts.city || parts.town || parts.city_district;
  const unique = [...new Set([road, locality, city].map((part) => part?.trim()).filter(Boolean))];
  return unique.slice(0, 3).join(", ") || input.display_name?.trim() || "";
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}
