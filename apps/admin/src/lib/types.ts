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
  pendingProfiles: number;
  pendingPhotos: number;
  openReports: number;
  recentSignups: number;
}

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
  reported: {
    profileId: number;
    user: { email: string };
  };
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

export interface PaginatedMeta {
  next_cursor?: string | null;
}

export function getNextCursor(meta: Record<string, unknown>): string | null {
  const cursor = meta.next_cursor;
  return typeof cursor === 'string' ? cursor : null;
}
