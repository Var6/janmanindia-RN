import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE: string =
  (Constants.expoConfig?.extra as { apiBase?: string } | undefined)?.apiBase ??
  'https://app.janmanindia.org';

const COOKIE_KEY = 'janmanindia.cookie';

let cachedCookie: string | null = null;

async function getCookie(): Promise<string | null> {
  if (cachedCookie !== null) return cachedCookie;
  cachedCookie = await AsyncStorage.getItem(COOKIE_KEY);
  return cachedCookie;
}

async function setCookie(cookie: string | null): Promise<void> {
  cachedCookie = cookie;
  if (cookie === null) await AsyncStorage.removeItem(COOKIE_KEY);
  else await AsyncStorage.setItem(COOKIE_KEY, cookie);
}

/** Pull the auth cookie out of a Set-Cookie response header. The web app
 *  uses a single httpOnly cookie called `auth-token`; we keep only that
 *  pair so we don't accidentally replay analytics / Vercel cookies. */
function extractAuthCookie(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(/auth-token=[^;]+/);
  return match ? match[0] : null;
}

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const cookie = await getCookie();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (cookie) headers.set('Cookie', cookie);

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (err) {
    return { ok: false, status: 0, data: null, error: 'Network error' };
  }

  // Capture auth cookie from any response that sets one (login + refresh).
  const setCookieHeader =
    res.headers.get('set-cookie') ?? (res.headers as unknown as { 'set-cookie'?: string })['set-cookie'] ?? null;
  const newCookie = extractAuthCookie(setCookieHeader);
  if (newCookie) await setCookie(newCookie);

  let data: T | null = null;
  try { data = (await res.json()) as T; } catch { /* non-JSON body */ }

  if (!res.ok) {
    const error = (data as unknown as { error?: string })?.error ?? `HTTP ${res.status}`;
    return { ok: false, status: res.status, data, error };
  }
  return { ok: true, status: res.status, data };
}

export async function login(email: string, password: string): Promise<ApiResponse<{ role: string }>> {
  return api<{ role: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  district?: string;
  village?: string;
  preferredLanguage?: string;
  govtIdType?: string;
  govtIdUrl?: string;
  voiceIntroUrl?: string;
  voiceIntroDurationSec?: number;
}

export async function register(input: RegisterInput): Promise<ApiResponse<{ role?: string; redirectTo?: string; message?: string }>> {
  return api<{ role?: string; redirectTo?: string; message?: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function uploadFile(uri: string, name: string, mimeType: string): Promise<ApiResponse<{ url: string }>> {
  const cookie = await getCookie();
  const form = new FormData();
  form.append('file', { uri, name, type: mimeType } as unknown as Blob);
  try {
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: form,
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    const data = await res.json().catch(() => ({})) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      return { ok: false, status: res.status, data: null, error: data.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status, data: { url: data.url } };
  } catch {
    return { ok: false, status: 0, data: null, error: 'Network error' };
  }
}

export async function logout(): Promise<void> {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
  await setCookie(null);
}

export async function getMe(): Promise<{
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  communityProfile?: { verificationStatus?: string; assignedSocialWorker?: string };
} | null> {
  const res = await api<{ user: { _id: string; name: string; email: string; role: string; phone?: string; communityProfile?: { verificationStatus?: string; assignedSocialWorker?: string } } }>('/api/users/me');
  if (!res.ok || !res.data) return null;
  return res.data.user;
}

export async function hasSession(): Promise<boolean> {
  return (await getCookie()) !== null;
}

export { API_BASE };
