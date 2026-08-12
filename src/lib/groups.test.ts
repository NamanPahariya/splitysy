import { describe, expect, it } from "vitest";

import {
  DELETE_CONFIRMATION_MESSAGE,
  GROUP_NAME_REQUIRED_MESSAGE,
  matchesDeletionConfirmation,
  validateGroupName,
} from "./groups";

describe("validateGroupName", () => {
  it.each(["", " ", "\t\n"])("rejects an empty group name: %j", (name) => {
    expect(validateGroupName(name)).toEqual({
      ok: false,
      message: GROUP_NAME_REQUIRED_MESSAGE,
    });
  });

  it("trims surrounding whitespace", () => {
    expect(validateGroupName("  Goa trip  ")).toEqual({
      ok: true,
      name: "Goa trip",
    });
  });

  it("preserves internal whitespace", () => {
    expect(validateGroupName("Team   lunch")).toEqual({
      ok: true,
      name: "Team   lunch",
    });
  });
});

describe("matchesDeletionConfirmation", () => {
  it("accepts the exact displayed group name", () => {
    expect(matchesDeletionConfirmation("Goa trip", "Goa trip")).toBe(true);
  });

  it.each(["goa trip", " Goa trip", "Goa trip "])(
    "rejects a non-exact confirmation: %j",
    (confirmation) => {
      expect(matchesDeletionConfirmation("Goa trip", confirmation)).toBe(
        false,
      );
    },
  );

  it("provides the specified confirmation guidance", () => {
    expect(DELETE_CONFIRMATION_MESSAGE).toBe(
      "Enter the group name exactly to confirm deletion.",
    );
  });
});
