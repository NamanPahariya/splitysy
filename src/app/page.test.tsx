import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  listGroupsForAccount: vi.fn(),
  redirect: vi.fn(),
  resolveSession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.cookieGet })),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../server/session-service", () => ({
  SESSION_COOKIE_NAME: "splitsy_session",
  resolveSession: mocks.resolveSession,
}));
vi.mock("../server/group-service", () => ({
  listGroupsForAccount: mocks.listGroupsForAccount,
}));
vi.mock("../components/group-create-form", () => ({
  GroupCreateForm: () => <form>Create group form</form>,
}));
vi.mock("../components/sign-out-form", () => ({
  SignOutForm: () => <button type="button">Sign out</button>,
}));

import Home from "./page";

const redirectSignal = new Error("NEXT_REDIRECT");

describe("protected landing page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation(() => {
      throw redirectSignal;
    });
    mocks.listGroupsForAccount.mockResolvedValue([]);
  });

  it("shows the signed-in member and sign-out control", async () => {
    mocks.cookieGet.mockReturnValue({ value: "session-secret" });
    mocks.resolveSession.mockResolvedValue({
      accountId: "account-1",
      displayName: "Asha",
      expiresAt: new Date("2026-09-11T12:00:00.000Z"),
    });

    const html = renderToStaticMarkup(await Home());

    expect(html).toContain("Welcome, Asha");
    expect(html).toContain("Your groups");
    expect(html).toContain("Sign out");
    expect(html).toContain("You do not belong to any groups yet.");
    expect(html).toContain("Create group form");
    expect(mocks.listGroupsForAccount).toHaveBeenCalledWith("account-1");
    expect(mocks.resolveSession).toHaveBeenCalledWith(
      "session-secret",
      expect.any(Date),
    );
  });

  it("shows every group returned for the signed-in account", async () => {
    mocks.cookieGet.mockReturnValue({ value: "session-secret" });
    mocks.resolveSession.mockResolvedValue({
      accountId: "account-1",
      displayName: "Asha",
      expiresAt: new Date("2026-09-11T12:00:00.000Z"),
    });
    mocks.listGroupsForAccount.mockResolvedValue([
      { id: "group-1", name: "Goa trip", memberCount: 3 },
      { id: "group-2", name: "Flatmates", memberCount: 1 },
    ]);

    const html = renderToStaticMarkup(await Home());

    expect(html).toContain("Goa trip");
    expect(html).toContain("3 members");
    expect(html).toContain('href="/groups/group-1"');
    expect(html).toContain("Flatmates");
    expect(html).toContain("1 member");
  });

  it("redirects a visitor without a session", async () => {
    mocks.cookieGet.mockReturnValue(undefined);

    await expect(Home()).rejects.toBe(redirectSignal);
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("redirects an expired session", async () => {
    mocks.cookieGet.mockReturnValue({ value: "expired-secret" });
    mocks.resolveSession.mockResolvedValue(null);

    await expect(Home()).rejects.toBe(redirectSignal);
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
  });
});
