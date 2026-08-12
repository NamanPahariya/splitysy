import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../generated/prisma/client";

export async function createTestDatabase(): Promise<PrismaClient> {
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: ":memory:" }),
  });

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Account" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "displayName" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "passwordDigest" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email")',
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "secretDigest" TEXT NOT NULL,
      "accountId" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Session_accountId_fkey" FOREIGN KEY ("accountId")
        REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX "Session_secretDigest_key" ON "Session"("secretDigest")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX "Session_accountId_idx" ON "Session"("accountId")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt")',
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Group" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "creatorId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Group_creatorId_fkey" FOREIGN KEY ("creatorId")
        REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE INDEX "Group_creatorId_idx" ON "Group"("creatorId")',
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "GroupMember" (
      "groupId" TEXT NOT NULL,
      "accountId" TEXT NOT NULL,
      "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("groupId", "accountId"),
      CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId")
        REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "GroupMember_accountId_fkey" FOREIGN KEY ("accountId")
        REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE INDEX "GroupMember_accountId_idx" ON "GroupMember"("accountId")',
  );

  return prisma;
}
