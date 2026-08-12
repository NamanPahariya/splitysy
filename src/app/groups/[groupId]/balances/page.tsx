import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { describeBalance } from "../../../../lib/balances";
import { SignOutForm } from "../../../../components/sign-out-form";
import { getGroupBalances } from "../../../../server/balance-service";
import { getGroupForMember } from "../../../../server/group-service";
import {
  SESSION_COOKIE_NAME,
  resolveSession,
} from "../../../../server/session-service";

type BalancesPageProps = {
  params: Promise<{ groupId: string }>;
};

function formatCents(cents: number): string {
  return `₹${(cents / 100).toFixed(2)}`;
}

function describeBalanceText(balanceCents: number): string {
  const { direction, amountCents } = describeBalance(balanceCents);

  if (direction === "owed") {
    return `Owed ${formatCents(amountCents)}`;
  }

  if (direction === "owes") {
    return `Owes ${formatCents(amountCents)}`;
  }

  return "Settled up";
}

export default async function BalancesPage({ params }: BalancesPageProps) {
  const cookieStore = await cookies();
  const secret = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!secret) {
    redirect("/sign-in");
  }

  const session = await resolveSession(secret, new Date());

  if (!session) {
    redirect("/sign-in");
  }

  const { groupId } = await params;
  const group = await getGroupForMember(session.accountId, groupId);

  if (!group) {
    notFound();
  }

  const balances = await getGroupBalances(session.accountId, groupId);
  const myBalance = balances?.members.find(
    (member) => member.accountId === session.accountId,
  );

  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="text-lg font-bold tracking-tight text-indigo-700"
            href="/"
          >
            Splitsy
          </Link>
          <SignOutForm />
        </header>

        <div className="mt-10">
          <Link
            className="text-sm font-semibold text-indigo-700 underline-offset-4 hover:underline"
            href={`/groups/${groupId}`}
          >
            ← {group.name}
          </Link>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-4xl font-bold tracking-tight">Balances</h1>

          <div className="mt-6 rounded-2xl bg-indigo-50 p-6">
            <p className="text-sm font-semibold text-indigo-700">
              Your balance
            </p>
            <p className="mt-1 text-2xl font-bold">
              {myBalance ? describeBalanceText(myBalance.balanceCents) : "Settled up"}
            </p>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold">Every member</h2>
            <ul className="mt-4 divide-y divide-slate-200">
              {balances?.members.map((member) => (
                <li
                  className="flex items-center justify-between gap-4 py-3"
                  key={member.accountId}
                >
                  <span>
                    {member.displayName}
                    {!member.isCurrentMember ? (
                      <span className="ml-2 text-xs text-slate-500">
                        (left the group)
                      </span>
                    ) : null}
                  </span>
                  <span>{describeBalanceText(member.balanceCents)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold">Settle up</h2>
            {!balances || balances.settlements.length === 0 ? (
              <p className="mt-3 text-slate-600">No settlements are needed.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {balances.settlements.map((settlement, index) => (
                  <li
                    className="rounded-xl bg-slate-50 px-4 py-3 text-sm"
                    key={`${settlement.from.accountId}-${settlement.to.accountId}-${index}`}
                  >
                    <span className="font-semibold">
                      {settlement.from.displayName}
                    </span>{" "}
                    pays{" "}
                    <span className="font-semibold">
                      {settlement.to.displayName}
                    </span>{" "}
                    {formatCents(settlement.amountCents)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
