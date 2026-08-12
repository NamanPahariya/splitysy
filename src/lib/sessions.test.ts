import { describe, expect, it } from "vitest";

import {
  SESSION_INACTIVITY_DAYS,
  isSessionExpired,
  sessionExpiryFrom,
} from "./sessions";

describe("sessionExpiryFrom", () => {
  it("sets expiry to 30 days after the latest use", () => {
    const now = new Date("2026-08-12T12:00:00.000Z");

    expect(sessionExpiryFrom(now)).toEqual(
      new Date("2026-09-11T12:00:00.000Z"),
    );
    expect(SESSION_INACTIVITY_DAYS).toBe(30);
  });

  it("does not mutate the supplied date", () => {
    const now = new Date("2026-08-12T12:00:00.000Z");

    sessionExpiryFrom(now);

    expect(now).toEqual(new Date("2026-08-12T12:00:00.000Z"));
  });
});

describe("isSessionExpired", () => {
  const expiresAt = new Date("2026-09-11T12:00:00.000Z");

  it("keeps a session active immediately before its expiry", () => {
    expect(
      isSessionExpired(expiresAt, new Date("2026-09-11T11:59:59.999Z")),
    ).toBe(false);
  });

  it("expires a session at its inactivity boundary", () => {
    expect(isSessionExpired(expiresAt, expiresAt)).toBe(true);
  });

  it("expires a session after its inactivity boundary", () => {
    expect(
      isSessionExpired(expiresAt, new Date("2026-09-11T12:00:00.001Z")),
    ).toBe(true);
  });
});
