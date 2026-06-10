export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
  meta: Record<string, unknown>;
}

export interface AdminProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface DashboardStats {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  activeProfiles: number;
  pendingProfiles: number;
  pendingPhotos: number;
  openReports: number;
  recentSignups: number;
  signupsToday: number;
  interestsSentToday: number;
  interestToMatchRate: number;
  paidConversionRate: number;
  emailOpenRate: string | null;
}

export interface SignupDataPoint {
  date: string;
  count: number;
}

export interface ProfileListItem {
  id: string;
  profileId: number;
  gender: string | null;
  gotra: string | null;
  adminStatus: string;
  isVerified: boolean;
  profileCompletenessPct: number;
  createdAt: string;
  email: string;
  tier: string;
  userStatus: string;
  city: string | null;
  openReportCount: number;
  isFlagged: boolean;
}

export interface AdminProfileDetail {
  id: string;
  profileId: number;
  gender: string | null;
  gotra: string | null;
  aakna?: string | null;
  manglikStatus?: string;
  maritalStatus?: string | null;
  age?: number | null;
  height_cm?: number | null;
  heightFt?: number | null;
  heightIn?: number | null;
  heightDisplay?: string | null;
  complexion?: string | null;
  mobile?: string | null;
  email?: string | null;
  nativeState?: string | null;
  aboutMe?: string | null;
  adminStatus: string;
  isVerified: boolean;
  profileCompletenessPct?: number;
  createdAt?: string;
  homeAddress?: string | null;
  fatherName?: string | null;
  parentMobile?: string | null;
  country?: string | null;
  city?: string | null;
  tier?: string;
  userStatus?: string;
  openReportCount: number;
  isFlagged: boolean;
  interestStats?: { sent: number; received: number; accepted: number };
  education?: {
    highestDegree?: string | null;
    fieldOfStudy?: string | null;
    institution?: string | null;
    completionYear?: number | null;
  } | null;
  occupation?: {
    occupationType?: string | null;
    jobTitle?: string | null;
    employer?: string | null;
    annualIncomeMin?: number | null;
    annualIncomeMax?: number | null;
  } | null;
  family?: {
    fatherName?: string | null;
    parentMobile?: string | null;
    fatherOccupation?: string | null;
    motherName?: string | null;
    motherOccupation?: string | null;
    siblings?: number | null;
    familyType?: string | null;
    familyStatus?: string | null;
    homeAddress?: string | null;
  } | null;
  preferences?: Record<string, unknown> | null;
  gallery?: Array<{
    id: string;
    r2Key: string;
    adminStatus: string;
    visibility: string;
    signedUrl?: string | null;
  }>;
}

/** Legacy shape — pending queue rows from old API */
export interface PendingProfile {
  id: string;
  profileId: number;
  gender: string | null;
  gotra: string | null;
  maritalStatus: string | null;
  dateOfBirth: string | null;
  height_cm: number | null;
  complexion: string | null;
  mobile: string | null;
  nativeState: string | null;
  aboutMe: string | null;
  adminStatus: string;
  createdAt: string;
  user: { email: string; preferredLanguage: string };
  livingCity: { name: string } | null;
}

export interface PendingPhoto {
  id: string;
  profileId: string;
  r2Key: string;
  signedUrl?: string;
  adminStatus: string;
  createdAt: string;
  profile: {
    profileId: number;
    user: { email: string; preferredLanguage: string };
  };
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reasonCode: string;
  detail: string | null;
  status: string;
  createdAt: string;
  reportedOpenReportCount?: number;
  reportedIsFlagged?: boolean;
  reported: {
    profileId: number;
    user: { email: string };
  };
}

export type ReportAction = 'warn' | 'suspend' | 'ban' | 'dismiss';

export interface InterestActivity {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  sender: { id: string; profileId: number; email: string };
  receiver: { id: string; profileId: number; email: string };
}

export interface InterestAbuseAlert {
  id: string;
  profileId: number;
  email: string;
  tier: string;
  interestsSentToday: number;
  threshold: number;
}

export interface PushCampaign {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  sentAt: string;
  recipientCount: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  nameHi: string;
  durationDays: number;
  priceInr: number;
  isActive: boolean;
  createdAt: string;
  _count?: { subscriptions: number };
}

export interface AdminUser {
  id: string;
  email: string;
  tier: string;
  status: string;
  preferredLanguage: string;
  createdAt: string;
  lastActiveAt: string | null;
  hasPushToken: boolean;
  profile: {
    profileId: number;
    adminStatus: string;
    gender: string | null;
    livingCity: { name: string } | null;
  } | null;
}

export interface AdminAccount {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface RevenueSummary {
  totalRevenue: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalPaidCount: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  status: string;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  plan: { name: string; priceInr: number };
}

export interface SuccessStory {
  id: string;
  profileId: string;
  testimonial: string;
  photoR2Key: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  photoUrl?: string | null;
  profile?: {
    profileId: number;
    user: { email: string };
  };
}

export interface PaginatedMeta {
  next_cursor?: string | null;
}

export function getNextCursor(meta: Record<string, unknown>): string | null {
  const cursor = meta.next_cursor;
  return typeof cursor === 'string' ? cursor : null;
}
