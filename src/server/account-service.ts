import type { PrismaClient } from "../generated/prisma/client";
import {
  normalizeEmailForUniqueness,
  validatePassword,
} from "../lib/accounts";
import { prisma } from "./prisma";

import {
  DUMMY_PASSWORD_DIGEST,
  hashPassword,
  verifyPassword,
} from "./password";

export const EMAIL_IN_USE_MESSAGE = "That email address is already in use.";
export const SIGN_IN_FAILED_MESSAGE = "Email address or password is incorrect.";

export type AccountResult =
  | { ok: true; accountId: string }
  | { ok: false; message: string };

type AccountInput = {
  displayName: string;
  email: string;
  password: string;
};

type SignInInput = {
  email: string;
  password: string;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    Reflect.get(error, "code") === "P2002"
  );
}

export async function registerAccount(
  input: AccountInput,
  database: PrismaClient = prisma,
): Promise<AccountResult> {
  const passwordValidation = validatePassword(input.password);

  if (!passwordValidation.ok) {
    return passwordValidation;
  }

  const passwordDigest = await hashPassword(input.password);

  try {
    const account = await database.account.create({
      data: {
        displayName: input.displayName,
        email: normalizeEmailForUniqueness(input.email),
        passwordDigest,
      },
      select: { id: true },
    });

    return { ok: true, accountId: account.id };
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, message: EMAIL_IN_USE_MESSAGE };
    }

    throw error;
  }
}

export async function signIn(
  input: SignInInput,
  database: PrismaClient = prisma,
): Promise<AccountResult> {
  const account = await database.account.findUnique({
    where: { email: normalizeEmailForUniqueness(input.email) },
    select: { id: true, passwordDigest: true },
  });
  const passwordMatches = await verifyPassword(
    input.password,
    account?.passwordDigest ?? DUMMY_PASSWORD_DIGEST,
  );

  if (!account || !passwordMatches) {
    return { ok: false, message: SIGN_IN_FAILED_MESSAGE };
  }

  return { ok: true, accountId: account.id };
}
