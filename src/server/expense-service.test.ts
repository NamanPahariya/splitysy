import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PrismaClient } from "../generated/prisma/client";
import {
  AMOUNT_NOT_POSITIVE_MESSAGE,
  DATE_IN_FUTURE_MESSAGE,
  DESCRIPTION_LENGTH_MESSAGE,
  EXACT_SHARES_MISMATCH_MESSAGE,
} from "../lib/expenses";
import { addMember, createGroup } from "./group-service";
import { createTestDatabase } from "../test/database";
import {
  GROUP_NOT_FOUND_MESSAGE,
  NOT_A_MEMBER_MESSAGE,
  listExpensesForGroup,
  recordExpense,
  type RecordExpenseInput,
} from "./expense-service";

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

function baseInput(
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

describe("expense service", () => {
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
  });

  afterEach(async () => {
    await database.$disconnect();
  });

  it("records an equal-split expense with every field visible", async () => {
    const result = await recordExpense(
      ashaId,
      groupId,
      baseInput({
        payerId: ashaId,
        participantIds: [ashaId, raviId],
        totalCents: 1001,
      }),
      NOW,
      database,
    );

    expect(result.ok).toBe(true);
    const expenses = await listExpensesForGroup(ashaId, groupId, database);
    expect(expenses).toMatchObject([
      {
        payer: { accountId: ashaId, displayName: "Asha" },
        description: "Dinner",
        totalCents: 1001,
        participants: [
          { accountId: ashaId, displayName: "Asha", shareCents: 501 },
          { accountId: raviId, displayName: "Ravi", shareCents: 500 },
        ],
      },
    ]);
  });

  it("records exact shares that already sum to the total unchanged", async () => {
    const result = await recordExpense(
      ashaId,
      groupId,
      baseInput({
        payerId: ashaId,
        participantIds: [ashaId, raviId],
        totalCents: 1000,
        split: {
          mode: "exact",
          shareCentsByAccountId: { [ashaId]: 400, [raviId]: 600 },
        },
      }),
      NOW,
      database,
    );

    expect(result.ok).toBe(true);
    const expenses = await listExpensesForGroup(ashaId, groupId, database);
    expect(expenses).toMatchObject([
      {
        participants: [
          { accountId: ashaId, shareCents: 400 },
          { accountId: raviId, shareCents: 600 },
        ],
      },
    ]);
  });

  it("computes and distributes leftover paise for a percentage split", async () => {
    const result = await recordExpense(
      ashaId,
      groupId,
      baseInput({
        payerId: ashaId,
        participantIds: [ashaId, raviId],
        totalCents: 101,
        split: {
          mode: "percentage",
          percentagesByAccountId: { [ashaId]: 50, [raviId]: 50 },
        },
      }),
      NOW,
      database,
    );

    expect(result.ok).toBe(true);
    const expenses = await listExpensesForGroup(ashaId, groupId, database);
    expect(expenses).toMatchObject([
      {
        totalCents: 101,
        participants: [
          { accountId: ashaId, shareCents: 51 },
          { accountId: raviId, shareCents: 50 },
        ],
      },
    ]);
  });

  it("rejects exact shares that do not sum to the total", async () => {
    const result = await recordExpense(
      ashaId,
      groupId,
      baseInput({
        payerId: ashaId,
        participantIds: [ashaId, raviId],
        totalCents: 1000,
        split: {
          mode: "exact",
          shareCentsByAccountId: { [ashaId]: 400, [raviId]: 500 },
        },
      }),
      NOW,
      database,
    );

    expect(result).toEqual({
      ok: false,
      message: EXACT_SHARES_MISMATCH_MESSAGE,
    });
    await expect(database.expense.count()).resolves.toBe(0);
  });

  it.each([0, -100])("rejects a total of %d", async (totalCents) => {
    const result = await recordExpense(
      ashaId,
      groupId,
      baseInput({
        payerId: ashaId,
        participantIds: [ashaId, raviId],
        totalCents,
      }),
      NOW,
      database,
    );

    expect(result).toEqual({
      ok: false,
      message: AMOUNT_NOT_POSITIVE_MESSAGE,
    });
  });

  it("rejects a negative exact share", async () => {
    const result = await recordExpense(
      ashaId,
      groupId,
      baseInput({
        payerId: ashaId,
        participantIds: [ashaId, raviId],
        totalCents: 1000,
        split: {
          mode: "exact",
          shareCentsByAccountId: { [ashaId]: 1100, [raviId]: -100 },
        },
      }),
      NOW,
      database,
    );

    expect(result).toEqual({
      ok: false,
      message: AMOUNT_NOT_POSITIVE_MESSAGE,
    });
  });

  it("rejects a payer who is not a current group member", async () => {
    const result = await recordExpense(
      ashaId,
      groupId,
      baseInput({ payerId: zoeId, participantIds: [ashaId, raviId] }),
      NOW,
      database,
    );

    expect(result).toEqual({ ok: false, message: NOT_A_MEMBER_MESSAGE });
  });

  it("rejects a participant who is not a current group member", async () => {
    const result = await recordExpense(
      ashaId,
      groupId,
      baseInput({ payerId: ashaId, participantIds: [ashaId, zoeId] }),
      NOW,
      database,
    );

    expect(result).toEqual({ ok: false, message: NOT_A_MEMBER_MESSAGE });
  });

  it("accepts the payer also listed as a participant", async () => {
    const result = await recordExpense(
      ashaId,
      groupId,
      baseInput({ payerId: ashaId, participantIds: [ashaId, raviId] }),
      NOW,
      database,
    );

    expect(result.ok).toBe(true);
  });

  it("rejects a blank description", async () => {
    const result = await recordExpense(
      ashaId,
      groupId,
      baseInput({
        payerId: ashaId,
        participantIds: [ashaId],
        description: "   ",
      }),
      NOW,
      database,
    );

    expect(result).toEqual({
      ok: false,
      message: DESCRIPTION_LENGTH_MESSAGE,
    });
  });

  it("accepts today and rejects a future date", async () => {
    const today = await recordExpense(
      ashaId,
      groupId,
      baseInput({
        payerId: ashaId,
        participantIds: [ashaId],
        date: "2026-08-12",
      }),
      NOW,
      database,
    );
    expect(today.ok).toBe(true);

    const future = await recordExpense(
      ashaId,
      groupId,
      baseInput({
        payerId: ashaId,
        participantIds: [ashaId],
        date: "2026-08-13",
      }),
      NOW,
      database,
    );
    expect(future).toEqual({ ok: false, message: DATE_IN_FUTURE_MESSAGE });
  });

  it("records an identical expense again without a duplicate warning", async () => {
    const input = baseInput({ payerId: ashaId, participantIds: [ashaId, raviId] });

    await recordExpense(ashaId, groupId, input, NOW, database);
    const second = await recordExpense(ashaId, groupId, input, NOW, database);

    expect(second.ok).toBe(true);
    await expect(database.expense.count()).resolves.toBe(2);
  });

  it("rejects recording for an account that does not belong to the group", async () => {
    const result = await recordExpense(
      zoeId,
      groupId,
      baseInput({ payerId: ashaId, participantIds: [ashaId] }),
      NOW,
      database,
    );

    expect(result).toEqual({ ok: false, message: GROUP_NOT_FOUND_MESSAGE });
  });

  it("returns an empty list for a group with no expenses", async () => {
    await expect(listExpensesForGroup(ashaId, groupId, database)).resolves.toEqual(
      [],
    );
  });

  it("hides expenses from an account that does not belong to the group", async () => {
    await expect(
      listExpensesForGroup(zoeId, groupId, database),
    ).resolves.toBeNull();
  });
});
