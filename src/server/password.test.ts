import { describe, expect, it } from "vitest";

import {
  DUMMY_PASSWORD_DIGEST,
  hashPassword,
  verifyPassword,
} from "./password";

describe("password protection", () => {
  it("verifies the password used to create a digest", async () => {
    const digest = await hashPassword("correct horse battery staple");

    await expect(
      verifyPassword("correct horse battery staple", digest),
    ).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const digest = await hashPassword("correct horse battery staple");

    await expect(verifyPassword("wrong password", digest)).resolves.toBe(
      false,
    );
  });

  it("uses a different random salt for each digest", async () => {
    const first = await hashPassword("same password");
    const second = await hashPassword("same password");

    expect(first).not.toBe(second);
  });

  it("rejects a malformed digest", async () => {
    await expect(verifyPassword("password", "not-a-digest")).resolves.toBe(
      false,
    );
  });

  it("provides a valid dummy digest for unknown accounts", async () => {
    await expect(
      verifyPassword("a password someone entered", DUMMY_PASSWORD_DIGEST),
    ).resolves.toBe(false);
  });
});
