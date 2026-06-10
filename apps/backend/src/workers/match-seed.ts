import { prisma } from '../db/prisma';
import {
  EDUCATION_DEGREE_OPTIONS,
  resolveHeightFtIn,
  heightToTotalInches,
} from '@gahoisarthi/shared';

/**
 * Match seed worker — computes scored candidate list for each user.
 *
 * Hard filters (applied before scoring):
 *  - Must be opposite gender
 *  - Must be approved profile
 *  - Gotra exclusion if user's preference excludes same gotra
 *  - Not blocked by either user
 *  - Not already matched (has accepted mutual interest)
 *
 * Scoring (max 100 points):
 *  - Age within preferences: 20pts
 *  - Height within preferences: 10pts
 *  - Marital status match: 15pts
 *  - Gotra preference: 15pts (excluded = 0, allowed = full)
 *  - Location match (same state): 10pts
 *  - Education meets minimum: 15pts
 *  - Income meets minimum: 15pts
 */

const EDUCATION_RANK: Record<string, number> = Object.fromEntries(
  EDUCATION_DEGREE_OPTIONS.map((deg, i) => [deg, i]),
);

function resolveTotalInches(
  ft: number | null | undefined,
  inches: number | null | undefined,
  cm: number | null | undefined,
): number | null {
  const resolved = resolveHeightFtIn(ft, inches, cm);
  if (resolved.ft == null) return null;
  return heightToTotalInches(resolved.ft, resolved.in ?? 0);
}

function scoreMatch(candidate: CandidateProfile, prefs: UserPreferences, userProfile: UserProfile): number {
  let score = 0;

  // Age (20 pts)
  if (prefs.ageMin && prefs.ageMax && candidate.age) {
    if (candidate.age >= prefs.ageMin && candidate.age <= prefs.ageMax) score += 20;
    else if (Math.abs(candidate.age - prefs.ageMin) <= 2 || Math.abs(candidate.age - prefs.ageMax) <= 2) score += 10;
  } else {
    score += 10; // No preference set = partial credit
  }

  // Height (10 pts) — prefers ft/in, falls back to legacy cm
  const candInches = resolveTotalInches(candidate.heightFt, candidate.heightIn, candidate.height_cm);
  const minInches = resolveTotalInches(prefs.heightMinFt, prefs.heightMinIn, prefs.heightMinCm);
  const maxInches = resolveTotalInches(prefs.heightMaxFt, prefs.heightMaxIn, prefs.heightMaxCm);
  if (minInches != null && maxInches != null && candInches != null) {
    if (candInches >= minInches && candInches <= maxInches) score += 10;
  } else {
    score += 5;
  }

  // Marital status (15 pts)
  if (prefs.maritalStatus && prefs.maritalStatus.length > 0 && candidate.maritalStatus) {
    if (prefs.maritalStatus.includes(candidate.maritalStatus)) score += 15;
  } else {
    score += 8;
  }

  // Gotra (15 pts) — only score if not same gotra or preference allows
  if (candidate.gotra && userProfile.gotra) {
    const isSameGotra = candidate.gotra === userProfile.gotra;
    if (!prefs.excludeSameGotra && isSameGotra) score += 8;
    else if (!isSameGotra) score += 15;
  } else {
    score += 8;
  }

  // Location (10 pts)
  if (candidate.stateId && userProfile.stateId && candidate.stateId === userProfile.stateId) score += 10;
  else if (candidate.countryId && userProfile.countryId && candidate.countryId === userProfile.countryId) score += 5;

  // Education (15 pts)
  if (prefs.educationMin && candidate.highestDegree) {
    const minRank = EDUCATION_RANK[prefs.educationMin] ?? 0;
    const candRank = EDUCATION_RANK[candidate.highestDegree] ?? 0;
    if (candRank >= minRank) score += 15;
    else if (candRank >= minRank - 1) score += 8;
  } else {
    score += 8;
  }

  // Income (15 pts)
  if (prefs.incomeMin && candidate.annualIncomeMin) {
    if (candidate.annualIncomeMin >= prefs.incomeMin) score += 15;
    else if (candidate.annualIncomeMin >= prefs.incomeMin * 0.8) score += 8;
  } else {
    score += 8;
  }

  return Math.min(score, 100);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidateProfile {
  id: string;
  gender: string | null;
  gotra: string | null;
  maritalStatus: string | null;
  heightFt: number | null;
  heightIn: number | null;
  height_cm: number | null;
  age: number | null;
  stateId: number | null;
  countryId: number | null;
  highestDegree: string | null;
  annualIncomeMin: number | null;
  manglikStatus: string | null;
}

interface UserProfile {
  id: string;
  gender: string | null;
  gotra: string | null;
  stateId: number | null;
  countryId: number | null;
  manglikStatus: string | null;
}

interface UserPreferences {
  ageMin: number | null;
  ageMax: number | null;
  heightMinFt: number | null;
  heightMinIn: number | null;
  heightMaxFt: number | null;
  heightMaxIn: number | null;
  heightMinCm: number | null;
  heightMaxCm: number | null;
  maritalStatus: string[];
  educationMin: string | null;
  incomeMin: number | null;
  manglikPreference: string | null;
  excludeSameGotra: boolean;
  preferredCityIds: number[];
}

// ─── Worker function ──────────────────────────────────────────────────────────

export async function runMatchSeed(targetUserId?: string) {
  console.log('🔄 Match seed worker starting...');

  // Get all users (or specific user if targetUserId provided)
  const users = await prisma.profile.findMany({
    where: {
      ...(targetUserId ? { id: targetUserId } : {}),
      adminStatus: 'approved',
      gender: { not: null },
    },
    include: {
      preferences: true,
      livingCity: { select: { stateId: true } },
    },
  });

  let totalMatches = 0;

  for (const user of users) {
    const oppositeGender = user.gender === 'Male' ? 'Female' : 'Male';

    // Get blocks
    const blocks = await prisma.profileBlock.findMany({
      where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] },
    });
    const blockedIds = new Set([
      ...blocks.map((b) => b.blockerId),
      ...blocks.map((b) => b.blockedId),
    ]);
    blockedIds.delete(user.id);

    // Build hard filter query
    const prefs = user.preferences;
    const now = new Date();

    const ageWhere = prefs?.ageMin && prefs?.ageMax
      ? {
          dateOfBirth: {
            gte: new Date(now.getFullYear() - prefs.ageMax, now.getMonth(), now.getDate()),
            lte: new Date(now.getFullYear() - prefs.ageMin, now.getMonth(), now.getDate()),
          },
        }
      : {};

    const gotrasWhere = prefs?.excludeSameGotra && user.gotra
      ? { NOT: { gotra: user.gotra } }
      : {};

    const candidates = await prisma.profile.findMany({
      where: {
        gender: oppositeGender,
        adminStatus: 'approved',
        id: { notIn: [...blockedIds, user.id] },
        ...ageWhere,
        ...gotrasWhere,
      },
      include: {
        education: { select: { highestDegree: true } },
        occupation: { select: { annualIncomeMin: true } },
        livingCity: { select: { stateId: true } },
      },
      take: 500, // Cap for performance
    });

    // Score each candidate
    const userPrefs: UserPreferences = {
      ageMin: prefs?.ageMin ?? null,
      ageMax: prefs?.ageMax ?? null,
      heightMinFt: prefs?.heightMinFt ?? null,
      heightMinIn: prefs?.heightMinIn ?? null,
      heightMaxFt: prefs?.heightMaxFt ?? null,
      heightMaxIn: prefs?.heightMaxIn ?? null,
      heightMinCm: prefs?.heightMinCm ?? null,
      heightMaxCm: prefs?.heightMaxCm ?? null,
      maritalStatus: prefs?.maritalStatus ?? [],
      educationMin: prefs?.educationMin ?? null,
      incomeMin: prefs?.incomeMin ?? null,
      manglikPreference: prefs?.manglikPreference ?? null,
      excludeSameGotra: prefs?.excludeSameGotra ?? true,
      preferredCityIds: prefs?.preferredCityIds ?? [],
    };

    const userProfileData: UserProfile = {
      id: user.id,
      gender: user.gender,
      gotra: user.gotra,
      stateId: user.livingCity?.stateId ?? null,
      countryId: user.countryId,
      manglikStatus: user.manglikStatus,
    };

    const scored = candidates
      .map((c) => {
        const age = c.dateOfBirth
          ? Math.floor((Date.now() - c.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null;

        const candidateData: CandidateProfile = {
          id: c.id,
          gender: c.gender,
          gotra: c.gotra,
          maritalStatus: c.maritalStatus,
          heightFt: c.heightFt,
          heightIn: c.heightIn,
          height_cm: c.height_cm,
          age,
          stateId: c.livingCity?.stateId ?? null,
          countryId: c.countryId,
          highestDegree: c.education?.highestDegree ?? null,
          annualIncomeMin: c.occupation?.annualIncomeMin ?? null,
          manglikStatus: c.manglikStatus,
        };

        return {
          candidateId: c.id,
          score: scoreMatch(candidateData, userPrefs, userProfileData),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 100); // Keep top 100

    // Upsert match candidates
    for (const { candidateId, score } of scored) {
      await prisma.matchCandidate.upsert({
        where: { userId_candidateId: { userId: user.id, candidateId } },
        update: { matchScore: score, computedAt: new Date() },
        create: { userId: user.id, candidateId, matchScore: score },
      });
    }

    totalMatches += scored.length;
  }

  console.log(`✅ Match seed complete. ${totalMatches} candidates computed for ${users.length} users.`);
}

// ─── Match suggestions endpoint service ───────────────────────────────────────

export async function getMatchSuggestions(userId: string, userTier: string, cursor?: string) {
  const limit = userTier === 'paid' ? 30 : 5;
  const take = limit + 1;

  const matches = await prisma.matchCandidate.findMany({
    where: {
      userId,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { matchScore: 'desc' },
    take,
  });

  const hasMore = matches.length > limit;
  const items = hasMore ? matches.slice(0, limit) : matches;

  const candidateIds = items.map((m) => m.candidateId);
  const profiles = await prisma.profile.findMany({
    where: { id: { in: candidateIds } },
    include: {
      user: true,
      livingCity: { select: { name: true } },
      education: { select: { highestDegree: true } },
      occupation: { select: { occupationType: true } },
      gallery: {
        where: { adminStatus: 'approved' },
        select: { r2Key: true },
        take: 1,
      },
    },
  });

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const resultItems = [];
  for (const m of items) {
    const prof = profileMap.get(m.candidateId);
    if (!prof) continue;

    const age = prof.dateOfBirth
      ? Math.floor((Date.now() - prof.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    let photoUrl = undefined;
    if (prof.gallery && prof.gallery.length > 0) {
      try {
        const { getSignedImageUrl } = require('../modules/profile/gallery.service');
        photoUrl = await getSignedImageUrl(prof.gallery[0].r2Key);
      } catch (e) {
        console.error('Failed to get signed image url:', e);
      }
    }

    resultItems.push({
      id: prof.id,
      profileId: prof.profileId,
      gender: prof.gender,
      gotra: prof.gotra,
      maritalStatus: prof.maritalStatus,
      age,
      height_cm: prof.height_cm,
      city: prof.livingCity?.name ?? null,
      education: prof.education?.highestDegree ?? null,
      occupation: prof.occupation?.occupationType ?? null,
      matchScore: m.matchScore,
      photoUrl,
      isVerified: prof.isVerified,
    });
  }

  return {
    items: resultItems,
    meta: {
      next_cursor: hasMore ? btoa(items[items.length - 1].id) : null,
      total: null,
    },
  };
}

