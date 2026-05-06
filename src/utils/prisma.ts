import { PrismaClient } from "../../generated/prisma/client";

export const prismaClient = new PrismaClient()

// const prismaClient = globalThis as unknown as { prisma: PrismaClient };

// export const prisma =
//   prismaClient.prisma ??
//   new PrismaClient({ log: ["query", "warn", "error"] });

// if (process.env.NODE_ENV !== "production") {
//   prismaClient.prisma = prisma;
// }
