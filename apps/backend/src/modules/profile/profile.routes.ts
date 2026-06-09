import { Router, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authGuard, type AuthRequest } from '../../middleware/auth-guard';
import {
  UpdateProfileSchema,
  UpdateEducationSchema,
  UpdateOccupationSchema,
  UpdateFamilySchema,
  UpdatePreferencesSchema,
} from './profile.schema';
import {
  getMyProfile,
  upsertProfile,
  upsertEducation,
  upsertOccupation,
  upsertFamily,
  upsertPreferences,
  getProfileById,
  deleteProfile,
  getProfileViews,
} from './profile.service';

import { prisma } from '../../db/prisma';

export const profileRouter = Router();

// GET /v1/profile/metadata/gotras — public
profileRouter.get('/metadata/gotras', async (_req, res) => {
  try {
    const gotras = await prisma.gotra.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: gotras, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch gotras', meta: {} });
  }
});

// GET /v1/profile/metadata/cities — public
profileRouter.get('/metadata/cities', async (_req, res) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: 'asc' },
      include: { state: { select: { name: true } } }
    });
    res.json({ success: true, data: cities, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch cities', meta: {} });
  }
});

// All profile routes require authentication
profileRouter.use(authGuard);

// View rate limiting
const profileViewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req: AuthRequest) => (req.userTier === 'paid' ? 120 : 30),
  keyGenerator: (req: AuthRequest) => req.userId ?? req.ip ?? 'unknown',
  message: { success: false, data: null, error: 'Profile view limit reached', meta: {} },
});

// GET /v1/profile/me
profileRouter.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const profile = await getMyProfile(req.userId!);
    if (!profile) {
      res.json({ success: true, data: null, error: null, meta: {} });
      return;
    }
    res.json({ success: true, data: profile, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch profile', meta: {} });
  }
});

// GET /v1/profile/me/views
profileRouter.get('/me/views', async (req: AuthRequest, res: Response) => {
  try {
    const views = await getProfileViews(req.userId!, req.userTier ?? 'free');
    res.json({ success: true, data: views, error: null, meta: {} });
  } catch (err: any) {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch profile views', meta: {} });
  }
});

// PATCH /v1/profile/me/language
profileRouter.patch('/me/language', async (req: AuthRequest, res: Response) => {
  const { language } = req.body;
  if (language !== 'en' && language !== 'hi') {
    res.status(400).json({ success: false, data: null, error: 'Invalid language', meta: {} });
    return;
  }
  try {
    await prisma.user.update({
      where: { id: req.userId! },
      data: { preferredLanguage: language },
    });
    res.json({ success: true, data: { message: 'Language updated' }, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to update language', meta: {} });
  }
});

// PATCH /v1/profile/me
profileRouter.patch('/me', async (req: AuthRequest, res: Response) => {
  const result = UpdateProfileSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const profile = await upsertProfile(req.userId!, result.data);
    res.json({ success: true, data: profile, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to update profile', meta: {} });
  }
});

// PATCH /v1/profile/me/education
profileRouter.patch('/me/education', async (req: AuthRequest, res: Response) => {
  const result = UpdateEducationSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }
  try {
    await upsertEducation(req.userId!, result.data);
    res.json({ success: true, data: { message: 'Education updated' }, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to update education', meta: {} });
  }
});

// PATCH /v1/profile/me/occupation
profileRouter.patch('/me/occupation', async (req: AuthRequest, res: Response) => {
  const result = UpdateOccupationSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }
  try {
    await upsertOccupation(req.userId!, result.data);
    res.json({ success: true, data: { message: 'Occupation updated' }, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to update occupation', meta: {} });
  }
});

// PATCH /v1/profile/me/family
profileRouter.patch('/me/family', async (req: AuthRequest, res: Response) => {
  const result = UpdateFamilySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }
  try {
    await upsertFamily(req.userId!, result.data);
    res.json({ success: true, data: { message: 'Family updated' }, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to update family', meta: {} });
  }
});

// PATCH /v1/profile/me/preferences
profileRouter.patch('/me/preferences', async (req: AuthRequest, res: Response) => {
  const result = UpdatePreferencesSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }
  try {
    await upsertPreferences(req.userId!, result.data);
    res.json({ success: true, data: { message: 'Preferences updated' }, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to update preferences', meta: {} });
  }
});

// GET /v1/profile/:id
profileRouter.get('/:id', profileViewLimiter, async (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  try {
    const profile = await getProfileById(req.userId!, req.userTier ?? 'free', targetId);
    if (!profile) {
      res.status(404).json({ success: false, data: null, error: 'Profile not found', meta: {} });
      return;
    }

    // Fetch interest relationship
    const interest = await prisma.interest.findFirst({
      where: {
        OR: [
          { senderId: req.userId!, receiverId: targetId },
          { senderId: targetId, receiverId: req.userId! },
        ],
      },
    });

    res.json({ success: true, data: { ...profile, interest }, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch profile', meta: {} });
  }
});


// DELETE /v1/profile/me — hard delete all PII
profileRouter.delete('/me', async (req: AuthRequest, res: Response) => {
  try {
    await deleteProfile(req.userId!);
    res.json({ success: true, data: { message: 'Account deleted' }, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to delete account', meta: {} });
  }
});
