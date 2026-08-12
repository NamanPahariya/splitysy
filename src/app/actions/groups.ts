"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  addMember,
  createGroup,
  deleteGroup,
  leaveGroup,
} from "../../server/group-service";
import {
  SESSION_COOKIE_NAME,
  resolveSession,
} from "../../server/session-service";

export type GroupActionState = {
  message: string | null;
  status: "idle" | "error" | "success";
};

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
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

export async function createGroupAction(
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const accountId = await currentAccountId();
  const result = await createGroup(accountId, textField(formData, "name"));

  if (!result.ok) {
    return { message: result.message, status: "error" };
  }

  revalidatePath("/");
  redirect(`/groups/${result.groupId}`);
}

export async function addMemberAction(
  groupId: string,
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const accountId = await currentAccountId();
  const result = await addMember(
    accountId,
    groupId,
    textField(formData, "email"),
  );

  if (!result.ok) {
    return { message: result.message, status: "error" };
  }

  revalidatePath("/");
  revalidatePath(`/groups/${groupId}`);
  return { message: "Member added.", status: "success" };
}

export async function leaveGroupAction(
  groupId: string,
  _previousState: GroupActionState,
  _formData: FormData,
): Promise<GroupActionState> {
  void _previousState;
  void _formData;
  const accountId = await currentAccountId();
  const result = await leaveGroup(accountId, groupId);

  if (!result.ok) {
    return { message: result.message, status: "error" };
  }

  revalidatePath("/");
  revalidatePath(`/groups/${groupId}`);
  redirect("/");
}

export async function deleteGroupAction(
  groupId: string,
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const accountId = await currentAccountId();
  const result = await deleteGroup(
    accountId,
    groupId,
    textField(formData, "confirmation"),
  );

  if (!result.ok) {
    return { message: result.message, status: "error" };
  }

  revalidatePath("/");
  revalidatePath(`/groups/${groupId}`);
  redirect("/");
}
