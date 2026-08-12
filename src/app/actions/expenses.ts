"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { rupeesToCents } from "../../lib/expenses";
import { recordExpense, type SplitInput } from "../../server/expense-service";
import {
  SESSION_COOKIE_NAME,
  resolveSession,
} from "../../server/session-service";

export type ExpenseActionState = {
  message: string | null;
  status: "idle" | "error";
};

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function listField(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string");
}

async function currentAccountId(): Promise<string> {
  const cookieStore = await cookies();
  const secret = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!secret) {
    redirect("/sign-in");
  }

  const session = await resolveSession(secret, new Date());

  if (!session) {
    redirect("/sign-in");
  }

  return session.accountId;
}

function parseSplit(formData: FormData, participantIds: string[]): SplitInput {
  const mode = textField(formData, "mode");

  if (mode === "exact") {
    const shareCentsByAccountId: Record<string, number> = {};
    participantIds.forEach((id) => {
      shareCentsByAccountId[id] = rupeesToCents(
        textField(formData, `exact-${id}`),
      );
    });
    return { mode: "exact", shareCentsByAccountId };
  }

  if (mode === "percentage") {
    const percentagesByAccountId: Record<string, number> = {};
    participantIds.forEach((id) => {
      percentagesByAccountId[id] = Number(
        textField(formData, `percentage-${id}`),
      );
    });
    return { mode: "percentage", percentagesByAccountId };
  }

  return { mode: "equal" };
}

export async function recordExpenseAction(
  groupId: string,
  _previousState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const accountId = await currentAccountId();
  const participantIds = listField(formData, "participantIds");

  const result = await recordExpense(
    accountId,
    groupId,
    {
      payerId: textField(formData, "payerId"),
      description: textField(formData, "description"),
      date: textField(formData, "date"),
      totalCents: rupeesToCents(textField(formData, "totalRupees")),
      participantIds,
      split: parseSplit(formData, participantIds),
    },
    new Date(),
  );

  if (!result.ok) {
    return { message: result.message, status: "error" };
  }

  revalidatePath(`/groups/${groupId}/expenses`);
  redirect(`/groups/${groupId}/expenses`);
}
