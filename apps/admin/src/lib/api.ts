import type { ApiResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';
export const TOKEN_KEY = 'admin_token';
export const ADMIN_KEY = 'admin_profile';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, admin?: unknown): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (admin) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  }
}

export function getStoredAdmin<T>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  { auth = true }: { auth?: boolean } = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (res.status === 401 && auth && typeof window !== 'undefined') {
    clearAuth();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  if (!res.ok || !json.success) {
    throw new ApiError(json.error ?? `Request failed (${res.status})`, res.status);
  }

  return json;
}

export async function sendAdminOtp(email: string) {
  return apiRequest<{ sent: boolean }>(
    '/admin-auth/send-otp',
    { method: 'POST', body: JSON.stringify({ email }) },
    { auth: false }
  );
}

export async function verifyAdminOtp(email: string, otp: string) {
  return apiRequest<{ token: string; admin: { id: string; email: string; name: string | null; role: string } }>(
    '/admin-auth/verify-otp',
    { method: 'POST', body: JSON.stringify({ email, otp }) },
    { auth: false }
  );
}

export async function fetchAdminMe() {
  return apiRequest<{ id: string; email: string; name: string | null; role: string }>('/admin-auth/me');
}

const PUSH_BANNER_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const PUSH_BANNER_MAX_BYTES = 2 * 1024 * 1024;

export async function uploadPushBanner(file: File): Promise<string> {
  if (!PUSH_BANNER_TYPES.includes(file.type as (typeof PUSH_BANNER_TYPES)[number])) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }
  if (file.size > PUSH_BANNER_MAX_BYTES) {
    throw new Error('Image must be 2MB or smaller');
  }

  const res = await apiRequest<{ uploadUrl: string; imageUrl: string; r2Key: string }>(
    '/admin/push/upload-url',
    {
      method: 'POST',
      body: JSON.stringify({ contentType: file.type }),
    }
  );

  const putRes = await fetch(res.data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error('Failed to upload image to Cloudflare R2');
  }

  return res.data.imageUrl;
}
