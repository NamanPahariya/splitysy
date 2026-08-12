export const DESCRIPTION_LENGTH_MESSAGE =
  "The description must contain between 1 and 120 characters.";
export const AMOUNT_NOT_POSITIVE_MESSAGE =
  "Amounts must be greater than zero and shares cannot be negative.";
export const EXACT_SHARES_MISMATCH_MESSAGE =
  "The shares must equal the total amount.";
export const PERCENTAGES_MISMATCH_MESSAGE =
  "The percentages must total 100 percent.";
export const DATE_IN_FUTURE_MESSAGE =
  "The expense date cannot be in the future.";
export const DUPLICATE_PARTICIPANT_MESSAGE =
  "This participant is already included.";

export type ValidationResult = { ok: true } | { ok: false; message: string };

export type DescriptionResult =
  | { ok: true; description: string }
  | { ok: false; message: string };

export type DateResult =
  | { ok: true; date: string }
  | { ok: false; message: string };

export type ParticipantListResult =
  | { ok: true; participantIds: string[] }
  | { ok: false; message: string };

export function validateDescription(raw: string): DescriptionResult {
  const description = raw.trim();

  if (description.length < 1 || description.length > 120) {
    return { ok: false, message: DESCRIPTION_LENGTH_MESSAGE };
  }

  return { ok: true, description };
}

export function todayAsDateInput(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function validateExpenseDate(raw: string, today: string): DateResult {
  const date = raw.trim();

  if (date > today) {
    return { ok: false, message: DATE_IN_FUTURE_MESSAGE };
  }

  return { ok: true, date };
}

export function addParticipant(
  current: string[],
  candidateAccountId: string,
): ParticipantListResult {
  if (current.includes(candidateAccountId)) {
    return { ok: false, message: DUPLICATE_PARTICIPANT_MESSAGE };
  }

  return { ok: true, participantIds: [...current, candidateAccountId] };
}

// Invalid or missing input becomes NaN so validateTotalCents/validateExactShares
// reject it with their existing AMOUNT_NOT_POSITIVE_MESSAGE, rather than a second
// "invalid amount" message that no acceptance criterion asks for.
export function rupeesToCents(raw: string): number {
  const trimmed = raw.trim();
  const amount = trimmed === "" ? Number.NaN : Number(trimmed);
  return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
}

export function validateTotalCents(totalCents: number): ValidationResult {
  if (!Number.isInteger(totalCents) || totalCents <= 0) {
    return { ok: false, message: AMOUNT_NOT_POSITIVE_MESSAGE };
  }

  return { ok: true };
}

// Shared by equal and percentage splits: base shares are floor-divided and
// always undershoot the total by fewer paise than there are participants,
// so assigning one leftover paisa at a time in order exhausts it exactly (AC-5).
export function distributeLeftoverPaise(
  baseShareCents: number[],
  leftoverCents: number,
): number[] {
  return baseShareCents.map((share, index) =>
    index < leftoverCents ? share + 1 : share,
  );
}

export function computeEqualShares(
  totalCents: number,
  participantCount: number,
): number[] {
  const base = Math.floor(totalCents / participantCount);
  const leftover = totalCents - base * participantCount;
  return distributeLeftoverPaise(new Array(participantCount).fill(base), leftover);
}

export function validateExactShares(
  totalCents: number,
  shareCents: number[],
): ValidationResult {
  const hasNegativeShare = shareCents.some(
    (share) => !Number.isInteger(share) || share < 0,
  );

  if (hasNegativeShare) {
    return { ok: false, message: AMOUNT_NOT_POSITIVE_MESSAGE };
  }

  const sum = shareCents.reduce((total, share) => total + share, 0);

  if (sum !== totalCents) {
    return { ok: false, message: EXACT_SHARES_MISMATCH_MESSAGE };
  }

  return { ok: true };
}

export function validatePercentages(percentages: number[]): ValidationResult {
  const hasInvalidPercentage = percentages.some(
    (percentage) => !Number.isInteger(percentage) || percentage < 0,
  );

  if (hasInvalidPercentage) {
    return { ok: false, message: AMOUNT_NOT_POSITIVE_MESSAGE };
  }

  const sum = percentages.reduce((total, percentage) => total + percentage, 0);

  if (sum !== 100) {
    return { ok: false, message: PERCENTAGES_MISMATCH_MESSAGE };
  }

  return { ok: true };
}

export function computeSharesFromPercentages(
  totalCents: number,
  percentages: number[],
): number[] {
  const base = percentages.map((percentage) =>
    Math.floor((totalCents * percentage) / 100),
  );
  const leftover = totalCents - base.reduce((total, share) => total + share, 0);
  return distributeLeftoverPaise(base, leftover);
}
