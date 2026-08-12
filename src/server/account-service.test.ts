import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PrismaClient } from "../generated/prisma/client";
import { PASSWORD_LENGTH_MESSAGE } from "../lib/accounts";
import { createTestDatabase } from "../test/database";

import {
  EMAIL_IN_USE_MESSAGE,
  SIGN_IN_FAILED_MESSAGE,
  registerAccount,
  signIn,
} from "./account-service";

describe("account service", () => {
  let database: PrismaClient;

  beforeEach(async () => {
    database = await createTestDatabase();
  });

  afterEach(async () => {
    await database.$disconnect();
  });

  it("creates an account without requiring email confirmation", async () => {
    const result = await registerAccount(
      {
        displayName: "Asha",
        email: "Asha@Example.com",
        password: "abcdefghij",
      },
      database,
    );

    expect(result.ok).toBe(true);
    await expect(
      database.account.findUnique({ where: { email: "asha@example.com" } }),
    ).resolves.toMatchObject({ displayName: "Asha" });
  });

  it("rejects a short password without creating an account", async () => {
    await expect(
      registerAccount(
        { displayName: "Asha", email: "asha@example.com", password: "short" },
        database,
      ),
    ).resolves.toEqual({ ok: false, message: PASSWORD_LENGTH_MESSAGE });
    await expect(database.account.count()).resolves.toBe(0);
  });

  it("allows two accounts to share a display name", async () => {
    await registerAccount(
      { displayName: "Asha", email: "one@example.com", password: "abcdefghij" },
      database,
    );

    await expect(
      registerAccount(
        { displayName: "Asha", email: "two@example.com", password: "abcdefghij" },
        database,
      ),
    ).resolves.toMatchObject({ ok: true });
  });

  it("rejects an email already used with different capitalisation", async () => {
    await registerAccount(
      {
        displayName: "Asha",
        email: "Member@Example.com",
        password: "abcdefghij",
      },
      database,
    );

    await expect(
      registerAccount(
        {
          displayName: "Ravi",
          email: "member@example.COM",
          password: "abcdefghij",
        },
        database,
      ),
    ).resolves.toEqual({ ok: false, message: EMAIL_IN_USE_MESSAGE });
  });

  it("signs in with the correct email and password", async () => {
    const registration = await registerAccount(
      { displayName: "Asha", email: "asha@example.com", password: "abcdefghij" },
      database,
    );

    const result = await signIn(
      { email: "asha@example.com", password: "abcdefghij" },
      database,
    );

    expect(result).toEqual(registration);
  });

  it("returns the identical message for an unknown email and wrong password", async () => {
    await registerAccount(
      { displayName: "Asha", email: "asha@example.com", password: "abcdefghij" },
      database,
    );

    const unknownEmail = await signIn(
      { email: "unknown@example.com", password: "abcdefghij" },
      database,
    );
    const wrongPassword = await signIn(
      { email: "asha@example.com", password: "wrong-password" },
      database,
    );

    expect(unknownEmail).toEqual({ ok: false, message: SIGN_IN_FAILED_MESSAGE });
    expect(wrongPassword).toEqual(unknownEmail);
  });
});
