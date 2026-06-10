/**
 * Authoritative Gahoi zodiac (rashi) master list (12 signs).
 * Stored profile value: `english` (e.g. "Cancer") for backward compatibility.
 * Display label format: "English (Hindi)" e.g. "Cancer (कर्क)".
 */
export const GAHOI_ZODIAC_MASTER = [
  { code: 'ARIES', english: 'Aries', hindi: 'मेष', label: 'Aries (मेष)' },
  { code: 'TAURUS', english: 'Taurus', hindi: 'वृषभ', label: 'Taurus (वृषभ)' },
  { code: 'GEMINI', english: 'Gemini', hindi: 'मिथुन', label: 'Gemini (मिथुन)' },
  { code: 'CANCER', english: 'Cancer', hindi: 'कर्क', label: 'Cancer (कर्क)' },
  { code: 'LEO', english: 'Leo', hindi: 'सिंह', label: 'Leo (सिंह)' },
  { code: 'VIRGO', english: 'Virgo', hindi: 'कन्या', label: 'Virgo (कन्या)' },
  { code: 'LIBRA', english: 'Libra', hindi: 'तुला', label: 'Libra (तुला)' },
  { code: 'SCORPIO', english: 'Scorpio', hindi: 'वृश्चिक', label: 'Scorpio (वृश्चिक)' },
  { code: 'SAGITTARIUS', english: 'Sagittarius', hindi: 'धनु', label: 'Sagittarius (धनु)' },
  { code: 'CAPRICORN', english: 'Capricorn', hindi: 'मकर', label: 'Capricorn (मकर)' },
  { code: 'AQUARIUS', english: 'Aquarius', hindi: 'कुम्भ', label: 'Aquarius (कुम्भ)' },
  { code: 'PISCES', english: 'Pisces', hindi: 'मीन', label: 'Pisces (मीन)' },
] as const;

export type GahoiZodiacEntry = (typeof GAHOI_ZODIAC_MASTER)[number];
export type GahoiZodiacCode = GahoiZodiacEntry['code'];
export type ZodiacEnglish = GahoiZodiacEntry['english'];

export const ZODIAC_CODES = GAHOI_ZODIAC_MASTER.map((entry) => entry.code);

export function zodiacLabelForEnglish(english: string): string {
  const entry = GAHOI_ZODIAC_MASTER.find(
    (z) => z.english.toLowerCase() === english.toLowerCase(),
  );
  return entry?.label ?? english;
}
