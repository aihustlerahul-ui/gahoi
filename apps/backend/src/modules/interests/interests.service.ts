import { prisma } from '../../db/prisma';
import { Resend } from 'resend';
import { sendPushToUser } from '../../lib/push.service';
import type { SendInterestInput, RespondInterestInput } from './interests.schema';

const resend = new Resend(process.env.RESEND_API_KEY);

const FREE_DAILY_LIMIT = 5;

async function getDailyInterestCount(senderId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return prisma.interest.count({
    where: {
      senderId,
      createdAt: { gte: startOfDay },
    },
  });
}

async function sendInterestEmail(type: string, receiverEmail: string, senderProfile: { id: string }) {
  const subjects: Record<string, string> = {
    received: 'You have a new interest! / आपकी रुचि आई है',
    accepted: 'Your interest was accepted! / आपकी रुचि स्वीकार हुई',
    declined: 'Interest update / रुचि अपडेट',
  };

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@gahoisarthi.in',
    to: receiverEmail,
    subject: subjects[type] ?? 'Interest update',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1A0800;">Gahoi Sarthi — गहोई सारथी</h2>
        <p>You have a new <strong>${type}</strong> update on your profile.</p>
        <p>Log in to Gahoi Sarthi to view details.</p>
        <a href="${process.env.FRONTEND_URL ?? 'https://gahoisarthi.in'}/interests"
           style="display: inline-block; padding: 12px 24px; background: #E8B84B; color: #1A0800;
                  text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px;">
          View Interests / रुचियाँ देखें
        </a>
      </div>
    `,
  }).catch(() => {}); // Non-fatal
}

// ── Send interest ─────────────────────────────────────────────────────────────

export async function sendInterest(senderId: string, senderTier: string, input: SendInterestInput) {
  const { receiverId, message } = input;

  if (senderId === receiverId) throw new Error('Cannot send interest to yourself');

  // Check sender has a profile
  const senderProfile = await prisma.profile.findUnique({ where: { id: senderId } });
  if (!senderProfile) throw new Error('Complete your profile before sending interests');

  // Check receiver exists
  const receiverProfile = await prisma.profile.findUnique({
    where: { id: receiverId },
    include: { user: { select: { email: true } } },
  });
  if (!receiverProfile) throw new Error('Profile not found');

  // Check not blocked
  const blocked = await prisma.profileBlock.findFirst({
    where: {
      OR: [
        { blockerId: senderId, blockedId: receiverId },
        { blockerId: receiverId, blockedId: senderId },
      ],
    },
  });
  if (blocked) throw new Error('Cannot send interest to this profile');

  // Check daily limit for free users
  if (senderTier !== 'paid') {
    const dailyCount = await getDailyInterestCount(senderId);
    if (dailyCount >= FREE_DAILY_LIMIT) {
      throw new Error(`Free users can send ${FREE_DAILY_LIMIT} interests per day. Upgrade to paid for unlimited.`);
    }
  }

  // Check for existing interest
  const existing = await prisma.interest.findFirst({
    where: { senderId, receiverId },
  });
  if (existing) throw new Error('Interest already sent');

  const interest = await prisma.interest.create({
    data: { senderId, receiverId, message, status: 'pending' },
  });

  // Email notification (non-fatal)
  await sendInterestEmail('received', receiverProfile.user.email, senderProfile);

  // Push notification (non-fatal)
  sendPushToUser(receiverId, {
    title: '💛 New Interest Request',
    body: 'Someone from Gahoi Sarthi has sent you an interest request!',
    data: { screen: 'interests' },
  }).catch(() => {});

  return interest;
}

// ── Respond to interest ────────────────────────────────────────────────────────

export async function respondToInterest(
  interestId: string,
  userId: string,
  userTier: string,
  input: RespondInterestInput
) {
  const interest = await prisma.interest.findFirst({
    where: { id: interestId, receiverId: userId },
    include: {
      sender: { include: { user: { select: { email: true } } } },
    },
  });
  if (!interest) throw new Error('Interest not found');
  if (interest.status !== 'pending') throw new Error('Interest already responded to');

  const updated = await prisma.interest.update({
    where: { id: interestId },
    data: { status: input.action },
  });

  // Send email to sender (non-fatal)
  await sendInterestEmail(input.action, interest.sender.user.email, { id: interest.senderId });

  // Push notification to sender (non-fatal)
  if (input.action === 'accepted') {
    sendPushToUser(interest.senderId, {
      title: '🎉 Interest Accepted!',
      body: 'Great news! Your interest request was accepted. View their contact details now.',
      data: { screen: 'interests' },
    }).catch(() => {});
  } else if (input.action === 'declined') {
    sendPushToUser(interest.senderId, {
      title: 'Interest Update',
      body: "Your interest wasn't accepted this time. Keep exploring other profiles!",
      data: { screen: 'interests' },
    }).catch(() => {});
  }

  return updated;
}

// ── Withdraw interest ─────────────────────────────────────────────────────────

export async function withdrawInterest(interestId: string, userId: string) {
  const interest = await prisma.interest.findFirst({
    where: { id: interestId, senderId: userId, status: 'pending' },
  });
  if (!interest) throw new Error('Interest not found or cannot be withdrawn');

  return prisma.interest.delete({ where: { id: interestId } });
}

// ── List interests ─────────────────────────────────────────────────────────────

export async function listSentInterests(userId: string, cursor?: string) {
  const take = 20;
  const interests = await prisma.interest.findMany({
    where: { senderId: userId },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      receiver: {
        select: {
          id: true,
          profileId: true,
          gender: true,
          gotra: true,
          maritalStatus: true,
          height_cm: true,
          livingCity: { select: { name: true } },
        },
      },
    },
  });

  const hasMore = interests.length > take;
  const items = hasMore ? interests.slice(0, take) : interests;

  return {
    items,
    meta: {
      next_cursor: hasMore ? btoa(items[items.length - 1].id) : null,
    },
  };
}

export async function listReceivedInterests(userId: string, cursor?: string) {
  const take = 20;
  const interests = await prisma.interest.findMany({
    where: { receiverId: userId },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: {
          id: true,
          profileId: true,
          gender: true,
          gotra: true,
          maritalStatus: true,
          height_cm: true,
          livingCity: { select: { name: true } },
        },
      },
    },
  });

  const hasMore = interests.length > take;
  const items = hasMore ? interests.slice(0, take) : interests;

  return {
    items,
    meta: {
      next_cursor: hasMore ? btoa(items[items.length - 1].id) : null,
    },
  };
}

// ── Shortlist Service ─────────────────────────────────────────────────────────

export async function shortlistProfile(ownerId: string, ownerTier: string, targetId: string) {
  if (ownerId === targetId) throw new Error('Cannot shortlist yourself');

  // Verify target profile exists
  const target = await prisma.profile.findUnique({ where: { id: targetId } });
  if (!target) throw new Error('Profile not found');

  // Limit check for free users
  if (ownerTier !== 'paid') {
    const count = await prisma.shortlist.count({ where: { ownerId } });
    if (count >= 10) {
      throw new Error('Free users can shortlist up to 10 profiles. Upgrade to paid for unlimited.');
    }
  }

  // Create/upsert shortlist record
  return prisma.shortlist.upsert({
    where: {
      ownerId_shortlistedId: { ownerId, shortlistedId: targetId },
    },
    update: {},
    create: { ownerId, shortlistedId: targetId },
  });
}

export async function removeShortlist(ownerId: string, targetId: string) {
  try {
    return await prisma.shortlist.delete({
      where: {
        ownerId_shortlistedId: { ownerId, shortlistedId: targetId },
      },
    });
  } catch {
    throw new Error('Shortlist record not found');
  }
}

export async function listShortlist(ownerId: string, cursor?: string) {
  const take = 20;
  const list = await prisma.shortlist.findMany({
    where: { ownerId },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      shortlisted: {
        select: {
          id: true,
          profileId: true,
          gender: true,
          gotra: true,
          maritalStatus: true,
          height_cm: true,
          livingCity: { select: { name: true } },
        },
      },
    },
  });

  const hasMore = list.length > take;
  const items = hasMore ? list.slice(0, take) : list;

  return {
    items: items.map(item => item.shortlisted),
    meta: {
      next_cursor: hasMore ? btoa(items[items.length - 1].id) : null,
    },
  };
}
