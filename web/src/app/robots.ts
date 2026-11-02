import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const origin = publicSiteUrl().origin;
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/track", "/pay", "/checkout", "/cart", "/api"] },
      { userAgent: "GPTBot", allow: "/", disallow: ["/admin", "/track", "/pay", "/checkout", "/cart", "/api"] },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
