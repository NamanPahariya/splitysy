import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SignOutForm } from "../../../../components/sign-out-form";
import { listExpensesForGroup } from "../../../../server/expense-service";
import { getGroupForMember } from "../../../../server/group-service";
import {
  SESSION_COOKIE_NAME,
  resolveSession,
} from "../../../../server/session-service";

type ExpensesPageProps = {
  params: Promise<{ groupId: string }>;
};

function formatCents(cents: number): string {
  return `₹${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function ExpensesPage({ params }: ExpensesPageProps) {
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

  const expenses = await listExpensesForGroup(session.accountId, groupId);

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
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-4xl font-bold tracking-tight">Expenses</h1>
            <Link
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
              href={`/groups/${groupId}/expenses/new`}
            >
              Record expense
            </Link>
          </div>

          {!expenses || expenses.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-8 text-center">
              <p className="font-semibold">
                No expenses have been recorded yet.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Record your first expense to get started.
              </p>
            </div>
          ) : (
            <ul className="mt-8 space-y-6">
              {expenses.map((expense) => (
                <li
                  className="rounded-2xl border border-slate-200 p-6"
                  key={expense.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{expense.description}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Paid by {expense.payer.displayName} on{" "}
                        {formatDate(expense.date)}
                      </p>
                    </div>
                    <p className="text-lg font-bold">
                      {formatCents(expense.totalCents)}
                    </p>
                  </div>
                  <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200">
                    {expense.participants.map((participant) => (
                      <li
                        className="flex items-center justify-between py-2 text-sm"
                        key={participant.accountId}
                      >
                        <span>{participant.displayName}</span>
                        <span>{formatCents(participant.shareCents)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
