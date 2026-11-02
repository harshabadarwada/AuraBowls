const LIVE_ORIGIN = "https://theaurabowls.com";

const unusable = new Set([
  "localhost",
  "theaurabowl.com",
  "www.theaurabowl.com",
  "aura-bowls.vercel.app",
]);

function asUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (unusable.has(url.hostname.replace(/^www\./, "").toLowerCase()) || unusable.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
}

export function publicSiteUrl() {
  return (
    asUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    asUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    asUrl(process.env.VERCEL_URL) ||
    new URL(process.env.NODE_ENV === "production" ? LIVE_ORIGIN : "http://localhost:3000")
  );
}
