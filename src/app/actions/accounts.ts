"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { registerAccount, signIn } from "../../server/account-service";
import {
  SESSION_COOKIE_NAME,
  createSession,
  resolveSession,
  signOut as revokeSession,
} from "../../server/session-service";

export type AccountActionState = {
  message: string | null;
};

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function storeSessionCookie(
  secret: string,
  expiresAt: Date,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, secret, {
    expires: expiresAt,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function signUpAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const result = await registerAccount({
    displayName: textField(formData, "displayName"),
    email: textField(formData, "email"),
    password: textField(formData, "password"),
  });

  if (!result.ok) {
    return { message: result.message };
  }

  const session = await createSession(result.accountId, new Date());
  await storeSessionCookie(session.secret, session.expiresAt);
  redirect("/");
}

export async function signInAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const result = await signIn({
    email: textField(formData, "email"),
    password: textField(formData, "password"),
  });

  if (!result.ok) {
    return { message: result.message };
  }

  const session = await createSession(result.accountId, new Date());
  await storeSessionCookie(session.secret, session.expiresAt);
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  const secret = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (secret) {
    await revokeSession(secret);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/sign-in");
}

export async function refreshSessionAction(): Promise<void> {
  const cookieStore = await cookies();
  const secret = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!secret) {
    return;
  }

  const session = await resolveSession(secret, new Date());

  if (!session) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return;
  }

  await storeSessionCookie(secret, session.expiresAt);
}
