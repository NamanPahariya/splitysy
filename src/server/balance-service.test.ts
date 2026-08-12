import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PrismaClient } from "../generated/prisma/client";
import { addMember, createGroup, leaveGroup } from "./group-service";
import { createTestDatabase } from "../test/database";
import { recordExpense, type RecordExpenseInput } from "./expense-service";
import { getGroupBalances } from "./balance-service";

const NOW = new Date("2026-08-12T12:00:00.000Z");

async function createAccount(
  database: PrismaClient,
  displayName: string,
  email: string,
): Promise<string> {
  const account = await database.account.create({
    data: { displayName, email, passwordDigest: "protected" },
    select: { id: true },
  });
  return account.id;
}

function equalExpense(
  overrides: Partial<RecordExpenseInput> = {},
): RecordExpenseInput {
  return {
    payerId: "",
    description: "Dinner",
    date: "2026-08-12",
    totalCents: 1000,
    participantIds: [],
    split: { mode: "equal" },
    ...overrides,
  };
}

describe("balance service", () => {
  let database: PrismaClient;
  let ashaId: string;
  let raviId: string;
  let zoeId: string;
  let groupId: string;

  beforeEach(async () => {
    database = await createTestDatabase();
    ashaId = await createAccount(database, "Asha", "asha@example.com");
    raviId = await createAccount(database, "Ravi", "ravi@example.com");
    zoeId = await createAccount(database, "Zoe", "zoe@example.com");

    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");
    groupId = group.groupId;
    await addMember(ashaId, groupId, "ravi@example.com", database);
    await addMember(ashaId, groupId, "zoe@example.com", database);
  });

  afterEach(async () => {
    await database.$disconnect();
  });

  it("returns every current member settled up when there are no expenses", async () => {
    const balances = await getGroupBalances(ashaId, groupId, database);

    expect(balances).not.toBeNull();
    expect(balances?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ accountId: ashaId, balanceCents: 0 }),
        expect.objectContaining({ accountId: raviId, balanceCents: 0 }),
        expect.objectContaining({ accountId: zoeId, balanceCents: 0 }),
      ]),
    );
    expect(balances?.settlements).toEqual([]);
  });

  it("shows a payer's balance and a matching settlement for a single expense", async () => {
    await recordExpense(
      ashaId,
      groupId,
      equalExpense({ payerId: ashaId, participantIds: [ashaId, raviId] }),
      NOW,
      database,
    );

    const balances = await getGroupBalances(ashaId, groupId, database);

    expect(balances?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountId: ashaId,
          balanceCents: 500,
          isCurrentMember: true,
        }),
        expect.objectContaining({
          accountId: raviId,
          balanceCents: -500,
          isCurrentMember: true,
        }),
      ]),
    );
    expect(balances?.settlements).toEqual([
      {
        from: { accountId: raviId, displayName: "Ravi" },
        to: { accountId: ashaId, displayName: "Asha" },
        amountCents: 500,
      },
    ]);
  });

  it("counts two identical expenses separately", async () => {
    const input = equalExpense({
      payerId: ashaId,
      participantIds: [ashaId, raviId],
    });
    await recordExpense(ashaId, groupId, input, NOW, database);
    await recordExpense(ashaId, groupId, input, NOW, database);

    const balances = await getGroupBalances(ashaId, groupId, database);

    expect(balances?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ accountId: ashaId, balanceCents: 1000 }),
        expect.objectContaining({ accountId: raviId, balanceCents: -1000 }),
      ]),
    );
  });

  it("keeps a member who has left visible until their balance is settled", async () => {
    await recordExpense(
      ashaId,
      groupId,
      equalExpense({ payerId: ashaId, participantIds: [ashaId, raviId] }),
      NOW,
      database,
    );
    await leaveGroup(raviId, groupId, database);

    const balances = await getGroupBalances(ashaId, groupId, database);

    expect(balances?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountId: raviId,
          balanceCents: -500,
          isCurrentMember: false,
        }),
      ]),
    );
    expect(balances?.settlements).toEqual([
      expect.objectContaining({
        from: { accountId: raviId, displayName: "Ravi" },
      }),
    ]);
  });

  it("returns null for an account that does not belong to the group", async () => {
    const outsiderId = await createAccount(
      database,
      "Nikhil",
      "nikhil@example.com",
    );

    await expect(
      getGroupBalances(outsiderId, groupId, database),
    ).resolves.toBeNull();
  });

  it("breaks a tie between equally-owed creditors by who joined the group first", async () => {
    // Asha (created the group) and Ravi (added first) are tied at +200
    // each; Zoe owes both. Asha joined before Ravi, so her settlement with
    // Zoe is built first.
    await recordExpense(
      ashaId,
      groupId,
      equalExpense({
        payerId: ashaId,
        totalCents: 200,
        participantIds: [zoeId],
      }),
      NOW,
      database,
    );
    await recordExpense(
      ashaId,
      groupId,
      equalExpense({
        payerId: raviId,
        totalCents: 200,
        participantIds: [zoeId],
      }),
      NOW,
      database,
    );

    const balances = await getGroupBalances(ashaId, groupId, database);

    expect(balances?.settlements).toEqual([
      {
        from: { accountId: zoeId, displayName: "Zoe" },
        to: { accountId: ashaId, displayName: "Asha" },
        amountCents: 200,
      },
      {
        from: { accountId: zoeId, displayName: "Zoe" },
        to: { accountId: raviId, displayName: "Ravi" },
        amountCents: 200,
      },
    ]);
  });
});
