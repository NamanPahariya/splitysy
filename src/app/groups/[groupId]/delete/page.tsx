import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DeleteGroupForm } from "../../../../components/delete-group-form";
import { getGroupForMember } from "../../../../server/group-service";
import {
  SESSION_COOKIE_NAME,
  resolveSession,
} from "../../../../server/session-service";

type DeleteGroupPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function DeleteGroupPage({
  params,
}: DeleteGroupPageProps) {
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

  if (!group || !group.isCreator) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-2xl">
        <Link
          className="text-lg font-bold tracking-tight text-indigo-700"
          href="/"
        >
          Splitsy
        </Link>

        <section className="mt-10 rounded-3xl border border-rose-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-sm font-semibold text-rose-700">Permanent action</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Delete {group.name}?
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            The group will disappear from every member’s group list. It cannot
            be restored.
          </p>
          <DeleteGroupForm groupId={group.id} groupName={group.name} />
          <Link
            className="mt-6 inline-block font-semibold text-slate-700 underline underline-offset-4"
            href={`/groups/${group.id}`}
          >
            Cancel
          </Link>
        </section>
      </div>
    </main>
  );
}
