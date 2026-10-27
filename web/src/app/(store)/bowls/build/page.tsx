import type { Metadata } from "next";
import { BowlBuilder } from "@/components/bowl-builder";
import { Stage } from "@/components/stage";
import { listMeals } from "@/server/catalog";

export const metadata: Metadata = { title: "Build your bowl" };

export default async function BuildBowlPage() {
  const meals = await listMeals();
  const meal = meals.find((item) => item.slug === "build-your-own-bowl");
  if (!meal) {
    return <Stage eyebrow="Bowl" title="Build Your Own Bowl" copy="This bowl is not published yet." />;
  }
  return (
    <div>
      <Stage eyebrow="From ₹120" title="Build Your Own Bowl" copy="Choose a base, protein, vegetables, sauce, and add-ons. Missing components stay empty until the kitchen publishes a name and price." />
      <BowlBuilder meal={meal} />
    </div>
  );
}
