import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { publicSiteUrl } from "@/lib/site";
import { publishedPlans } from "@/server/published-plans";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicSiteUrl().origin;
  const staticPaths = ["", "/menu", "/menu/breakfast", "/menu/lunch", "/menu/dinner", "/plans", "/about", "/contact", "/privacy", "/terms", "/refund-policy"];
  const meals = await db().meal.findMany({ where: { published: true }, select: { slug: true } }).catch(() => []);
  const plans = await db().planTemplate.findMany({ where: { active: true }, select: { slug: true } }).catch(() => publishedPlans().map((plan) => ({ slug: plan.slug })));
  return [
    ...staticPaths.map((path) => ({ url: `${base}${path || "/"}` })),
    ...meals.map((meal) => ({ url: `${base}/meals/${meal.slug}` })),
    ...plans.map((plan) => ({ url: `${base}/plans/${plan.slug}` })),
  ];
}
