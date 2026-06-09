import { z } from 'zod';

export const SendOtpSchema = z.object({
  email: z.string().email(),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const GoogleAuthSchema = z.object({
  id_token: z.string().min(1),
});

export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
