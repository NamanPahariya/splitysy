import { describe, expect, it } from "vitest";

import {
  buildSettleUpList,
  computeBalances,
  describeBalance,
} from "./balances";

describe("computeBalances", () => {
  it("returns nothing for no expenses", () => {
    expect(computeBalances([])).toEqual({});
  });

  it("credits the payer and debits each participant", () => {
    expect(
      computeBalances([
        {
          payerId: "asha",
          totalCents: 1000,
          participants: [
            { accountId: "asha", shareCents: 400 },
            { accountId: "ravi", shareCents: 600 },
          ],
        },
      ]),
    ).toEqual({ asha: 600, ravi: -600 });
  });

  it("nets balances across multiple expenses to exactly zero", () => {
    const balances = computeBalances([
      {
        payerId: "asha",
        totalCents: 900,
        participants: [
          { accountId: "asha", shareCents: 300 },
          { accountId: "ravi", shareCents: 300 },
          { accountId: "zoe", shareCents: 300 },
        ],
      },
      {
        payerId: "ravi",
        totalCents: 600,
        participants: [
          { accountId: "ravi", shareCents: 300 },
          { accountId: "zoe", shareCents: 300 },
        ],
      },
    ]);

    const total = Object.values(balances).reduce((sum, cents) => sum + cents, 0);
    expect(total).toBe(0);
  });

  it("counts two identical expenses separately", () => {
    const expense = {
      payerId: "asha",
      totalCents: 1000,
      participants: [
        { accountId: "asha", shareCents: 500 },
        { accountId: "ravi", shareCents: 500 },
      ],
    };

    expect(computeBalances([expense, expense])).toEqual({
      asha: 1000,
      ravi: -1000,
    });
  });
});

describe("buildSettleUpList", () => {
  it("returns nothing when there is nothing to settle", () => {
    expect(buildSettleUpList({}, {})).toEqual([]);
    expect(buildSettleUpList({ asha: 0, ravi: 0 }, {})).toEqual([]);
  });

  it("settles two members with a single settlement", () => {
    expect(buildSettleUpList({ asha: 500, ravi: -500 }, {})).toEqual([
      { fromAccountId: "ravi", toAccountId: "asha", amountCents: 500 },
    ]);
  });

  it("excludes an already-settled member from the list", () => {
    const settlements = buildSettleUpList(
      { asha: 500, ravi: -500, zoe: 0 },
      {},
    );

    expect(settlements.some((s) => s.fromAccountId === "zoe" || s.toAccountId === "zoe")).toBe(
      false,
    );
  });

  it("breaks ties between equally-owed creditors by earliest join order", () => {
    const settlements = buildSettleUpList(
      { asha: 300, ravi: 300, zoe: -600 },
      { asha: 2, ravi: 1, zoe: 0 },
    );

    expect(settlements[0]).toEqual({
      fromAccountId: "zoe",
      toAccountId: "ravi",
      amountCents: 300,
    });
  });

  it("breaks a remaining tie by accountId", () => {
    const settlements = buildSettleUpList(
      { asha: 300, ravi: 300, zoe: -600 },
      { asha: 1, ravi: 1, zoe: 0 },
    );

    expect(settlements[0]).toEqual({
      fromAccountId: "zoe",
      toAccountId: "asha",
      amountCents: 300,
    });
  });

  it("brings every balance to exactly zero once every settlement is carried out", () => {
    const balances: Record<string, number> = { asha: 700, ravi: -200, zoe: -500 };
    const settlements = buildSettleUpList(balances, {});
    const finalBalances: Record<string, number> = { ...balances };

    for (const settlement of settlements) {
      finalBalances[settlement.fromAccountId] += settlement.amountCents;
      finalBalances[settlement.toAccountId] -= settlement.amountCents;
    }

    expect(Object.values(finalBalances).every((cents) => cents === 0)).toBe(
      true,
    );
  });

  it("returns the same settlements on repeated calls with the same input", () => {
    const balances = { asha: 400, ravi: 300, zoe: -700 };
    const joinOrder = { asha: 3, ravi: 1, zoe: 2 };

    expect(buildSettleUpList(balances, joinOrder)).toEqual(
      buildSettleUpList(balances, joinOrder),
    );
  });
});

describe("describeBalance", () => {
  it("describes a positive balance as owed", () => {
    expect(describeBalance(500)).toEqual({ direction: "owed", amountCents: 500 });
  });

  it("describes a negative balance as owing", () => {
    expect(describeBalance(-500)).toEqual({ direction: "owes", amountCents: 500 });
  });

  it("describes a zero balance as settled", () => {
    expect(describeBalance(0)).toEqual({ direction: "settled", amountCents: 0 });
  });
});
