import { Router, Response } from 'express';
import { authGuard, type AuthRequest } from '../../middleware/auth-guard';
import { getMatchSuggestions } from '../../workers/match-seed';
import { prisma } from '../../db/prisma';
import { computeAshtakoot } from './kundli.service';

export const matchesRouter = Router();

matchesRouter.use(authGuard);

// GET /v1/matches/suggestions
matchesRouter.get('/suggestions', async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor ? atob(req.query.cursor as string) : undefined;
  try {
    const result = await getMatchSuggestions(req.userId!, req.userTier ?? 'free', cursor);
    res.json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch matches', meta: {} });
  }
});

// GET /v1/matches/:id/kundli
matchesRouter.get('/:id/kundli', async (req: AuthRequest, res: Response) => {
  if (req.userTier !== 'paid') {
    res.status(403).json({ success: false, data: null, error: 'Paid subscription required', meta: {} });
    return;
  }

  const targetUserId = req.params.id;
  const viewerUserId = req.userId!;

  try {
    const viewerProfile = await prisma.profile.findUnique({
      where: { id: viewerUserId },
      select: { dateOfBirth: true, timeOfBirth: true }
    });

    const targetProfile = await prisma.profile.findUnique({
      where: { id: targetUserId },
      select: { dateOfBirth: true, timeOfBirth: true }
    });

    if (!viewerProfile || !targetProfile) {
      res.status(404).json({ success: false, data: null, error: 'Profile not found', meta: {} });
      return;
    }

    const score = computeAshtakoot(
      { dob: viewerProfile.dateOfBirth, tob: viewerProfile.timeOfBirth },
      { dob: targetProfile.dateOfBirth, tob: targetProfile.timeOfBirth }
    );

    res.json({ success: true, data: score, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to compute Kundli matching', meta: {} });
  }
});
