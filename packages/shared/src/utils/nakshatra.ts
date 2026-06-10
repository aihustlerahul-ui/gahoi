import { GAHOI_NAKSHATRA_MASTER } from '../constants/gahoi-nakshatra-master';

type NakshatraEnglish = (typeof GAHOI_NAKSHATRA_MASTER)[number]['english'];

const ENGLISH_BY_LOWER = new Map(
  GAHOI_NAKSHATRA_MASTER.map((entry) => [entry.english.toLowerCase(), entry.english]),
);

const ENGLISH_BY_CODE = new Map(
  GAHOI_NAKSHATRA_MASTER.map((entry) => [entry.code, entry.english]),
);

/** Legacy spellings accepted on input, normalized to canonical english. */
const LEGACY_ALIASES: Record<string, NakshatraEnglish> = {
  mrigashirsha: 'Mrigashira',
  moola: 'Mula',
};

/**
 * Resolve a nakshatra input (english, code, or legacy alias) to canonical english storage value.
 */
export function normalizeNakshatra(value: string): NakshatraEnglish | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const codeKey = trimmed.toUpperCase().replace(/[\s-]+/g, '_');
  const byCode = ENGLISH_BY_CODE.get(codeKey as (typeof GAHOI_NAKSHATRA_MASTER)[number]['code']);
  if (byCode) return byCode;

  const byEnglish = ENGLISH_BY_LOWER.get(trimmed.toLowerCase());
  if (byEnglish) return byEnglish;

  const legacy = LEGACY_ALIASES[trimmed.toLowerCase()];
  if (legacy) return legacy;

  return null;
}

export function isValidNakshatra(value: string): boolean {
  return normalizeNakshatra(value) !== null;
}
