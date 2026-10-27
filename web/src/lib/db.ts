import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaReady?: Promise<void> };

export function db() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
    const url = process.env.DATABASE_URL ?? "";
    globalForPrisma.prismaReady = url.startsWith("file:")
      ? globalForPrisma.prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL").then(() =>
          globalForPrisma.prisma!.$queryRawUnsafe("PRAGMA busy_timeout = 5000"),
        ).then(() => undefined)
      : Promise.resolve();
  }
  return globalForPrisma.prisma;
}

export async function dbReady() {
  db();
  await globalForPrisma.prismaReady;
  return db();
}

export function databaseWarning(): string | null {
  const url = process.env.DATABASE_URL ?? "";
  if (process.env.NODE_ENV === "production" && url.startsWith("file:")) {
    return "Production is using a local SQLite file. Move to managed PostgreSQL before accepting real orders.";
  }
  return null;
}
