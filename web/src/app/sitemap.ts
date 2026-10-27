import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const staticPaths = ["", "/menu", "/menu/breakfast", "/menu/lunch", "/menu/dinner", "/plans", "/about", "/contact", "/privacy", "/terms", "/refund-policy"];
  const meals = await db().meal.findMany({ where: { published: true }, select: { slug: true } }).catch(() => []);
  const plans = await db().planTemplate.findMany({ where: { active: true }, select: { slug: true } }).catch(() => []);
  return [
    ...staticPaths.map((path) => ({ url: `${base}${path || "/"}` })),
    ...meals.map((meal) => ({ url: `${base}/meals/${meal.slug}` })),
    ...plans.map((plan) => ({ url: `${base}/plans/${plan.slug}` })),
  ];
}
