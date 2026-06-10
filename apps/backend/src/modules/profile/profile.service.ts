import { prisma } from '../../db/prisma';
import {
  maskPhone,
  maskEmail,
  maskAddress,
  maskName,
  isProfileUuid,
  parsePublicProfileId,
  formatProfileIdLabel,
  resolveHeightFtIn,
  formatHeightFtIn,
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
  family:
    | (ProfileFamily & {
        maternalUncleAaknaMaster: { id: number; name: string } | null;
      })
    | null;
  preferences: ProfilePartnerPreferences | null;
  livingCity: { id: number; name: string; state: { name: string } } | null;
  birthCity: { id: number; name: string; state: { name: string } } | null;
  country: { id: number; name: string; iso2: string } | null;
  gotraMaster: {
    id: number;
    key: string;
    name: string;
    gotraHindi: string;
    gotraEnglish: string;
    rishi: string | null;
    kuldevi: string | null;
  } | null;
  selectedAakna: { id: number; name: string } | null;
  gallery: { id: string; r2Key: string; visibility: string; sortOrder: number }[];
};

/** Resolve internal UUID from public numeric ID or UUID string */
export async function resolveProfileInternalId(idOrPublicId: string): Promise<string | null> {
  const raw = idOrPublicId.trim();
  if (isProfileUuid(raw)) return raw;

  const publicId = parsePublicProfileId(raw);
  if (publicId === null) return null;

  const profile = await prisma.profile.findUnique({
    where: { profileId: publicId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

// ─── Profile completeness calculator ─────────────────────────────────────────

function computeCompleteness(profile: FullProfile): number {
  let filled = 0;
  const total = 28;

  if (profile.firstName) filled++;
  if (profile.lastName) filled++;
  if (profile.gender) filled++;
  if (profile.gotra) filled++;
  if (profile.maritalStatus) filled++;
  if (profile.dateOfBirth) filled++;
  if (profile.timeOfBirth) filled++;
  if (profile.heightFt != null || profile.height_cm) filled++;
  if (profile.complexion) filled++;
  if (profile.mobile) filled++;
  if (profile.livingCityId) filled++;
  if (profile.birthCityId) filled++;
  if (profile.aboutMe) filled++;
  if (profile.manglikStatus) filled++;
  if (profile.motherTongue) filled++;
  if (profile.dietaryHabit) filled++;

  if (profile.education?.highestDegree) filled++;
  if (profile.education?.fieldOfStudy) filled++;

  if (profile.occupation?.occupationType) filled++;
  if (profile.occupation?.annualIncomeMin) filled++;

  if (profile.family?.fatherName) filled++;
  if (profile.family?.familyType) filled++;
  if (profile.family?.familyStatus) filled++;
  if (profile.family?.homeAddress) filled++;

  if (profile.preferences?.ageMin) filled++;
  if (profile.preferences?.heightMinFt != null || profile.preferences?.heightMinCm) filled++;

  if (profile.user.termsAcceptedAt) filled++;

  if (profile.gallery && profile.gallery.length > 0) filled++;

  return Math.round((filled / total) * 100);
}

// ─── Height helpers ───────────────────────────────────────────────────────────

function serializeHeightFields(profile: FullProfile) {
  const { ft, in: inches } = resolveHeightFtIn(
    profile.heightFt,
    profile.heightIn,
    profile.height_cm,
  );
  return {
    heightFt: ft,
    heightIn: inches,
    heightDisplay: formatHeightFtIn(ft, inches),
    /** @deprecated Legacy cm — kept for list cards until mobile fully migrates */
    height_cm: profile.height_cm,
  };
}

function serializePrefHeightFields(prefs: ProfilePartnerPreferences | null) {
  if (!prefs) return null;
  const min = resolveHeightFtIn(prefs.heightMinFt, prefs.heightMinIn, prefs.heightMinCm);
  const max = resolveHeightFtIn(prefs.heightMaxFt, prefs.heightMaxIn, prefs.heightMaxCm);
  return {
    heightMinFt: min.ft,
    heightMinIn: min.in,
    heightMaxFt: max.ft,
    heightMaxIn: max.in,
    heightMinCm: prefs.heightMinCm,
    heightMaxCm: prefs.heightMaxCm,
  };
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
    publicProfileId: profile.profileId,
    profileIdLabel: formatProfileIdLabel(profile.profileId),
    firstName: profile.firstName,
    lastName: profile.lastName,
    gender: profile.gender,
    gotra: profile.gotra ?? profile.gotraMaster?.name ?? null,
    gotraId: profile.gotraId,
    aakna: profile.aakna ?? profile.selectedAakna?.name ?? null,
    aaknaId: profile.aaknaId,
    gotraEnglish: profile.gotraMaster?.gotraEnglish ?? null,
    gotraHindi: profile.gotraMaster?.gotraHindi ?? null,
    rishi: profile.gotraMaster?.rishi ?? null,
    kuldevi: profile.gotraMaster?.kuldevi ?? null,
    manglikStatus: profile.manglikStatus,
    maritalStatus: profile.maritalStatus,
    age,
    ...serializeHeightFields(profile),
    weightKg: profile.weightKg,
    complexion: profile.complexion,
    city: profile.livingCity?.name ?? null,
    state: profile.livingCity?.state?.name ?? null,
    birthCity: profile.birthCity?.name ?? profile.placeOfBirth ?? null,
    birthState: profile.birthCity?.state?.name ?? null,
    town: profile.town,
    nativeState: profile.nativeState,
    motherTongue: profile.motherTongue,
    disability: profile.disability,
    profileCreatedBy: profile.profileCreatedBy,
    bloodGroup: profile.bloodGroup,
    dietaryHabit: profile.dietaryHabit,
    placeOfBirth: profile.birthCity?.name ?? profile.placeOfBirth,
    nakshatra: profile.nakshatra,
    zodiac: profile.zodiac,
    education: profile.education?.highestDegree ?? null,
    occupation: profile.occupation?.occupationType ?? null,
    profileCompletenessPct: profile.profileCompletenessPct,
    isVerified: profile.isVerified,
    adminStatus: profile.adminStatus,
    aboutMe: profile.aboutMe,
    // NO mobile, whatsapp, email, address
  };
}

/**
 * serializeMaskedProfile — paid user, no mutual interest
 * Shows masked PII
 */
export function serializeMaskedProfile(profile: FullProfile) {
  const base = serializeProfileCard(profile);
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  return {
    ...base,
    firstName: profile.firstName ? maskName(profile.firstName) : null,
    lastName: profile.lastName ? maskName(profile.lastName) : null,
    fullName: fullName ? maskName(fullName) : null,
    mobile: profile.mobile ? maskPhone(profile.mobile) : null,
    whatsapp: profile.whatsapp ? maskPhone(profile.whatsapp) : null,
    email: maskEmail(profile.user.email),
    homeAddress: profile.family?.homeAddress ? maskAddress(profile.family.homeAddress) : null,
    permanentAddress: profile.family?.permanentAddress ? maskAddress(profile.family.permanentAddress) : null,
    fatherName: profile.family?.fatherName ? maskName(profile.family.fatherName) : null,
    parentMobile: profile.family?.parentMobile ? maskPhone(profile.family.parentMobile) : null,
    education: {
      highestDegree: profile.education?.highestDegree,
      fieldOfStudy: profile.education?.fieldOfStudy,
      institution: profile.education?.institution,
      completionYear: profile.education?.completionYear,
      educationalDetail: profile.education?.educationalDetail,
    },
    occupation: {
      type: profile.occupation?.occupationType,
      jobTitle: profile.occupation?.jobTitle,
      employer: profile.occupation?.employer,
      occupationDetail: profile.occupation?.occupationDetail,
      annualIncomeMin: profile.occupation?.annualIncomeMin,
      annualIncomeMax: profile.occupation?.annualIncomeMax,
    },
    family: {
      fatherOccupation: profile.family?.fatherOccupation,
      motherName: profile.family?.motherName ? maskName(profile.family.motherName) : null,
      motherOccupation: profile.family?.motherOccupation,
      siblings: profile.family?.siblings,
      marriedBrothers: profile.family?.marriedBrothers,
      unmarriedBrothers: profile.family?.unmarriedBrothers,
      marriedSisters: profile.family?.marriedSisters,
      unmarriedSisters: profile.family?.unmarriedSisters,
      maternalUncleName: profile.family?.maternalUncleName ? maskName(profile.family.maternalUncleName) : null,
      maternalUncleAakna:
        profile.family?.maternalUncleAakna ?? profile.family?.maternalUncleAaknaMaster?.name ?? null,
      maternalUncleAaknaId: profile.family?.maternalUncleAaknaId ?? null,
      familyType: profile.family?.familyType,
      familyStatus: profile.family?.familyStatus,
      hasHouse: profile.family?.hasHouse,
      hasCar: profile.family?.hasCar,
    },
    preferences: profile.preferences ? {
      ageMin: profile.preferences.ageMin,
      ageMax: profile.preferences.ageMax,
      ...serializePrefHeightFields(profile.preferences),
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
    firstName: profile.firstName ?? null,
    lastName: profile.lastName ?? null,
    fullName: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null,
    mobile: profile.mobile ?? null,
    whatsapp: profile.whatsapp ?? null,
    email: profile.user.email,
    homeAddress: profile.family?.homeAddress ?? null,
    permanentAddress: profile.family?.permanentAddress ?? null,
    fatherName: profile.family?.fatherName ?? null,
    parentMobile: profile.family?.parentMobile ?? null,
    timeOfBirth: profile.timeOfBirth,
    dateOfBirth: profile.dateOfBirth?.toISOString() ?? null,
    birthCityId: profile.birthCityId,
    livingCityId: profile.livingCityId,
    countryId: profile.countryId,
    termsAcceptedAt: profile.user.termsAcceptedAt?.toISOString() ?? null,
    aakna: profile.aakna,
    nativeState: profile.nativeState,
    country: profile.country?.name ?? null,
    preferredLanguage: profile.user.preferredLanguage,
    family: {
      fatherName: profile.family?.fatherName,
      parentMobile: profile.family?.parentMobile,
      fatherOccupation: profile.family?.fatherOccupation,
      motherName: profile.family?.motherName,
      motherOccupation: profile.family?.motherOccupation,
      siblings: profile.family?.siblings,
      marriedBrothers: profile.family?.marriedBrothers,
      unmarriedBrothers: profile.family?.unmarriedBrothers,
      marriedSisters: profile.family?.marriedSisters,
      unmarriedSisters: profile.family?.unmarriedSisters,
      maternalUncleName: profile.family?.maternalUncleName,
      maternalUncleAakna:
        profile.family?.maternalUncleAakna ?? profile.family?.maternalUncleAaknaMaster?.name ?? null,
      maternalUncleAaknaId: profile.family?.maternalUncleAaknaId ?? null,
      familyType: profile.family?.familyType,
      familyStatus: profile.family?.familyStatus,
      hasHouse: profile.family?.hasHouse,
      hasCar: profile.family?.hasCar,
      homeAddress: profile.family?.homeAddress,
      permanentAddress: profile.family?.permanentAddress,
    },
  };
}

// ─── DB include helper ────────────────────────────────────────────────────────

const FULL_PROFILE_INCLUDE = {
  user: true,
  education: true,
  occupation: true,
  family: {
    include: {
      maternalUncleAaknaMaster: { select: { id: true, name: true } },
    },
  },
  preferences: true,
  livingCity: { select: { id: true, name: true, state: { select: { name: true } } } },
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
    where: { adminStatus: 'approved' },
    select: { id: true, r2Key: true, visibility: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

// ─── Service functions ────────────────────────────────────────────────────────

async function resolveGotraAaknaFields(
  data: UpdateProfileInput
): Promise<UpdateProfileInput> {
  if (!data.gotraId && !data.aaknaId) return data;

  if (!data.gotraId) {
    throw new Error('Gotra is required when selecting aakna');
  }

  const gotra = await prisma.gotra.findUnique({ where: { id: data.gotraId } });
  if (!gotra) throw new Error('Invalid gotra selected');

  const resolved: UpdateProfileInput = {
    ...data,
    gotra: gotra.name,
  };

  if (data.aaknaId) {
    const link = await prisma.gotraAakna.findFirst({
      where: { gotraId: data.gotraId, aaknaMasterId: data.aaknaId },
      include: { aakna: true },
    });
    if (!link) throw new Error('Invalid aakna for selected gotra');
    resolved.aakna = link.aakna.name;
  } else {
    resolved.aakna = undefined;
    resolved.aaknaId = undefined;
  }

  return resolved;
}

async function resolveFamilyFields(data: UpdateFamilyInput): Promise<UpdateFamilyInput> {
  if (!data.maternalUncleAaknaId) return data;

  const aakna = await prisma.aaknaMaster.findUnique({ where: { id: data.maternalUncleAaknaId } });
  if (!aakna) throw new Error('Invalid maternal uncle aakna');

  return { ...data, maternalUncleAakna: aakna.name };
}

export async function getMyProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    include: FULL_PROFILE_INCLUDE,
  });

  if (!profile) return null;

  return serializeFullProfile(profile as FullProfile);
}

export async function upsertProfile(userId: string, data: UpdateProfileInput) {
  const resolved = await resolveGotraAaknaFields(data);

  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: {
      ...resolved,
      dateOfBirth: resolved.dateOfBirth ? new Date(resolved.dateOfBirth) : undefined,
    },
    create: {
      id: userId,
      ...resolved,
      dateOfBirth: resolved.dateOfBirth ? new Date(resolved.dateOfBirth) : undefined,
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
  const resolved = await resolveFamilyFields(data);

  await prisma.profileFamily.upsert({
    where: { profileId: userId },
    update: resolved,
    create: { profileId: userId, ...resolved },
  });

  const profile = await prisma.profile.findUnique({ where: { id: userId }, include: FULL_PROFILE_INCLUDE });
  if (profile) {
    const pct = computeCompleteness(profile as FullProfile);
    await prisma.profile.update({ where: { id: userId }, data: { profileCompletenessPct: pct } });
  }
}

export async function upsertPreferences(userId: string, data: UpdatePreferencesInput) {
  const { termsAccepted, ...prefs } = data;

  await prisma.profilePartnerPreferences.upsert({
    where: { profileId: userId },
    update: prefs,
    create: { profileId: userId, ...prefs },
  });

  if (termsAccepted) {
    await prisma.user.update({
      where: { id: userId },
      data: { termsAcceptedAt: new Date() },
    });
  }

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
  targetIdOrPublicId: string
): Promise<Record<string, unknown> | null> {
  const targetProfileId = await resolveProfileInternalId(targetIdOrPublicId);
  if (!targetProfileId) return null;

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

