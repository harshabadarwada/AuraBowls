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
