import { prisma } from '../../db/prisma';
import { Resend } from 'resend';
import { sendPushToUser, sendBroadcast } from '../../lib/push.service';
import { getSignedImageUrl } from '../profile/gallery.service';

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Profile Moderation ──────────────────────────────────────────────────────

export async function getPendingProfiles(cursor?: string) {
  const take = 20;
  const profiles = await prisma.profile.findMany({
    where: { adminStatus: 'pending' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, preferredLanguage: true } },
      livingCity: { select: { name: true } },
    },
  });

  const hasMore = profiles.length > take;
  const items = hasMore ? profiles.slice(0, take) : profiles;

  return {
    items,
    meta: {
      next_cursor: hasMore ? btoa(items[items.length - 1].id) : null,
    },
  };
}

export async function moderateProfile(
  profileId: string,
  status: 'approved' | 'rejected' | 'suspended'
) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { user: { select: { email: true, preferredLanguage: true } } },
  });

  if (!profile) throw new Error('Profile not found');

  const updated = await prisma.profile.update({
    where: { id: profileId },
    data: { adminStatus: status },
  });

  // If status is approved, trigger email + push
  if (status === 'approved' && profile.user.email) {
    const isHindi = profile.user.preferredLanguage === 'hi';
    const subject = isHindi ? 'गहोई सारथी — आपकी प्रोफ़ाइल स्वीकृत हो गई है!' : 'Gahoi Sarthi — Your Profile has been Approved!';
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@gahoisarthi.in',
      to: profile.user.email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #FDFAF5; border: 1px solid #E8E0D0; border-radius: 8px;">
          <h2 style="color: #B5620E;">Gahoi Sarthi — गहोई सारथी</h2>
          <p>${isHindi ? 'बधाई हो! आपकी प्रोफ़ाइल स्वीकृत कर दी गई है।' : 'Congratulations! Your profile has been reviewed and approved by the admin.'}</p>
          <p>${isHindi ? 'आपकी प्रोफ़ाइल अब लाइव है और अन्य सदस्य आपसे संपर्क कर सकते हैं।' : 'Your profile is now live. Other members of the community can discover you.'}</p>
          <a href="${process.env.FRONTEND_URL ?? 'https://gahoisarthi.in'}/profile"
             style="display: inline-block; padding: 12px 24px; background: #B5620E; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px;">
            ${isHindi ? 'अपना खाता देखें / View Account' : 'View Account'}
          </a>
        </div>
      `,
    }).catch(() => {});

    // Personal push: tell the user their profile is live
    sendPushToUser(profile.id, {
      title: '🎉 Profile Approved!',
      body: 'Your Gahoi Sarthi profile is now live. Members can discover and connect with you!',
      data: { screen: 'matches' },
    }).catch(() => {});

    // Community broadcast: notify all other active users about the new profile
    sendBroadcast({
      title: '🆕 New Profile Joined!',
      body: 'A new member has joined Gahoi Sarthi. Check out their profile and see if it\'s a match!',
      data: { screen: 'matches' },
    }).catch(() => {});
  }

  return updated;
}

// ─── Photo Moderation ────────────────────────────────────────────────────────

export async function getPendingPhotos(cursor?: string) {
  const take = 20;
  const photos = await prisma.profileGallery.findMany({
    where: { adminStatus: 'pending' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      profile: {
        include: {
          user: { select: { email: true, preferredLanguage: true } },
        },
      },
    },
  });

  const hasMore = photos.length > take;
  const items = hasMore ? photos.slice(0, take) : photos;

  // Generate signed URLs for the pending photos
  const itemsWithSignedUrls = await Promise.all(
    items.map(async (photo) => {
      try {
        const signedUrl = await getSignedImageUrl(photo.r2Key);
        return { ...photo, signedUrl };
      } catch (err) {
        console.error(`Failed to sign URL for R2 key ${photo.r2Key}:`, err);
        return photo;
      }
    })
  );

  return {
    items: itemsWithSignedUrls,
    meta: {
      next_cursor: hasMore ? btoa(items[items.length - 1].id) : null,
    },
  };
}

export async function moderatePhoto(
  galleryId: string,
  status: 'approved' | 'rejected',
  reason?: string
) {
  const photo = await prisma.profileGallery.findUnique({
    where: { id: galleryId },
    include: {
      profile: {
        include: {
          user: { select: { email: true, preferredLanguage: true } },
        },
      },
    },
  });

  if (!photo) throw new Error('Photo not found');

  const updated = await prisma.profileGallery.update({
    where: { id: galleryId },
    data: { adminStatus: status },
  });

  // If rejected, trigger email + push
  if (status === 'rejected' && photo.profile.user.email) {
    const isHindi = photo.profile.user.preferredLanguage === 'hi';
    const subject = isHindi ? 'गहोई सारथी — फोटो अस्वीकृत' : 'Gahoi Sarthi — Photo Rejected';
    const defaultReason = isHindi ? 'हमारी फोटो दिशानिर्देशों का पालन नहीं करता है।' : 'Does not match our photo guidelines.';
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@gahoisarthi.in',
      to: photo.profile.user.email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #FDFAF5; border: 1px solid #E8E0D0; border-radius: 8px;">
          <h2 style="color: #D32F2F;">Gahoi Sarthi — गहोई सारथी</h2>
          <p>${isHindi ? 'आपकी हाल ही में अपलोड की गई फोटो अस्वीकृत कर दी गई है।' : 'Your recently uploaded photo has been rejected during moderation.'}</p>
          <div style="margin: 16px 0; padding: 12px; background: #FFEBEE; border-left: 4px solid #D32F2F; color: #C62828;">
            <strong>${isHindi ? 'अस्वीकृति का कारण / Reason:' : 'Reason for rejection:'}</strong> ${reason ?? defaultReason}
          </div>
          <p>${isHindi ? 'कृपया स्पष्ट फोटो अपलोड करें।' : 'Please upload a clear, appropriate photo.'}</p>
          <a href="${process.env.FRONTEND_URL ?? 'https://gahoisarthi.in'}/profile"
             style="display: inline-block; padding: 12px 24px; background: #D32F2F; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px;">
            ${isHindi ? 'फोटो फिर से अपलोड करें / Re-upload Photo' : 'Re-upload Photo'}
          </a>
        </div>
      `,
    }).catch(() => {});

    // Personal push: tell the user to re-upload
    sendPushToUser(photo.profileId, {
      title: '📸 Photo Needs Attention',
      body: 'Your uploaded photo was rejected during review. Please upload a new clear photo.',
      data: { screen: 'profile_edit' },
    }).catch(() => {});
  }

  return updated;
}

// ─── Reports Moderation ──────────────────────────────────────────────────────

export async function getReports(cursor?: string) {
  const take = 20;
  const reports = await prisma.profileReport.findMany({
    where: { status: 'open' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      reported: {
        include: {
          user: { select: { email: true } },
        },
      },
    },
  });

  const hasMore = reports.length > take;
  const items = hasMore ? reports.slice(0, take) : reports;

  return {
    items,
    meta: {
      next_cursor: hasMore ? btoa(items[items.length - 1].id) : null,
    },
  };
}

export async function resolveReport(
  reportId: string,
  action: 'resolve_no_action' | 'resolve_suspend_user'
) {
  const report = await prisma.profileReport.findUnique({
    where: { id: reportId },
  });

  if (!report) throw new Error('Report not found');

  // Mark report as resolved
  const updatedReport = await prisma.profileReport.update({
    where: { id: reportId },
    data: { status: 'resolved' },
  });

  if (action === 'resolve_suspend_user') {
    await prisma.user.update({
      where: { id: report.reportedId },
      data: { status: 'Suspended' },
    });
  }

  return updatedReport;
}

// ─── Admin Dashboard Analytics ────────────────────────────────────────────────

export async function getAnalyticsDashboard() {
  const totalUsers = await prisma.user.count();
  const paidUsers = await prisma.user.count({ where: { tier: 'paid' } });
  const freeUsers = totalUsers - paidUsers;

  const pendingProfiles = await prisma.profile.count({ where: { adminStatus: 'pending' } });
  const pendingPhotos = await prisma.profileGallery.count({ where: { adminStatus: 'pending' } });
  const openReports = await prisma.profileReport.count({ where: { status: 'open' } });

  // Signups in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSignups = await prisma.user.count({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
  });

  return {
    totalUsers,
    paidUsers,
    freeUsers,
    pendingProfiles,
    pendingPhotos,
    openReports,
    recentSignups,
  };
}

// ─── User Management ──────────────────────────────────────────────────────────

export async function searchUsers(search?: string, cursor?: string) {
  const take = 20;

  const numericSearch = search && !isNaN(Number(search)) ? Number(search) : undefined;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          ...(numericSearch !== undefined ? [{ profile: { is: { profileId: numericSearch } } }] : []),
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      tier: true,
      status: true,
      preferredLanguage: true,
      expoPushToken: true,
      createdAt: true,
      lastActiveAt: true,
      profile: {
        select: {
          profileId: true,
          adminStatus: true,
          gender: true,
          livingCity: { select: { name: true } },
        },
      },
    },
  });

  const hasMore = users.length > take;
  const items = hasMore ? users.slice(0, take) : users;

  return {
    items: items.map((u) => ({ ...u, hasPushToken: !!u.expoPushToken, expoPushToken: undefined })),
    meta: { next_cursor: hasMore ? btoa(items[items.length - 1].id) : null },
  };
}

export async function updateUserTier(userId: string, tier: 'free' | 'paid') {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  return prisma.user.update({
    where: { id: userId },
    data: { tier },
    select: { id: true, email: true, tier: true, status: true },
  });
}

export async function updateUserStatus(userId: string, status: 'Active' | 'Suspended') {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  return prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, email: true, tier: true, status: true },
  });
}

// ─── Subscription Plans ───────────────────────────────────────────────────────

export async function listPlans() {
  return prisma.subscriptionPlan.findMany({
    orderBy: { priceInr: 'asc' },
    include: {
      _count: { select: { subscriptions: true } },
    },
  });
}

export async function createPlan(data: {
  name: string;
  nameHi: string;
  durationDays: number;
  priceInr: number;
}) {
  return prisma.subscriptionPlan.create({ data });
}

export async function updatePlan(
  planId: string,
  data: Partial<{
    name: string;
    nameHi: string;
    durationDays: number;
    priceInr: number;
    isActive: boolean;
  }>
) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error('Plan not found');

  return prisma.subscriptionPlan.update({ where: { id: planId }, data });
}

// ─── Revenue & Subscriptions ──────────────────────────────────────────────────

export async function listSubscriptions(cursor?: string) {
  const take = 30;

  const subscriptions = await prisma.subscription.findMany({
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      plan: { select: { name: true, priceInr: true } },
    },
  });

  const hasMore = subscriptions.length > take;
  const items = hasMore ? subscriptions.slice(0, take) : subscriptions;

  return {
    items,
    meta: { next_cursor: hasMore ? btoa(items[items.length - 1].id) : null },
  };
}

export async function getRevenueSummary() {
  // Total paid subscriptions (confirmed = status 'paid')
  const paidSubs = await prisma.subscription.findMany({
    where: { status: 'paid' },
    include: { plan: { select: { priceInr: true } } },
  });

  const totalRevenue = paidSubs.reduce((sum, s) => sum + s.plan.priceInr, 0);
  const activeSubscriptions = await prisma.subscription.count({
    where: { status: 'paid', expiresAt: { gte: new Date() } },
  });

  // Revenue this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlyRevenue = paidSubs
    .filter((s) => s.createdAt >= startOfMonth)
    .reduce((sum, s) => sum + s.plan.priceInr, 0);

  return { totalRevenue, activeSubscriptions, monthlyRevenue, totalPaidCount: paidSubs.length };
}
