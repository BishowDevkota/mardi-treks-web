import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function normalizeDirectDatabaseUrl(value: string) {
  const url = new URL(value);
  const sslMode = url.searchParams.get("sslmode");
  if (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca") {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

function createPrismaClient() {
  const directUrl = process.env.DIRECT_DATABASE_URL;
  const accelerateUrl = process.env.DATABASE_URL;

  // Local admin work should not depend on the remote Accelerate query engine.
  // Production keeps Accelerate unless PRISMA_USE_DIRECT is explicitly enabled.
  const useDirect =
    Boolean(directUrl) &&
    (process.env.NODE_ENV !== "production" || process.env.PRISMA_USE_DIRECT === "true");

  if (useDirect) {
    return new PrismaClient({
      adapter: new PrismaPg({
        connectionString: normalizeDirectDatabaseUrl(directUrl!),
      }),
    });
  }

  if (!accelerateUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return new PrismaClient({ accelerateUrl });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
