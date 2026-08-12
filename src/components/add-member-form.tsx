"use client";

import { useActionState } from "react";

import {
  addMemberAction,
  type GroupActionState,
} from "../app/actions/groups";

const initialState: GroupActionState = {
  message: null,
  status: "idle",
};

type AddMemberFormProps = {
  groupId: string;
};

export function AddMemberForm({ groupId }: AddMemberFormProps) {
  const action = addMemberAction.bind(null, groupId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-5 space-y-3">
      <div>
        <label className="block text-sm font-medium" htmlFor="member-email">
          Email address
        </label>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
          id="member-email"
          name="email"
          placeholder="member@example.com"
          required
          type="email"
        />
      </div>
      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "success"
              ? "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <button
        className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Adding…" : "Add member"}
      </button>
    </form>
  );
}
