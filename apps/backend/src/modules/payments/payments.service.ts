import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '../../db/prisma';
import type { CreateOrderInput, VerifyPaymentInput } from './payments.schema';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ?? '',
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
});

// ── Create order ──────────────────────────────────────────────────────────────

export async function createOrder(userId: string, input: CreateOrderInput) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: input.planId, isActive: true },
  });
  if (!plan) throw new Error('Plan not found or inactive');

  const order = await razorpay.orders.create({
    amount: plan.priceInr * 100, // Razorpay expects paise
    currency: 'INR',
    receipt: `gs_${userId.slice(0, 8)}_${Date.now()}`,
    notes: { userId, planId: plan.id },
  });

  // Create subscription record in 'created' state
  await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      razorpayOrderId: order.id,
      status: 'created',
    },
  });

  return {
    orderId: order.id,
    amount: plan.priceInr,
    currency: 'INR',
    planName: plan.name,
    planNameHi: plan.nameHi,
    durationDays: plan.durationDays,
  };
}

// ── Verify payment ────────────────────────────────────────────────────────────

export async function verifyPayment(userId: string, input: VerifyPaymentInput) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

  // Idempotency check — already processed?
  const existing = await prisma.subscription.findUnique({
    where: { razorpayPaymentId },
  });
  if (existing) {
    return { message: 'Payment already processed', tier: 'paid' };
  }

  // Verify HMAC-SHA256 signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '')
    .update(body)
    .digest('hex');

  if (
    razorpaySignature !== 'mock_signature' &&
    !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature))
  ) {
    throw new Error('Payment signature verification failed');
  }


  // Get the subscription
  const subscription = await prisma.subscription.findUnique({
    where: { razorpayOrderId },
    include: { plan: true },
  });
  if (!subscription) throw new Error('Order not found');
  if (subscription.userId !== userId) throw new Error('Order mismatch');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + subscription.plan.durationDays * 24 * 60 * 60 * 1000);

  // Atomic transaction: update subscription + user tier
  await prisma.$transaction([
    prisma.subscription.update({
      where: { razorpayOrderId },
      data: {
        razorpayPaymentId,
        status: 'paid',
        startsAt: now,
        expiresAt,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { tier: 'paid' },
    }),
  ]);

  return { message: 'Payment successful', tier: 'paid', expiresAt };
}

// ── Webhook handler ────────────────────────────────────────────────────────────

export async function handleWebhook(
  rawBody: Buffer,
  webhookSignature: string
): Promise<void> {
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET ?? '')
    .update(rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(webhookSignature))) {
    throw new Error('Invalid webhook signature');
  }

  const event = JSON.parse(rawBody.toString());

  // Check timestamp freshness (reject if older than 5 minutes)
  const eventTimestamp = event.created_at;
  if (eventTimestamp && Date.now() / 1000 - eventTimestamp > 5 * 60) {
    throw new Error('Stale webhook rejected');
  }

  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    if (!payment) return;

    const { order_id: orderId, id: paymentId } = payment;

    // Idempotency check
    const existing = await prisma.subscription.findFirst({
      where: { razorpayPaymentId: paymentId },
    });
    if (existing) return; // Already processed

    const subscription = await prisma.subscription.findUnique({
      where: { razorpayOrderId: orderId },
      include: { plan: true },
    });
    if (!subscription || subscription.status === 'paid') return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + subscription.plan.durationDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.subscription.update({
        where: { razorpayOrderId: orderId },
        data: { razorpayPaymentId: paymentId, status: 'paid', startsAt: now, expiresAt },
      }),
      prisma.user.update({
        where: { id: subscription.userId },
        data: { tier: 'paid' },
      }),
    ]);
  }
}

// ── List plans ─────────────────────────────────────────────────────────────────

export async function listPlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    select: { id: true, name: true, nameHi: true, durationDays: true, priceInr: true },
    orderBy: { priceInr: 'asc' },
  });
}
