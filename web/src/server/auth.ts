import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { appSecret } from "@/lib/config";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "ab_session";

type SessionPayload = { email: string; csrf: string; exp: number };

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function sign(body: string) {
  return createHmac("sha256", appSecret()).update(body).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createSessionToken(email: string) {
  const payload: SessionPayload = {
    email,
    csrf: randomBytes(18).toString("base64url"),
    exp: Date.now() + 12 * 60 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readSessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(sign(body), signature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload.email || !payload.csrf || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function currentAdmin() {
  const jar = await cookies();
  const session = readSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const admin = await db().adminUser.findUnique({ where: { email: session.email } });
  if (!admin) return null;
  return { admin, csrf: session.csrf };
}

export function assertLoginAllowed(key: string) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }
  if (entry.count >= 8) {
    throw new Error("Too many sign-in attempts. Wait a few minutes and try again.");
  }
  entry.count += 1;
}

export async function verifyAdminPassword(email: string, password: string) {
  const admin = await db().adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!admin) return null;
  const match = await bcrypt.compare(password, admin.passwordHash);
  return match ? admin : null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}
