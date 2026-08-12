import type { PrismaClient } from "../generated/prisma/client";
import { normalizeEmailForUniqueness } from "../lib/accounts";
import {
  DELETE_CONFIRMATION_MESSAGE,
  matchesDeletionConfirmation,
  validateGroupName,
} from "../lib/groups";
import { prisma } from "./prisma";

export const NO_ACCOUNT_MESSAGE = "No account exists for that email address.";
export const ALREADY_MEMBER_MESSAGE =
  "This person is already a member of the group.";
export const GROUP_NOT_FOUND_MESSAGE = "Group not found.";
export const DELETE_NOT_ALLOWED_MESSAGE = "Only the group creator can delete it.";

export type GroupActionResult =
  | { ok: true }
  | { ok: false; message: string };

export type CreateGroupResult =
  | { ok: true; groupId: string }
  | { ok: false; message: string };

export type LeaveGroupResult =
  | { ok: true; deletedGroup: boolean }
  | { ok: false; message: string };

export type GroupSummary = {
  id: string;
  name: string;
  memberCount: number;
};

export type GroupDetails = {
  id: string;
  name: string;
  isCreator: boolean;
  members: Array<{
    accountId: string;
    displayName: string;
    email: string;
  }>;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    Reflect.get(error, "code") === "P2002"
  );
}

export async function createGroup(
  accountId: string,
  rawName: string,
  database: PrismaClient = prisma,
): Promise<CreateGroupResult> {
  const validation = validateGroupName(rawName);

  if (!validation.ok) {
    return validation;
  }

  const group = await database.group.create({
    data: {
      name: validation.name,
      creatorId: accountId,
      members: { create: { accountId } },
    },
    select: { id: true },
  });

  return { ok: true, groupId: group.id };
}

export async function listGroupsForAccount(
  accountId: string,
  database: PrismaClient = prisma,
): Promise<GroupSummary[]> {
  const groups = await database.group.findMany({
    where: { members: { some: { accountId } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      name: true,
      _count: { select: { members: true } },
    },
  });

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    memberCount: group._count.members,
  }));
}

export async function getGroupForMember(
  accountId: string,
  groupId: string,
  database: PrismaClient = prisma,
): Promise<GroupDetails | null> {
  const group = await database.group.findFirst({
    where: { id: groupId, members: { some: { accountId } } },
    select: {
      id: true,
      name: true,
      creatorId: true,
      members: {
        orderBy: [
          { account: { displayName: "asc" } },
          { account: { email: "asc" } },
        ],
        select: {
          accountId: true,
          account: { select: { displayName: true, email: true } },
        },
      },
    },
  });

  if (!group) {
    return null;
  }

  return {
    id: group.id,
    name: group.name,
    isCreator: group.creatorId === accountId,
    members: group.members.map((member) => ({
      accountId: member.accountId,
      displayName: member.account.displayName,
      email: member.account.email,
    })),
  };
}

export async function addMember(
  accountId: string,
  groupId: string,
  email: string,
  database: PrismaClient = prisma,
): Promise<GroupActionResult> {
  return database.$transaction(async (transaction) => {
    const currentMembership = await transaction.groupMember.findUnique({
      where: { groupId_accountId: { groupId, accountId } },
      select: { groupId: true },
    });

    if (!currentMembership) {
      return { ok: false, message: GROUP_NOT_FOUND_MESSAGE };
    }

    const account = await transaction.account.findUnique({
      where: { email: normalizeEmailForUniqueness(email) },
      select: { id: true },
    });

    if (!account) {
      return { ok: false, message: NO_ACCOUNT_MESSAGE };
    }

    const existingMembership = await transaction.groupMember.findUnique({
      where: { groupId_accountId: { groupId, accountId: account.id } },
      select: { groupId: true },
    });

    if (existingMembership) {
      return { ok: false, message: ALREADY_MEMBER_MESSAGE };
    }

    try {
      await transaction.groupMember.create({
        data: { groupId, accountId: account.id },
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        return { ok: false, message: ALREADY_MEMBER_MESSAGE };
      }

      throw error;
    }

    return { ok: true };
  });
}

export async function leaveGroup(
  accountId: string,
  groupId: string,
  database: PrismaClient = prisma,
): Promise<LeaveGroupResult> {
  return database.$transaction(async (transaction) => {
    const group = await transaction.group.findFirst({
      where: { id: groupId, members: { some: { accountId } } },
      select: { _count: { select: { members: true } } },
    });

    if (!group) {
      return { ok: false, message: GROUP_NOT_FOUND_MESSAGE };
    }

    if (group._count.members === 1) {
      await transaction.group.delete({ where: { id: groupId } });
      return { ok: true, deletedGroup: true };
    }

    await transaction.groupMember.delete({
      where: { groupId_accountId: { groupId, accountId } },
    });
    return { ok: true, deletedGroup: false };
  });
}

export async function deleteGroup(
  accountId: string,
  groupId: string,
  confirmation: string,
  database: PrismaClient = prisma,
): Promise<GroupActionResult> {
  const group = await database.group.findFirst({
    where: { id: groupId, members: { some: { accountId } } },
    select: { name: true, creatorId: true },
  });

  if (!group) {
    return { ok: false, message: GROUP_NOT_FOUND_MESSAGE };
  }

  if (group.creatorId !== accountId) {
    return { ok: false, message: DELETE_NOT_ALLOWED_MESSAGE };
  }

  if (!matchesDeletionConfirmation(group.name, confirmation)) {
    return { ok: false, message: DELETE_CONFIRMATION_MESSAGE };
  }

  await database.group.delete({ where: { id: groupId } });
  return { ok: true };
}
