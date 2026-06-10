import { z } from 'zod';
import {
  GENDER_OPTIONS,
  MANGLIK_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  COMPLEXION_OPTIONS,
  PROFILE_CREATED_BY_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  DISABILITY_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  DIETARY_HABIT_OPTIONS,
  NAKSHATRA_OPTIONS,
  ZODIAC_OPTIONS,
  OCCUPATION_TYPE_OPTIONS,
  FAMILY_TYPE_OPTIONS,
  FAMILY_STATUS_OPTIONS,
  HAS_HOUSE_OPTIONS,
  EDUCATION_DEGREE_OPTIONS,
  MANGLIK_PREFERENCE_OPTIONS,
  HEIGHT_FT_OPTIONS,
  HEIGHT_IN_OPTIONS,
  normalizeNakshatra,
  normalizeZodiac,
  normalizeTimeOfBirth,
  heightFtInToCm,
} from '@gahoisarthi/shared';

const phoneRegex = /^\+?[0-9]{10,15}$/;

const heightFtSchema = z.number().int().min(HEIGHT_FT_OPTIONS[0]).max(HEIGHT_FT_OPTIONS[HEIGHT_FT_OPTIONS.length - 1]);
const heightInSchema = z.number().int().min(HEIGHT_IN_OPTIONS[0]).max(HEIGHT_IN_OPTIONS[HEIGHT_IN_OPTIONS.length - 1]);

const timeOfBirthSchema = z.preprocess(
  (val) => (typeof val === 'string' ? normalizeTimeOfBirth(val) ?? val : val),
  z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, 'Time of birth must be HH:MM:SS (24-hour)')
    .optional(),
);

export const UpdateProfileSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    gender: z.enum(GENDER_OPTIONS).optional(),
    gotraId: z.number().int().positive().optional(),
    aaknaId: z.number().int().positive().optional(),
    gotra: z.string().max(200).optional(),
    aakna: z.string().max(200).optional(),
    manglikStatus: z.enum(MANGLIK_OPTIONS).optional(),
    maritalStatus: z.enum(MARITAL_STATUS_OPTIONS).optional(),
    dateOfBirth: z.string().datetime().optional(),
    timeOfBirth: timeOfBirthSchema,
    placeOfBirth: z.string().max(100).optional(),
    birthCityId: z.number().int().positive().optional(),
    nakshatra: z.preprocess(
      (val) => (typeof val === 'string' ? normalizeNakshatra(val) ?? val : val),
      z.enum(NAKSHATRA_OPTIONS).optional(),
    ),
    zodiac: z.preprocess(
      (val) => (typeof val === 'string' ? normalizeZodiac(val) ?? val : val),
      z.enum(ZODIAC_OPTIONS).optional(),
    ),
    heightFt: heightFtSchema.optional(),
    heightIn: heightInSchema.optional(),
    /** @deprecated Legacy cm input — prefer heightFt/heightIn; synced to height_cm on write */
    height_cm: z.number().int().min(100).max(250).optional(),
    weightKg: z.number().min(30).max(200).optional(),
    complexion: z.enum(COMPLEXION_OPTIONS).optional(),
    mobile: z.string().regex(phoneRegex).optional(),
    whatsapp: z.string().regex(phoneRegex).optional(),
    motherTongue: z.enum(MOTHER_TONGUE_OPTIONS).optional(),
    disability: z.enum(DISABILITY_OPTIONS).optional(),
    profileCreatedBy: z.enum(PROFILE_CREATED_BY_OPTIONS).optional(),
    bloodGroup: z.enum(BLOOD_GROUP_OPTIONS).optional(),
    dietaryHabit: z.enum(DIETARY_HABIT_OPTIONS).optional(),
    livingCityId: z.number().int().positive().optional(),
    town: z.string().max(100).optional(),
    nativeState: z.string().max(100).optional(),
    aboutMe: z.string().max(1000).optional(),
    countryId: z.number().int().positive().optional(),
  })
  .transform((data) => {
    const out = { ...data };
    if (out.heightFt != null) {
      out.heightIn = out.heightIn ?? 0;
      out.height_cm = heightFtInToCm(out.heightFt, out.heightIn);
    } else if (out.height_cm != null && out.heightFt == null) {
      // Legacy cm-only update — height_cm kept as-is
    }
    return out;
  });

export const UpdateEducationSchema = z.object({
  highestDegree: z.enum(EDUCATION_DEGREE_OPTIONS).or(z.string().max(100)).optional(),
  fieldOfStudy: z.string().max(100).optional(),
  institution: z.string().max(200).optional(),
  completionYear: z.number().int().min(1970).max(2030).optional(),
  educationalDetail: z.string().max(500).optional(),
});

export const UpdateOccupationSchema = z.object({
  occupationType: z.enum(OCCUPATION_TYPE_OPTIONS).optional(),
  jobTitle: z.string().max(100).optional(),
  employer: z.string().max(200).optional(),
  occupationDetail: z.string().max(500).optional(),
  annualIncomeMin: z.number().int().min(0).optional(),
  annualIncomeMax: z.number().int().min(0).optional(),
});

export const UpdateFamilySchema = z.object({
  fatherName: z.string().max(100).optional(),
  parentMobile: z.string().regex(phoneRegex).optional(),
  fatherOccupation: z.string().max(100).optional(),
  motherName: z.string().max(100).optional(),
  motherOccupation: z.string().max(100).optional(),
  siblings: z.number().int().min(0).max(20).optional(),
  marriedBrothers: z.number().int().min(0).max(20).optional(),
  unmarriedBrothers: z.number().int().min(0).max(20).optional(),
  marriedSisters: z.number().int().min(0).max(20).optional(),
  unmarriedSisters: z.number().int().min(0).max(20).optional(),
  maternalUncleName: z.string().max(200).optional(),
  maternalUncleAaknaId: z.number().int().positive().optional(),
  maternalUncleAakna: z.string().max(100).optional(),
  familyType: z.enum(FAMILY_TYPE_OPTIONS).optional(),
  familyStatus: z.enum(FAMILY_STATUS_OPTIONS).optional(),
  hasHouse: z.enum(HAS_HOUSE_OPTIONS).optional(),
  hasCar: z.boolean().optional(),
  homeAddress: z.string().max(500).optional(),
  permanentAddress: z.string().max(500).optional(),
});

export const UpdatePreferencesSchema = z
  .object({
    ageMin: z.number().int().min(18).max(80).optional(),
    ageMax: z.number().int().min(18).max(80).optional(),
    heightMinFt: heightFtSchema.optional(),
    heightMinIn: heightInSchema.optional(),
    heightMaxFt: heightFtSchema.optional(),
    heightMaxIn: heightInSchema.optional(),
    /** @deprecated Legacy cm — prefer heightMinFt/In; synced on write */
    heightMinCm: z.number().int().min(100).max(250).optional(),
    heightMaxCm: z.number().int().min(100).max(250).optional(),
    maritalStatus: z.array(z.enum(MARITAL_STATUS_OPTIONS)).optional(),
    educationMin: z.enum(EDUCATION_DEGREE_OPTIONS).or(z.string()).optional(),
    incomeMin: z.number().int().min(0).optional(),
    manglikPreference: z.enum(MANGLIK_PREFERENCE_OPTIONS).optional(),
    excludeSameGotra: z.boolean().optional(),
    preferredCityIds: z.array(z.number().int()).optional(),
    preferredCountries: z.array(z.string()).optional(),
    termsAccepted: z.literal(true).optional(),
  })
  .transform((data) => {
    const out = { ...data };
    if (out.heightMinFt != null) {
      out.heightMinIn = out.heightMinIn ?? 0;
      out.heightMinCm = heightFtInToCm(out.heightMinFt, out.heightMinIn);
    }
    if (out.heightMaxFt != null) {
      out.heightMaxIn = out.heightMaxIn ?? 0;
      out.heightMaxCm = heightFtInToCm(out.heightMaxFt, out.heightMaxIn);
    }
    return out;
  });

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdateEducationInput = z.infer<typeof UpdateEducationSchema>;
export type UpdateOccupationInput = z.infer<typeof UpdateOccupationSchema>;
export type UpdateFamilyInput = z.infer<typeof UpdateFamilySchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
