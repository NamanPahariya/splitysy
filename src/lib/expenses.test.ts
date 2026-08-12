import { describe, expect, it } from "vitest";

import {
  AMOUNT_NOT_POSITIVE_MESSAGE,
  DATE_IN_FUTURE_MESSAGE,
  DESCRIPTION_LENGTH_MESSAGE,
  DUPLICATE_PARTICIPANT_MESSAGE,
  EXACT_SHARES_MISMATCH_MESSAGE,
  PERCENTAGES_MISMATCH_MESSAGE,
  addParticipant,
  computeEqualShares,
  computeSharesFromPercentages,
  distributeLeftoverPaise,
  rupeesToCents,
  todayAsDateInput,
  validateDescription,
  validateExactShares,
  validateExpenseDate,
  validatePercentages,
  validateTotalCents,
} from "./expenses";

describe("validateDescription", () => {
  it("trims surrounding whitespace", () => {
    expect(validateDescription("  Dinner  ")).toEqual({
      ok: true,
      description: "Dinner",
    });
  });

  it("accepts exactly 1 and exactly 120 trimmed characters", () => {
    expect(validateDescription("D")).toEqual({ ok: true, description: "D" });
    expect(validateDescription("D".repeat(120))).toEqual({
      ok: true,
      description: "D".repeat(120),
    });
  });

  it("rejects a blank description", () => {
    expect(validateDescription("   ")).toEqual({
      ok: false,
      message: DESCRIPTION_LENGTH_MESSAGE,
    });
  });

  it("rejects more than 120 characters after trimming", () => {
    expect(validateDescription(`  ${"D".repeat(121)}  `)).toEqual({
      ok: false,
      message: DESCRIPTION_LENGTH_MESSAGE,
    });
  });
});

describe("todayAsDateInput", () => {
  it("returns the calendar date of now", () => {
    expect(todayAsDateInput(new Date("2026-08-12T18:30:00.000Z"))).toBe(
      "2026-08-12",
    );
  });
});

describe("validateExpenseDate", () => {
  it("accepts today", () => {
    expect(validateExpenseDate("2026-08-12", "2026-08-12")).toEqual({
      ok: true,
      date: "2026-08-12",
    });
  });

  it("accepts a past date", () => {
    expect(validateExpenseDate("2026-01-01", "2026-08-12")).toEqual({
      ok: true,
      date: "2026-01-01",
    });
  });

  it("rejects a future date", () => {
    expect(validateExpenseDate("2026-08-13", "2026-08-12")).toEqual({
      ok: false,
      message: DATE_IN_FUTURE_MESSAGE,
    });
  });
});

describe("addParticipant", () => {
  it("appends a new participant in order", () => {
    expect(addParticipant(["a", "b"], "c")).toEqual({
      ok: true,
      participantIds: ["a", "b", "c"],
    });
  });

  it("rejects a participant already included", () => {
    expect(addParticipant(["a", "b"], "b")).toEqual({
      ok: false,
      message: DUPLICATE_PARTICIPANT_MESSAGE,
    });
  });
});

describe("rupeesToCents", () => {
  it("converts a rupee amount to the nearest paisa", () => {
    expect(rupeesToCents("10.01")).toBe(1001);
    expect(rupeesToCents("10")).toBe(1000);
  });

  it("returns NaN for unparsable input", () => {
    expect(rupeesToCents("abc")).toBeNaN();
    expect(rupeesToCents("")).toBeNaN();
  });
});

describe("validateTotalCents", () => {
  it("accepts a positive integer", () => {
    expect(validateTotalCents(1234)).toEqual({ ok: true });
  });

  it.each([0, -1, -1234])("rejects %d", (totalCents) => {
    expect(validateTotalCents(totalCents)).toEqual({
      ok: false,
      message: AMOUNT_NOT_POSITIVE_MESSAGE,
    });
  });
});

describe("distributeLeftoverPaise", () => {
  it("assigns one leftover paisa at a time in array order", () => {
    expect(distributeLeftoverPaise([100, 100, 100], 2)).toEqual([
      101, 101, 100,
    ]);
  });

  it("leaves shares unchanged when there is no leftover", () => {
    expect(distributeLeftoverPaise([100, 100], 0)).toEqual([100, 100]);
  });
});

describe("computeEqualShares", () => {
  it("splits a total evenly with no remainder", () => {
    expect(computeEqualShares(300, 3)).toEqual([100, 100, 100]);
  });

  it("distributes leftover paise in participant order", () => {
    expect(computeEqualShares(100, 3)).toEqual([34, 33, 33]);
  });

  it("never loses or adds a paisa across participant counts", () => {
    for (let participantCount = 1; participantCount <= 7; participantCount += 1) {
      const shares = computeEqualShares(1999, participantCount);
      expect(shares.reduce((total, share) => total + share, 0)).toBe(1999);
    }
  });
});

describe("validateExactShares", () => {
  it("accepts shares that sum exactly to the total", () => {
    expect(validateExactShares(300, [100, 200])).toEqual({ ok: true });
  });

  it("accepts a zero share", () => {
    expect(validateExactShares(300, [300, 0])).toEqual({ ok: true });
  });

  it("rejects a negative share", () => {
    expect(validateExactShares(300, [400, -100])).toEqual({
      ok: false,
      message: AMOUNT_NOT_POSITIVE_MESSAGE,
    });
  });

  it("rejects shares that do not sum to the total", () => {
    expect(validateExactShares(300, [100, 100])).toEqual({
      ok: false,
      message: EXACT_SHARES_MISMATCH_MESSAGE,
    });
  });
});

describe("validatePercentages", () => {
  it("accepts whole percentages summing to 100", () => {
    expect(validatePercentages([50, 50])).toEqual({ ok: true });
    expect(validatePercentages([34, 33, 33])).toEqual({ ok: true });
  });

  it("rejects a negative percentage", () => {
    expect(validatePercentages([110, -10])).toEqual({
      ok: false,
      message: AMOUNT_NOT_POSITIVE_MESSAGE,
    });
  });

  it("rejects percentages that do not sum to 100", () => {
    expect(validatePercentages([50, 40])).toEqual({
      ok: false,
      message: PERCENTAGES_MISMATCH_MESSAGE,
    });
  });
});

describe("computeSharesFromPercentages", () => {
  it("computes proportional shares that sum to the total", () => {
    expect(computeSharesFromPercentages(1000, [50, 50])).toEqual([500, 500]);
  });

  it("distributes leftover paise in participant order", () => {
    expect(computeSharesFromPercentages(100, [34, 33, 33])).toEqual([
      34, 33, 33,
    ]);
    expect(computeSharesFromPercentages(10, [34, 33, 33])).toEqual([4, 3, 3]);
  });

  it("never loses or adds a paisa across participant counts", () => {
    const percentageSets = [
      [100],
      [50, 50],
      [34, 33, 33],
      [40, 30, 20, 10],
    ];
    for (const percentages of percentageSets) {
      const shares = computeSharesFromPercentages(1999, percentages);
      expect(shares.reduce((total, share) => total + share, 0)).toBe(1999);
    }
  });
});
