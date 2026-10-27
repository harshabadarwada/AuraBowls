import { NextResponse } from "next/server";
import { assertLoginAllowed, createSessionToken, sessionCookieOptions, SESSION_COOKIE, verifyAdminPassword } from "@/server/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  try {
    assertLoginAllowed(`${ip}:${email.toLowerCase()}`);
    const admin = await verifyAdminPassword(email, password);
    if (!admin) {
      return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
    }
    const response = NextResponse.redirect(new URL("/admin", request.url), 303);
    response.cookies.set(SESSION_COOKIE, createSessionToken(admin.email), sessionCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed.";
    return NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(message)}`, request.url), 303);
  }
}
