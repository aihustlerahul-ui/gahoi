import { Platform } from 'react-native';
import { deleteSecureItem, getSecureItem, setSecureItem } from './secure-storage';

let API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

if (__DEV__) {
  if (Platform.OS === 'web') {
    // LAN IP in .env is for device/emulator; browser dev uses localhost by default
    API_URL = process.env.EXPO_PUBLIC_API_URL_WEB ?? 'http://localhost:3001/v1';
  } else if (Platform.OS === 'android') {
    API_URL = API_URL.replace('localhost', '10.0.2.2');
  }
}

let _accessToken: string | null = null;
let _onAuthChange: ((isLoggedIn: boolean) => void) | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (_onAuthChange) {
    _onAuthChange(!!token);
  }
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function subscribeAuthChange(callback: (isLoggedIn: boolean) => void) {
  _onAuthChange = callback;
}

const REFRESH_TOKEN_KEY = 'gahoi_refresh_token';

export async function saveRefreshToken(token: string) {
  await setSecureItem(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await getSecureItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function deleteTokens() {
  _accessToken = null;
  try {
    await deleteSecureItem(REFRESH_TOKEN_KEY);
  } catch {}
  if (_onAuthChange) {
    _onAuthChange(false);
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshTokens(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await deleteTokens();
    throw new Error('Session expired');
  }

  const result = await res.json();
  if (!result.success || !result.data) {
    await deleteTokens();
    throw new Error('Session expired');
  }

  const { accessToken, refreshToken: newRefresh } = result.data;
  setAccessToken(accessToken);
  if (newRefresh) {
    await saveRefreshToken(newRefresh);
  }
  return accessToken;
}

export async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (_accessToken) {
    headers.set('Authorization', `Bearer ${_accessToken}`);
  }

  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  try {
    let response = await fetch(url, { ...options, headers });

    if (
      response.status === 401 &&
      !path.includes('/auth/refresh') &&
      !path.includes('/auth/verify-otp')
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newAccessToken = await refreshTokens();
          isRefreshing = false;
          onRefreshed(newAccessToken);
        } catch (err) {
          isRefreshing = false;
          throw err;
        }
      }

      const retryToken = await new Promise<string>((resolve) => {
        subscribeTokenRefresh((token) => resolve(token));
      });

      headers.set('Authorization', `Bearer ${retryToken}`);
      response = await fetch(url, { ...options, headers });
    }

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error || 'Request failed');
    }

    return json;
  } catch (err) {
    throw err;
  }
}
