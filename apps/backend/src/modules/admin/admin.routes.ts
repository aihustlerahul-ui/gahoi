import { Router, Response } from 'express';
import { adminAuthGuard, requireAdminRole, type AuthRequest } from '../../middleware/auth-guard';
import { prisma } from '../../db/prisma';
import { z } from 'zod';
import {
  ModerateProfileSchema,
  ModeratePhotoSchema,
  ResolveReportSchema,
  ListProfilesQuerySchema,
  ListInterestsQuerySchema,
  VerifiedBadgeSchema,
  EmailBroadcastSchema,
  CreateAdminSchema,
  UpdateAdminSchema,
  UpdateSuccessStorySchema,
  CreateSuccessStorySchema,
} from './admin.schema';
import {
  listProfiles,
  getAdminProfileById,
  moderateProfile,
  deleteProfile,
  toggleProfileVerified,
  getPendingPhotos,
  moderatePhoto,
  getReports,
  resolveReport,
  listInterests,
  getInterestAbuseAlerts,
  sendEmailBroadcast,
  getAnalyticsDashboard,
  getSignupAnalytics,
  searchUsers,
  updateUserTier,
  updateUserStatus,
  listPlans,
  createPlan,
  updatePlan,
  listSubscriptions,
  getRevenueSummary,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  listSuccessStories,
  createSuccessStory,
  updateSuccessStory,
  deleteSuccessStory,
} from './admin.service';
import { sendBroadcast } from '../../lib/push.service';
import { createPushBannerUploadUrl } from './push-banner.service';

export const adminRouter = Router();

const superAdminOnly = requireAdminRole(['super_admin', 'SuperAdmin']);

adminRouter.use(adminAuthGuard);

// ─── Profiles ────────────────────────────────────────────────────────────────

adminRouter.get('/profiles', async (req: AuthRequest, res: Response) => {
  const parsed = ListProfilesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }

  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  const filters = {
    status: parsed.data.status ?? 'pending',
    gender: parsed.data.gender,
    cityId: parsed.data.cityId,
    tier: parsed.data.tier,
    verified: parsed.data.verified === 'true' ? true : parsed.data.verified === 'false' ? false : undefined,
    flagged: parsed.data.flagged === 'true' ? true : parsed.data.flagged === 'false' ? false : undefined,
    search: parsed.data.search,
  };

  try {
    const result = await listProfiles(filters, cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch profiles', meta: {} });
  }
});

adminRouter.get('/profiles/:id', async (req: AuthRequest, res: Response) => {
  try {
    const profile = await getAdminProfileById(req.params.id);
    if (!profile) {
      res.status(404).json({ success: false, data: null, error: 'Profile not found', meta: {} });
      return;
    }
    res.json({ success: true, data: profile, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch profile', meta: {} });
  }
});

adminRouter.post('/profiles/:id/moderate', async (req: AuthRequest, res: Response) => {
  const result = ModerateProfileSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }

  if (result.data.status === 'rejected' && !result.data.reason) {
    res.status(400).json({ success: false, data: null, error: 'Reason is required when rejecting a profile', meta: {} });
    return;
  }

  try {
    const updated = await moderateProfile(
      req.params.id,
      result.data.status,
      result.data.reason,
      req.adminId
    );
    res.json({ success: true, data: updated, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to moderate profile';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

adminRouter.delete('/profiles/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteProfile(req.params.id, req.adminId);
    res.json({ success: true, data: result, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete profile';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

adminRouter.patch('/profiles/:id/verified', async (req: AuthRequest, res: Response) => {
  const parsed = VerifiedBadgeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }

  try {
    const updated = await toggleProfileVerified(req.params.id, parsed.data.isVerified, req.adminId);
    res.json({ success: true, data: updated, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update verification';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// ─── Photos ──────────────────────────────────────────────────────────────────

adminRouter.get('/photos', async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await getPendingPhotos(cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch pending photos', meta: {} });
  }
});

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

// ─── Interests ───────────────────────────────────────────────────────────────

adminRouter.get('/interests', async (req: AuthRequest, res: Response) => {
  const parsed = ListInterestsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }

  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await listInterests(parsed.data, cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch interests', meta: {} });
  }
});

adminRouter.get('/interests/abuse', async (_req: AuthRequest, res: Response) => {
  try {
    const alerts = await getInterestAbuseAlerts();
    res.json({ success: true, data: alerts, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch abuse alerts', meta: {} });
  }
});

// ─── Reports ─────────────────────────────────────────────────────────────────

adminRouter.get('/reports', async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await getReports(cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch reports', meta: {} });
  }
});

adminRouter.post('/reports/:id/resolve', async (req: AuthRequest, res: Response) => {
  const result = ResolveReportSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }

  try {
    const resolved = await resolveReport(req.params.id, result.data.action, req.adminId);
    res.json({ success: true, data: resolved, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to resolve report';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// ─── Dashboard & Analytics ───────────────────────────────────────────────────

adminRouter.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await getAnalyticsDashboard();
    res.json({ success: true, data: stats, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch dashboard stats', meta: {} });
  }
});

adminRouter.get('/analytics/signups', async (req: AuthRequest, res: Response) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  try {
    const data = await getSignupAnalytics(days);
    res.json({ success: true, data, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch signup analytics', meta: {} });
  }
});

// ─── Email Broadcast (super_admin only) ──────────────────────────────────────

adminRouter.post('/email/broadcast', superAdminOnly, async (req: AuthRequest, res: Response) => {
  const parsed = EmailBroadcastSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }

  try {
    const result = await sendEmailBroadcast(
      parsed.data.segment,
      parsed.data.subject,
      parsed.data.bodyHtml,
      req.adminId
    );
    res.json({ success: true, data: result, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Broadcast failed';
    res.status(500).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// ─── Push (super_admin only) ─────────────────────────────────────────────────

const PushBannerUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

adminRouter.post('/push/upload-url', superAdminOnly, async (req: AuthRequest, res: Response) => {
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

const BroadcastSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(250),
  data: z.record(z.unknown()).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

adminRouter.post('/push/broadcast', superAdminOnly, async (req: AuthRequest, res: Response) => {
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
    const recipientCount = await sendBroadcast({
      title,
      body,
      data,
      imageUrl: imageUrl || undefined,
    });

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

adminRouter.get('/push/campaigns', superAdminOnly, async (_req: AuthRequest, res: Response) => {
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

// ─── User Management (tier override: super_admin only) ───────────────────────

adminRouter.get('/users', superAdminOnly, async (req: AuthRequest, res: Response) => {
  const search = req.query.search as string | undefined;
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await searchUsers(search, cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch users', meta: {} });
  }
});

const UpdateTierSchema = z.object({ tier: z.enum(['free', 'paid']) });

adminRouter.patch('/users/:id/tier', superAdminOnly, async (req: AuthRequest, res: Response) => {
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

const UpdateStatusSchema = z.object({ status: z.enum(['Active', 'Suspended']) });

adminRouter.patch('/users/:id/status', superAdminOnly, async (req: AuthRequest, res: Response) => {
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

// ─── Subscription Plans (super_admin only) ───────────────────────────────────

adminRouter.get('/plans', superAdminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const plans = await listPlans();
    res.json({ success: true, data: plans, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch plans', meta: {} });
  }
});

const CreatePlanSchema = z.object({
  name: z.string().min(1),
  nameHi: z.string().min(1),
  durationDays: z.number().int().positive(),
  priceInr: z.number().int().positive(),
});

adminRouter.post('/plans', superAdminOnly, async (req: AuthRequest, res: Response) => {
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

const UpdatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  nameHi: z.string().min(1).optional(),
  durationDays: z.number().int().positive().optional(),
  priceInr: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

adminRouter.patch('/plans/:id', superAdminOnly, async (req: AuthRequest, res: Response) => {
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

// ─── Revenue & Subscriptions (super_admin only) ──────────────────────────────

adminRouter.get('/revenue', superAdminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const summary = await getRevenueSummary();
    res.json({ success: true, data: summary, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch revenue', meta: {} });
  }
});

adminRouter.get('/subscriptions', superAdminOnly, async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  const expiry = req.query.expiry as 'active' | 'expired' | 'all' | undefined;
  try {
    const result = await listSubscriptions(cursor, expiry ?? 'all');
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch subscriptions', meta: {} });
  }
});

// ─── Admin User CRUD (super_admin only) ──────────────────────────────────────

adminRouter.get('/admins', superAdminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const admins = await listAdmins();
    res.json({ success: true, data: admins, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch admins', meta: {} });
  }
});

adminRouter.post('/admins', superAdminOnly, async (req: AuthRequest, res: Response) => {
  const parsed = CreateAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const admin = await createAdmin(parsed.data);
    res.status(201).json({ success: true, data: admin, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create admin';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

adminRouter.patch('/admins/:id', superAdminOnly, async (req: AuthRequest, res: Response) => {
  const parsed = UpdateAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const admin = await updateAdmin(req.params.id, parsed.data);
    res.json({ success: true, data: admin, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update admin';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

adminRouter.delete('/admins/:id', superAdminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteAdmin(req.params.id);
    res.json({ success: true, data: result, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to deactivate admin';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// ─── Success Stories ─────────────────────────────────────────────────────────

adminRouter.get('/success-stories', async (req: AuthRequest, res: Response) => {
  const status = req.query.status as string | undefined;
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await listSuccessStories(status, cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch success stories', meta: {} });
  }
});

adminRouter.post('/success-stories', superAdminOnly, async (req: AuthRequest, res: Response) => {
  const parsed = CreateSuccessStorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const story = await createSuccessStory(parsed.data);
    res.status(201).json({ success: true, data: story, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create success story';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

adminRouter.patch('/success-stories/:id', superAdminOnly, async (req: AuthRequest, res: Response) => {
  const parsed = UpdateSuccessStorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, data: null, error: parsed.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const story = await updateSuccessStory(req.params.id, parsed.data, req.adminId);
    res.json({ success: true, data: story, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update success story';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

adminRouter.delete('/success-stories/:id', superAdminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteSuccessStory(req.params.id, req.adminId);
    res.json({ success: true, data: result, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete success story';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});
