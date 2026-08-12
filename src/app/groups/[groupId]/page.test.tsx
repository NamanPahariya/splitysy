import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  getGroupForMember: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
  resolveSession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.cookieGet })),
}));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));
vi.mock("../../../server/group-service", () => ({
  getGroupForMember: mocks.getGroupForMember,
}));
vi.mock("../../../server/session-service", () => ({
  SESSION_COOKIE_NAME: "splitsy_session",
  resolveSession: mocks.resolveSession,
}));
vi.mock("../../../components/add-member-form", () => ({
  AddMemberForm: ({ groupId }: { groupId: string }) => (
    <form>Add member to {groupId}</form>
  ),
}));
vi.mock("../../../components/leave-group-form", () => ({
  LeaveGroupForm: ({ groupId }: { groupId: string }) => (
    <form>Leave {groupId}</form>
  ),
}));
vi.mock("../../../components/sign-out-form", () => ({
  SignOutForm: () => <button type="button">Sign out</button>,
}));

import GroupPage from "./page";

const navigationSignal = new Error("NEXT_NAVIGATION");

describe("group page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieGet.mockReturnValue({ value: "session-secret" });
    mocks.resolveSession.mockResolvedValue({
      accountId: "account-1",
      displayName: "Asha",
      expiresAt: new Date("2026-09-11T12:00:00.000Z"),
    });
    mocks.notFound.mockImplementation(() => {
      throw navigationSignal;
    });
    mocks.redirect.mockImplementation(() => {
      throw navigationSignal;
    });
  });

  it("shows the group and all current members", async () => {
    mocks.getGroupForMember.mockResolvedValue({
      id: "group-1",
      name: "Goa trip",
      isCreator: true,
      members: [
        {
          accountId: "account-1",
          displayName: "Asha",
          email: "asha@example.com",
        },
        {
          accountId: "account-2",
          displayName: "Ravi",
          email: "ravi@example.com",
        },
      ],
    });

    const html = renderToStaticMarkup(
      await GroupPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    );

    expect(html).toContain("Goa trip");
    expect(html).toContain("Asha");
    expect(html).toContain("asha@example.com");
    expect(html).toContain("Ravi");
    expect(html).toContain("ravi@example.com");
    expect(html).toContain("Add member to group-1");
    expect(html).toContain("Leave group-1");
    expect(html).toContain('href="/groups/group-1/delete"');
    expect(mocks.getGroupForMember).toHaveBeenCalledWith(
      "account-1",
      "group-1",
    );
  });

  it("does not show deletion controls to a member who is not the creator", async () => {
    mocks.getGroupForMember.mockResolvedValue({
      id: "group-1",
      name: "Goa trip",
      isCreator: false,
      members: [],
    });

    const html = renderToStaticMarkup(
      await GroupPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    );

    expect(html).not.toContain("Continue to delete group");
  });

  it("returns not found when the account is not a current member", async () => {
    mocks.getGroupForMember.mockResolvedValue(null);

    await expect(
      GroupPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    ).rejects.toBe(navigationSignal);

    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("redirects when there is no current session", async () => {
    mocks.cookieGet.mockReturnValue(undefined);

    await expect(
      GroupPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    ).rejects.toBe(navigationSignal);

    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
    expect(mocks.getGroupForMember).not.toHaveBeenCalled();
  });
});
