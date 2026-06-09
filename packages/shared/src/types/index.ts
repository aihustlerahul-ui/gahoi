export type UserTier = 'free' | 'paid';
export type UserStatus = 'Active' | 'Suspended' | 'Deleted' | 'Hidden';
export type AuthProvider = 'email_otp' | 'google';
export type ProfileAdminStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type Gender = 'Male' | 'Female';
export type ManglikStatus = 'Manglik' | 'Non-Manglik' | 'Anshik Manglik';
export type MaritalStatus = 'Never Married' | 'Divorced' | 'Widowed' | 'Awaiting Divorce';
export type InterestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';
export type Language = 'en' | 'hi';

export interface ApiResponse<T = null> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta: {
    next_cursor?: string;
    total?: number;
  };
}

export interface KundliScore {
  total: number;
  varna: number;
  vashya: number;
  tara: number;
  yoni: number;
  graha_maitri: number;
  gana: number;
  bhakoot: number;
  nadi: number;
  label: 'Uttam' | 'Madhyam' | 'Vichar Yogya';
  is_approximate: boolean;
}
