"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readDraft, writeDraft, type Draft } from "@/components/draft";
import { Stage } from "@/components/stage";
import { formatInr } from "@/lib/format";

type Slot = { id: string; label: string; mealType: string };

export function CheckoutForm({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState<"details" | "review">("details");
  const [quote, setQuote] = useState<{ totalPaise: number; planDiscountPaise: number; deliveryFeePaise: number } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [grant, setGrant] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", line1: "", line2: "", landmark: "", city: "Hyderabad", instructions: "", allergies: "", dietary: "", code: "", channel: "whatsapp" });

  useEffect(() => { setDraft(readDraft()); }, []);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function review() {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      let next = draft;
      if (draft.mealType === "both" && draft.selections.some((selection) => !selection.slotId)) {
        throw new Error("Choose the breakfast and lunch slots on the plan page.");
      }
      if (!draft.selections[0]?.slotId || draft.selections.some((selection) => !selection.slotId)) {
        const slotId = (document.getElementById("slot") as HTMLSelectElement).value;
        const startDate = (document.getElementById("start") as HTMLInputElement).value;
        const pinCode = (document.getElementById("pin") as HTMLInputElement).value;
        const preview = await fetch("/api/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: draft.mode, planSlug: draft.planSlug, mealType: draft.mealType, startDate, pinCode, slotId }) }).then((response) => response.json().then((data) => ({ ok: response.ok, data })));
        if (!preview.ok) throw new Error(preview.data.message);
        const mealId = draft.selections[0]?.mealId || preview.data.defaultMealId;
        next = {
          ...draft,
          startDate,
          pinCode,
          selections: preview.data.dates.map((date: string, index: number) => draft.selections[index] && draft.mode === "plan"
            ? { ...draft.selections[index], date, slotId }
            : { date, mealId, addonIds: [], quantity: draft.selections[0]?.quantity || 1, note: draft.selections[0]?.note || "", slotId }),
        };
      }
      const response = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setDraft(next);
      writeDraft(next);
      setQuote(data.quote);
      setStep("review");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout could not continue.");
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: form.phone, channel: form.channel }) });
    const data = await response.json();
    setBusy(false);
    if (!response.ok || !data.ok) {
      setError(data.message || "The code could not be sent.");
      return;
    }
    setVerificationId(data.verificationId);
    setDevCode(data.devCode || "");
  }

  async function verify() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/otp/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verificationId, phone: form.phone, code: form.code }) });
    const data = await response.json();
    setBusy(false);
    if (!data.ok) {
      setError(data.message || "That code was not accepted.");
      return;
    }
    setGrant(data.grant);
    if (data.savedAddress) {
      setForm((current) => ({ ...current, name: data.savedAddress.fullName || current.name, line1: data.savedAddress.line1, line2: data.savedAddress.line2 || "", landmark: data.savedAddress.landmark || "", city: data.savedAddress.city || current.city, instructions: data.savedAddress.instructions || "" }));
    }
  }

  async function place() {
    if (!draft || !quote || !agreed) return;
    setBusy(true);
    setError("");
    const fingerprint = JSON.stringify({ draft, totalPaise: quote.totalPaise });
    const stored = sessionStorage.getItem("aurabowls.checkout.v1");
    const previous = stored ? JSON.parse(stored) as { fingerprint?: string; idempotencyKey?: string } : null;
    const idempotencyKey = previous?.fingerprint === fingerprint && previous.idempotencyKey ? previous.idempotencyKey : crypto.randomUUID();
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        idempotencyKey,
        expectedTotalPaise: quote.totalPaise,
        verificationId,
        grant,
        customer: { ...form, saveAddress: true },
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      if (data.quote?.totalPaise) setQuote(data.quote);
      setError(data.message || "The order was not created.");
      return;
    }
    sessionStorage.setItem("aurabowls.checkout.v1", JSON.stringify({ fingerprint, idempotencyKey, token: data.token }));
    router.push(`/pay/${data.token}`);
  }

  if (!draft) return <Stage eyebrow="Checkout" title="Your cart is empty" copy="Choose a bowl first. Checkout starts after a meal or a plan is in the draft."><a className="btn btn-accent" href="/menu">Explore Bowls</a></Stage>;
  const relevantSlots = slots.filter((slot) => slot.mealType === draft.mealType);

  return (
    <div className="mx-auto max-w-2xl">
      <Stage eyebrow="Delivery" title="Where should we bring it?" copy="Your number is verified before payment. A pending order is not an accepted order." className="mb-5" />
      {error ? <p className="mt-4 rounded-xl bg-[#fff1e8] px-4 py-3 text-sm" role="alert">{error}</p> : null}
      {step === "details" ? (
        <div className="mt-5 space-y-4">
          <section className="store-card space-y-3 p-5">
            <h2 className="text-lg text-[#1A4A16]">Delivery</h2>
            {draft.selections.some((selection) => !selection.slotId) ? (
              <>
                <label className="block text-sm">Start date<input id="start" className="field mt-1" type="date" required /></label>
                <label className="block text-sm">PIN<input id="pin" className="field mt-1" inputMode="numeric" maxLength={6} required /></label>
                <label className="block text-sm">Slot
                  <select id="slot" className="field mt-1">{relevantSlots.map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}</select>
                </label>
              </>
            ) : <p className="text-sm text-[#6A5A4E]">{draft.mealType === "both" ? `${new Set(draft.selections.map((selection) => selection.date)).size} days of breakfast and lunch` : `${draft.selections.length} scheduled ${draft.mealType} deliveries`} to PIN {draft.pinCode}.</p>}
          </section>
          <section className="store-card space-y-3 p-5">
            <h2 className="text-lg text-[#1A4A16]">Contact</h2>
            <label className="block text-sm">Full name<input className="field mt-1" value={form.name} onChange={(event) => patch("name", event.target.value)} required /></label>
            <label className="block text-sm">Mobile<input className="field mt-1" value={form.phone} onChange={(event) => patch("phone", event.target.value)} required /></label>
            <div className="flex gap-2">
              <select className="field max-w-[140px]" value={form.channel} onChange={(event) => patch("channel", event.target.value)}><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option></select>
              <button className="btn btn-line" type="button" onClick={sendCode} disabled={busy}>Send code</button>
            </div>
            {devCode ? <p className="rounded-xl bg-[#EAF6DC] px-3 py-2 text-sm">Development code {devCode}. No WhatsApp or SMS message was sent.</p> : null}
            <div className="flex gap-2">
              <input className="field" value={form.code} onChange={(event) => patch("code", event.target.value)} placeholder="6 digit code" />
              <button className="btn btn-forest" type="button" onClick={verify} disabled={busy || !verificationId}>Verify</button>
            </div>
          </section>
          <section className="store-card space-y-3 p-5">
            <h2 className="text-lg text-[#1A4A16]">Address</h2>
            <label className="block text-sm">Address<input className="field mt-1" value={form.line1} onChange={(event) => patch("line1", event.target.value)} /></label>
            <label className="block text-sm">Area / landmark<input className="field mt-1" value={form.landmark} onChange={(event) => patch("landmark", event.target.value)} /></label>
            <label className="block text-sm">City<input className="field mt-1" value={form.city} onChange={(event) => patch("city", event.target.value)} /></label>
            <label className="block text-sm">Delivery instructions<input className="field mt-1" value={form.instructions} onChange={(event) => patch("instructions", event.target.value)} /></label>
            <label className="block text-sm">Allergies<input className="field mt-1" value={form.allergies} onChange={(event) => patch("allergies", event.target.value)} /></label>
            <label className="block text-sm">Dietary notes<input className="field mt-1" value={form.dietary} onChange={(event) => patch("dietary", event.target.value)} /></label>
          </section>
          <button className="btn btn-accent w-full" type="button" onClick={review} disabled={busy || !grant}>Review order</button>
        </div>
      ) : (
        <div className="store-card mt-5 space-y-3 p-5">
          <h2 className="text-2xl text-[#1A4A16]">Ready to pay {quote ? formatInr(quote.totalPaise) : ""}</h2>
          <p className="text-sm text-[#6A5A4E]">Delivery {quote ? formatInr(quote.deliveryFeePaise) : ""} · Discount {quote ? formatInr(quote.planDiscountPaise) : ""}</p>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /> I have reviewed this total and want to continue to payment.</label>
          <button className="btn btn-accent w-full" type="button" disabled={!agreed || busy} onClick={place}>{busy ? "Creating order…" : `Proceed to Payment — ${quote ? formatInr(quote.totalPaise) : ""}`}</button>
          <button className="text-sm underline" type="button" onClick={() => setStep("details")}>Edit details</button>
        </div>
      )}
    </div>
  );
}
