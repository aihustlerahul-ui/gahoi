import { KundliScore } from '@gahoisarthi/shared';

// Names of Nakshatras and Rashis
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati'
];

const RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Helper to convert degree to radian
function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculates Julian Date
 */
function getJulianDate(date: Date, timeStr: string | null): number {
  const d = new Date(date);
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h || 0, m || 0, 0, 0);
  } else {
    d.setHours(12, 0, 0, 0); // Default to noon
  }
  
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours() + d.getMinutes() / 60;

  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  // Convert local IST (UTC+5.5) to UTC
  const istOffset = 5.5;
  const utcHour = hour - istOffset;
  jd += (utcHour - 12) / 24;

  return jd;
}

/**
 * Calculates Moon's Nakshatra and Rashi indexes
 */
function getNakshatraAndRashi(date: Date, timeStr: string | null): { nakshatraIdx: number; rashiIdx: number } {
  const jd = getJulianDate(date, timeStr);
  const t = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000.0

  // Mean longitude of Moon
  let L = 218.316447 + 481267.881234 * t;
  // Mean elongation of Moon
  let D = 297.850192 + 445267.111403 * t;
  // Sun's mean anomaly
  let M = 357.529109 + 35999.050291 * t;
  // Moon's mean anomaly
  let M_prime = 134.963396 + 477198.867505 * t;

  // Approximate longitude
  let lon = L +
    6.289 * Math.sin(deg2rad(M_prime)) +
    1.274 * Math.sin(deg2rad(2 * D - M_prime)) +
    0.658 * Math.sin(deg2rad(2 * D)) +
    0.214 * Math.sin(deg2rad(2 * M_prime)) -
    0.186 * Math.sin(deg2rad(M));

  lon = ((lon % 360) + 360) % 360;

  // Sidereal longitude using Lahiri Ayanamsa approximation
  const ayanamsa = 23.85 + (date.getFullYear() - 2000) * 0.01306;
  const siderealLon = ((lon - ayanamsa) % 360 + 360) % 360;

  const nakshatraIdx = Math.floor(siderealLon / (360 / 27)) % 27;
  const rashiIdx = Math.floor(siderealLon / 30) % 12;

  return { nakshatraIdx, rashiIdx };
}

/**
 * computes Ashtakoot compatibility between two sets of birth details
 */
export function computeAshtakoot(
  p1: { dob: Date | null; tob: string | null },
  p2: { dob: Date | null; tob: string | null }
): KundliScore {
  // Check if birth data is missing
  if (!p1.dob || !p2.dob) {
    // Return a default approximate response
    return {
      total: 18,
      varna: 0.5,
      vashya: 1.0,
      tara: 1.5,
      yoni: 2.0,
      graha_maitri: 2.5,
      gana: 3.0,
      bhakoot: 3.5,
      nadi: 4.0,
      label: 'Madhyam',
      is_approximate: true,
    };
  }

  const g = getNakshatraAndRashi(p1.dob, p1.tob); // Groom (p1)
  const b = getNakshatraAndRashi(p2.dob, p2.tob); // Bride (p2)

  // 1. Varna (1 point)
  // Brahmin: Cancer (3), Scorpio (7), Pisces (11)
  // Kshatriya: Aries (0), Leo (4), Sagittarius (8)
  // Vaishya: Taurus (1), Virgo (5), Capricorn (9)
  // Shudra: Gemini (2), Libra (6), Aquarius (10)
  const getVarna = (rashi: number) => {
    if ([3, 7, 11].includes(rashi)) return 4; // Brahmin
    if ([0, 4, 8].includes(rashi)) return 3;  // Kshatriya
    if ([1, 5, 9].includes(rashi)) return 2;  // Vaishya
    return 1;                                 // Shudra
  };
  const varnaG = getVarna(g.rashiIdx);
  const varnaB = getVarna(b.rashiIdx);
  const varna = varnaG >= varnaB ? 1 : 0;

  // 2. Vashya (2 points)
  // Chatushpad: Aries, Taurus, Leo (first 15), Sagittarius (second 15), Capricorn (first 15)
  // Manushya: Gemini, Virgo, Libra, Sagittarius (first 15), Aquarius
  // Jalachar: Cancer, Capricorn (second 15), Pisces
  // Vanachar: Leo (second 15)
  // Keeta: Scorpio
  const getVashyaGroup = (rashi: number) => {
    if ([0, 1].includes(rashi)) return 'chatushpad';
    if ([2, 5, 6, 10].includes(rashi)) return 'manushya';
    if ([3, 11].includes(rashi)) return 'jalachar';
    if (rashi === 4) return 'vanachar';
    if (rashi === 7) return 'keeta';
    if (rashi === 8) return 'chatushpad'; // Sagittarius
    return 'jalachar'; // Capricorn
  };
  const vashyaG = getVashyaGroup(g.rashiIdx);
  const vashyaB = getVashyaGroup(b.rashiIdx);
  let vashya = 0;
  if (vashyaG === vashyaB) {
    vashya = 2;
  } else if (
    (vashyaG === 'manushya' && vashyaB === 'jalachar') ||
    (vashyaG === 'jalachar' && vashyaB === 'manushya') ||
    (vashyaG === 'chatushpad' && vashyaB === 'jalachar') ||
    (vashyaG === 'jalachar' && vashyaB === 'chatushpad')
  ) {
    vashya = 1;
  }

  // 3. Tara (3 points)
  const distBrideToGroom = (g.nakshatraIdx - b.nakshatraIdx + 27) % 27 + 1;
  const distGroomToBride = (b.nakshatraIdx - g.nakshatraIdx + 27) % 27 + 1;
  const rem1 = distBrideToGroom % 9;
  const rem2 = distGroomToBride % 9;
  const badRem = [3, 5, 7];
  const isBad1 = badRem.includes(rem1);
  const isBad2 = badRem.includes(rem2);
  let tara = 3;
  if (isBad1 && isBad2) tara = 0;
  else if (isBad1 || isBad2) tara = 1.5;

  // 4. Yoni (4 points)
  // Nakshatra animals
  const YONI_ANIMALS = [
    'Horse', 'Elephant', 'Sheep', 'Serpent', 'Serpent', 'Dog', 'Cat', 'Goat', 'Cat',
    'Rat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Buffalo', 'Tiger', 'Deer', 'Deer',
    'Dog', 'Monkey', 'Mongoose', 'Monkey', 'Lion', 'Lion', 'Lion', 'Cow', 'Elephant'
  ];
  const yoniG = YONI_ANIMALS[g.nakshatraIdx];
  const yoniB = YONI_ANIMALS[b.nakshatraIdx];
  
  // Friendship matrix between Yoni animals
  const ENEMY_PAIRS = [
    ['Horse', 'Buffalo'],
    ['Elephant', 'Lion'],
    ['Sheep', 'Monkey'],
    ['Serpent', 'Mongoose'],
    ['Dog', 'Deer'],
    ['Cat', 'Rat'],
    ['Goat', 'Cow'],
    ['Tiger', 'Cow']
  ];

  let yoni = 2; // Default neutral
  const isEnemy = ENEMY_PAIRS.some(pair => pair.includes(yoniG) && pair.includes(yoniB));

  if (yoniG === yoniB) {
    yoni = 4;
  } else if (isEnemy) {
    yoni = 0;
  } else {
    // Friendly animal combos
    const friendly = [
      ['Horse', 'Deer'], ['Elephant', 'Cow'], ['Sheep', 'Goat'], ['Serpent', 'Cat'],
      ['Dog', 'Monkey'], ['Cat', 'Rat'], ['Mongoose', 'Monkey']
    ];
    const isFriendly = friendly.some(pair => pair.includes(yoniG) && pair.includes(yoniB));
    if (isFriendly) yoni = 3;
    else yoni = 1; // Minor enmity
  }

  // 5. Graha Maitri (5 points)
  // Rashi lords: Sun(0), Moon(1), Mars(2), Mercury(3), Jupiter(4), Venus(5), Saturn(6)
  const RASHI_LORDS = [
    2, // Aries -> Mars
    5, // Taurus -> Venus
    3, // Gemini -> Mercury
    1, // Cancer -> Moon
    0, // Leo -> Sun
    3, // Virgo -> Mercury
    5, // Libra -> Venus
    2, // Scorpio -> Mars
    4, // Sagittarius -> Jupiter
    6, // Capricorn -> Saturn
    6, // Aquarius -> Saturn
    4  // Pisces -> Jupiter
  ];
  const lordG = RASHI_LORDS[g.rashiIdx];
  const lordB = RASHI_LORDS[b.rashiIdx];

  // Friendliness matrix between lords: 0=Sun, 1=Moon, 2=Mars, 3=Mercury, 4=Jupiter, 5=Venus, 6=Saturn
  // Values: 2=Friend, 1=Neutral, 0=Enemy
  const LORD_RELATION = [
    // Sun, Moon, Mars, Merc, Jup, Ven, Sat
    [2, 2, 2, 1, 2, 0, 0], // Sun
    [2, 2, 1, 2, 1, 1, 1], // Moon
    [2, 2, 2, 0, 2, 1, 1], // Mars
    [2, 0, 1, 2, 1, 2, 2], // Mercury
    [2, 2, 2, 0, 2, 0, 1], // Jupiter
    [0, 0, 1, 2, 1, 2, 2], // Venus
    [0, 0, 0, 2, 1, 2, 2]  // Saturn
  ];
  const rel1 = LORD_RELATION[lordG][lordB];
  const rel2 = LORD_RELATION[lordB][lordG];
  let graha_maitri = 0;
  if (rel1 === 2 && rel2 === 2) graha_maitri = 5;
  else if ((rel1 === 2 && rel2 === 1) || (rel1 === 1 && rel2 === 2)) graha_maitri = 4;
  else if (rel1 === 1 && rel2 === 1) graha_maitri = 3;
  else if ((rel1 === 1 && rel2 === 0) || (rel1 === 0 && rel2 === 1)) graha_maitri = 1;

  // 6. Gana (6 points)
  // Deva(0), Manushya(1), Rakshasa(2)
  const NAKSHATRA_GANAS = [
    0, 1, 2, 1, 0, 1, 0, 0, 2, // 0-8
    2, 1, 1, 0, 2, 0, 2, 0, 2, // 9-17
    2, 1, 2, 0, 2, 2, 1, 1, 0  // 18-26
  ];
  const ganaG = NAKSHATRA_GANAS[g.nakshatraIdx];
  const ganaB = NAKSHATRA_GANAS[b.nakshatraIdx];
  let gana = 0;
  if (ganaG === ganaB) {
    gana = 6;
  } else if (
    (ganaG === 0 && ganaB === 1) ||
    (ganaG === 1 && ganaB === 0)
  ) {
    gana = 5;
  } else if (
    (ganaG === 0 && ganaB === 2) ||
    (ganaG === 2 && ganaB === 0)
  ) {
    gana = 1;
  }

  // 7. Bhakoot (7 points)
  // Distance from Bride to Groom
  const distRashi = (g.rashiIdx - b.rashiIdx + 12) % 12 + 1;
  let bhakoot = 0;
  if ([1, 7, 3, 4, 10, 11].includes(distRashi)) {
    bhakoot = 7;
  }

  // 8. Nadi (8 points)
  // Adi(0), Madhya(1), Antya(2)
  const NAKSHATRA_NADIS = [
    0, 1, 2, 2, 1, 0, 0, 1, 2, // Ashwini to Ashlesha
    2, 1, 0, 0, 1, 2, 2, 1, 0, // Magha to Jyeshtha
    0, 1, 2, 2, 1, 0, 0, 1, 2  // Moola to Revati
  ];
  const nadiG = NAKSHATRA_NADIS[g.nakshatraIdx];
  const nadiB = NAKSHATRA_NADIS[b.nakshatraIdx];
  const nadi = nadiG !== nadiB ? 8 : 0;

  // Total out of 36
  const total = varna + vashya + tara + yoni + graha_maitri + gana + bhakoot + nadi;

  let label: 'Uttam' | 'Madhyam' | 'Vichar Yogya' = 'Vichar Yogya';
  if (total >= 28) label = 'Uttam';
  else if (total >= 18) label = 'Madhyam';

  return {
    total,
    varna,
    vashya,
    tara,
    yoni,
    graha_maitri,
    gana,
    bhakoot,
    nadi,
    label,
    is_approximate: !p1.tob || !p2.tob,
  };
}
