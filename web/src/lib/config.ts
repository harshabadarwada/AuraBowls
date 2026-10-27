export function appSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("APP_SECRET must be set to a string of at least 16 characters.");
  }
  return secret;
}

export function paymentMode(): "razorpay" | "simulator" | "unconfigured" {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return "razorpay";
  if (process.env.PAYMENT_SIMULATOR === "true" && process.env.NODE_ENV !== "production") return "simulator";
  return "unconfigured";
}

export function otpDevReveal(): boolean {
  return process.env.OTP_DEV_REVEAL === "true" && process.env.NODE_ENV !== "production";
}

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export function smsConfigured(): boolean {
  return Boolean(process.env.SMS_API_URL && process.env.SMS_API_KEY);
}

export function sheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
  );
}
