import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PrismaClient } from "../generated/prisma/client";
import {
  DELETE_CONFIRMATION_MESSAGE,
  GROUP_NAME_REQUIRED_MESSAGE,
} from "../lib/groups";
import { createTestDatabase } from "../test/database";
import {
  ALREADY_MEMBER_MESSAGE,
  DELETE_NOT_ALLOWED_MESSAGE,
  GROUP_NOT_FOUND_MESSAGE,
  NO_ACCOUNT_MESSAGE,
  addMember,
  createGroup,
  deleteGroup,
  getGroupForMember,
  leaveGroup,
  listGroupsForAccount,
} from "./group-service";

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

describe("group service", () => {
  let database: PrismaClient;
  let ashaId: string;
  let raviId: string;

  beforeEach(async () => {
    database = await createTestDatabase();
    ashaId = await createAccount(database, "Asha", "asha@example.com");
    raviId = await createAccount(database, "Ravi", "ravi@example.com");
    await createAccount(database, "Zoe", "zoe@example.com");
  });

  afterEach(async () => {
    await database.$disconnect();
  });

  it("creates a trimmed group and adds its creator as a member", async () => {
    const result = await createGroup(ashaId, "  Goa trip  ", database);

    expect(result.ok).toBe(true);
    await expect(database.group.findFirstOrThrow()).resolves.toMatchObject({
      name: "Goa trip",
      creatorId: ashaId,
    });
    await expect(database.groupMember.count()).resolves.toBe(1);
  });

  it("rejects an empty group name", async () => {
    await expect(createGroup(ashaId, "   ", database)).resolves.toEqual({
      ok: false,
      message: GROUP_NAME_REQUIRED_MESSAGE,
    });
    await expect(database.group.count()).resolves.toBe(0);
  });

  it("permits different groups to share a name", async () => {
    await createGroup(ashaId, "Flat", database);
    await createGroup(ashaId, "Flat", database);

    await expect(database.group.count()).resolves.toBe(2);
  });

  it("lists only groups the account belongs to", async () => {
    await createGroup(ashaId, "Asha group", database);
    await createGroup(raviId, "Ravi group", database);

    await expect(listGroupsForAccount(ashaId, database)).resolves.toEqual([
      expect.objectContaining({ name: "Asha group", memberCount: 1 }),
    ]);
  });

  it("adds a member using email with different capitalisation", async () => {
    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");

    await expect(
      addMember(ashaId, group.groupId, "RAVI@EXAMPLE.COM", database),
    ).resolves.toEqual({ ok: true });
    await expect(listGroupsForAccount(raviId, database)).resolves.toEqual([
      expect.objectContaining({ id: group.groupId, name: "Trip" }),
    ]);
  });

  it("returns the required message for an unknown email", async () => {
    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");

    await expect(
      addMember(ashaId, group.groupId, "nobody@example.com", database),
    ).resolves.toEqual({ ok: false, message: NO_ACCOUNT_MESSAGE });
  });

  it("does not add a duplicate member", async () => {
    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");
    await addMember(ashaId, group.groupId, "ravi@example.com", database);

    await expect(
      addMember(ashaId, group.groupId, "RAVI@example.com", database),
    ).resolves.toEqual({ ok: false, message: ALREADY_MEMBER_MESSAGE });
    await expect(database.groupMember.count()).resolves.toBe(2);
  });

  it("lets a non-creator member add another account", async () => {
    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");
    await addMember(ashaId, group.groupId, "ravi@example.com", database);

    await expect(
      addMember(raviId, group.groupId, "zoe@example.com", database),
    ).resolves.toEqual({ ok: true });
  });

  it("hides group details from non-members", async () => {
    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");

    await expect(
      getGroupForMember(raviId, group.groupId, database),
    ).resolves.toBeNull();
  });

  it("returns group details with ordered members", async () => {
    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");
    await addMember(ashaId, group.groupId, "zoe@example.com", database);
    await addMember(ashaId, group.groupId, "ravi@example.com", database);

    await expect(
      getGroupForMember(ashaId, group.groupId, database),
    ).resolves.toMatchObject({
      name: "Trip",
      isCreator: true,
      members: [
        { displayName: "Asha", email: "asha@example.com" },
        { displayName: "Ravi", email: "ravi@example.com" },
        { displayName: "Zoe", email: "zoe@example.com" },
      ],
    });
  });

  it("removes a member while keeping the group for others", async () => {
    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");
    await addMember(ashaId, group.groupId, "ravi@example.com", database);

    await expect(leaveGroup(raviId, group.groupId, database)).resolves.toEqual({
      ok: true,
      deletedGroup: false,
    });
    await expect(database.group.count()).resolves.toBe(1);
    await expect(
      getGroupForMember(raviId, group.groupId, database),
    ).resolves.toBeNull();
  });

  it("lets the creator leave and removes their continuing control", async () => {
    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");
    await addMember(ashaId, group.groupId, "ravi@example.com", database);

    await leaveGroup(ashaId, group.groupId, database);

    await expect(
      deleteGroup(ashaId, group.groupId, "Trip", database),
    ).resolves.toEqual({ ok: false, message: GROUP_NOT_FOUND_MESSAGE });
    await expect(
      getGroupForMember(raviId, group.groupId, database),
    ).resolves.toMatchObject({ name: "Trip", isCreator: false });
  });

  it("deletes the group when its final member leaves", async () => {
    const group = await createGroup(ashaId, "Solo", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");

    await expect(leaveGroup(ashaId, group.groupId, database)).resolves.toEqual({
      ok: true,
      deletedGroup: true,
    });
    await expect(database.group.count()).resolves.toBe(0);
  });

  it("prevents a non-creator member from deleting the group", async () => {
    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");
    await addMember(ashaId, group.groupId, "ravi@example.com", database);

    await expect(
      deleteGroup(raviId, group.groupId, "Trip", database),
    ).resolves.toEqual({ ok: false, message: DELETE_NOT_ALLOWED_MESSAGE });
  });

  it("requires exact typed confirmation before deletion", async () => {
    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");

    await expect(
      deleteGroup(ashaId, group.groupId, "trip", database),
    ).resolves.toEqual({ ok: false, message: DELETE_CONFIRMATION_MESSAGE });
    await expect(database.group.count()).resolves.toBe(1);
  });

  it("lets the current creator delete the group and memberships", async () => {
    const group = await createGroup(ashaId, "Trip", database);
    if (!group.ok) throw new Error("Expected group creation to succeed");
    await addMember(ashaId, group.groupId, "ravi@example.com", database);

    await expect(
      deleteGroup(ashaId, group.groupId, "Trip", database),
    ).resolves.toEqual({ ok: true });
    await expect(database.group.count()).resolves.toBe(0);
    await expect(database.groupMember.count()).resolves.toBe(0);
  });
});
