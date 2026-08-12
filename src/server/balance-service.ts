import type { PrismaClient } from "../generated/prisma/client";
import { buildSettleUpList, computeBalances } from "../lib/balances";
import { getGroupForMember } from "./group-service";
import { prisma } from "./prisma";

export type MemberBalance = {
  accountId: string;
  displayName: string;
  balanceCents: number;
  isCurrentMember: boolean;
};

export type SettlementView = {
  from: { accountId: string; displayName: string };
  to: { accountId: string; displayName: string };
  amountCents: number;
};

export type GroupBalances = {
  members: MemberBalance[];
  settlements: SettlementView[];
};

export async function getGroupBalances(
  accountId: string,
  groupId: string,
  database: PrismaClient = prisma,
): Promise<GroupBalances | null> {
  const group = await getGroupForMember(accountId, groupId, database);

  if (!group) {
    return null;
  }

  const [currentMembers, expenses] = await Promise.all([
    database.groupMember.findMany({
      where: { groupId },
      select: { accountId: true, joinedAt: true },
    }),
    database.expense.findMany({
      where: { groupId },
      orderBy: { createdAt: "asc" },
      select: {
        payerId: true,
        totalCents: true,
        createdAt: true,
        participants: { select: { accountId: true, shareCents: true } },
      },
    }),
  ]);

  const currentMemberIds = new Set(
    currentMembers.map((member) => member.accountId),
  );
  const joinOrder: Record<string, number> = {};
  currentMembers.forEach((member) => {
    joinOrder[member.accountId] = member.joinedAt.getTime();
  });

  // A member who has since left has no GroupMember row, so there is no real
  // join time left to break ties with. The earliest expense they appear in
  // (this query is ordered oldest-first) stands in for it instead.
  for (const expense of expenses) {
    const involvedIds = [
      expense.payerId,
      ...expense.participants.map((participant) => participant.accountId),
    ];
    for (const involvedId of involvedIds) {
      if (!(involvedId in joinOrder)) {
        joinOrder[involvedId] = expense.createdAt.getTime();
      }
    }
  }

  const balances = computeBalances(
    expenses.map((expense) => ({
      payerId: expense.payerId,
      totalCents: expense.totalCents,
      participants: expense.participants,
    })),
  );

  // Every current member is shown even at zero; a member who has left is
  // only shown while they still owe or are owed something (AC-16).
  const relevantAccountIds = new Set(currentMemberIds);
  for (const [balanceAccountId, balanceCents] of Object.entries(balances)) {
    if (balanceCents !== 0) {
      relevantAccountIds.add(balanceAccountId);
    }
  }

  const accounts = await database.account.findMany({
    where: { id: { in: [...relevantAccountIds] } },
    select: { id: true, displayName: true },
  });
  const displayNameById = new Map(
    accounts.map((account) => [account.id, account.displayName]),
  );

  const members = [...relevantAccountIds]
    .map((id) => ({
      accountId: id,
      displayName: displayNameById.get(id) ?? "",
      balanceCents: balances[id] ?? 0,
      isCurrentMember: currentMemberIds.has(id),
    }))
    .sort((a, b) => (joinOrder[a.accountId] ?? 0) - (joinOrder[b.accountId] ?? 0));

  const settlements = buildSettleUpList(balances, joinOrder);

  return {
    members,
    settlements: settlements.map((settlement) => ({
      from: {
        accountId: settlement.fromAccountId,
        displayName: displayNameById.get(settlement.fromAccountId) ?? "",
      },
      to: {
        accountId: settlement.toAccountId,
        displayName: displayNameById.get(settlement.toAccountId) ?? "",
      },
      amountCents: settlement.amountCents,
    })),
  };
}
