import { afterEach, describe, expect, it, vi } from "vitest";
import { publicSiteUrl } from "./site";

afterEach(() => vi.unstubAllEnvs());

describe("publicSiteUrl", () => {
  it("does not canonicalize to the unregistered domain or the 404 vercel alias", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://theaurabowl.com");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "aura-bowls.vercel.app");
    vi.stubEnv("VERCEL_URL", "aura-bowls-harshabadarwadas-projects.vercel.app");
    expect(publicSiteUrl().origin).toBe("https://aura-bowls-harshabadarwadas-projects.vercel.app");
  });

  it("uses a real custom domain once it is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    expect(publicSiteUrl().origin).toBe("https://example.com");
  });

  it("falls back to theaurabowls.com in production when no other host is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(publicSiteUrl().origin).toBe("https://theaurabowls.com");
  });

  it("stays on localhost in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(publicSiteUrl().origin).toBe("http://localhost:3000");
  });
});
