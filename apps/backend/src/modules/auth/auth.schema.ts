import { z } from 'zod';

export const SendOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
