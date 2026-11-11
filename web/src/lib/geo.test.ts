import { describe, expect, it } from "vitest";
import { MADHAPUR_CENTER, distanceKm, isWithinServedRadius, mapsUrl, placeLabel } from "./geo";

describe("Madhapur map location", () => {
  it("treats Hitech City as inside 7 km and a far pin as outside", () => {
    expect(distanceKm(MADHAPUR_CENTER, MADHAPUR_CENTER)).toBeCloseTo(0, 5);
    expect(isWithinServedRadius({ lat: 17.4435, lng: 78.3772 })).toBe(true);
    expect(isWithinServedRadius({ lat: 17.385, lng: 78.4867 })).toBe(false);
    expect(mapsUrl(MADHAPUR_CENTER)).toContain("17.448400");
  });

  it("builds a short place label from a reverse-geocode address", () => {
    expect(placeLabel({
      display_name: "Long noisy display name",
      address: {
        house_number: "12",
        road: "Ayyappa Society Road",
        suburb: "Madhapur",
        city: "Hyderabad",
      },
    })).toBe("12 Ayyappa Society Road, Madhapur, Hyderabad");
  });
});
