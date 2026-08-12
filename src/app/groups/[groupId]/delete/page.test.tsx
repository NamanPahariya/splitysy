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
vi.mock("../../../../server/group-service", () => ({
  getGroupForMember: mocks.getGroupForMember,
}));
vi.mock("../../../../server/session-service", () => ({
  SESSION_COOKIE_NAME: "splitsy_session",
  resolveSession: mocks.resolveSession,
}));
vi.mock("../../../../components/delete-group-form", () => ({
  DeleteGroupForm: ({
    groupId,
    groupName,
  }: {
    groupId: string;
    groupName: string;
  }) => <form>Delete {groupName} from {groupId}</form>,
}));

import DeleteGroupPage from "./page";

const navigationSignal = new Error("NEXT_NAVIGATION");

describe("delete group page", () => {
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

  it("shows exact-name confirmation to the creator", async () => {
    mocks.getGroupForMember.mockResolvedValue({
      id: "group-1",
      name: "Goa trip",
      isCreator: true,
      members: [],
    });

    const html = renderToStaticMarkup(
      await DeleteGroupPage({
        params: Promise.resolve({ groupId: "group-1" }),
      }),
    );

    expect(html).toContain("Delete Goa trip?");
    expect(html).toContain("Delete Goa trip from group-1");
    expect(html).toContain('href="/groups/group-1"');
  });

  it("returns not found to a member who is not the creator", async () => {
    mocks.getGroupForMember.mockResolvedValue({
      id: "group-1",
      name: "Goa trip",
      isCreator: false,
      members: [],
    });

    await expect(
      DeleteGroupPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    ).rejects.toBe(navigationSignal);

    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("returns not found when the group is unavailable to the account", async () => {
    mocks.getGroupForMember.mockResolvedValue(null);

    await expect(
      DeleteGroupPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    ).rejects.toBe(navigationSignal);

    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
