import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ExpenseForm } from "../../../../../components/expense-form";
import { todayAsDateInput } from "../../../../../lib/expenses";
import { getGroupForMember } from "../../../../../server/group-service";
import {
  SESSION_COOKIE_NAME,
  resolveSession,
} from "../../../../../server/session-service";

type NewExpensePageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function NewExpensePage({
  params,
}: NewExpensePageProps) {
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

  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-2xl">
        <div className="mt-2">
          <Link
            className="text-sm font-semibold text-indigo-700 underline-offset-4 hover:underline"
            href={`/groups/${groupId}/expenses`}
          >
            ← Expenses
          </Link>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Record an expense
          </h1>
          <ExpenseForm
            groupId={groupId}
            members={group.members.map((member) => ({
              accountId: member.accountId,
              displayName: member.displayName,
            }))}
            today={todayAsDateInput(new Date())}
          />
        </section>
      </div>
    </main>
  );
}
