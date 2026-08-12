export const GROUP_NAME_REQUIRED_MESSAGE = "A group name is required.";
export const DELETE_CONFIRMATION_MESSAGE =
  "Enter the group name exactly to confirm deletion.";

export type GroupNameResult =
  | { ok: true; name: string }
  | { ok: false; message: string };

export function validateGroupName(value: string): GroupNameResult {
  const name = value.trim();

  if (!name) {
    return { ok: false, message: GROUP_NAME_REQUIRED_MESSAGE };
  }

  return { ok: true, name };
}

export function matchesDeletionConfirmation(
  groupName: string,
  confirmation: string,
): boolean {
  return groupName === confirmation;
}
