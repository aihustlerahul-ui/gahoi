/** Profile field enums — shared between backend validation and mobile onboarding */

import { GAHOI_NAKSHATRA_MASTER } from './gahoi-nakshatra-master';
import { GAHOI_ZODIAC_MASTER } from './gahoi-zodiac-master';
import { HEIGHT_FT_OPTIONS, HEIGHT_IN_OPTIONS } from '../utils/height';

export { HEIGHT_FT_OPTIONS, HEIGHT_IN_OPTIONS };

export const GENDER_OPTIONS = ['Male', 'Female'] as const;
export type GenderOption = (typeof GENDER_OPTIONS)[number];

export const MANGLIK_OPTIONS = ['Non-Manglik', 'Manglik', 'Anshik Manglik'] as const;
export type ManglikOption = (typeof MANGLIK_OPTIONS)[number];

export const MARITAL_STATUS_OPTIONS = [
  'Never Married',
  'Divorced',
  'Widowed',
  'Awaiting Divorce',
] as const;
export type MaritalStatusOption = (typeof MARITAL_STATUS_OPTIONS)[number];

export const COMPLEXION_OPTIONS = [
  'Very Fair',
  'Fair',
  'Wheatish',
  'Wheatish Brown',
  'Dark',
] as const;
export type ComplexionOption = (typeof COMPLEXION_OPTIONS)[number];

export const PROFILE_CREATED_BY_OPTIONS = ['Self', 'Parents', 'Sibling', 'Relative'] as const;
export type ProfileCreatedByOption = (typeof PROFILE_CREATED_BY_OPTIONS)[number];

export const MOTHER_TONGUE_OPTIONS = [
  'Hindi',
  'English',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Urdu',
  'Bhojpuri',
  'Other',
] as const;
export type MotherTongueOption = (typeof MOTHER_TONGUE_OPTIONS)[number];

export const DISABILITY_OPTIONS = ['No', 'Yes'] as const;
export type DisabilityOption = (typeof DISABILITY_OPTIONS)[number];

export const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodGroupOption = (typeof BLOOD_GROUP_OPTIONS)[number];

export const DIETARY_HABIT_OPTIONS = ['Veg', 'Non-Veg', 'Eggetarian', 'Vegan'] as const;
export type DietaryHabitOption = (typeof DIETARY_HABIT_OPTIONS)[number];

export const NAKSHATRA_OPTIONS = GAHOI_NAKSHATRA_MASTER.map((entry) => entry.english) as unknown as readonly [
  (typeof GAHOI_NAKSHATRA_MASTER)[number]['english'],
  (typeof GAHOI_NAKSHATRA_MASTER)[number]['english'],
  ...(typeof GAHOI_NAKSHATRA_MASTER)[number]['english'][],
];
export type NakshatraOption = (typeof NAKSHATRA_OPTIONS)[number];

export const ZODIAC_OPTIONS = GAHOI_ZODIAC_MASTER.map((entry) => entry.english) as unknown as readonly [
  (typeof GAHOI_ZODIAC_MASTER)[number]['english'],
  (typeof GAHOI_ZODIAC_MASTER)[number]['english'],
  ...(typeof GAHOI_ZODIAC_MASTER)[number]['english'][],
];
export type ZodiacOption = (typeof ZODIAC_OPTIONS)[number];

export const OCCUPATION_TYPE_OPTIONS = [
  'Private Job',
  'Government Job',
  'Business',
  'Self-Employed',
  'Homemaker',
  'Student',
  'Not Working',
] as const;
export type OccupationTypeOption = (typeof OCCUPATION_TYPE_OPTIONS)[number];

export const FAMILY_TYPE_OPTIONS = ['Nuclear', 'Joint', 'Extended'] as const;
export type FamilyTypeOption = (typeof FAMILY_TYPE_OPTIONS)[number];

export const FAMILY_STATUS_OPTIONS = [
  'Middle Class',
  'Upper Middle Class',
  'Rich',
  'Affluent',
] as const;
export type FamilyStatusOption = (typeof FAMILY_STATUS_OPTIONS)[number];

export const HAS_HOUSE_OPTIONS = ['Yes Personal', 'Yes Rented', 'No'] as const;
export type HasHouseOption = (typeof HAS_HOUSE_OPTIONS)[number];

export const EDUCATION_DEGREE_OPTIONS = [
  // School
  'Below 10th',
  '10th',
  '12th',
  // Diploma / ITI
  'Diploma',
  'ITI',
  'PGDCA',
  // UG
  'BA',
  'BSc',
  'BCom',
  'BBA',
  'BCA',
  'BTech/BE',
  'BArch',
  'BPharm',
  'LLB',
  'MBBS',
  'BDS',
  'BEd',
  'BCom LLB',
  'Other UG',
  // PG
  'MA',
  'MSc',
  'MCom',
  'MBA',
  'MCA',
  'MTech/ME',
  'MArch',
  'MPharm',
  'LLM',
  'MD',
  'MS',
  'MEd',
  'Other PG',
  // Doctorate / Professional
  'PhD',
  'CA',
  'CS',
  'CMA',
] as const;
export type EducationDegreeOption = (typeof EDUCATION_DEGREE_OPTIONS)[number];

export const MANGLIK_PREFERENCE_OPTIONS = ['Any', 'Non-Manglik', 'Manglik'] as const;
export type ManglikPreferenceOption = (typeof MANGLIK_PREFERENCE_OPTIONS)[number];

export const INCOME_RANGE_OPTIONS = [
  { label: 'Not Working / Studying / Household', min: 0, max: 0 },
  { label: 'Up to ₹1 lakh', min: 0, max: 100000 },
  { label: '₹1–2 lakh', min: 100000, max: 200000 },
  { label: '₹3–5 lakh', min: 300000, max: 500000 },
  { label: '₹5–10 lakh', min: 500000, max: 1000000 },
  { label: '₹10–15 lakh', min: 1000000, max: 1500000 },
  { label: '₹15–20 lakh', min: 1500000, max: 2000000 },
  { label: '₹20–25 lakh', min: 2000000, max: 2500000 },
  { label: '₹25–30 lakh', min: 2500000, max: 3000000 },
  { label: '₹30–40 lakh', min: 3000000, max: 4000000 },
  { label: '₹40–50 lakh', min: 4000000, max: 5000000 },
  { label: '₹50–75 lakh', min: 5000000, max: 7500000 },
  { label: '₹75 lakh – ₹1 Cr', min: 7500000, max: 10000000 },
  { label: '₹1 Cr+', min: 10000000, max: 999999999 },
] as const;
