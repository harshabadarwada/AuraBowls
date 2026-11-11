import { NextResponse } from "next/server";
import { isWithinServedRadius, mapsUrl, placeLabel } from "@/lib/geo";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ message: "Location is missing." }, { status: 400 });
  }
  const point = { lat, lng };
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "AuraBowls/1.0 (https://theaurabowls.com)",
        },
        next: { revalidate: 86400 },
      },
    );
    const data = (await response.json().catch(() => null)) as { display_name?: string; address?: Record<string, string> } | null;
    const label = data ? placeLabel(data) : "";
    return NextResponse.json({
      label: label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      mapUrl: mapsUrl(point),
      inArea: isWithinServedRadius(point),
      lat,
      lng,
    });
  } catch {
    return NextResponse.json({
      label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      mapUrl: mapsUrl(point),
      inArea: isWithinServedRadius(point),
      lat,
      lng,
    });
  }
}
