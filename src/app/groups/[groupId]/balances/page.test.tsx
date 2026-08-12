import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  getGroupBalances: vi.fn(),
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
vi.mock("../../../../server/balance-service", () => ({
  getGroupBalances: mocks.getGroupBalances,
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

import BalancesPage from "./page";

const navigationSignal = new Error("NEXT_NAVIGATION");

describe("balances page", () => {
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

  it("shows the viewer's balance, every member, and the settle-up list", async () => {
    mocks.getGroupBalances.mockResolvedValue({
      members: [
        {
          accountId: "account-1",
          displayName: "Asha",
          balanceCents: 500,
          isCurrentMember: true,
        },
        {
          accountId: "account-2",
          displayName: "Ravi",
          balanceCents: -500,
          isCurrentMember: false,
        },
      ],
      settlements: [
        {
          from: { accountId: "account-2", displayName: "Ravi" },
          to: { accountId: "account-1", displayName: "Asha" },
          amountCents: 500,
        },
      ],
    });

    const html = renderToStaticMarkup(
      await BalancesPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    );

    expect(html).toContain("Owed ₹5.00");
    expect(html).toContain("Owes ₹5.00");
    expect(html).toContain("(left the group)");
    expect(html).toContain("Ravi");
    expect(html).toContain("pays");
    expect(html).toContain("Asha");
  });

  it("shows no settlements needed when every balance is zero", async () => {
    mocks.getGroupBalances.mockResolvedValue({
      members: [
        {
          accountId: "account-1",
          displayName: "Asha",
          balanceCents: 0,
          isCurrentMember: true,
        },
      ],
      settlements: [],
    });

    const html = renderToStaticMarkup(
      await BalancesPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    );

    expect(html).toContain("Settled up");
    expect(html).toContain("No settlements are needed.");
  });

  it("returns not found for a non-member", async () => {
    mocks.getGroupForMember.mockResolvedValue(null);

    await expect(
      BalancesPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    ).rejects.toBe(navigationSignal);

    expect(mocks.notFound).toHaveBeenCalledOnce();
    expect(mocks.getGroupBalances).not.toHaveBeenCalled();
  });

  it("redirects when there is no current session", async () => {
    mocks.cookieGet.mockReturnValue(undefined);

    await expect(
      BalancesPage({ params: Promise.resolve({ groupId: "group-1" }) }),
    ).rejects.toBe(navigationSignal);

    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
    expect(mocks.getGroupForMember).not.toHaveBeenCalled();
  });
});
