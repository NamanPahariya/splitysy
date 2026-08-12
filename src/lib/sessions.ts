export const SESSION_INACTIVITY_DAYS = 30;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function sessionExpiryFrom(now: Date): Date {
  return new Date(
    now.getTime() + SESSION_INACTIVITY_DAYS * MILLISECONDS_PER_DAY,
  );
}

export function isSessionExpired(expiresAt: Date, now: Date): boolean {
  return now.getTime() >= expiresAt.getTime();
}
