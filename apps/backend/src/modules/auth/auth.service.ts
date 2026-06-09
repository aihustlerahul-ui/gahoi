import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import { issueAccessToken, issueRefreshToken, verifyToken } from '../../lib/jwt';
import { Resend } from 'resend';
import { OAuth2Client } from 'google-auth-library';
import type { SendOtpInput, VerifyOtpInput, GoogleAuthInput } from './auth.schema';

const resend = new Resend(process.env.RESEND_API_KEY);
const googleClient = new OAuth2Client(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID);

// OTP config
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
// Escalating lockout durations (minutes)
const LOCKOUT_DURATIONS = [30, 120, 240, 1440]; // 30min, 2hr, 4hr, 24hr

function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function timingSafeEqual(a: string, b: string): boolean {
  // Always compare same-length buffers to prevent timing attacks
  const bufA = Buffer.from(a.padEnd(64, '0'));
  const bufB = Buffer.from(b.padEnd(64, '0'));
  return crypto.timingSafeEqual(bufA, bufB) && a.length === b.length;
}

function getLockoutDuration(attemptCount: number): number {
  // Returns lockout duration in minutes based on how many times they've been locked
  const idx = Math.min(attemptCount, LOCKOUT_DURATIONS.length - 1);
  return LOCKOUT_DURATIONS[idx];
}

// ── Send OTP ──────────────────────────────────────────────────────────────────

export async function sendOtp(input: SendOtpInput): Promise<void> {
  const { email } = input;

  // Check if there's an active lockout
  const existing = await prisma.otpRequest.findFirst({
    where: {
      email,
      used: false,
      lockedUntil: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    throw new Error('Invalid or expired OTP'); // Intentionally generic
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, isEmailVerified: false },
    });
  }

  // Invalidate previous OTP requests for this email
  await prisma.otpRequest.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  await prisma.otpRequest.create({
    data: {
      email,
      otpHash,
      userId: user.id,
    },
  });

  // Send OTP email via Resend
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@gahoisarthi.in',
    to: email,
    subject: 'Your Gahoi Sarthi OTP / आपका OTP',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1A0800;">Gahoi Sarthi — गहोई सारथी</h2>
        <p>Your one-time password (OTP) is:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #E8B84B; padding: 16px 0;">
          ${otp}
        </div>
        <p>आपका OTP: <strong>${otp}</strong></p>
        <p style="color: #666; font-size: 13px;">
          This OTP expires in 10 minutes. Do not share it with anyone.<br>
          यह OTP 10 मिनट में समाप्त हो जाएगा। इसे किसी के साथ साझा न करें।
        </p>
      </div>
    `,
  });
}

// ── Verify OTP ────────────────────────────────────────────────────────────────

export async function verifyOtp(input: VerifyOtpInput): Promise<{
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}> {
  const { email, otp } = input;
  const GENERIC_ERROR = 'Invalid or expired OTP';

  // Find the latest unused OTP for this email
  const otpRecord = await prisma.otpRequest.findFirst({
    where: { email, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) throw new Error(GENERIC_ERROR);

  // Check lockout
  if (otpRecord.lockedUntil && otpRecord.lockedUntil > new Date()) {
    throw new Error(GENERIC_ERROR);
  }

  // Check expiry
  const ageMs = Date.now() - otpRecord.createdAt.getTime();
  if (ageMs > OTP_EXPIRY_MS) {
    await prisma.otpRequest.update({ where: { id: otpRecord.id }, data: { used: true } });
    throw new Error(GENERIC_ERROR);
  }

  // Timing-safe OTP comparison
  const inputHash = hashOtp(otp);
  const isValid = timingSafeEqual(inputHash, otpRecord.otpHash);

  if (!isValid) {
    const newAttempts = otpRecord.attempts + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
      // Count how many times they've been locked out before
      const lockoutCount = await prisma.otpRequest.count({
        where: {
          email,
          lockedUntil: { not: null },
        },
      });
      const lockDurationMin = getLockoutDuration(lockoutCount);
      const lockedUntil = new Date(Date.now() + lockDurationMin * 60 * 1000);

      await prisma.otpRequest.update({
        where: { id: otpRecord.id },
        data: { attempts: newAttempts, lockedUntil },
      });
    } else {
      await prisma.otpRequest.update({
        where: { id: otpRecord.id },
        data: { attempts: newAttempts },
      });
    }

    throw new Error(GENERIC_ERROR);
  }

  // OTP valid — mark as used
  await prisma.otpRequest.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  // Get or create user
  let user = await prisma.user.findUnique({ where: { email } });
  const isNewUser = !user?.isEmailVerified;

  if (!user) {
    user = await prisma.user.create({
      data: { email, isEmailVerified: true },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, lastActiveAt: new Date() },
    });
  }

  // Issue tokens
  const accessToken = issueAccessToken(user.id, user.tier);
  const rawRefreshToken = issueRefreshToken(user.id);
  const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return { accessToken, refreshToken: rawRefreshToken, isNewUser };
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

export async function refreshTokens(rawToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // Verify JWT signature first
  let payload;
  try {
    payload = verifyToken(rawToken);
  } catch {
    throw new Error('Invalid refresh token');
  }

  if (payload.type !== 'refresh') throw new Error('Invalid refresh token');

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const stored = await prisma.refreshToken.findFirst({
    where: {
      userId: payload.sub as string,
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!stored) {
    // Possible token reuse — invalidate ALL sessions for this user
    await prisma.refreshToken.updateMany({
      where: { userId: payload.sub as string, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new Error('Invalid refresh token');
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const newAccessToken = issueAccessToken(stored.user.id, stored.user.tier);
  const newRawRefresh = issueRefreshToken(stored.user.id);
  const newHash = crypto.createHash('sha256').update(newRawRefresh).digest('hex');

  await prisma.refreshToken.create({
    data: {
      userId: stored.user.id,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRawRefresh };
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout(userId: string, rawToken: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.refreshToken.updateMany({
    where: { userId, tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ── Google Sign-In ────────────────────────────────────────────────────────────

export async function googleSignIn(input: GoogleAuthInput): Promise<{
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}> {
  const ticket = await googleClient.verifyIdToken({
    idToken: input.idToken,
    audience: [
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
    ],
  });

  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error('Invalid Google token');

  const email = payload.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });
  const isNewUser = !user;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        isEmailVerified: true,
        authProvider: 'google',
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
  }

  const accessToken = issueAccessToken(user.id, user.tier);
  const rawRefreshToken = issueRefreshToken(user.id);
  const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken: rawRefreshToken, isNewUser };
}
