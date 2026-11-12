export type DraftSelection = {
  date: string;
  mealId: string;
  addonIds: string[];
  quantity: number;
  note: string;
  slotId: string;
};

export type Draft = {
  mode: "single" | "plan";
  planSlug: string | null;
  mealType: "breakfast" | "lunch" | "both";
  startDate: string;
  pinCode: string;
  couponCode: string;
  selections: DraftSelection[];
};

const KEY = "aurabowls.draft.v1";

export function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function writeDraft(draft: Draft) {
  sessionStorage.setItem(KEY, JSON.stringify(draft));
  window.dispatchEvent(new Event("aurabowls-draft"));
}

export function clearDraft() {
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event("aurabowls-draft"));
}

export type MenuLine = {
  slug: string;
  name: string;
  pricePaise: number;
  quantity: number;
  mealType: string;
};

const MENU_KEY = "aurabowls.menu.v1";

export function readMenu(): MenuLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(MENU_KEY);
    const lines = raw ? (JSON.parse(raw) as MenuLine[]) : [];
    return Array.isArray(lines) ? lines.filter((line) => line.slug && line.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function writeMenu(lines: MenuLine[]) {
  sessionStorage.setItem(MENU_KEY, JSON.stringify(lines.filter((line) => line.quantity > 0)));
  window.dispatchEvent(new Event("aurabowls-menu"));
}

export type Person = { name: string; address: string; pin: string; phone?: string };

const PERSON_KEY = "aurabowls.person.v1";
import { SERVED_AREA } from "@/lib/area";

export const SERVED_PIN = SERVED_AREA;

export function readPerson(): Person {
  if (typeof window === "undefined") return { name: "", address: "", pin: "", phone: "" };
  try {
    const raw = sessionStorage.getItem(PERSON_KEY);
    const person = raw ? JSON.parse(raw) as Person : null;
    return { name: person?.name || "", address: person?.address || "", pin: person?.pin || "", phone: person?.phone || "" };
  } catch {
    return { name: "", address: "", pin: "", phone: "" };
  }
}

export function writePerson(person: Person) {
  const current = readPerson();
  sessionStorage.setItem(PERSON_KEY, JSON.stringify({
    name: person.name,
    address: person.address,
    pin: person.pin,
    phone: person.phone ?? current.phone ?? "",
  }));
  window.dispatchEvent(new Event("aurabowls-person"));
}

export function addMenuLine(line: Omit<MenuLine, "quantity">, quantity = 1) {
  const lines = readMenu();
  const found = lines.find((item) => item.slug === line.slug);
  if (found) found.quantity = Math.min(6, found.quantity + quantity);
  else lines.push({ ...line, quantity: Math.min(6, Math.max(1, quantity)) });
  writeMenu(lines);
}
