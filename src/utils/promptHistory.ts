export const MAX_HISTORY_LENGTH = 20;

export function addToHistory(
  history: string[],
  prompt: string,
  maxLength: number = MAX_HISTORY_LENGTH
): string[] {
  const trimmed = prompt.trim();
  if (!trimmed) return history;

  const withoutDuplicate = history.filter((item) => item !== trimmed);
  return [trimmed, ...withoutDuplicate].slice(0, maxLength);
}
