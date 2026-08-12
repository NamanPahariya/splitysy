import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addMember: vi.fn(),
  cookieGet: vi.fn(),
  createGroup: vi.fn(),
  deleteGroup: vi.fn(),
  leaveGroup: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  resolveSession: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.cookieGet })),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../../server/group-service", () => ({
  addMember: mocks.addMember,
  createGroup: mocks.createGroup,
  deleteGroup: mocks.deleteGroup,
  leaveGroup: mocks.leaveGroup,
}));
vi.mock("../../server/session-service", () => ({
  SESSION_COOKIE_NAME: "splitsy_session",
  resolveSession: mocks.resolveSession,
}));

import {
  addMemberAction,
  createGroupAction,
  deleteGroupAction,
  leaveGroupAction,
} from "./groups";

const initialState = { message: null, status: "idle" as const };
const redirectSignal = new Error("NEXT_REDIRECT");

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  Object.entries(fields).forEach(([name, value]) => data.set(name, value));
  return data;
}

describe("group actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieGet.mockReturnValue({ value: "session-secret" });
    mocks.resolveSession.mockResolvedValue({
      accountId: "account-1",
      displayName: "Asha",
      expiresAt: new Date("2026-09-11T12:00:00.000Z"),
    });
    mocks.redirect.mockImplementation(() => {
      throw redirectSignal;
    });
  });

  it("creates a group for the current account and redirects to it", async () => {
    mocks.createGroup.mockResolvedValue({ ok: true, groupId: "group-1" });

    await expect(
      createGroupAction(initialState, formData({ name: "Goa trip" })),
    ).rejects.toBe(redirectSignal);

    expect(mocks.createGroup).toHaveBeenCalledWith("account-1", "Goa trip");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.redirect).toHaveBeenCalledWith("/groups/group-1");
  });

  it("returns group-name validation errors", async () => {
    mocks.createGroup.mockResolvedValue({
      ok: false,
      message: "A group name is required.",
    });

    await expect(
      createGroupAction(initialState, formData({ name: "   " })),
    ).resolves.toEqual({
      message: "A group name is required.",
      status: "error",
    });
  });

  it("requires a current session before creating a group", async () => {
    mocks.cookieGet.mockReturnValue(undefined);

    await expect(
      createGroupAction(initialState, formData({ name: "Goa trip" })),
    ).rejects.toBe(redirectSignal);

    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
    expect(mocks.createGroup).not.toHaveBeenCalled();
  });

  it("requires a valid session before changing a group", async () => {
    mocks.resolveSession.mockResolvedValue(null);

    await expect(
      addMemberAction(
        "group-1",
        initialState,
        formData({ email: "member@example.com" }),
      ),
    ).rejects.toBe(redirectSignal);

    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
    expect(mocks.addMember).not.toHaveBeenCalled();
  });

  it("adds a member and revalidates the group views", async () => {
    mocks.addMember.mockResolvedValue({ ok: true });

    await expect(
      addMemberAction(
        "group-1",
        initialState,
        formData({ email: "Member@Example.com" }),
      ),
    ).resolves.toEqual({ message: "Member added.", status: "success" });

    expect(mocks.addMember).toHaveBeenCalledWith(
      "account-1",
      "group-1",
      "Member@Example.com",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/groups/group-1");
  });

  it("returns an add-member error", async () => {
    mocks.addMember.mockResolvedValue({
      ok: false,
      message: "No account exists for that email address.",
    });

    await expect(
      addMemberAction(
        "group-1",
        initialState,
        formData({ email: "unknown@example.com" }),
      ),
    ).resolves.toEqual({
      message: "No account exists for that email address.",
      status: "error",
    });
  });

  it("leaves a group and returns to the group list", async () => {
    mocks.leaveGroup.mockResolvedValue({ ok: true, deletedGroup: false });

    await expect(
      leaveGroupAction("group-1", initialState, new FormData()),
    ).rejects.toBe(redirectSignal);

    expect(mocks.leaveGroup).toHaveBeenCalledWith("account-1", "group-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("returns a leave-group error", async () => {
    mocks.leaveGroup.mockResolvedValue({
      ok: false,
      message: "Group not found.",
    });

    await expect(
      leaveGroupAction("group-1", initialState, new FormData()),
    ).resolves.toEqual({ message: "Group not found.", status: "error" });
  });

  it("deletes a group after exact confirmation and returns home", async () => {
    mocks.deleteGroup.mockResolvedValue({ ok: true });

    await expect(
      deleteGroupAction(
        "group-1",
        initialState,
        formData({ confirmation: "Goa trip" }),
      ),
    ).rejects.toBe(redirectSignal);

    expect(mocks.deleteGroup).toHaveBeenCalledWith(
      "account-1",
      "group-1",
      "Goa trip",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("returns a delete-group error", async () => {
    mocks.deleteGroup.mockResolvedValue({
      ok: false,
      message: "Enter the group name exactly to confirm deletion.",
    });

    await expect(
      deleteGroupAction(
        "group-1",
        initialState,
        formData({ confirmation: "goa trip" }),
      ),
    ).resolves.toEqual({
      message: "Enter the group name exactly to confirm deletion.",
      status: "error",
    });
  });
});
