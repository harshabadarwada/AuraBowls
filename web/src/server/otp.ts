import { createHash, createHmac, randomBytes, randomInt } from "crypto";
import { appSecret, otpDevReveal, smsConfigured, whatsappConfigured } from "@/lib/config";
import { db } from "@/lib/db";
import { normalizeIndianMobile } from "@/lib/phone";

const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function hashCode(phone: string, code: string) {
  return createHmac("sha256", appSecret()).update(`${phone}:${code}`).digest("hex");
}

function hashGrant(grant: string) {
  return createHash("sha256").update(grant).digest("hex");
}

function allowIp(ipHash: string) {
  const now = Date.now();
  const bucket = ipBuckets.get(ipHash);
  if (!bucket || bucket.resetAt < now) {
    ipBuckets.set(ipHash, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (bucket.count >= 20) return false;
  bucket.count += 1;
  return true;
}

async function dispatchCode(phone: string, code: string, channel: "whatsapp" | "sms") {
  if (channel === "whatsapp" && whatsappConfigured()) {
    const response = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone.replace("+", ""),
        type: "template",
        template: {
          name: process.env.WHATSAPP_OTP_TEMPLATE || "aurabowls_otp",
          language: { code: "en" },
          components: [{ type: "body", parameters: [{ type: "text", text: code }] }],
        },
      }),
    });
    return response.ok ? "sent" : "failed";
  }
  if (channel === "sms" && smsConfigured()) {
    const response = await fetch(process.env.SMS_API_URL as string, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SMS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: phone, message: `AuraBowls code: ${code}. It expires in 5 minutes.` }),
    });
    return response.ok ? "sent" : "failed";
  }
  if (otpDevReveal()) return "dev_only";
  return "unconfigured";
}

export async function sendOtp(rawPhone: string, channel: "whatsapp" | "sms", ipHash: string) {
  const phone = normalizeIndianMobile(rawPhone);
  if (!phone) return { ok: false as const, code: "invalid_phone", message: "Enter a valid Indian mobile number." };
  if (!allowIp(ipHash)) {
    return { ok: false as const, code: "rate_limited", message: "Too many codes were requested from this network. Try again later." };
  }
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db().phoneVerification.count({ where: { phone, createdAt: { gt: hourAgo } } });
  if (recent >= 5) {
    return { ok: false as const, code: "rate_limited", message: "Too many codes were requested for this number. Try again later." };
  }
  const last = await db().phoneVerification.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (last && last.resendAvailableAt > new Date()) {
    return { ok: false as const, code: "cooldown", message: "Wait a moment before requesting another code." };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const dispatchStatus = await dispatchCode(phone, code, channel);
  if (dispatchStatus === "failed" || dispatchStatus === "unconfigured") {
    return {
      ok: false as const,
      code: "provider_unavailable",
      message:
        channel === "whatsapp"
          ? "WhatsApp verification is unavailable. Try SMS, or ask AuraBowls to finish provider setup."
          : "SMS verification is unavailable. Try WhatsApp, or ask AuraBowls to finish provider setup.",
    };
  }

  const verification = await db().phoneVerification.create({
    data: {
      phone,
      channel,
      codeHash: hashCode(phone, code),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      resendAvailableAt: new Date(Date.now() + 45 * 1000),
      dispatchStatus,
      ipHash,
    },
  });

  return {
    ok: true as const,
    verificationId: verification.id,
    channel,
    devCode: dispatchStatus === "dev_only" ? code : undefined,
    message: dispatchStatus === "dev_only" ? "Development code generated. No WhatsApp or SMS message was sent." : "Code sent.",
  };
}

export async function verifyOtp(verificationId: string, rawPhone: string, code: string) {
  const phone = normalizeIndianMobile(rawPhone);
  if (!phone) return { ok: false as const, message: "Enter a valid Indian mobile number." };
  const row = await db().phoneVerification.findUnique({ where: { id: verificationId } });
  if (!row || row.phone !== phone || row.dispatchStatus === "not_sent") {
    return { ok: false as const, message: "That code is not valid." };
  }
  if (row.consumedAt) return { ok: false as const, message: "That code has already been used." };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false as const, message: "That code has expired. Request a new one." };
  if (row.attempts >= row.maxAttempts) return { ok: false as const, message: "Too many attempts. Request a new code." };

  const matches = hashCode(phone, code.trim()) === row.codeHash;
  if (!matches) {
    await db().phoneVerification.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return { ok: false as const, message: "That code is not valid." };
  }

  const grant = randomBytesGrant();
  await db().phoneVerification.update({
    where: { id: row.id },
    data: { consumedAt: new Date(), grantHash: hashGrant(grant) },
  });
  const customer = await db().customer.findUnique({ where: { phone }, include: { address: true } });
  return {
    ok: true as const,
    grant,
    phone,
    savedAddress: customer?.address && !customer.anonymizedAt
      ? {
          fullName: customer.address.fullName,
          line1: customer.address.line1,
          line2: customer.address.line2,
          landmark: customer.address.landmark,
          pinCode: customer.address.pinCode,
          city: customer.address.city,
          instructions: customer.address.instructions,
        }
      : null,
  };
}

function randomBytesGrant() {
  return randomBytes(32).toString("base64url");
}

export function grantMatches(grant: string) {
  return hashGrant(grant);
}
