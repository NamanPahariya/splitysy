import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SignOutForm } from "../components/sign-out-form";
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4">
          <p className="text-lg font-bold tracking-tight text-indigo-700">
            Splitsy
          </p>
          <SignOutForm />
        </header>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <p className="text-sm font-semibold text-indigo-700">Your account</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Welcome, {session.displayName}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Your groups, expenses, balances, and settlements will appear here.
          </p>
        </section>
      </div>
    </main>
  );
}
