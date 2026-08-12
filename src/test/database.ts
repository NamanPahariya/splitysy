import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is not set");
}

// Tables are created once (IF NOT EXISTS) and truncated on every call so each
// test starts from an empty schema without re-running migrations per test.
export async function createTestDatabase(): Promise<PrismaClient> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: testDatabaseUrl }),
  });

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Account" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "displayName" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "passwordDigest" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "Account_email_key" ON "Account"("email")',
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "secretDigest" TEXT NOT NULL,
      "accountId" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Session_accountId_fkey" FOREIGN KEY ("accountId")
        REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "Session_secretDigest_key" ON "Session"("secretDigest")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "Session_accountId_idx" ON "Session"("accountId")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt")',
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Group" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "creatorId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Group_creatorId_fkey" FOREIGN KEY ("creatorId")
        REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "Group_creatorId_idx" ON "Group"("creatorId")',
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GroupMember" (
      "groupId" TEXT NOT NULL,
      "accountId" TEXT NOT NULL,
      "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("groupId", "accountId"),
      CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId")
        REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "GroupMember_accountId_fkey" FOREIGN KEY ("accountId")
        REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "GroupMember_accountId_idx" ON "GroupMember"("accountId")',
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Expense" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "groupId" TEXT NOT NULL,
      "payerId" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "totalCents" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Expense_groupId_fkey" FOREIGN KEY ("groupId")
        REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Expense_payerId_fkey" FOREIGN KEY ("payerId")
        REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "Expense_groupId_idx" ON "Expense"("groupId")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "Expense_payerId_idx" ON "Expense"("payerId")',
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ExpenseParticipant" (
      "expenseId" TEXT NOT NULL,
      "accountId" TEXT NOT NULL,
      "position" INTEGER NOT NULL,
      "shareCents" INTEGER NOT NULL,
      PRIMARY KEY ("expenseId", "accountId"),
      CONSTRAINT "ExpenseParticipant_expenseId_fkey" FOREIGN KEY ("expenseId")
        REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ExpenseParticipant_accountId_fkey" FOREIGN KEY ("accountId")
        REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "ExpenseParticipant_accountId_idx" ON "ExpenseParticipant"("accountId")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseParticipant_expenseId_position_key" ON "ExpenseParticipant"("expenseId", "position")',
  );

  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Account", "Session", "Group", "GroupMember", "Expense", "ExpenseParticipant" CASCADE',
  );

  return prisma;
}
