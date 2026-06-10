/**
 * Authoritative Gahoi nakshatra master list (27 nakshatras).
 * Stored profile value: `english` (e.g. "Pushya") for backward compatibility.
 * Display label format: "English (Hindi)" e.g. "Pushya (पुष्य)".
 */
export const GAHOI_NAKSHATRA_MASTER = [
  { code: 'ASHWINI', english: 'Ashwini', hindi: 'अश्विनी', label: 'Ashwini (अश्विनी)' },
  { code: 'BHARANI', english: 'Bharani', hindi: 'भरणी', label: 'Bharani (भरणी)' },
  { code: 'KRITTIKA', english: 'Krittika', hindi: 'कृत्तिका', label: 'Krittika (कृत्तिका)' },
  { code: 'ROHINI', english: 'Rohini', hindi: 'रोहिणी', label: 'Rohini (रोहिणी)' },
  { code: 'MRIGASHIRSHA', english: 'Mrigashira', hindi: 'मृगशिरा', label: 'Mrigashira (मृगशिरा)' },
  { code: 'ARDRA', english: 'Ardra', hindi: 'आर्द्रा', label: 'Ardra (आर्द्रा)' },
  { code: 'PUNARVASU', english: 'Punarvasu', hindi: 'पुनर्वसु', label: 'Punarvasu (पुनर्वसु)' },
  { code: 'PUSHYA', english: 'Pushya', hindi: 'पुष्य', label: 'Pushya (पुष्य)' },
  { code: 'ASHLESHA', english: 'Ashlesha', hindi: 'आश्लेषा', label: 'Ashlesha (आश्लेषा)' },
  { code: 'MAGHA', english: 'Magha', hindi: 'मघा', label: 'Magha (मघा)' },
  {
    code: 'PURVA_PHALGUNI',
    english: 'Purva Phalguni',
    hindi: 'पूर्व फाल्गुनी',
    label: 'Purva Phalguni (पूर्व फाल्गुनी)',
  },
  {
    code: 'UTTARA_PHALGUNI',
    english: 'Uttara Phalguni',
    hindi: 'उत्तर फाल्गुनी',
    label: 'Uttara Phalguni (उत्तर फाल्गुनी)',
  },
  { code: 'HASTA', english: 'Hasta', hindi: 'हस्त', label: 'Hasta (हस्त)' },
  { code: 'CHITRA', english: 'Chitra', hindi: 'चित्रा', label: 'Chitra (चित्रा)' },
  { code: 'SWATI', english: 'Swati', hindi: 'स्वाति', label: 'Swati (स्वाति)' },
  { code: 'VISHAKHA', english: 'Vishakha', hindi: 'विशाखा', label: 'Vishakha (विशाखा)' },
  { code: 'ANURADHA', english: 'Anuradha', hindi: 'अनुराधा', label: 'Anuradha (अनुराधा)' },
  { code: 'JYESHTHA', english: 'Jyeshtha', hindi: 'ज्येष्ठा', label: 'Jyeshtha (ज्येष्ठा)' },
  { code: 'MULA', english: 'Mula', hindi: 'मूल', label: 'Mula (मूल)' },
  {
    code: 'PURVA_ASHADHA',
    english: 'Purva Ashadha',
    hindi: 'पूर्वाषाढ़ा',
    label: 'Purva Ashadha (पूर्वाषाढ़ा)',
  },
  {
    code: 'UTTARA_ASHADHA',
    english: 'Uttara Ashadha',
    hindi: 'उत्तराषाढ़ा',
    label: 'Uttara Ashadha (उत्तराषाढ़ा)',
  },
  { code: 'SHRAVANA', english: 'Shravana', hindi: 'श्रवण', label: 'Shravana (श्रवण)' },
  { code: 'DHANISHTA', english: 'Dhanishta', hindi: 'धनिष्ठा', label: 'Dhanishta (धनिष्ठा)' },
  { code: 'SHATABHISHA', english: 'Shatabhisha', hindi: 'शतभिषा', label: 'Shatabhisha (शतभिषा)' },
  {
    code: 'PURVA_BHADRAPADA',
    english: 'Purva Bhadrapada',
    hindi: 'पूर्व भाद्रपद',
    label: 'Purva Bhadrapada (पूर्व भाद्रपद)',
  },
  {
    code: 'UTTARA_BHADRAPADA',
    english: 'Uttara Bhadrapada',
    hindi: 'उत्तर भाद्रपद',
    label: 'Uttara Bhadrapada (उत्तर भाद्रपद)',
  },
  { code: 'REVATI', english: 'Revati', hindi: 'रेवती', label: 'Revati (रेवती)' },
] as const;

export type GahoiNakshatraEntry = (typeof GAHOI_NAKSHATRA_MASTER)[number];
export type GahoiNakshatraCode = GahoiNakshatraEntry['code'];
export type NakshatraEnglish = GahoiNakshatraEntry['english'];

export const NAKSHATRA_CODES = GAHOI_NAKSHATRA_MASTER.map((entry) => entry.code);

export function nakshatraLabelForEnglish(english: string): string {
  const entry = GAHOI_NAKSHATRA_MASTER.find(
    (n) => n.english.toLowerCase() === english.toLowerCase(),
  );
  return entry?.label ?? english;
}
