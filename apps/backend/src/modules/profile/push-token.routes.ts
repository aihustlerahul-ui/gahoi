import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/auth-guard';
import { prisma } from '../../db/prisma';
import { z } from 'zod';

export const pushTokenRouter = Router();

const pushTokenSchema = z.object({
  token: z
    .string()
    .min(1)
    .refine(
      (t) => t.startsWith('ExponentPushToken[') && t.endsWith(']'),
      'Invalid Expo push token format'
    ),
});

/**
 * POST /v1/profile/me/push-token
 * Register or update the user's Expo push token.
 * Called automatically by the mobile app on login.
 */
pushTokenRouter.post('/', authGuard, async (req: Request, res: Response) => {
  const parsed = pushTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: parsed.error.errors[0]?.message ?? 'Invalid token',
      meta: {},
    });
  }

  const userId = (req as any).user.userId as string;

  await prisma.user.update({
    where: { id: userId },
    data: { expoPushToken: parsed.data.token },
  });

  return res.json({
    success: true,
    data: { registered: true },
    error: null,
    meta: {},
  });
});

/**
 * DELETE /v1/profile/me/push-token
 * Deregister push token (e.g. on logout).
 */
pushTokenRouter.delete('/', authGuard, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId as string;

  await prisma.user.update({
    where: { id: userId },
    data: { expoPushToken: null },
  });

  return res.json({
    success: true,
    data: { deregistered: true },
    error: null,
    meta: {},
  });
});
