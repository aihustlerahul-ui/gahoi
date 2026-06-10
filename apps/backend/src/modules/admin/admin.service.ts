import * as React from 'react';
import { render } from '@react-email/components';
import {
  ProfileApprovedEmail,
  ProfileRejectedEmail,
  ReportOutcomeEmail,
} from '@gahoisarthi/email-templates';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { Resend } from 'resend';
import { sendPushToUser, sendBroadcast } from '../../lib/push.service';
import { getSignedImageUrl } from '../profile/gallery.service';
import { serializeFullProfile } from '../profile/profile.service';

const resend = new Resend(process.env.RESEND_API_KEY);

const INTEREST_ABUSE_THRESHOLD = Number(process.env.INTEREST_ABUSE_THRESHOLD ?? '10');
const FLAGGED_REPORT_THRESHOLD = 3;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://gahoisarthi.in';

const ADMIN_PROFILE_INCLUDE = {
  user: true,
  education: true,
  occupation: true,
  family: {
    include: {
      maternalUncleAaknaMaster: { select: { id: true, name: true } },
    },
  },
  preferences: true,
  livingCity: { select: { id: true, name: true } },
  birthCity: { select: { id: true, name: true, state: { select: { name: true } } } },
  country: { select: { id: true, name: true, iso2: true } },
  gotraMaster: {
    select: {
      id: true,
      key: true,
      name: true,
      gotraHindi: true,
      gotraEnglish: true,
      rishi: true,
      kuldevi: true,
    },
  },
  selectedAakna: { select: { id: true, name: true } },
  gallery: {
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>
) {
  await prisma.adminActionLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  }).catch(() => {});
}

async function getOpenReportCounts(profileIds: string[]): Promise<Map<string, number>> {
  if (profileIds.length === 0) return new Map();

  const rows = await prisma.profileReport.groupBy({
    by: ['reportedId'],
    where: { reportedId: { in: profileIds }, status: 'open' },
    _count: { _all: true },
  });

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.reportedId, row._count._all);
  }
  return map;
}

async function getFlaggedProfileIds(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ reported_id: string }[]>(
    Prisma.sql`
      SELECT reported_id
      FROM profile_reports
      WHERE status = 'open'
      GROUP BY reported_id
      HAVING COUNT(*) >= ${FLAGGED_REPORT_THRESHOLD}
    `
  );
  return rows.map((r) => r.reported_id);
}

function serializeAdminProfileListItem(
  profile: {
    id: string;
    profileId: number;
    gender: string | null;
    gotra: string | null;
    adminStatus: string;
    isVerified: boolean;
    profileCompletenessPct: number;
    createdAt: Date;
    user: { email: string; tier: string; status: string };
    livingCity: { name: string } | null;
  },
  openReportCount: number
) {
  return {
    id: profile.id,
    profileId: profile.profileId,
    gender: profile.gender,
    gotra: profile.gotra,
    adminStatus: profile.adminStatus,
    isVerified: profile.isVerified,
    profileCompletenessPct: profile.profileCompletenessPct,
    createdAt: profile.createdAt,
    email: profile.user.email,
    tier: profile.user.tier,
    userStatus: profile.user.status,
    city: profile.livingCity?.name ?? null,
    openReportCount,
    isFlagged: openReportCount >= FLAGGED_REPORT_THRESHOLD,
  };
}

// ─── Profile Moderation ──────────────────────────────────────────────────────

export interface ListProfilesFilters {
  status?: string;
  gender?: string;
  cityId?: number;
  tier?: 'free' | 'paid';
  verified?: boolean;
  flagged?: boolean;
  search?: string;
}

export async function listProfiles(filters: ListProfilesFilters, cursor?: string) {
  const take = 20;
  const status = filters.status ?? 'pending';

  const where: Prisma.ProfileWhereInput = {};

  if (status !== 'all') {
    where.adminStatus = status;
  }

  if (filters.gender) {
    where.gender = filters.gender;
  }

  if (filters.cityId) {
    where.livingCityId = filters.cityId;
  }

  if (filters.tier) {
    where.user = { tier: filters.tier };
  }

  if (filters.verified !== undefined) {
    where.isVerified = filters.verified;
  }

  if (filters.search) {
    const numericSearch = !isNaN(Number(filters.search)) ? Number(filters.search) : undefined;
    where.OR = [
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ...(numericSearch !== undefined ? [{ profileId: numericSearch }] : []),
    ];
  }

  if (filters.flagged) {
    const flaggedIds = await getFlaggedProfileIds();
    if (flaggedIds.length === 0) {
      return { items: [], meta: { next_cursor: null } };
    }
    where.id = { in: flaggedIds };
  }

  const profiles = await prisma.profile.findMany({
    where,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, tier: true, status: true } },
      livingCity: { select: { name: true } },
    },
  });

  const hasMore = profiles.length > take;
  const items = hasMore ? profiles.slice(0, take) : profiles;
  const reportCounts = await getOpenReportCounts(items.map((p) => p.id));

  return {
    items: items.map((p) =>
      serializeAdminProfileListItem(p, reportCounts.get(p.id) ?? 0)
    ),
    meta: {
      next_cursor: hasMore ? btoa(items[items.length - 1].id) : null,
    },
  };
}

/** @deprecated Use listProfiles — kept for internal reference */
export async function getPendingProfiles(cursor?: string) {
  return listProfiles({ status: 'pending' }, cursor);
}

export async function getAdminProfileById(profileId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: ADMIN_PROFILE_INCLUDE,
  });

  if (!profile) return null;

  const openReportCount = await prisma.profileReport.count({
    where: { reportedId: profileId, status: 'open' },
  });

  const interestsSent = await prisma.interest.count({ where: { senderId: profileId } });
  const interestsReceived = await prisma.interest.count({ where: { receiverId: profileId } });
  const interestsAccepted = await prisma.interest.count({
    where: {
      OR: [
        { senderId: profileId, status: 'accepted' },
        { receiverId: profileId, status: 'accepted' },
      ],
    },
  });

  const galleryWithUrls = await Promise.all(
    profile.gallery.map(async (photo) => {
      try {
        const signedUrl = await getSignedImageUrl(photo.r2Key);
        return { ...photo, signedUrl };
      } catch {
        return { ...photo, signedUrl: null };
      }
    })
  );

  const serialized = serializeFullProfile(profile as Parameters<typeof serializeFullProfile>[0]);

  return {
    ...serialized,
    adminStatus: profile.adminStatus,
    isVerified: profile.isVerified,
    timeOfBirth: profile.timeOfBirth,
    dateOfBirth: profile.dateOfBirth,
    gallery: galleryWithUrls,
    openReportCount,
    isFlagged: openReportCount >= FLAGGED_REPORT_THRESHOLD,
    interestStats: {
      sent: interestsSent,
      received: interestsReceived,
      accepted: interestsAccepted,
    },
    userStatus: profile.user.status,
    tier: profile.user.tier,
  };
}

export async function moderateProfile(
  profileId: string,
  status: 'approved' | 'rejected' | 'suspended',
  reason?: string,
  adminId?: string
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

  if (adminId) {
    await logAdminAction(adminId, `profile_${status}`, 'profile', profileId, { reason });
  }

  const lang = profile.user.preferredLanguage === 'hi' ? 'hi' : 'en';
  const profileLink = `${FRONTEND_URL}/profile`;
  const userName = profile.user.email.split('@')[0];

  if (status === 'approved' && profile.user.email) {
    const html = await render(
      React.createElement(ProfileApprovedEmail, {
        userName,
        profileLink,
        lang,
      })
    );
    const subject =
      lang === 'hi'
        ? 'गहोई सारथी — आपकी प्रोफ़ाइल स्वीकृत हो गई है!'
        : 'Gahoi Sarthi — Your Profile has been Approved!';

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@gahoisarthi.in',
      to: profile.user.email,
      subject,
      html,
    }).catch(() => {});

    sendPushToUser(profile.id, {
      title: '🎉 Profile Approved!',
      body: 'Your Gahoi Sarthi profile is now live. Members can discover and connect with you!',
      data: { screen: 'matches' },
    }).catch(() => {});

    sendBroadcast({
      title: '🆕 New Profile Joined!',
      body: "A new member has joined Gahoi Sarthi. Check out their profile and see if it's a match!",
      data: { screen: 'matches' },
    }).catch(() => {});
  }

  if (status === 'rejected' && profile.user.email) {
    const defaultReason =
      lang === 'hi'
        ? 'प्रोफ़ाइल हमारी दिशानिर्देशों का पालन नहीं करती।'
        : 'Profile does not meet our community guidelines.';
    const html = await render(
      React.createElement(ProfileRejectedEmail, {
        userName,
        reason: reason ?? defaultReason,
        profileLink,
        lang,
      })
    );
    const subject =
      lang === 'hi' ? 'गहोई सारथी — प्रोफ़ाइल अस्वीकृत' : 'Gahoi Sarthi — Profile Rejected';

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@gahoisarthi.in',
      to: profile.user.email,
      subject,
      html,
    }).catch(() => {});
  }

  return updated;
}

export async function deleteProfile(profileId: string, adminId?: string) {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) throw new Error('Profile not found');

  // Profile.id === User.id — cascade deletes all related records (DPDP hard delete)
  await prisma.user.delete({ where: { id: profileId } });

  if (adminId) {
    await logAdminAction(adminId, 'profile_delete', 'profile', profileId);
  }

  return { deleted: true };
}

export async function toggleProfileVerified(
  profileId: string,
  isVerified: boolean,
  adminId?: string
) {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) throw new Error('Profile not found');

  const updated = await prisma.profile.update({
    where: { id: profileId },
    data: { isVerified },
  });

  if (adminId) {
    await logAdminAction(adminId, 'profile_verify_toggle', 'profile', profileId, {
      isVerified,
    });
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

  if (status === 'rejected' && photo.profile.user.email) {
    const isHindi = photo.profile.user.preferredLanguage === 'hi';
    const subject = isHindi ? 'गहोई सारथी — फोटो अस्वीकृत' : 'Gahoi Sarthi — Photo Rejected';
    const defaultReason = isHindi
      ? 'हमारी फोटो दिशानिर्देशों का पालन नहीं करता है।'
      : 'Does not match our photo guidelines.';
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
          <a href="${FRONTEND_URL}/profile"
             style="display: inline-block; padding: 12px 24px; background: #D32F2F; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px;">
            ${isHindi ? 'फोटो फिर से अपलोड करें / Re-upload Photo' : 'Re-upload Photo'}
          </a>
        </div>
      `,
    }).catch(() => {});

    sendPushToUser(photo.profileId, {
      title: '📸 Photo Needs Attention',
      body: 'Your uploaded photo was rejected during review. Please upload a new clear photo.',
      data: { screen: 'profile_edit' },
    }).catch(() => {});
  }

  return updated;
}

// ─── Interest Activity ───────────────────────────────────────────────────────

export async function listInterests(
  filters: { senderId?: string; status?: string; since?: string },
  cursor?: string
) {
  const take = 30;
  const where: Prisma.InterestWhereInput = {};

  if (filters.senderId) where.senderId = filters.senderId;
  if (filters.status) where.status = filters.status;
  if (filters.since) where.createdAt = { gte: new Date(filters.since) };

  const interests = await prisma.interest.findMany({
    where,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: {
          id: true,
          profileId: true,
          user: { select: { email: true } },
        },
      },
      receiver: {
        select: {
          id: true,
          profileId: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  const hasMore = interests.length > take;
  const items = hasMore ? interests.slice(0, take) : interests;

  return {
    items: items.map((i) => ({
      id: i.id,
      status: i.status,
      message: i.message,
      createdAt: i.createdAt,
      sender: {
        id: i.sender.id,
        profileId: i.sender.profileId,
        email: i.sender.user.email,
      },
      receiver: {
        id: i.receiver.id,
        profileId: i.receiver.profileId,
        email: i.receiver.user.email,
      },
    })),
    meta: { next_cursor: hasMore ? btoa(items[items.length - 1].id) : null },
  };
}

export async function getInterestAbuseAlerts() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const rows = await prisma.interest.groupBy({
    by: ['senderId'],
    where: { createdAt: { gte: startOfDay } },
    _count: { _all: true },
  });

  const abusers = rows.filter((r) => r._count._all > INTEREST_ABUSE_THRESHOLD);

  if (abusers.length === 0) return [];

  const profiles = await prisma.profile.findMany({
    where: { id: { in: abusers.map((a) => a.senderId) } },
    select: {
      id: true,
      profileId: true,
      user: { select: { email: true, tier: true } },
    },
  });

  const countMap = new Map(abusers.map((a) => [a.senderId, a._count._all]));

  return profiles.map((p) => ({
    profileId: p.profileId,
    id: p.id,
    email: p.user.email,
    tier: p.user.tier,
    interestsSentToday: countMap.get(p.id) ?? 0,
    threshold: INTEREST_ABUSE_THRESHOLD,
  }));
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
  const reportedIds = items.map((r) => r.reportedId);
  const reportCounts = await getOpenReportCounts(reportedIds);

  const enriched = items.map((r) => ({
    ...r,
    reportedOpenReportCount: reportCounts.get(r.reportedId) ?? 0,
    reportedIsFlagged: (reportCounts.get(r.reportedId) ?? 0) >= FLAGGED_REPORT_THRESHOLD,
  }));

  return {
    items: enriched,
    meta: {
      next_cursor: hasMore ? btoa(items[items.length - 1].id) : null,
    },
  };
}

async function notifyReporter(reportId: string, reporterId: string) {
  const reporterProfile = await prisma.profile.findUnique({
    where: { id: reporterId },
    include: { user: { select: { email: true, preferredLanguage: true } } },
  });

  if (!reporterProfile?.user.email) return;

  const lang = reporterProfile.user.preferredLanguage === 'hi' ? 'hi' : 'en';
  const html = await render(React.createElement(ReportOutcomeEmail, { lang }));
  const subject =
    lang === 'hi' ? 'गहोई सारथी — रिपोर्ट समीक्षा पूर्ण' : 'Gahoi Sarthi — Report Reviewed';

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@gahoisarthi.in',
    to: reporterProfile.user.email,
    subject,
    html,
  }).catch(() => {});
}

export async function resolveReport(
  reportId: string,
  action: 'warn' | 'suspend' | 'ban' | 'dismiss',
  adminId?: string
) {
  const report = await prisma.profileReport.findUnique({
    where: { id: reportId },
  });

  if (!report) throw new Error('Report not found');
  if (report.status !== 'open') throw new Error('Report already resolved');

  const updatedReport = await prisma.profileReport.update({
    where: { id: reportId },
    data: { status: 'resolved' },
  });

  if (action === 'suspend') {
    await prisma.user.update({
      where: { id: report.reportedId },
      data: { status: 'Suspended' },
    });
  }

  if (action === 'ban') {
    await prisma.user.update({
      where: { id: report.reportedId },
      data: { status: 'Banned' },
    });
    await prisma.profile.update({
      where: { id: report.reportedId },
      data: { adminStatus: 'suspended' },
    });
  }

  if (action === 'warn') {
    const reported = await prisma.profile.findUnique({
      where: { id: report.reportedId },
      include: { user: { select: { email: true, preferredLanguage: true } } },
    });
    if (reported?.user.email) {
      const lang = reported.user.preferredLanguage === 'hi' ? 'hi' : 'en';
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@gahoisarthi.in',
        to: reported.user.email,
        subject:
          lang === 'hi'
            ? 'गहोई सारथी — सामुदायिक दिशानिर्देश'
            : 'Gahoi Sarthi — Community Guidelines Notice',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; padding: 24px;">
            <p>${lang === 'hi' ? 'आपकी प्रोफ़ाइल पर रिपोर्ट प्राप्त हुई। कृपया सामुदायिक दिशानिर्देशों का पालन करें।' : 'Your profile received a report. Please review and follow our community guidelines.'}</p>
          </div>
        `,
      }).catch(() => {});
    }
  }

  await notifyReporter(reportId, report.reporterId);

  if (adminId) {
    await logAdminAction(adminId, `report_${action}`, 'report', reportId);
  }

  return updatedReport;
}

// ─── Email Broadcast ─────────────────────────────────────────────────────────

export async function sendEmailBroadcast(
  segment: 'all' | 'paid' | 'free' | 'inactive_30d',
  subject: string,
  bodyHtml: string,
  adminId?: string
) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let where: Prisma.UserWhereInput = {
    isEmailVerified: true,
    status: 'Active',
  };

  if (segment === 'paid') {
    where.tier = 'paid';
  } else if (segment === 'free') {
    where.tier = 'free';
  } else if (segment === 'inactive_30d') {
    where.OR = [
      { lastActiveAt: { lt: thirtyDaysAgo } },
      { lastActiveAt: null },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: { email: true },
    take: 5000,
  });

  const emails = users.map((u) => u.email).filter(Boolean);
  let sentCount = 0;

  // Resend batch — send in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@gahoisarthi.in',
      to: chunk[0],
      bcc: chunk,
      subject,
      html: bodyHtml,
    }).catch(() => {});
    sentCount += chunk.length;
  }

  if (adminId) {
    await logAdminAction(adminId, 'email_broadcast', 'segment', segment, {
      subject,
      recipientCount: sentCount,
    });
  }

  return { segment, recipientCount: sentCount };
}

// ─── Admin Dashboard Analytics ───────────────────────────────────────────────

export async function getAnalyticsDashboard() {
  const totalUsers = await prisma.user.count();
  const paidUsers = await prisma.user.count({ where: { tier: 'paid' } });
  const freeUsers = totalUsers - paidUsers;

  const pendingProfiles = await prisma.profile.count({ where: { adminStatus: 'pending' } });
  const pendingPhotos = await prisma.profileGallery.count({ where: { adminStatus: 'pending' } });
  const openReports = await prisma.profileReport.count({ where: { status: 'open' } });

  const activeProfiles = await prisma.profile.count({ where: { adminStatus: 'approved' } });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const signupsToday = await prisma.user.count({
    where: { createdAt: { gte: startOfDay } },
  });

  const interestsSentToday = await prisma.interest.count({
    where: { createdAt: { gte: startOfDay } },
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSignups = await prisma.user.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });

  const totalInterests = await prisma.interest.count();
  const acceptedInterests = await prisma.interest.count({ where: { status: 'accepted' } });
  const interestToMatchRate =
    totalInterests > 0 ? Math.round((acceptedInterests / totalInterests) * 100) : 0;

  const paidConversionRate =
    totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0;

  return {
    totalUsers,
    paidUsers,
    freeUsers,
    activeProfiles,
    pendingProfiles,
    pendingPhotos,
    openReports,
    recentSignups,
    signupsToday,
    interestsSentToday,
    interestToMatchRate,
    paidConversionRate,
    emailOpenRate: null as string | null, // N/A — Resend analytics not wired
  };
}

export async function getSignupAnalytics(days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<{ date: string; count: number }[]>(
    Prisma.sql`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM users
      WHERE created_at >= ${start}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `
  );

  // Fill missing days with zero counts
  const result: { date: string; count: number }[] = [];
  const countMap = new Map(rows.map((r) => [r.date, r.count]));

  for (let d = 0; d < days; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    const key = day.toISOString().slice(0, 10);
    result.push({ date: key, count: countMap.get(key) ?? 0 });
  }

  return result;
}

// ─── User Management ──────────────────────────────────────────────────────────

export async function searchUsers(search?: string, cursor?: string) {
  const take = 20;

  const numericSearch = search && !isNaN(Number(search)) ? Number(search) : undefined;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          ...(numericSearch !== undefined
            ? [{ profile: { is: { profileId: numericSearch } } }]
            : []),
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

export async function listSubscriptions(
  cursor?: string,
  expiryFilter?: 'active' | 'expired' | 'all'
) {
  const take = 30;
  const now = new Date();

  const where: Prisma.SubscriptionWhereInput = { status: 'paid' };

  if (expiryFilter === 'active') {
    where.expiresAt = { gte: now };
  } else if (expiryFilter === 'expired') {
    where.expiresAt = { lt: now };
  }

  const subscriptions = await prisma.subscription.findMany({
    where,
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
  const paidSubs = await prisma.subscription.findMany({
    where: { status: 'paid' },
    include: { plan: { select: { priceInr: true } } },
  });

  const totalRevenue = paidSubs.reduce((sum, s) => sum + s.plan.priceInr, 0);
  const activeSubscriptions = await prisma.subscription.count({
    where: { status: 'paid', expiresAt: { gte: new Date() } },
  });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlyRevenue = paidSubs
    .filter((s) => s.createdAt >= startOfMonth)
    .reduce((sum, s) => sum + s.plan.priceInr, 0);

  return {
    totalRevenue,
    activeSubscriptions,
    monthlyRevenue,
    totalPaidCount: paidSubs.length,
  };
}

// ─── Admin User CRUD ─────────────────────────────────────────────────────────

export async function listAdmins() {
  return prisma.admin.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export async function createAdmin(data: {
  email: string;
  name?: string;
  role: string;
}) {
  const existing = await prisma.admin.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) throw new Error('Admin already exists');

  return prisma.admin.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function updateAdmin(
  adminId: string,
  data: { name?: string; role?: string; isActive?: boolean }
) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new Error('Admin not found');

  return prisma.admin.update({
    where: { id: adminId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
    },
  });
}

export async function deleteAdmin(adminId: string) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new Error('Admin not found');

  await prisma.admin.update({
    where: { id: adminId },
    data: { isActive: false },
  });

  return { deactivated: true };
}

// ─── Success Stories ─────────────────────────────────────────────────────────

export async function listSuccessStories(status?: string, cursor?: string) {
  const take = 20;
  const where: Prisma.SuccessStoryWhereInput = status ? { status } : {};

  const stories = await prisma.successStory.findMany({
    where,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      profile: {
        select: {
          profileId: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  const hasMore = stories.length > take;
  const items = hasMore ? stories.slice(0, take) : stories;

  const itemsWithPhotos = await Promise.all(
    items.map(async (story) => {
      let photoUrl: string | null = null;
      if (story.photoR2Key) {
        try {
          photoUrl = await getSignedImageUrl(story.photoR2Key);
        } catch {
          photoUrl = null;
        }
      }
      return { ...story, photoUrl };
    })
  );

  return {
    items: itemsWithPhotos,
    meta: { next_cursor: hasMore ? btoa(items[items.length - 1].id) : null },
  };
}

export async function createSuccessStory(data: {
  profileId: string;
  testimonial: string;
  photoR2Key?: string;
}) {
  return prisma.successStory.create({
    data: {
      profileId: data.profileId,
      testimonial: data.testimonial,
      photoR2Key: data.photoR2Key,
      status: 'pending',
    },
  });
}

export async function updateSuccessStory(
  storyId: string,
  data: { testimonial?: string; status?: string },
  adminId?: string
) {
  const story = await prisma.successStory.findUnique({ where: { id: storyId } });
  if (!story) throw new Error('Success story not found');

  const updateData: Prisma.SuccessStoryUpdateInput = {};
  if (data.testimonial) updateData.testimonial = data.testimonial;
  if (data.status) {
    updateData.status = data.status;
    if (data.status === 'published') {
      updateData.publishedAt = new Date();
    }
  }

  const updated = await prisma.successStory.update({
    where: { id: storyId },
    data: updateData,
  });

  if (adminId) {
    await logAdminAction(adminId, 'success_story_update', 'success_story', storyId, data);
  }

  return updated;
}

export async function deleteSuccessStory(storyId: string, adminId?: string) {
  const story = await prisma.successStory.findUnique({ where: { id: storyId } });
  if (!story) throw new Error('Success story not found');

  await prisma.successStory.delete({ where: { id: storyId } });

  if (adminId) {
    await logAdminAction(adminId, 'success_story_delete', 'success_story', storyId);
  }

  return { deleted: true };
}
