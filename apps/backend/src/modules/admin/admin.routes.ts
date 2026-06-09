import { Router, Response } from 'express';
import { adminAuthGuard, type AuthRequest } from '../../middleware/auth-guard';
import { prisma } from '../../db/prisma';
import { z } from 'zod';
import {
  ModerateProfileSchema,
  ModeratePhotoSchema,
  ResolveReportSchema,
} from './admin.schema';
import {
  getPendingProfiles,
  moderateProfile,
  getPendingPhotos,
  moderatePhoto,
  getReports,
  resolveReport,
  getAnalyticsDashboard,
  searchUsers,
  updateUserTier,
  updateUserStatus,
  listPlans,
  createPlan,
  updatePlan,
  listSubscriptions,
  getRevenueSummary,
} from './admin.service';
import { sendBroadcast } from '../../lib/push.service';
import { createPushBannerUploadUrl } from './push-banner.service';

export const adminRouter = Router();

// All admin routes require a valid admin-typed JWT (issued by /v1/admin-auth/verify-otp)
adminRouter.use(adminAuthGuard);

// GET /v1/admin/profiles — list profiles pending moderation
adminRouter.get('/profiles', async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await getPendingProfiles(cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch pending profiles', meta: {} });
  }
});

// POST /v1/admin/profiles/:id/moderate — approve, reject, or suspend a profile
adminRouter.post('/profiles/:id/moderate', async (req: AuthRequest, res: Response) => {
  const result = ModerateProfileSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }

  try {
    const updated = await moderateProfile(req.params.id, result.data.status);
    res.json({ success: true, data: updated, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to moderate profile';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// GET /v1/admin/photos — list photos pending moderation
adminRouter.get('/photos', async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await getPendingPhotos(cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch pending photos', meta: {} });
  }
});

// POST /v1/admin/photos/:id/moderate — approve or reject a photo
adminRouter.post('/photos/:id/moderate', async (req: AuthRequest, res: Response) => {
  const result = ModeratePhotoSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }

  try {
    const updated = await moderatePhoto(req.params.id, result.data.status, result.data.reason);
    res.json({ success: true, data: updated, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to moderate photo';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// GET /v1/admin/reports — list open profile reports
adminRouter.get('/reports', async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await getReports(cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch reports', meta: {} });
  }
});

// POST /v1/admin/reports/:id/resolve — resolve a report (with optional user suspension)
adminRouter.post('/reports/:id/resolve', async (req: AuthRequest, res: Response) => {
  const result = ResolveReportSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }

  try {
    const resolved = await resolveReport(req.params.id, result.data.action);
    res.json({ success: true, data: resolved, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to resolve report';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// GET /v1/admin/dashboard — analytics overview for dashboard
adminRouter.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getAnalyticsDashboard();
    res.json({ success: true, data: stats, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch dashboard stats', meta: {} });
  }
});

// POST /v1/admin/push/upload-url — presigned R2 upload for push banner images
const PushBannerUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

adminRouter.post('/push/upload-url', async (req: AuthRequest, res: Response) => {
  const parsed = PushBannerUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      data: null,
      error: parsed.error.errors[0]?.message ?? 'Invalid payload',
      meta: {},
    });
    return;
  }

  try {
    const result = await createPushBannerUploadUrl(parsed.data.contentType);
    res.json({ success: true, data: result, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create upload URL';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// POST /v1/admin/push/broadcast — send a promotional push notification to all users
const BroadcastSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(250),
  data: z.record(z.unknown()).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

adminRouter.post('/push/broadcast', async (req: AuthRequest, res: Response) => {
  const parsed = BroadcastSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      data: null,
      error: parsed.error.errors[0]?.message ?? 'Invalid payload',
      meta: {},
    });
    return;
  }

  try {
    const { title, body, data, imageUrl } = parsed.data;

    // Send to all users with a push token
    const recipientCount = await sendBroadcast({
      title,
      body,
      data,
      imageUrl: imageUrl || undefined,
    });

    // Record the campaign
    const campaign = await prisma.pushCampaign.create({
      data: {
        title,
        body,
        data: { ...(data ?? {}), ...(imageUrl ? { imageUrl } : {}) } as object,
        recipientCount,
      },
    });

    res.json({
      success: true,
      data: { campaignId: campaign.id, recipientCount },
      error: null,
      meta: {},
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Broadcast failed';
    res.status(500).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// GET /v1/admin/push/campaigns — list past broadcast campaigns
adminRouter.get('/push/campaigns', async (_req: AuthRequest, res: Response) => {
  try {
    const campaigns = await prisma.pushCampaign.findMany({
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: campaigns, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch campaigns', meta: {} });
  }
});

// ── User Management ─────────────────────────────────────────────────────────

// GET /v1/admin/users — search + paginate users
adminRouter.get('/users', async (req: AuthRequest, res: Response) => {
  const search = req.query.search as string | undefined;
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await searchUsers(search, cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch users', meta: {} });
  }
});

// PATCH /v1/admin/users/:id/tier — change user tier (free / paid)
const UpdateTierSchema = z.object({ tier: z.enum(['free', 'paid']) });

adminRouter.patch('/users/:id/tier', async (req: AuthRequest, res: Response) => {
  const parsed = UpdateTierSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const updated = await updateUserTier(req.params.id, parsed.data.tier);
    res.json({ success: true, data: updated, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update tier';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// PATCH /v1/admin/users/:id/status — suspend or activate a user
const UpdateStatusSchema = z.object({ status: z.enum(['Active', 'Suspended']) });

adminRouter.patch('/users/:id/status', async (req: AuthRequest, res: Response) => {
  const parsed = UpdateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const updated = await updateUserStatus(req.params.id, parsed.data.status);
    res.json({ success: true, data: updated, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update status';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// ── Subscription Plans ───────────────────────────────────────────────────────

// GET /v1/admin/plans — list all plans
adminRouter.get('/plans', async (_req: AuthRequest, res: Response) => {
  try {
    const plans = await listPlans();
    res.json({ success: true, data: plans, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch plans', meta: {} });
  }
});

// POST /v1/admin/plans — create a new plan
const CreatePlanSchema = z.object({
  name: z.string().min(1),
  nameHi: z.string().min(1),
  durationDays: z.number().int().positive(),
  priceInr: z.number().int().positive(),
});

adminRouter.post('/plans', async (req: AuthRequest, res: Response) => {
  const parsed = CreatePlanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const plan = await createPlan(parsed.data);
    res.status(201).json({ success: true, data: plan, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create plan';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// PATCH /v1/admin/plans/:id — update or toggle a plan
const UpdatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  nameHi: z.string().min(1).optional(),
  durationDays: z.number().int().positive().optional(),
  priceInr: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

adminRouter.patch('/plans/:id', async (req: AuthRequest, res: Response) => {
  const parsed = UpdatePlanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const plan = await updatePlan(req.params.id, parsed.data);
    res.json({ success: true, data: plan, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update plan';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// ── Revenue & Subscriptions ──────────────────────────────────────────────────

// GET /v1/admin/revenue — summary stats
adminRouter.get('/revenue', async (_req: AuthRequest, res: Response) => {
  try {
    const summary = await getRevenueSummary();
    res.json({ success: true, data: summary, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch revenue', meta: {} });
  }
});

// GET /v1/admin/subscriptions — paginated subscription history
adminRouter.get('/subscriptions', async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await listSubscriptions(cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch subscriptions', meta: {} });
  }
});
