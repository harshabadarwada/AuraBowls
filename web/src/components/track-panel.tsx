"use client";

import { useState } from "react";
import { formatLongDate } from "@/lib/time";

export function TrackPanel({ token, whatsapp, deliveries }: { token: string; whatsapp: string; deliveries: { id: string; date: string; status: string; meal: string; delivered: boolean }[] }) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [deliveryId, setDeliveryId] = useState(deliveries.find((delivery) => delivery.delivered)?.id || "");

  function wa(text: string) {
    if (!whatsapp) return "#";
    return `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  }

  async function renew() {
    const response = await fetch("/api/renew", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Renewal details are unavailable.");
      return;
    }
    if (!data.planSlug) {
      setMessage("This order was a single delivery. Choose a plan to schedule the next set of days.");
      return;
    }
    window.location.href = `/plans/${data.planSlug}`;
  }

  async function sendFeedback() {
    const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, deliveryId, rating, comment }) });
    const data = await response.json();
    setMessage(data.message || (response.ok ? "Thank you. The kitchen can see this privately." : "Feedback was not saved."));
  }

  const prompts = [
    ["Order question", "I have a question about this order."],
    ["Meal change", "I would like to change a meal. I understand changes need 24 hours."],
    ["Skip a day", "I would like to skip a delivery and move it to a later date."],
    ["Address change", "I would like to request an address change for future deliveries."],
    ["Cancellation", "I would like to ask about cancelling eligible future deliveries."],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-accent" type="button" onClick={renew}>Renew plan</button>
        {prompts.map(([label, text]) => whatsapp ? (
          <a key={label} className="btn btn-line" href={wa(`${text} Order reference is on my tracking page.`)}>{label}</a>
        ) : null)}
      </div>
      {!whatsapp ? <p className="text-sm text-[#6A5A4E]">WhatsApp support is not configured yet, so these requests cannot be opened from the site.</p> : <p className="text-sm text-[#6A5A4E]">WhatsApp opens a draft. It is not sent until you press send, and it is not an automatic approval.</p>}
      <form className="store-card space-y-3 p-4" onSubmit={(event) => { event.preventDefault(); sendFeedback(); }}>
        <h2 className="text-xl text-[#1A4A16]">Rate a delivered meal</h2>
        {deliveries.filter((delivery) => delivery.delivered).length === 0 ? <p className="text-sm text-[#6A5A4E]">Ratings open after a delivery is marked delivered.</p> : (
          <>
            <select className="field" value={deliveryId} onChange={(event) => setDeliveryId(event.target.value)}>
              {deliveries.filter((delivery) => delivery.delivered).map((delivery) => <option key={delivery.id} value={delivery.id}>{formatLongDate(delivery.date)} · {delivery.meal}</option>)}
            </select>
            <label className="block text-sm">Stars
              <input className="field mt-1" type="number" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} />
            </label>
            <textarea className="field min-h-24" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Optional comment" />
            <button className="btn btn-forest" type="submit">Send privately</button>
          </>
        )}
        {message ? <p className="text-sm" role="status">{message}</p> : null}
      </form>
    </div>
  );
}
