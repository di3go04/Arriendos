import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

/**
 * Returns a singleton PrismaClient instance.
 * In serverless environments (Vercel) this prevents opening a new DB connection on each request.
 */
export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : [],
    });
  }
  return prisma;
}
