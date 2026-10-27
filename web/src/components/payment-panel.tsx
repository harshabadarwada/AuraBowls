"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearDraft } from "@/components/draft";
import { Stage } from "@/components/stage";

export function PaymentPanel({ token, reference, totalLabel, status, reconciliation, whatsappHref, summary, deliveryCount = 0, planName = "" }: { token: string; reference: string; totalLabel: string; status: string; reconciliation: boolean; whatsappHref: string; summary: string; deliveryCount?: number; planName?: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(status === "paid" || status === "paid_pending_acceptance" || status === "accepted");
  useEffect(() => {
    if (!paid) return;
    clearDraft();
    sessionStorage.removeItem("aurabowls.checkout.v1");
    if (!whatsappHref || reconciliation) return;
    const key = `aurabowls-wa-${reference}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    window.location.assign(whatsappHref);
  }, [paid, whatsappHref, reconciliation, reference]);

  async function pay() {
    setBusy(true);
    setMessage("");
    const created = await fetch("/api/payments/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).then((response) => response.json().then((data) => ({ ok: response.ok, data })));
    if (!created.ok) {
      setBusy(false);
      setMessage(created.data.message || "Payment could not start.");
      return;
    }
    if (created.data.mode === "already_paid") {
      setPaid(true);
      setBusy(false);
      return;
    }
    if (created.data.mode === "simulator") {
      const done = await fetch("/api/payments/simulator-complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, nonce: created.data.nonce }) }).then((response) => response.json().then((data) => ({ ok: response.ok, data })));
      setBusy(false);
      if (!done.ok) {
        setMessage(done.data.message);
        return;
      }
      setPaid(true);
      setMessage(done.data.reconciliation ? "Payment was recorded, but the reservation had expired. The kitchen has not accepted the deliveries. A refund is waiting for review." : "Development payment recorded. The kitchen still needs to accept the order. No money moved.");
      return;
    }
    const scriptReady = await loadRazorpay();
    if (!scriptReady || !window.Razorpay) {
      setBusy(false);
      setMessage("Razorpay checkout could not be loaded.");
      return;
    }
    const checkout = new window.Razorpay({
      key: created.data.keyId,
      amount: created.data.amountPaise,
      currency: "INR",
      order_id: created.data.gatewayOrderId,
      name: "AuraBowls",
      description: created.data.description,
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verified = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...response }) }).then((result) => result.json().then((data) => ({ ok: result.ok, data })));
        setBusy(false);
        if (!verified.ok) setMessage(verified.data.message || "Payment was not confirmed.");
        else {
          setPaid(true);
          setMessage(verified.data.status === "authorized" ? "The payment is authorized and waiting for capture." : "Payment confirmed. The kitchen still needs to accept the order.");
        }
      },
      modal: { ondismiss: () => { setBusy(false); setMessage("Payment was closed. You can try again on this same order."); } },
    });
    checkout.open();
  }

  if (paid) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="pay-glow store-card p-6 sm:p-8">
          <div className="pay-check grid h-16 w-16 place-items-center rounded-full bg-[#EAF6DC] text-2xl text-[#1A4A16]" aria-hidden="true">✓</div>
          <h1 className="display mt-4 text-4xl text-[#1A4A16]">You&apos;re All Set!</h1>
          <p className="mt-2 text-sm leading-6 text-[#6A5A4E]">Your payment is complete. Your meals are now awaiting confirmation from the AuraBowls team.</p>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt>Order</dt><dd className="font-semibold text-[#1A4A16]">{reference}</dd></div>
            <div className="flex justify-between gap-3"><dt>Amount paid</dt><dd className="font-semibold text-[#F15C00]">{totalLabel}</dd></div>
            {planName ? <div className="flex justify-between gap-3"><dt>Plan</dt><dd>{planName}</dd></div> : null}
            {deliveryCount > 0 ? <div className="flex justify-between gap-3"><dt>Deliveries</dt><dd>{deliveryCount}</dd></div> : null}
          </dl>
          {reconciliation ? <p className="mt-3 rounded-xl bg-[#fff1e8] px-3 py-2 text-sm">This payment needs a manual review because the delivery hold was no longer available.</p> : null}
          {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
          <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#FFF8F2] p-3 text-xs text-[#1A4A16]">{summary}</pre>
          <p className="mt-3 text-xs text-[#6A5A4E]">Opening WhatsApp does not send the message, and it does not mean the kitchen has accepted the order.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {whatsappHref ? <a className="btn btn-accent" href={whatsappHref}>Continue to WhatsApp</a> : <p className="text-sm">Add the business WhatsApp number in admin settings to open the summary.</p>}
            <Link className="btn btn-line" href={`/track/${token}`}>View order details</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Stage eyebrow="Payment" title="Pay securely" copy={`${reference}${planName ? ` · ${planName}` : ""}${deliveryCount ? ` · ${deliveryCount} deliveries` : ""}. Refreshing does not create another order.`} />
      <div className="store-card max-w-xl p-6">
      {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
      <p className="text-sm text-[#6A5A4E]">Razorpay opens after the kitchen confirms this amount and holds the delivery slots.</p>
      <p className="mt-3 text-3xl font-semibold text-[#F15C00]">{totalLabel}</p>
      <button className="btn btn-accent mt-5" type="button" onClick={pay} disabled={busy}>{busy ? "Waiting…" : `Pay ${totalLabel} Securely`}</button>
      </div>
    </div>
  );
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
