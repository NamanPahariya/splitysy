import { createHash, randomBytes } from "node:crypto";

import type { PrismaClient } from "../generated/prisma/client";
import { isSessionExpired, sessionExpiryFrom } from "../lib/sessions";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "splitsy_session";

export type CreatedSession = {
  secret: string;
  expiresAt: Date;
};

export type ResolvedSession = {
  accountId: string;
  displayName: string;
  expiresAt: Date;
};

function digestSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export async function createSession(
  accountId: string,
  now: Date,
  database: PrismaClient = prisma,
): Promise<CreatedSession> {
  const secret = randomBytes(32).toString("base64url");
  const expiresAt = sessionExpiryFrom(now);

  await database.session.create({
    data: {
      accountId,
      expiresAt,
      secretDigest: digestSecret(secret),
    },
  });

  return { secret, expiresAt };
}

export async function resolveSession(
  secret: string,
  now: Date,
  database: PrismaClient = prisma,
): Promise<ResolvedSession | null> {
  const secretDigest = digestSecret(secret);
  const session = await database.session.findUnique({
    where: { secretDigest },
    select: {
      id: true,
      accountId: true,
      expiresAt: true,
      account: { select: { displayName: true } },
    },
  });

  if (!session) {
    return null;
  }

  if (isSessionExpired(session.expiresAt, now)) {
    await database.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  const expiresAt = sessionExpiryFrom(now);
  await database.session.updateMany({
    where: { id: session.id, expiresAt: { lt: expiresAt } },
    data: { expiresAt },
  });

  return {
    accountId: session.accountId,
    displayName: session.account.displayName,
    expiresAt:
      session.expiresAt.getTime() > expiresAt.getTime()
        ? session.expiresAt
        : expiresAt,
  };
}

export async function signOut(
  secret: string,
  database: PrismaClient = prisma,
): Promise<void> {
  await database.session.deleteMany({
    where: { secretDigest: digestSecret(secret) },
  });
}
