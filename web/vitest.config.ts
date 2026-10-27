import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    env: {
      DATABASE_URL: "file:./integration.db",
      APP_SECRET: "test-secret-aurabowls",
      OTP_DEV_REVEAL: "true",
      PAYMENT_SIMULATOR: "true",
      NODE_ENV: "test",
      ADMIN_EMAIL: "admin@aurabowls.local",
      ADMIN_PASSWORD: "change-me-local-only",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
