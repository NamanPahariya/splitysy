import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GroupCreateForm } from "../components/group-create-form";
import { SignOutForm } from "../components/sign-out-form";
import { listGroupsForAccount } from "../server/group-service";
import {
  SESSION_COOKIE_NAME,
  resolveSession,
} from "../server/session-service";

export default async function Home() {
  const cookieStore = await cookies();
  const secret = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!secret) {
    redirect("/sign-in");
  }

  const session = await resolveSession(secret, new Date());

  if (!session) {
    redirect("/sign-in");
  }

  const groups = await listGroupsForAccount(session.accountId);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4">
          <p className="text-lg font-bold tracking-tight text-indigo-700">
            Splitsy
          </p>
          <SignOutForm />
        </header>

        <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <p className="text-sm font-semibold text-indigo-700">
            Welcome, {session.displayName}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Your groups</h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Create a group for the people you share costs with.
          </p>
          <GroupCreateForm />
        </section>

        <section aria-labelledby="group-list-heading" className="mt-8">
          <h2 className="sr-only" id="group-list-heading">
            Groups you belong to
          </h2>
          {groups.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-semibold">You do not belong to any groups yet.</p>
              <p className="mt-2 text-sm text-slate-600">
                Create your first group above to get started.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {groups.map((group) => (
                <li key={group.id}>
                  <Link
                    className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    href={`/groups/${group.id}`}
                  >
                    <h2 className="text-xl font-bold tracking-tight">
                      {group.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
