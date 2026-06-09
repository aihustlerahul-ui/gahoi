import { z } from 'zod';

export const ModerateProfileSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended']),
});

export const ModeratePhotoSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

export const ResolveReportSchema = z.object({
  action: z.enum(['resolve_no_action', 'resolve_suspend_user']),
});

export type ModerateProfileInput = z.infer<typeof ModerateProfileSchema>;
export type ModeratePhotoInput = z.infer<typeof ModeratePhotoSchema>;
export type ResolveReportInput = z.infer<typeof ResolveReportSchema>;
