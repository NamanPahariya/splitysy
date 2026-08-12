import { describe, expect, it } from "vitest";

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_LENGTH_MESSAGE,
  normalizeEmailForUniqueness,
  validatePassword,
} from "./accounts";

describe("normalizeEmailForUniqueness", () => {
  it("compares email addresses without regard to capitalisation", () => {
    expect(normalizeEmailForUniqueness("Member@Example.COM")).toBe(
      "member@example.com",
    );
  });
});

describe("validatePassword", () => {
  it.each(["", "a", "123456789"])(
    "rejects a password shorter than 10 characters: %j",
    (password) => {
      expect(validatePassword(password)).toEqual({
        ok: false,
        message: PASSWORD_LENGTH_MESSAGE,
      });
    },
  );

  it.each([
    "abcdefghij",
    "1234567890",
    "!@#$%^&*()",
    "          ",
    "🙂🙂🙂🙂🙂🙂🙂🙂🙂🙂",
  ])("accepts any combination of at least 10 characters: %j", (password) => {
    expect(validatePassword(password)).toEqual({ ok: true });
  });

  it("keeps the documented minimum at 10 characters", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(10);
  });
});
