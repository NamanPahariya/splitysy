import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieDelete: vi.fn(),
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  createSession: vi.fn(),
  redirect: vi.fn(),
  registerAccount: vi.fn(),
  resolveSession: vi.fn(),
  revokeSession: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    delete: mocks.cookieDelete,
    get: mocks.cookieGet,
    set: mocks.cookieSet,
  })),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../../server/account-service", () => ({
  registerAccount: mocks.registerAccount,
  signIn: mocks.signIn,
}));
vi.mock("../../server/session-service", () => ({
  SESSION_COOKIE_NAME: "splitsy_session",
  createSession: mocks.createSession,
  resolveSession: mocks.resolveSession,
  signOut: mocks.revokeSession,
}));

import {
  refreshSessionAction,
  signInAction,
  signOutAction,
  signUpAction,
} from "./accounts";

const redirectSignal = new Error("NEXT_REDIRECT");
const expiresAt = new Date("2026-09-11T12:00:00.000Z");
const initialState = { message: null };
const sessionCookieName = "splitsy_session";

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  Object.entries(fields).forEach(([name, value]) => data.set(name, value));
  return data;
}

describe("account actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation(() => {
      throw redirectSignal;
    });
    mocks.createSession.mockResolvedValue({
      secret: "session-secret",
      expiresAt,
    });
  });

  it("creates an account, stores its session, and redirects", async () => {
    mocks.registerAccount.mockResolvedValue({ ok: true, accountId: "account-1" });

    await expect(
      signUpAction(
        initialState,
        formData({
          displayName: "Asha",
          email: "asha@example.com",
          password: "abcdefghij",
        }),
      ),
    ).rejects.toBe(redirectSignal);

    expect(mocks.createSession).toHaveBeenCalledWith("account-1", expect.any(Date));
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      sessionCookieName,
      "session-secret",
      expect.objectContaining({
        expires: expiresAt,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      }),
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("returns a sign-up failure without creating a session", async () => {
    mocks.registerAccount.mockResolvedValue({
      ok: false,
      message: "That email address is already in use.",
    });

    await expect(
      signUpAction(
        initialState,
        formData({ email: "used@example.com", password: "abcdefghij" }),
      ),
    ).resolves.toEqual({ message: "That email address is already in use." });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("returns the generic sign-in failure without creating a session", async () => {
    mocks.signIn.mockResolvedValue({
      ok: false,
      message: "Email address or password is incorrect.",
    });

    await expect(
      signInAction(
        initialState,
        formData({ email: "unknown@example.com", password: "wrong-password" }),
      ),
    ).resolves.toEqual({
      message: "Email address or password is incorrect.",
    });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("starts a session after a successful sign-in", async () => {
    mocks.signIn.mockResolvedValue({ ok: true, accountId: "account-1" });

    await expect(
      signInAction(
        initialState,
        formData({ email: "asha@example.com", password: "abcdefghij" }),
      ),
    ).rejects.toBe(redirectSignal);
    expect(mocks.createSession).toHaveBeenCalledWith("account-1", expect.any(Date));
  });

  it("revokes the current session, clears its cookie, and redirects", async () => {
    mocks.cookieGet.mockReturnValue({ value: "session-secret" });

    await expect(signOutAction()).rejects.toBe(redirectSignal);

    expect(mocks.revokeSession).toHaveBeenCalledWith("session-secret");
    expect(mocks.cookieDelete).toHaveBeenCalledWith(sessionCookieName);
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("rolls the session cookie after authenticated use", async () => {
    mocks.cookieGet.mockReturnValue({ value: "session-secret" });
    mocks.resolveSession.mockResolvedValue({
      accountId: "account-1",
      displayName: "Asha",
      expiresAt,
    });

    await refreshSessionAction();

    expect(mocks.resolveSession).toHaveBeenCalledWith(
      "session-secret",
      expect.any(Date),
    );
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      sessionCookieName,
      "session-secret",
      expect.objectContaining({ expires: expiresAt }),
    );
  });
});
