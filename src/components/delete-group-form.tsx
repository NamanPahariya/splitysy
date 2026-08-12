"use client";

import { useActionState } from "react";

import {
  deleteGroupAction,
  type GroupActionState,
} from "../app/actions/groups";

const initialState: GroupActionState = {
  message: null,
  status: "idle",
};

type DeleteGroupFormProps = {
  groupId: string;
  groupName: string;
};

export function DeleteGroupForm({
  groupId,
  groupName,
}: DeleteGroupFormProps) {
  const action = deleteGroupAction.bind(null, groupId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium" htmlFor="confirmation">
          Enter <span className="font-bold">{groupName}</span> to confirm
        </label>
        <input
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-200"
          id="confirmation"
          name="confirmation"
          required
          type="text"
        />
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
        className="rounded-xl bg-rose-700 px-5 py-3 font-semibold text-white transition hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Deleting…" : "Delete group for everyone"}
      </button>
    </form>
  );
}
