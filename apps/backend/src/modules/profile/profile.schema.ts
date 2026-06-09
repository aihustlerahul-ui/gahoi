import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  gender: z.enum(['Male', 'Female']).optional(),
  gotra: z.string().max(100).optional(),
  aakna: z.string().max(100).optional(),
  manglikStatus: z.enum(['Manglik', 'Non-Manglik', 'Anshik Manglik']).optional(),
  maritalStatus: z.enum(['Never Married', 'Widowed', 'Divorced', 'Awaiting Divorce']).optional(),
  dateOfBirth: z.string().datetime().optional(),
  timeOfBirth: z.string().max(10).optional(),
  height_cm: z.number().int().min(100).max(250).optional(),
  complexion: z.enum(['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Dark']).optional(),
  mobile: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
  livingCityId: z.number().int().positive().optional(),
  nativeState: z.string().max(100).optional(),
  aboutMe: z.string().max(1000).optional(),
  countryId: z.number().int().positive().optional(),
});

export const UpdateEducationSchema = z.object({
  highestDegree: z.string().max(100).optional(),
  fieldOfStudy: z.string().max(100).optional(),
  institution: z.string().max(200).optional(),
  completionYear: z.number().int().min(1970).max(2030).optional(),
});

export const UpdateOccupationSchema = z.object({
  occupationType: z.enum(['Private Job', 'Government Job', 'Business', 'Self-Employed', 'Not Working']).optional(),
  jobTitle: z.string().max(100).optional(),
  employer: z.string().max(200).optional(),
  annualIncomeMin: z.number().int().min(0).optional(),
  annualIncomeMax: z.number().int().min(0).optional(),
});

export const UpdateFamilySchema = z.object({
  fatherName: z.string().max(100).optional(),
  fatherMobile: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
  fatherOccupation: z.string().max(100).optional(),
  motherName: z.string().max(100).optional(),
  motherOccupation: z.string().max(100).optional(),
  siblings: z.number().int().min(0).max(20).optional(),
  familyType: z.enum(['Joint', 'Nuclear', 'Extended']).optional(),
  familyStatus: z.enum(['Middle Class', 'Upper Middle Class', 'Rich', 'Affluent']).optional(),
  homeAddress: z.string().max(500).optional(),
});

export const UpdatePreferencesSchema = z.object({
  ageMin: z.number().int().min(18).max(80).optional(),
  ageMax: z.number().int().min(18).max(80).optional(),
  heightMinCm: z.number().int().min(100).max(250).optional(),
  heightMaxCm: z.number().int().min(100).max(250).optional(),
  maritalStatus: z.array(z.string()).optional(),
  educationMin: z.string().optional(),
  incomeMin: z.number().int().min(0).optional(),
  manglikPreference: z.enum(['Manglik', 'Non-Manglik', 'Any']).optional(),
  excludeSameGotra: z.boolean().optional(),
  preferredCityIds: z.array(z.number().int()).optional(),
  preferredCountries: z.array(z.string()).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdateEducationInput = z.infer<typeof UpdateEducationSchema>;
export type UpdateOccupationInput = z.infer<typeof UpdateOccupationSchema>;
export type UpdateFamilyInput = z.infer<typeof UpdateFamilySchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
