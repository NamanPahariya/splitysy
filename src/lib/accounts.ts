export const MIN_PASSWORD_LENGTH = 10;
export const PASSWORD_LENGTH_MESSAGE =
  "Password must be at least 10 characters long.";

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function normalizeEmailForUniqueness(email: string): string {
  return email.toLowerCase();
}

export function validatePassword(password: string): ValidationResult {
  if ([...password].length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: PASSWORD_LENGTH_MESSAGE };
  }

  return { ok: true };
}
