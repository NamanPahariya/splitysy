export type ExpenseForBalance = {
  payerId: string;
  totalCents: number;
  participants: Array<{ accountId: string; shareCents: number }>;
};

export type Settlement = {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
};

export type BalanceDirection = "owed" | "owes" | "settled";

export type BalanceDescription = {
  direction: BalanceDirection;
  amountCents: number;
};

// A member's balance is everything they paid as a payer, minus everything
// they owe as a participant (see specs/000-product/spec.md). Every expense's
// total is credited once and its shares are debited once each, so the sum
// across every account this touches is always exactly zero (AC-2).
export function computeBalances(
  expenses: ExpenseForBalance[],
): Record<string, number> {
  const balances: Record<string, number> = {};

  const add = (accountId: string, deltaCents: number) => {
    balances[accountId] = (balances[accountId] ?? 0) + deltaCents;
  };

  for (const expense of expenses) {
    add(expense.payerId, expense.totalCents);
    for (const participant of expense.participants) {
      add(participant.accountId, -participant.shareCents);
    }
  }

  return balances;
}

type BalanceEntry = { accountId: string; balanceCents: number };

// Ties break on joinOrder (lower = joined/first-appeared earlier), then on
// accountId, so the result never depends on object or array iteration order.
function pickExtreme(
  entries: BalanceEntry[],
  direction: "max" | "min",
  joinOrder: Record<string, number>,
): BalanceEntry {
  return entries.reduce((best, candidate) => {
    const better =
      direction === "max"
        ? candidate.balanceCents > best.balanceCents
        : candidate.balanceCents < best.balanceCents;

    if (better) {
      return candidate;
    }

    if (candidate.balanceCents !== best.balanceCents) {
      return best;
    }

    const candidateOrder = joinOrder[candidate.accountId] ?? 0;
    const bestOrder = joinOrder[best.accountId] ?? 0;

    if (candidateOrder !== bestOrder) {
      return candidateOrder < bestOrder ? candidate : best;
    }

    return candidate.accountId < best.accountId ? candidate : best;
  });
}

// Repeatedly matches the largest creditor against the largest debtor and
// settles the smaller of the two amounts between them, until every balance
// is zero (AC-7). This is a fixed, deterministic rule (AC-8, AC-9), not an
// attempt at a provably-minimal transaction count for every possible input.
export function buildSettleUpList(
  balances: Record<string, number>,
  joinOrder: Record<string, number>,
): Settlement[] {
  const entries: BalanceEntry[] = Object.entries(balances)
    .filter(([, balanceCents]) => balanceCents !== 0)
    .map(([accountId, balanceCents]) => ({ accountId, balanceCents }));

  const settlements: Settlement[] = [];

  while (true) {
    const creditors = entries.filter((entry) => entry.balanceCents > 0);
    const debtors = entries.filter((entry) => entry.balanceCents < 0);

    if (creditors.length === 0 || debtors.length === 0) {
      break;
    }

    const creditor = pickExtreme(creditors, "max", joinOrder);
    const debtor = pickExtreme(debtors, "min", joinOrder);
    const amountCents = Math.min(creditor.balanceCents, -debtor.balanceCents);

    settlements.push({
      fromAccountId: debtor.accountId,
      toAccountId: creditor.accountId,
      amountCents,
    });

    creditor.balanceCents -= amountCents;
    debtor.balanceCents += amountCents;
  }

  return settlements;
}

export function describeBalance(balanceCents: number): BalanceDescription {
  if (balanceCents > 0) {
    return { direction: "owed", amountCents: balanceCents };
  }

  if (balanceCents < 0) {
    return { direction: "owes", amountCents: -balanceCents };
  }

  return { direction: "settled", amountCents: 0 };
}
