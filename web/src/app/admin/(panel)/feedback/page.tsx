import { db } from "@/lib/db";
import { guard } from "@/server/guard";

export default async function FeedbackPage() {
  await guard();
  const feedback = await db().feedback.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div>
      <h1 className="text-3xl text-[#1A4A16]">Feedback</h1>
      <p className="mt-2 text-sm text-[#6A5A4E]">Ratings stay private to this dashboard.</p>
      {feedback.length === 0 ? <p className="mt-4 text-sm">No ratings yet.</p> : feedback.map((item) => (
        <article key={item.id} className="store-card mt-3 p-4"><p className="font-semibold text-[#1A4A16]">{item.rating} / 5 · {item.mealName}</p><p className="text-sm text-[#6A5A4E]">{item.comment || "No comment"}</p></article>
      ))}
    </div>
  );
}
