"use client";

import { useActionState } from "react";

import {
  leaveGroupAction,
  type GroupActionState,
} from "../app/actions/groups";

const initialState: GroupActionState = {
  message: null,
  status: "idle",
};

type LeaveGroupFormProps = {
  groupId: string;
};

export function LeaveGroupForm({ groupId }: LeaveGroupFormProps) {
  const action = leaveGroupAction.bind(null, groupId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      {state.message ? (
        <p
          aria-live="polite"
          className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <button
        className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Leaving…" : "Leave group"}
      </button>
    </form>
  );
}
