import { Router, Response } from 'express';
import { authGuard, type AuthRequest } from '../../middleware/auth-guard';
import { SendInterestSchema, RespondInterestSchema } from './interests.schema';
import {
  sendInterest,
  respondToInterest,
  withdrawInterest,
  listSentInterests,
  listReceivedInterests,
} from './interests.service';

export const interestsRouter = Router();

interestsRouter.use(authGuard);

// POST /v1/interests — send interest
interestsRouter.post('/', async (req: AuthRequest, res: Response) => {
  const result = SendInterestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const interest = await sendInterest(req.userId!, req.userTier ?? 'free', result.data);
    res.status(201).json({ success: true, data: interest, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send interest';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// PATCH /v1/interests/:id — accept or decline
interestsRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const result = RespondInterestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, data: null, error: result.error.errors[0].message, meta: {} });
    return;
  }
  try {
    const interest = await respondToInterest(req.params.id, req.userId!, req.userTier ?? 'free', result.data);
    res.json({ success: true, data: interest, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to respond to interest';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// DELETE /v1/interests/:id — withdraw
interestsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await withdrawInterest(req.params.id, req.userId!);
    res.json({ success: true, data: { message: 'Interest withdrawn' }, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to withdraw interest';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// GET /v1/interests/sent
interestsRouter.get('/sent', async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await listSentInterests(req.userId!, cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch interests', meta: {} });
  }
});

// GET /v1/interests/received
interestsRouter.get('/received', async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await listReceivedInterests(req.userId!, cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch interests', meta: {} });
  }
});
