import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  recordExpense: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  resolveSession: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.cookieGet })),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../../server/expense-service", () => ({
  recordExpense: mocks.recordExpense,
}));
vi.mock("../../server/session-service", () => ({
  SESSION_COOKIE_NAME: "splitsy_session",
  resolveSession: mocks.resolveSession,
}));

import { recordExpenseAction } from "./expenses";

const initialState = { message: null, status: "idle" as const };
const redirectSignal = new Error("NEXT_REDIRECT");

function formData(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  Object.entries(fields).forEach(([name, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => data.append(name, entry));
    } else {
      data.set(name, value);
    }
  });
  return data;
}

describe("recordExpenseAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieGet.mockReturnValue({ value: "session-secret" });
    mocks.resolveSession.mockResolvedValue({
      accountId: "account-1",
      displayName: "Asha",
      expiresAt: new Date("2026-09-11T12:00:00.000Z"),
    });
    mocks.redirect.mockImplementation(() => {
      throw redirectSignal;
    });
  });

  it("parses an equal split and redirects to the expense list", async () => {
    mocks.recordExpense.mockResolvedValue({ ok: true, expenseId: "expense-1" });

    await expect(
      recordExpenseAction(
        "group-1",
        initialState,
        formData({
          payerId: "account-1",
          description: "Dinner",
          date: "2026-08-12",
          totalRupees: "10.01",
          mode: "equal",
          participantIds: ["account-1", "account-2"],
        }),
      ),
    ).rejects.toBe(redirectSignal);

    expect(mocks.recordExpense).toHaveBeenCalledWith(
      "account-1",
      "group-1",
      {
        payerId: "account-1",
        description: "Dinner",
        date: "2026-08-12",
        totalCents: 1001,
        participantIds: ["account-1", "account-2"],
        split: { mode: "equal" },
      },
      expect.any(Date),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/groups/group-1/expenses",
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/groups/group-1/expenses");
  });

  it("parses exact shares in rupees into cents per participant", async () => {
    mocks.recordExpense.mockResolvedValue({ ok: true, expenseId: "expense-1" });

    await expect(
      recordExpenseAction(
        "group-1",
        initialState,
        formData({
          payerId: "account-1",
          description: "Dinner",
          date: "2026-08-12",
          totalRupees: "10.00",
          mode: "exact",
          participantIds: ["account-1", "account-2"],
          "exact-account-1": "4.00",
          "exact-account-2": "6.00",
        }),
      ),
    ).rejects.toBe(redirectSignal);

    expect(mocks.recordExpense).toHaveBeenCalledWith(
      "account-1",
      "group-1",
      expect.objectContaining({
        split: {
          mode: "exact",
          shareCentsByAccountId: { "account-1": 400, "account-2": 600 },
        },
      }),
      expect.any(Date),
    );
  });

  it("parses whole-number percentages per participant", async () => {
    mocks.recordExpense.mockResolvedValue({ ok: true, expenseId: "expense-1" });

    await expect(
      recordExpenseAction(
        "group-1",
        initialState,
        formData({
          payerId: "account-1",
          description: "Dinner",
          date: "2026-08-12",
          totalRupees: "10.00",
          mode: "percentage",
          participantIds: ["account-1", "account-2"],
          "percentage-account-1": "40",
          "percentage-account-2": "60",
        }),
      ),
    ).rejects.toBe(redirectSignal);

    expect(mocks.recordExpense).toHaveBeenCalledWith(
      "account-1",
      "group-1",
      expect.objectContaining({
        split: {
          mode: "percentage",
          percentagesByAccountId: { "account-1": 40, "account-2": 60 },
        },
      }),
      expect.any(Date),
    );
  });

  it("returns a validation error without redirecting", async () => {
    mocks.recordExpense.mockResolvedValue({
      ok: false,
      message: "The shares must equal the total amount.",
    });

    await expect(
      recordExpenseAction(
        "group-1",
        initialState,
        formData({
          payerId: "account-1",
          description: "Dinner",
          date: "2026-08-12",
          totalRupees: "10.00",
          mode: "exact",
          participantIds: ["account-1"],
          "exact-account-1": "5.00",
        }),
      ),
    ).resolves.toEqual({
      message: "The shares must equal the total amount.",
      status: "error",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("requires a current session before recording an expense", async () => {
    mocks.cookieGet.mockReturnValue(undefined);

    await expect(
      recordExpenseAction("group-1", initialState, formData({})),
    ).rejects.toBe(redirectSignal);

    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
    expect(mocks.recordExpense).not.toHaveBeenCalled();
  });
});
