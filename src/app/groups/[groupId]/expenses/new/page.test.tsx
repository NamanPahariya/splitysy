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
vi.mock("../../../../../server/group-service", () => ({
  getGroupForMember: mocks.getGroupForMember,
}));
vi.mock("../../../../../server/session-service", () => ({
  SESSION_COOKIE_NAME: "splitsy_session",
  resolveSession: mocks.resolveSession,
}));
vi.mock("../../../../../components/expense-form", () => ({
  ExpenseForm: ({
    groupId,
    members,
  }: {
    groupId: string;
    members: Array<{ accountId: string; displayName: string }>;
  }) => (
    <form>
      Record expense for {groupId} with {members.map((m) => m.displayName).join(", ")}
    </form>
  ),
}));

import NewExpensePage from "./page";

const navigationSignal = new Error("NEXT_NAVIGATION");

describe("new expense page", () => {
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

  it("renders the expense form with the group's current members", async () => {
    mocks.getGroupForMember.mockResolvedValue({
      id: "group-1",
      name: "Goa trip",
      isCreator: true,
      members: [
        { accountId: "account-1", displayName: "Asha", email: "asha@example.com" },
        { accountId: "account-2", displayName: "Ravi", email: "ravi@example.com" },
      ],
    });

    const html = renderToStaticMarkup(
      await NewExpensePage({
        params: Promise.resolve({ groupId: "group-1" }),
      }),
    );

    expect(html).toContain("Record expense for group-1 with Asha, Ravi");
  });

  it("returns not found for a non-member", async () => {
    mocks.getGroupForMember.mockResolvedValue(null);

    await expect(
      NewExpensePage({ params: Promise.resolve({ groupId: "group-1" }) }),
    ).rejects.toBe(navigationSignal);

    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("redirects when there is no current session", async () => {
    mocks.cookieGet.mockReturnValue(undefined);

    await expect(
      NewExpensePage({ params: Promise.resolve({ groupId: "group-1" }) }),
    ).rejects.toBe(navigationSignal);

    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
    expect(mocks.getGroupForMember).not.toHaveBeenCalled();
  });
});
