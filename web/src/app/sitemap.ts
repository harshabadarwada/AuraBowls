import type { MetadataRoute } from "next";
import { catalog } from "../../prisma/catalog";
import { db } from "@/lib/db";
import { publicSiteUrl } from "@/lib/site";
import { publishedPlans } from "@/server/published-plans";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicSiteUrl().origin;
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/menu`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/menu/breakfast`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/menu/lunch`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/bowls/build`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/plans`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/plans/tomorrow`, lastModified: now, changeFrequency: "weekly", priority: 0.3 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
  const meals = await db()
    .meal.findMany({ where: { published: true }, select: { slug: true } })
    .catch(() => catalog.map((meal) => ({ slug: meal.slug })));
  const plans = await db()
    .planTemplate.findMany({ where: { active: true }, select: { slug: true } })
    .catch(() => publishedPlans().map((plan) => ({ slug: plan.slug })));
  return [
    ...staticPages,
    ...meals.map((meal) => ({ url: `${base}/meals/${meal.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...plans.map((plan) => ({ url: `${base}/plans/${plan.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
