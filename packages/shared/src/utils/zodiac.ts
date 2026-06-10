import { GAHOI_ZODIAC_MASTER } from '../constants/gahoi-zodiac-master';

type ZodiacEnglish = (typeof GAHOI_ZODIAC_MASTER)[number]['english'];

const ENGLISH_BY_LOWER = new Map(
  GAHOI_ZODIAC_MASTER.map((entry) => [entry.english.toLowerCase(), entry.english]),
);

const ENGLISH_BY_CODE = new Map(
  GAHOI_ZODIAC_MASTER.map((entry) => [entry.code, entry.english]),
);

/**
 * Resolve a zodiac input (english or code) to canonical english storage value.
 */
export function normalizeZodiac(value: string): ZodiacEnglish | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const codeKey = trimmed.toUpperCase().replace(/[\s-]+/g, '_');
  const byCode = ENGLISH_BY_CODE.get(codeKey as (typeof GAHOI_ZODIAC_MASTER)[number]['code']);
  if (byCode) return byCode;

  const byEnglish = ENGLISH_BY_LOWER.get(trimmed.toLowerCase());
  if (byEnglish) return byEnglish;

  return null;
}

export function isValidZodiac(value: string): boolean {
  return normalizeZodiac(value) !== null;
}
