export function getCooldownSeconds(value: unknown): number {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function storageKey(email: string, prefix: string): string {
  return `${prefix}:${encodeURIComponent(normalizeEmail(email))}`;
}

export function getRemainingSeconds(deadline: number, now = Date.now()): number {
  if (!Number.isFinite(deadline) || deadline <= 0) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function readCooldownDeadline(email: string, prefix: string): number {
  if (!email.trim()) return 0;
  try {
    const deadline = Number(window.sessionStorage.getItem(storageKey(email, prefix)));
    return Number.isFinite(deadline) && deadline > 0 ? deadline : 0;
  } catch {
    // The page can still work when browser storage is unavailable.
    return 0;
  }
}

export function saveCooldownDeadline(
  email: string,
  seconds: number,
  prefix: string,
  now = Date.now(),
): number {
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  const deadline = now + Math.ceil(seconds) * 1000;
  try {
    window.sessionStorage.setItem(storageKey(email, prefix), String(deadline));
  } catch {
    // Return the deadline so the component can retain its countdown in memory.
  }
  return deadline;
}
