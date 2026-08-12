"use client";

import { useActionState } from "react";

import {
  createGroupAction,
  type GroupActionState,
} from "../app/actions/groups";

const initialState: GroupActionState = {
  message: null,
  status: "idle",
};

export function GroupCreateForm() {
  const [state, formAction, pending] = useActionState(
    createGroupAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <label className="sr-only" htmlFor="group-name">
          Group name
        </label>
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
          id="group-name"
          name="name"
          placeholder="e.g. Goa trip"
          required
          type="text"
        />
        {state.message ? (
          <p
            aria-live="polite"
            className="mt-2 text-sm text-rose-700"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}
      </div>
      <button
        className="self-start rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating…" : "Create group"}
      </button>
    </form>
  );
}
