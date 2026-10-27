export function publicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fallback = process.env.NODE_ENV === "production" ? "https://theaurabowl.com" : "http://localhost:3000";
  const value = configured || fallback;
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return new URL(fallback);
  }
}
