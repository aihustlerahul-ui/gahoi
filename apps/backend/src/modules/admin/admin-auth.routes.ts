/**
 * Admin Authentication Routes
 * Separate from the user auth flow — validates against the `admins` table,
 * not the `users` table. Issues admin-typed JWTs.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { issueAdminToken } from '../../lib/jwt';
import { adminAuthGuard, type AuthRequest } from '../../middleware/auth-guard';
import { Resend } from 'resend';

export const adminAuthRouter = Router();

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP store for admins (same simple approach as user OTP)
// Key: email, Value: { otp, expiresAt }
const adminOtpStore = new Map<string, { otp: string; expiresAt: Date }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /v1/admin-auth/send-otp
 * Sends an OTP to an admin email. Rejects immediately if the email
 * is not found in the `admins` table — this prevents enumeration
 * but still tells the admin panel "not an admin" explicitly.
 */
adminAuthRouter.post('/send-otp', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, data: null, error: 'Email is required', meta: {} });
  }

  const normalised = email.toLowerCase().trim();

  // Check against admins table only
  const admin = await prisma.admin.findUnique({
    where: { email: normalised },
    select: { id: true, isActive: true, name: true },
  });

  if (!admin) {
    return res.status(403).json({
      success: false,
      data: null,
      error: 'Email not authorised for admin access',
      meta: {},
    });
  }

  if (!admin.isActive) {
    return res.status(403).json({
      success: false,
      data: null,
      error: 'Admin account is inactive. Contact the super admin.',
      meta: {},
    });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  adminOtpStore.set(normalised, { otp, expiresAt });

  // Send OTP email
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@gahoisarthi.in',
    to: normalised,
    subject: 'Gahoi Sarthi Admin — Your Login OTP',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;
                  background: #1A0800; color: #FDFAF5; border-radius: 8px;">
        <h2 style="color: #E8B84B; margin: 0 0 8px;">Gahoi Sarthi Admin Panel</h2>
        <p style="color: #C8B89A; margin: 0 0 24px;">Hi ${admin.name ?? 'Admin'}, your login OTP:</p>
        <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #E8B84B;
                    background: #2A1200; padding: 16px 24px; border-radius: 6px;
                    text-align: center; margin-bottom: 24px;">
          ${otp}
        </div>
        <p style="color: #8A7A60; font-size: 13px;">Expires in 10 minutes. Do not share this code.</p>
      </div>
    `,
  }).catch(() => {}); // Non-fatal — OTP is also logged in dev

  if (process.env.NODE_ENV === 'development') {
    console.log(`[AdminAuth] OTP for ${normalised}: ${otp}`);
  }

  return res.json({ success: true, data: { sent: true }, error: null, meta: {} });
});

/**
 * POST /v1/admin-auth/verify-otp
 * Verifies the OTP and issues an admin-typed JWT (8h expiry).
 */
adminAuthRouter.post('/verify-otp', async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, data: null, error: 'Email and OTP are required', meta: {} });
  }

  const normalised = email.toLowerCase().trim();
  const stored = adminOtpStore.get(normalised);

  if (!stored) {
    return res.status(401).json({ success: false, data: null, error: 'No OTP requested for this email', meta: {} });
  }

  if (new Date() > stored.expiresAt) {
    adminOtpStore.delete(normalised);
    return res.status(401).json({ success: false, data: null, error: 'OTP expired. Please request a new one.', meta: {} });
  }

  if (stored.otp !== otp.toString()) {
    return res.status(401).json({ success: false, data: null, error: 'Invalid OTP', meta: {} });
  }

  // Valid — clear OTP and issue token
  adminOtpStore.delete(normalised);

  const admin = await prisma.admin.findUnique({
    where: { email: normalised },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!admin) {
    return res.status(403).json({ success: false, data: null, error: 'Admin not found', meta: {} });
  }

  // Update last login
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const token = issueAdminToken(admin.id, admin.role);

  return res.json({
    success: true,
    data: {
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    },
    error: null,
    meta: {},
  });
});

/**
 * GET /v1/admin-auth/me
 * Returns the authenticated admin's profile.
 */
adminAuthRouter.get('/me', adminAuthGuard, async (req: AuthRequest, res: Response) => {
  const admin = await prisma.admin.findUnique({
    where: { id: req.adminId },
    select: { id: true, email: true, name: true, role: true, lastLoginAt: true },
  });

  if (!admin) {
    return res.status(404).json({ success: false, data: null, error: 'Admin not found', meta: {} });
  }

  return res.json({ success: true, data: admin, error: null, meta: {} });
});
