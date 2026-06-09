/**
 * Expo Push Notification Service
 * Uses Expo's HTTP v2 Push API (no extra SDK needed).
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

import { prisma } from '../db/prisma';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** Optional rich notification image URL */
  imageUrl?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Send a push notification to one or more Expo push tokens.
 * Automatically chunks into batches of 100 (Expo limit).
 * Invalid tokens are silently ignored (non-fatal).
 */
export async function sendPush(
  tokens: string[],
  message: PushMessage
): Promise<void> {
  const validTokens = tokens.filter(
    (t) => t && t.startsWith('ExponentPushToken[')
  );
  if (validTokens.length === 0) return;

  // Chunk into batches
  for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
    const batch = validTokens.slice(i, i + BATCH_SIZE);
    const messages = batch.map((to) => ({
      to,
      title: message.title,
      body: message.body,
      data: message.data ?? {},
      sound: 'default' as const,
      ...(message.imageUrl ? { richContent: { image: message.imageUrl } } : {}),
      priority: 'high' as const,
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        console.error(`[Push] Expo API error: ${res.status} ${res.statusText}`);
        return;
      }

      const result = await res.json() as { data: ExpoPushTicket[] };

      // Log any per-token errors for debugging (non-fatal)
      result.data?.forEach((ticket, idx) => {
        if (ticket.status === 'error') {
          console.warn(`[Push] Ticket error for token ${batch[idx]}: ${ticket.message}`);
          // If token is invalid/unregistered, clear it from DB
          if (
            ticket.details?.error === 'DeviceNotRegistered' ||
            ticket.details?.error === 'InvalidCredentials'
          ) {
            prisma.user
              .updateMany({
                where: { expoPushToken: batch[idx] },
                data: { expoPushToken: null },
              })
              .catch(() => {});
          }
        }
      });
    } catch (err) {
      // Push failures are always non-fatal
      console.error('[Push] Failed to send batch:', err);
    }
  }
}

/**
 * Send a push notification to a single user by their userId.
 * Looks up their expoPushToken from the database.
 */
export async function sendPushToUser(
  userId: string,
  message: PushMessage
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { expoPushToken: true },
  });

  if (!user?.expoPushToken) return;
  await sendPush([user.expoPushToken], message);
}

/**
 * Broadcast a push notification to ALL users who have registered a push token.
 * Processes in pages of 500 DB rows at a time to avoid memory issues.
 * Returns the total number of tokens that were targeted.
 */
export async function sendBroadcast(message: PushMessage): Promise<number> {
  let totalSent = 0;
  let cursor: string | undefined;

  while (true) {
    const users = await prisma.user.findMany({
      where: {
        expoPushToken: { not: null },
        status: 'Active',
      },
      select: { id: true, expoPushToken: true },
      take: 500,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
    });

    if (users.length === 0) break;

    const tokens = users
      .map((u: { id: string; expoPushToken: string | null }) => u.expoPushToken!)
      .filter((t: string) => t.startsWith('ExponentPushToken['));

    await sendPush(tokens, message);
    totalSent += tokens.length;

    if (users.length < 500) break;
    cursor = users[users.length - 1].id;
  }

  return totalSent;
}
