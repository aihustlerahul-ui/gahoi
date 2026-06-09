import { Router, Response } from 'express';
import { authGuard, type AuthRequest } from '../../middleware/auth-guard';
import {
  shortlistProfile,
  removeShortlist,
  listShortlist,
} from './interests.service';

export const shortlistRouter = Router();

shortlistRouter.use(authGuard);

// POST /v1/shortlist/:id — add profile to shortlist
shortlistRouter.post('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const record = await shortlistProfile(req.userId!, req.userTier ?? 'free', req.params.id);
    res.status(201).json({ success: true, data: record, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to shortlist profile';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// DELETE /v1/shortlist/:id — remove profile from shortlist
shortlistRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await removeShortlist(req.userId!, req.params.id);
    res.json({ success: true, data: { message: 'Shortlist removed' }, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to remove shortlist';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// GET /v1/shortlist — list paginated shortlisted profiles
shortlistRouter.get('/', async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await listShortlist(req.userId!, cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch shortlist', meta: {} });
  }
});
