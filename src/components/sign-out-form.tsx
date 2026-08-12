"use client";

import { useEffect } from "react";

import {
  refreshSessionAction,
  signOutAction,
} from "../app/actions/accounts";

export function SignOutForm() {
  useEffect(() => {
    void refreshSessionAction();
  }, []);

  return (
    <form action={signOutAction}>
      <button
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
