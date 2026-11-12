import { describe, expect, it } from "vitest";
import { localDigits, normalizeIndianMobile } from "./phone";

describe("mobile digits", () => {
  it("keeps a 10-digit Indian mobile", () => {
    expect(localDigits("9876543210")).toBe("9876543210");
    expect(localDigits("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianMobile("09876543210")).toBe("+919876543210");
  });
});
