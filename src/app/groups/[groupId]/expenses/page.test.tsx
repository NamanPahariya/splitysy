import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  getGroupForMember: vi.fn(),
  listExpensesForGroup: vi.fn(),
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
vi.mock("../../../../server/expense-service", () => ({
  listExpensesForGroup: mocks.listExpensesForGroup,
}));
vi.mock("../../../../server/group-service", () => ({
  getGroupForMember: mocks.getGroupForMember,
}));
vi.mock("../../../../server/session-service", () => ({
  SESSION_COOKIE_NAME: "splitsy_session",
  resolveSession: mocks.resolveSession,
}));
vi.mock("../../../../components/sign-out-form", () => ({
  SignOutForm: () => <button type="button">Sign out</button>,
}));

import ExpensesPage from "./page";

const navigationSignal = new Error("NEXT_NAVIGATION");

describe("expenses page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieGet.mockReturnValue({ value: "session-secret" });
    mocks.resolveSession.mockResolvedValue({
      accountId: "account-1",
      displayName: "Asha",
      expiresAt: new Date("2026-09-11T12:00:00.000Z"),
    });
    mocks.getGroupForMember.mockResolvedValue({
      id: "group-1",
      name: "Goa trip",
      isCreator: true,
      members: [],
    });
    mocks.notFound.mockImplementation(() => {
      throw navigationSignal;
    });
    mocks.redirect.mockImplementation(() => {
      throw navigationSignal;
    });
  });

  it("shows every recorded expense with its payer, date, total, and shares", async () => {
    mocks.listExpensesForGroup.mockResolvedValue([
      {
        id: "expense-1",
        payer: { accountId: "account-1", displayName: "Asha" },
        description: "Dinner",
        date: new Date("2026-08-10T00:00:00.000Z"),
        totalCents: 1001,
        participants: [
          { accountId: "account-1", displayName: "Asha", shareCents: 501 },
          { accountId: "account-2", displayName: "Ravi", shareCents: 500 },
        ],
      },
    ]);

    const html = renderToStaticMarkup(
      await ExpensesPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    );

    expect(html).toContain("Dinner");
    expect(html).toContain("Asha");
    expect(html).toContain("2026-08-10");
    expect(html).toContain("₹10.01");
    expect(html).toContain("₹5.01");
    expect(html).toContain("₹5.00");
    expect(html).toContain("Ravi");
  });

  it("shows the empty state with a link to record an expense", async () => {
    mocks.listExpensesForGroup.mockResolvedValue([]);

    const html = renderToStaticMarkup(
      await ExpensesPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    );

    expect(html).toContain("No expenses have been recorded yet.");
    expect(html).toContain('href="/groups/group-1/expenses/new"');
  });

  it("returns not found for a non-member", async () => {
    mocks.getGroupForMember.mockResolvedValue(null);

    await expect(
      ExpensesPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    ).rejects.toBe(navigationSignal);

    expect(mocks.notFound).toHaveBeenCalledOnce();
    expect(mocks.listExpensesForGroup).not.toHaveBeenCalled();
  });

  it("redirects when there is no current session", async () => {
    mocks.cookieGet.mockReturnValue(undefined);

    await expect(
      ExpensesPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    ).rejects.toBe(navigationSignal);

    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
    expect(mocks.getGroupForMember).not.toHaveBeenCalled();
  });
});
