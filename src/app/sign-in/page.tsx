import type { Metadata } from "next";

import { signInAction } from "../actions/accounts";
import { AccountForm } from "../../components/account-form";

export const metadata: Metadata = {
  title: "Sign in | Splitsy",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-700">
          Splitsy
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-3 text-slate-600">
          Sign in to see your groups, expenses, balances, and settlements.
        </p>
        <AccountForm action={signInAction} mode="sign-in" />
      </section>
    </main>
  );
}
