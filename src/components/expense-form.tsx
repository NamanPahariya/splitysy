"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";

import {
  addParticipant,
  computeEqualShares,
  computeSharesFromPercentages,
  rupeesToCents,
} from "../lib/expenses";
import {
  recordExpenseAction,
  type ExpenseActionState,
} from "../app/actions/expenses";

const initialState: ExpenseActionState = { message: null, status: "idle" };

type Member = {
  accountId: string;
  displayName: string;
};

type SplitMode = "equal" | "exact" | "percentage";

type ExpenseFormProps = {
  groupId: string;
  members: Member[];
  today: string;
};

function formatCents(cents: number): string {
  return `₹${(cents / 100).toFixed(2)}`;
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200";
const labelClassName = "block text-sm font-medium";

export function ExpenseForm({ groupId, members, today }: ExpenseFormProps) {
  const action = recordExpenseAction.bind(null, groupId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [payerId, setPayerId] = useState(members[0]?.accountId ?? "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [totalRupees, setTotalRupees] = useState("");
  const [mode, setMode] = useState<SplitMode>("equal");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [pendingParticipantId, setPendingParticipantId] = useState(
    members[0]?.accountId ?? "",
  );
  const [participantMessage, setParticipantMessage] = useState<string | null>(
    null,
  );
  const [exactShares, setExactShares] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.accountId, member])),
    [members],
  );

  function handleAddParticipant() {
    const result = addParticipant(participantIds, pendingParticipantId);

    if (!result.ok) {
      setParticipantMessage(result.message);
      return;
    }

    setParticipantMessage(null);
    setParticipantIds(result.participantIds);
  }

  function handleRemoveParticipant(accountId: string) {
    setParticipantMessage(null);
    setParticipantIds((current) => current.filter((id) => id !== accountId));
  }

  const totalCents = rupeesToCents(totalRupees);
  const previewShares = useMemo(() => {
    if (!Number.isInteger(totalCents) || totalCents <= 0 || participantIds.length === 0) {
      return null;
    }

    if (mode === "equal") {
      return computeEqualShares(totalCents, participantIds.length);
    }

    if (mode === "exact") {
      return participantIds.map((id) => rupeesToCents(exactShares[id] ?? ""));
    }

    return computeSharesFromPercentages(
      totalCents,
      participantIds.map((id) => Number(percentages[id] ?? "")),
    );
  }, [mode, totalCents, participantIds, exactShares, percentages]);

  return (
    <form action={formAction} className="mt-6 space-y-6">
      <input name="payerId" type="hidden" value={payerId} />
      <input name="mode" type="hidden" value={mode} />
      {participantIds.map((id) => (
        <input key={id} name="participantIds" type="hidden" value={id} />
      ))}

      <div>
        <label className={labelClassName} htmlFor="expense-payer">
          Paid by
        </label>
        <select
          className={inputClassName}
          id="expense-payer"
          onChange={(event) => setPayerId(event.target.value)}
          value={payerId}
        >
          {members.map((member) => (
            <option key={member.accountId} value={member.accountId}>
              {member.displayName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClassName} htmlFor="expense-description">
          Description
        </label>
        <input
          className={inputClassName}
          id="expense-description"
          maxLength={120}
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. Dinner at the beach shack"
          required
          type="text"
          value={description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName} htmlFor="expense-date">
            Date
          </label>
          <input
            className={inputClassName}
            id="expense-date"
            max={today}
            name="date"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </div>
        <div>
          <label className={labelClassName} htmlFor="expense-total">
            Total amount (₹)
          </label>
          <input
            className={inputClassName}
            id="expense-total"
            min="0.01"
            name="totalRupees"
            onChange={(event) => setTotalRupees(event.target.value)}
            required
            step="0.01"
            type="number"
            value={totalRupees}
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="font-bold">Participants</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <select
            className={`${inputClassName} sm:flex-1`}
            onChange={(event) => setPendingParticipantId(event.target.value)}
            value={pendingParticipantId}
          >
            {members.map((member) => (
              <option key={member.accountId} value={member.accountId}>
                {member.displayName}
              </option>
            ))}
          </select>
          <button
            className="self-start rounded-xl border border-indigo-600 px-5 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={handleAddParticipant}
            type="button"
          >
            Add participant
          </button>
        </div>
        {participantMessage ? (
          <p aria-live="polite" className="mt-2 text-sm text-rose-700" role="alert">
            {participantMessage}
          </p>
        ) : null}

        {participantIds.length > 0 ? (
          <ul className="mt-4 divide-y divide-slate-200">
            {participantIds.map((id) => (
              <li
                className="flex items-center justify-between gap-4 py-3"
                key={id}
              >
                <span>{memberById.get(id)?.displayName ?? id}</span>
                <button
                  className="text-sm font-semibold text-rose-700 underline-offset-4 hover:underline"
                  onClick={() => handleRemoveParticipant(id)}
                  type="button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="font-bold">Split</h3>
        <div className="mt-3 flex gap-4">
          {(["equal", "exact", "percentage"] as SplitMode[]).map((option) => (
            <label className="flex items-center gap-2 text-sm" key={option}>
              <input
                checked={mode === option}
                name="mode-choice"
                onChange={() => setMode(option)}
                type="radio"
                value={option}
              />
              {option === "equal"
                ? "Equal shares"
                : option === "exact"
                  ? "Exact amounts"
                  : "Percentages"}
            </label>
          ))}
        </div>

        {mode !== "equal" && participantIds.length > 0 ? (
          <div className="mt-4 space-y-3">
            {participantIds.map((id) => (
              <div className="flex items-center gap-3" key={id}>
                <span className="w-32 text-sm">
                  {memberById.get(id)?.displayName ?? id}
                </span>
                {mode === "exact" ? (
                  <input
                    className={inputClassName}
                    name={`exact-${id}`}
                    onChange={(event) =>
                      setExactShares((current) => ({
                        ...current,
                        [id]: event.target.value,
                      }))
                    }
                    step="0.01"
                    type="number"
                    value={exactShares[id] ?? ""}
                  />
                ) : (
                  <input
                    className={inputClassName}
                    name={`percentage-${id}`}
                    onChange={(event) =>
                      setPercentages((current) => ({
                        ...current,
                        [id]: event.target.value,
                      }))
                    }
                    step="1"
                    type="number"
                    value={percentages[id] ?? ""}
                  />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {previewShares ? (
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="font-bold">Final shares</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {participantIds.map((id, index) => (
              <li className="flex justify-between" key={id}>
                <span>{memberById.get(id)?.displayName ?? id}</span>
                <span>{formatCents(previewShares[index])}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.message ? (
        <p aria-live="polite" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {state.message}
        </p>
      ) : null}

      <button
        className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        disabled={pending || participantIds.length === 0}
        type="submit"
      >
        {pending ? "Recording…" : "Record expense"}
      </button>
    </form>
  );
}
