import type { PrismaClient } from "../generated/prisma/client";
import {
  computeEqualShares,
  computeSharesFromPercentages,
  todayAsDateInput,
  validateDescription,
  validateExactShares,
  validateExpenseDate,
  validatePercentages,
  validateTotalCents,
} from "../lib/expenses";
import { getGroupForMember } from "./group-service";
import { prisma } from "./prisma";

export const GROUP_NOT_FOUND_MESSAGE = "Group not found.";
export const NOT_A_MEMBER_MESSAGE = "Choose a current group member.";
export const NO_PARTICIPANTS_MESSAGE = "Choose at least one participant.";

export type SplitInput =
  | { mode: "equal" }
  | { mode: "exact"; shareCentsByAccountId: Record<string, number> }
  | { mode: "percentage"; percentagesByAccountId: Record<string, number> };

export type RecordExpenseInput = {
  payerId: string;
  description: string;
  date: string;
  totalCents: number;
  participantIds: string[];
  split: SplitInput;
};

export type RecordExpenseResult =
  | { ok: true; expenseId: string }
  | { ok: false; message: string };

export type ExpenseParticipantShare = {
  accountId: string;
  displayName: string;
  shareCents: number;
};

export type ExpenseSummary = {
  id: string;
  payer: { accountId: string; displayName: string };
  description: string;
  date: Date;
  totalCents: number;
  participants: ExpenseParticipantShare[];
};

export async function recordExpense(
  accountId: string,
  groupId: string,
  input: RecordExpenseInput,
  now: Date,
  database: PrismaClient = prisma,
): Promise<RecordExpenseResult> {
  const group = await getGroupForMember(accountId, groupId, database);

  if (!group) {
    return { ok: false, message: GROUP_NOT_FOUND_MESSAGE };
  }

  const memberIds = new Set(group.members.map((member) => member.accountId));
  const participantIds = [...new Set(input.participantIds)];

  if (participantIds.length === 0) {
    return { ok: false, message: NO_PARTICIPANTS_MESSAGE };
  }

  const everyChosenAccountIsCurrent = [input.payerId, ...participantIds].every(
    (id) => memberIds.has(id),
  );

  if (!everyChosenAccountIsCurrent) {
    return { ok: false, message: NOT_A_MEMBER_MESSAGE };
  }

  const description = validateDescription(input.description);
  if (!description.ok) {
    return description;
  }

  const totalAmount = validateTotalCents(input.totalCents);
  if (!totalAmount.ok) {
    return totalAmount;
  }

  const date = validateExpenseDate(input.date, todayAsDateInput(now));
  if (!date.ok) {
    return date;
  }

  const split = input.split;
  let shareCents: number[];

  if (split.mode === "equal") {
    shareCents = computeEqualShares(input.totalCents, participantIds.length);
  } else if (split.mode === "exact") {
    const enteredShares = participantIds.map(
      (id) => split.shareCentsByAccountId[id] ?? Number.NaN,
    );
    const validity = validateExactShares(input.totalCents, enteredShares);
    if (!validity.ok) {
      return validity;
    }
    shareCents = enteredShares;
  } else {
    const percentages = participantIds.map(
      (id) => split.percentagesByAccountId[id] ?? Number.NaN,
    );
    const validity = validatePercentages(percentages);
    if (!validity.ok) {
      return validity;
    }
    shareCents = computeSharesFromPercentages(input.totalCents, percentages);
  }

  const expense = await database.expense.create({
    data: {
      groupId,
      payerId: input.payerId,
      description: description.description,
      date: new Date(`${date.date}T00:00:00.000Z`),
      totalCents: input.totalCents,
      participants: {
        create: participantIds.map((participantAccountId, index) => ({
          accountId: participantAccountId,
          position: index,
          shareCents: shareCents[index],
        })),
      },
    },
    select: { id: true },
  });

  return { ok: true, expenseId: expense.id };
}

export async function listExpensesForGroup(
  accountId: string,
  groupId: string,
  database: PrismaClient = prisma,
): Promise<ExpenseSummary[] | null> {
  const group = await getGroupForMember(accountId, groupId, database);

  if (!group) {
    return null;
  }

  const expenses = await database.expense.findMany({
    where: { groupId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      description: true,
      date: true,
      totalCents: true,
      payer: { select: { id: true, displayName: true } },
      participants: {
        orderBy: { position: "asc" },
        select: {
          shareCents: true,
          account: { select: { id: true, displayName: true } },
        },
      },
    },
  });

  return expenses.map((expense) => ({
    id: expense.id,
    payer: {
      accountId: expense.payer.id,
      displayName: expense.payer.displayName,
    },
    description: expense.description,
    date: expense.date,
    totalCents: expense.totalCents,
    participants: expense.participants.map((participant) => ({
      accountId: participant.account.id,
      displayName: participant.account.displayName,
      shareCents: participant.shareCents,
    })),
  }));
}
