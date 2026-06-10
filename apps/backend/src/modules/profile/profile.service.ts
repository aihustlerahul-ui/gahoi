import { prisma } from '../../db/prisma';
import {
  maskPhone,
  maskEmail,
  maskAddress,
  maskName,
} from '@gahoisarthi/shared';
import type {
  UpdateProfileInput,
  UpdateEducationInput,
  UpdateOccupationInput,
  UpdateFamilyInput,
  UpdatePreferencesInput,
} from './profile.schema';
import type {
  Profile,
  ProfileEducation,
  ProfileOccupation,
  ProfileFamily,
  ProfilePartnerPreferences,
  User,
} from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type FullProfile = Profile & {
  user: User;
  education: ProfileEducation | null;
  occupation: ProfileOccupation | null;
  family: ProfileFamily | null;
  preferences: ProfilePartnerPreferences | null;
  livingCity: { id: number; name: string } | null;
  country: { id: number; name: string; iso2: string } | null;
  gallery: { id: string; r2Key: string; visibility: string; sortOrder: number }[];
};

// ─── Profile completeness calculator ─────────────────────────────────────────

function computeCompleteness(profile: FullProfile): number {
  let filled = 0;
  const total = 20;

  if (profile.gender) filled++;
  if (profile.gotra) filled++;
  if (profile.maritalStatus) filled++;
  if (profile.dateOfBirth) filled++;
  if (profile.height_cm) filled++;
  if (profile.complexion) filled++;
  if (profile.mobile) filled++;
  if (profile.livingCityId) filled++;
  if (profile.aboutMe) filled++;
  if (profile.manglikStatus) filled++;

  if (profile.education?.highestDegree) filled++;
  if (profile.education?.fieldOfStudy) filled++;

  if (profile.occupation?.occupationType) filled++;
  if (profile.occupation?.annualIncomeMin) filled++;

  if (profile.family?.fatherName) filled++;
  if (profile.family?.familyType) filled++;
  if (profile.family?.familyStatus) filled++;

  if (profile.preferences?.ageMin) filled++;
  if (profile.preferences?.heightMinCm) filled++;

  if (profile.gallery && profile.gallery.length > 0) filled++;

  return Math.round((filled / total) * 100);
}

// ─── Serialisers (three-tier visibility) ─────────────────────────────────────

/**
 * serializeProfileCard — free users / list & search endpoints
 * NO PII: no phone, no email, no address
 */
export function serializeProfileCard(profile: FullProfile) {
  const age = profile.dateOfBirth
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return {
    id: profile.id,
    profileId: profile.profileId,
    gender: profile.gender,
    gotra: profile.gotra,
    manglikStatus: profile.manglikStatus,
    maritalStatus: profile.maritalStatus,
    age,
    height_cm: profile.height_cm,
    complexion: profile.complexion,
    city: profile.livingCity?.name ?? null,
    nativeState: profile.nativeState,
    education: profile.education?.highestDegree ?? null,
    occupation: profile.occupation?.occupationType ?? null,
    profileCompletenessPct: profile.profileCompletenessPct,
    isVerified: profile.isVerified,
    adminStatus: profile.adminStatus,
    aboutMe: profile.aboutMe,
    // NO mobile, NO email, NO address, NO dateOfBirth raw, NO timeOfBirth
  };
}

/**
 * serializeMaskedProfile — paid user, no mutual interest
 * Shows masked PII
 */
export function serializeMaskedProfile(profile: FullProfile) {
  const base = serializeProfileCard(profile);
  return {
    ...base,
    mobile: profile.mobile ? maskPhone(profile.mobile) : null,
    email: maskEmail(profile.user.email),
    homeAddress: profile.family?.homeAddress ? maskAddress(profile.family.homeAddress) : null,
    fatherName: profile.family?.fatherName ? maskName(profile.family.fatherName) : null,
    fatherMobile: profile.family?.fatherMobile ? maskPhone(profile.family.fatherMobile) : null,
    education: {
      highestDegree: profile.education?.highestDegree,
      fieldOfStudy: profile.education?.fieldOfStudy,
      institution: profile.education?.institution,
      completionYear: profile.education?.completionYear,
    },
    occupation: {
      type: profile.occupation?.occupationType,
      jobTitle: profile.occupation?.jobTitle,
      employer: profile.occupation?.employer,
      annualIncomeMin: profile.occupation?.annualIncomeMin,
      annualIncomeMax: profile.occupation?.annualIncomeMax,
    },
    family: {
      fatherOccupation: profile.family?.fatherOccupation,
      motherOccupation: profile.family?.motherOccupation,
      siblings: profile.family?.siblings,
      familyType: profile.family?.familyType,
      familyStatus: profile.family?.familyStatus,
    },
    preferences: profile.preferences ? {
      ageMin: profile.preferences.ageMin,
      ageMax: profile.preferences.ageMax,
      heightMinCm: profile.preferences.heightMinCm,
      heightMaxCm: profile.preferences.heightMaxCm,
      maritalStatus: profile.preferences.maritalStatus,
      educationMin: profile.preferences.educationMin,
      incomeMin: profile.preferences.incomeMin,
      manglikPreference: profile.preferences.manglikPreference,
      excludeSameGotra: profile.preferences.excludeSameGotra,
      preferredCityIds: profile.preferences.preferredCityIds,
      preferredCountries: profile.preferences.preferredCountries,
    } : null,
  };
}

/**
 * serializeFullProfile — paid user + mutual accepted interest
 * Full PII revealed
 */
export function serializeFullProfile(profile: FullProfile) {
  const base = serializeMaskedProfile(profile);
  return {
    ...base,
    mobile: profile.mobile ?? null, // Unmasked
    email: profile.user.email, // Unmasked
    homeAddress: profile.family?.homeAddress ?? null, // Unmasked
    fatherName: profile.family?.fatherName ?? null, // Unmasked
    fatherMobile: profile.family?.fatherMobile ?? null, // Unmasked
    aakna: profile.aakna,
    nativeState: profile.nativeState,
    country: profile.country?.name ?? null,
    preferredLanguage: profile.user.preferredLanguage,
    family: {
      fatherName: profile.family?.fatherName,
      fatherMobile: profile.family?.fatherMobile,
      fatherOccupation: profile.family?.fatherOccupation,
      motherName: profile.family?.motherName,
      motherOccupation: profile.family?.motherOccupation,
      siblings: profile.family?.siblings,
      familyType: profile.family?.familyType,
      familyStatus: profile.family?.familyStatus,
      homeAddress: profile.family?.homeAddress,
    },
  };
}

// ─── DB include helper ────────────────────────────────────────────────────────

const FULL_PROFILE_INCLUDE = {
  user: true,
  education: true,
  occupation: true,
  family: true,
  preferences: true,
  livingCity: { select: { id: true, name: true } },
  country: { select: { id: true, name: true, iso2: true } },
  gallery: {
    where: { adminStatus: 'approved' },
    select: { id: true, r2Key: true, visibility: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

// ─── Service functions ────────────────────────────────────────────────────────

export async function getMyProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    include: FULL_PROFILE_INCLUDE,
  });

  if (!profile) return null;

  return serializeFullProfile(profile as FullProfile);
}

export async function upsertProfile(userId: string, data: UpdateProfileInput) {
  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
    create: {
      id: userId,
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
    include: FULL_PROFILE_INCLUDE,
  });

  const pct = computeCompleteness(profile as FullProfile);
  await prisma.profile.update({
    where: { id: userId },
    data: { profileCompletenessPct: pct },
  });

  return serializeFullProfile({ ...profile, profileCompletenessPct: pct } as FullProfile);
}

export async function upsertEducation(userId: string, data: UpdateEducationInput) {
  await prisma.profileEducation.upsert({
    where: { profileId: userId },
    update: data,
    create: { profileId: userId, ...data },
  });

  // Recalculate completeness
  const profile = await prisma.profile.findUnique({ where: { id: userId }, include: FULL_PROFILE_INCLUDE });
  if (profile) {
    const pct = computeCompleteness(profile as FullProfile);
    await prisma.profile.update({ where: { id: userId }, data: { profileCompletenessPct: pct } });
  }
}

export async function upsertOccupation(userId: string, data: UpdateOccupationInput) {
  await prisma.profileOccupation.upsert({
    where: { profileId: userId },
    update: data,
    create: { profileId: userId, ...data },
  });

  const profile = await prisma.profile.findUnique({ where: { id: userId }, include: FULL_PROFILE_INCLUDE });
  if (profile) {
    const pct = computeCompleteness(profile as FullProfile);
    await prisma.profile.update({ where: { id: userId }, data: { profileCompletenessPct: pct } });
  }
}

export async function upsertFamily(userId: string, data: UpdateFamilyInput) {
  await prisma.profileFamily.upsert({
    where: { profileId: userId },
    update: data,
    create: { profileId: userId, ...data },
  });

  const profile = await prisma.profile.findUnique({ where: { id: userId }, include: FULL_PROFILE_INCLUDE });
  if (profile) {
    const pct = computeCompleteness(profile as FullProfile);
    await prisma.profile.update({ where: { id: userId }, data: { profileCompletenessPct: pct } });
  }
}

export async function upsertPreferences(userId: string, data: UpdatePreferencesInput) {
  await prisma.profilePartnerPreferences.upsert({
    where: { profileId: userId },
    update: data,
    create: { profileId: userId, ...data },
  });

  const profile = await prisma.profile.findUnique({ where: { id: userId }, include: FULL_PROFILE_INCLUDE });
  if (profile) {
    const pct = computeCompleteness(profile as FullProfile);
    await prisma.profile.update({ where: { id: userId }, data: { profileCompletenessPct: pct } });
  }
}

/**
 * Get profile by ID with tier-gated visibility
 */
export async function getProfileById(
  viewerId: string,
  viewerTier: string,
  targetProfileId: string
): Promise<Record<string, unknown> | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: targetProfileId, adminStatus: 'approved' },
    include: FULL_PROFILE_INCLUDE,
  });

  if (!profile) return null;

  // Record the profile view
  await prisma.profileView.upsert({
    where: {
      id: `${viewerId}_${targetProfileId}`,
    },
    update: { createdAt: new Date() },
    create: {
      viewerId,
      viewedId: targetProfileId,
    },
  }).catch(() => {
    // upsert might fail if id format differs — create directly
    prisma.profileView.create({
      data: { viewerId, viewedId: targetProfileId },
    }).catch(() => {}); // non-critical
  });

  // Determine visibility tier
  if (viewerTier !== 'paid') {
    return serializeProfileCard(profile as FullProfile);
  }

  // Check mutual interest
  const mutualInterest = await prisma.interest.findFirst({
    where: {
      OR: [
        { senderId: viewerId, receiverId: targetProfileId, status: 'accepted' },
        { senderId: targetProfileId, receiverId: viewerId, status: 'accepted' },
      ],
    },
  });

  if (mutualInterest) {
    return serializeFullProfile(profile as FullProfile);
  }

  return serializeMaskedProfile(profile as FullProfile);
}

export async function deleteProfile(userId: string): Promise<void> {
  // Hard delete — cascades to all sub-tables via Prisma relations
  await prisma.user.delete({ where: { id: userId } });
}

export async function getProfileViews(userId: string, userTier: string) {
  const views = await prisma.profileView.findMany({
    where: { viewedId: userId },
    include: {
      viewer: {
        include: FULL_PROFILE_INCLUDE,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return views.map((v) => {
    const serializedViewer = serializeProfileCard(v.viewer as FullProfile);
    if (userTier !== 'paid') {
      return {
        id: v.id,
        createdAt: v.createdAt,
        viewer: {
          id: '',
          profileId: 0,
          gender: serializedViewer.gender,
          age: serializedViewer.age,
          gotra: '***',
          city: '***',
          education: '***',
          occupation: '***',
          isMasked: true,
        },
      };
    }
    return {
      id: v.id,
      createdAt: v.createdAt,
      viewer: {
        ...serializedViewer,
        isMasked: false,
      },
    };
  });
}

