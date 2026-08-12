import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PrismaClient } from "../generated/prisma/client";
import { createTestDatabase } from "../test/database";
import { createSession, resolveSession, signOut } from "./session-service";

describe("session service", () => {
  let database: PrismaClient;
  let accountId: string;

  beforeEach(async () => {
    database = await createTestDatabase();
    const account = await database.account.create({
      data: {
        displayName: "Asha",
        email: "asha@example.com",
        passwordDigest: "protected",
      },
    });
    accountId = account.id;
  });

  afterEach(async () => {
    await database.$disconnect();
  });

  it("stores a digest instead of the usable session secret", async () => {
    const created = await createSession(
      accountId,
      new Date("2026-08-12T12:00:00.000Z"),
      database,
    );
    const stored = await database.session.findFirstOrThrow();

    expect(stored.secretDigest).not.toBe(created.secret);
    expect(created.expiresAt).toEqual(
      new Date("2026-09-11T12:00:00.000Z"),
    );
  });

  it("resolves an active session and rolls expiry from the latest use", async () => {
    const created = await createSession(
      accountId,
      new Date("2026-08-12T12:00:00.000Z"),
      database,
    );

    await expect(
      resolveSession(
        created.secret,
        new Date("2026-09-11T11:59:59.999Z"),
        database,
      ),
    ).resolves.toEqual({
      accountId,
      displayName: "Asha",
      expiresAt: new Date("2026-10-11T11:59:59.999Z"),
    });
  });

  it("rejects and removes a session at 30 days of inactivity", async () => {
    const created = await createSession(
      accountId,
      new Date("2026-08-12T12:00:00.000Z"),
      database,
    );

    await expect(
      resolveSession(created.secret, created.expiresAt, database),
    ).resolves.toBeNull();
    await expect(database.session.count()).resolves.toBe(0);
  });

  it("returns null for an unknown session", async () => {
    await expect(
      resolveSession("unknown", new Date(), database),
    ).resolves.toBeNull();
  });

  it("revokes a session on sign-out", async () => {
    const created = await createSession(accountId, new Date(), database);

    await signOut(created.secret, database);

    await expect(database.session.count()).resolves.toBe(0);
  });
});
