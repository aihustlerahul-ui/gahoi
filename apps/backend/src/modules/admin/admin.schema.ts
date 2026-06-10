import { z } from 'zod';

export const ModerateProfileSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended']),
  reason: z.string().min(1).max(500).optional(),
});

export const ModeratePhotoSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

export const ResolveReportSchema = z.object({
  action: z.enum(['warn', 'suspend', 'ban', 'dismiss']),
});

export const ListProfilesQuerySchema = z.object({
  status: z.string().optional(),
  gender: z.string().optional(),
  cityId: z.coerce.number().int().positive().optional(),
  tier: z.enum(['free', 'paid']).optional(),
  verified: z.enum(['true', 'false']).optional(),
  flagged: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export const ListInterestsQuerySchema = z.object({
  senderId: z.string().uuid().optional(),
  status: z.string().optional(),
  since: z.string().datetime().optional(),
});

export const VerifiedBadgeSchema = z.object({
  isVerified: z.boolean(),
});

export const EmailBroadcastSchema = z.object({
  segment: z.enum(['all', 'paid', 'free', 'inactive_30d']),
  subject: z.string().min(1).max(200),
  bodyHtml: z.string().min(1).max(50000),
});

export const CreateAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['super_admin', 'moderator']).default('moderator'),
});

export const UpdateAdminSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['super_admin', 'moderator']).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSuccessStorySchema = z.object({
  testimonial: z.string().min(1).max(2000).optional(),
  status: z.enum(['pending', 'published', 'unpublished']).optional(),
});

export const CreateSuccessStorySchema = z.object({
  profileId: z.string().uuid(),
  testimonial: z.string().min(1).max(2000),
  photoR2Key: z.string().optional(),
});

export type ModerateProfileInput = z.infer<typeof ModerateProfileSchema>;
export type ModeratePhotoInput = z.infer<typeof ModeratePhotoSchema>;
export type ResolveReportInput = z.infer<typeof ResolveReportSchema>;
