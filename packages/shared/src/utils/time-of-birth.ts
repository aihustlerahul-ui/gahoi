/** Time of birth stored as 24-hour HH:MM:SS string for Kundli compatibility. */

const TIME_24_REGEX = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

export function isValidTimeOfBirth(value: string): boolean {
  return TIME_24_REGEX.test(value.trim());
}

export type Time12 = { hour: number; minute: number; ampm: 'AM' | 'PM' };

/** Convert 12-hour UI values to canonical 24-hour HH:MM:SS storage string. */
export function time12To24String(hour: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour;
  if (ampm === 'AM' && h === 12) h = 0;
  else if (ampm === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

/** Parse stored HH:MM:SS (or HH:MM) into 12-hour picker state. */
export function time24StringTo12(value: string): Time12 {
  const parts = value.trim().split(':');
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return { hour: hour12, minute: m, ampm };
}

/** Normalize partial input (HH:MM) to HH:MM:SS for storage. */
export function normalizeTimeOfBirth(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (TIME_24_REGEX.test(trimmed)) return trimmed;

  const shortMatch = /^([01]\d|2[0-3]):[0-5]\d$/.exec(trimmed);
  if (shortMatch) return `${trimmed}:00`;

  return null;
}
