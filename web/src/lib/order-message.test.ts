import { describe, expect, it } from "vitest";
import { guideOrderText, menuOrderText, outsideAreaText } from "./order-message";

describe("WhatsApp identity", () => {
  it("puts the name and address in a plan message", () => {
    const text = guideOrderText({
      name: "Meera Rao",
      address: "Flat 12, Madhapur",
      pin: "500081",
      goalLabel: "Fat loss",
      lines: [{ name: "Paneer Power Bowl", quantity: 1, pricePaise: 26000 }],
    });
    expect(text).toContain("Name: Meera Rao");
    expect(text).toContain("Address: Flat 12, Madhapur");
    expect(text).toContain("PIN: 500081");
    expect(text.indexOf("Name:")).toBeLessThan(text.indexOf("Bowls:"));
  });

  it("sends an outside-area note with the same identity", () => {
    const text = outsideAreaText({ name: "Arun", address: "Gachibowli road", pin: "500032" });
    expect(text).toContain("Name: Arun");
    expect(text).toContain("Address: Gachibowli road");
    expect(text).toContain("PIN: 500032");
    expect(text).toContain("outside PIN 500081");
    expect(menuOrderText({ name: "Arun", address: "Gachibowli road", pin: "500032", lines: [] })).toBe(text);
  });
});