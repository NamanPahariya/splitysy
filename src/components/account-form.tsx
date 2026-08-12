"use client";

import Link from "next/link";
import { useActionState } from "react";

type AccountActionState = {
  message: string | null;
};

type AccountAction = (
  state: AccountActionState,
  formData: FormData,
) => Promise<AccountActionState>;

type AccountFormProps = {
  action: AccountAction;
  mode: "sign-in" | "sign-up";
};

const initialState: AccountActionState = { message: null };

export function AccountForm({ action, mode }: AccountFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignUp = mode === "sign-up";

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {isSignUp ? (
        <div>
          <label className="block text-sm font-medium" htmlFor="displayName">
            Display name
          </label>
          <input
            autoComplete="name"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
            id="displayName"
            name="displayName"
            required
            type="text"
          />
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          Email address
        </label>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          aria-describedby={isSignUp ? "password-help" : undefined}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
          id="password"
          minLength={isSignUp ? 10 : undefined}
          name="password"
          required
          type="password"
        />
        {isSignUp ? (
          <p className="mt-2 text-sm text-slate-600" id="password-help">
            Use at least 10 characters. No other rules apply.
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p
          aria-live="polite"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {isSignUp ? "Already have an account?" : "New to Splitsy?"}{" "}
        <Link
          className="font-semibold text-indigo-700 underline-offset-4 hover:underline"
          href={isSignUp ? "/sign-in" : "/sign-up"}
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
