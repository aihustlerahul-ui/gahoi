import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  SendOtpSchema,
  VerifyOtpSchema,
  GoogleAuthSchema,
  RefreshTokenSchema,
} from './auth.schema';
import {
  sendOtp,
  verifyOtp,
  refreshTokens,
  logout,
  googleSignIn,
} from './auth.service';
import { authGuard, type AuthRequest } from '../../middleware/auth-guard';

export const authRouter = Router();

// Rate limiters specific to auth
const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => req.body?.email ?? req.ip ?? 'unknown',
  message: { success: false, data: null, error: 'Too many OTP requests', meta: {} },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.body?.email ?? req.ip ?? 'unknown',
  message: { success: false, data: null, error: 'Too many verification attempts', meta: {} },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /v1/auth/send-otp
authRouter.post('/send-otp', otpSendLimiter, async (req: Request, res: Response) => {
  const result = SendOtpSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }

  try {
    await sendOtp(result.data);
    res.json({ success: true, data: { message: 'OTP sent' }, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send OTP';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// POST /v1/auth/verify-otp
authRouter.post('/verify-otp', otpVerifyLimiter, async (req: Request, res: Response) => {
  const result = VerifyOtpSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }

  try {
    const { accessToken, refreshToken, isNewUser } = await verifyOtp(result.data);
    res.json({
      success: true,
      data: { accessToken, refreshToken, isNewUser },
      error: null,
      meta: {},
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Verification failed';
    res.status(401).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// POST /v1/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const result = RefreshTokenSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: 'Refresh token required', meta: {} });
    return;
  }

  try {
    const tokens = await refreshTokens(result.data.refreshToken);
    res.json({ success: true, data: tokens, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Token refresh failed';
    res.status(401).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// POST /v1/auth/logout
authRouter.post('/logout', authGuard, async (req: AuthRequest, res: Response) => {
  const result = RefreshTokenSchema.safeParse(req.body);
  if (!result.success || !req.userId) {
    res.status(400).json({ success: false, data: null, error: 'Refresh token required', meta: {} });
    return;
  }

  try {
    await logout(req.userId, result.data.refreshToken);
    res.json({ success: true, data: { message: 'Logged out' }, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Logout failed', meta: {} });
  }
});

// POST /v1/auth/google
authRouter.post('/google', async (req: Request, res: Response) => {
  const result = GoogleAuthSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }

  try {
    const { accessToken, refreshToken, isNewUser } = await googleSignIn(result.data);
    res.json({
      success: true,
      data: { accessToken, refreshToken, isNewUser },
      error: null,
      meta: {},
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Google authentication failed';
    res.status(401).json({ success: false, data: null, error: msg, meta: {} });
  }
});
