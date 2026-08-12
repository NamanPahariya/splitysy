import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AddMemberForm } from "../../../components/add-member-form";
import { LeaveGroupForm } from "../../../components/leave-group-form";
import { SignOutForm } from "../../../components/sign-out-form";
import { getGroupForMember } from "../../../server/group-service";
import {
  SESSION_COOKIE_NAME,
  resolveSession,
} from "../../../server/session-service";

type GroupPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupPage({ params }: GroupPageProps) {
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
            href="/"
          >
            ← Your groups
          </Link>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-4xl font-bold tracking-tight">{group.name}</h1>
          <p className="mt-3 text-slate-600">
            {group.members.length}{" "}
            {group.members.length === 1 ? "member" : "members"}
          </p>

          <div className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold">Members</h2>
            <ul className="mt-4 divide-y divide-slate-200">
              {group.members.map((member) => (
                <li
                  className="flex items-start justify-between gap-4 py-4"
                  key={member.accountId}
                >
                  <div>
                    <p className="font-semibold">{member.displayName}</p>
                    <p className="mt-1 text-sm text-slate-600">{member.email}</p>
                  </div>
                  {member.accountId === session.accountId ? (
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      You
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold">Expenses</h2>
            <Link
              className="mt-3 inline-block font-semibold text-indigo-700 underline-offset-4 hover:underline"
              href={`/groups/${group.id}/expenses`}
            >
              View expenses →
            </Link>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold">Balances</h2>
            <Link
              className="mt-3 inline-block font-semibold text-indigo-700 underline-offset-4 hover:underline"
              href={`/groups/${group.id}/balances`}
            >
              View balances →
            </Link>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold">Add a member</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the email address used for their Splitsy account.
            </p>
            <AddMemberForm groupId={group.id} />
          </div>
        </section>

        <section className="mt-8 flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold">Group membership</h2>
            <p className="mt-1 text-sm text-slate-600">
              Leaving removes this group from your list.
            </p>
          </div>
          <LeaveGroupForm groupId={group.id} />
        </section>

        {group.isCreator ? (
          <section className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-6">
            <h2 className="font-bold text-rose-950">Delete this group</h2>
            <p className="mt-1 text-sm text-rose-800">
              This removes the group for every member.
            </p>
            <Link
              className="mt-4 inline-block font-semibold text-rose-800 underline underline-offset-4"
              href={`/groups/${group.id}/delete`}
            >
              Continue to delete group
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}
