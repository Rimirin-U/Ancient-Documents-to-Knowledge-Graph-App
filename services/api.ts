// services/api.ts
// 通用请求工具，内置 Token 自动刷新拦截器

import { getStorageItem, setStorageItem, removeStorageItem } from './storage';
import { API_BASE_URL } from './config';

export { API_BASE_URL };

const TOKEN_KEY = 'auth_token';
const EXPIRES_KEY = 'auth_expires_at';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

let _refreshPromise: Promise<string | null> | null = null;

async function refreshTokenInternal(): Promise<string | null> {
  const token = await getStorageItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access_token) {
      const expiresAt = (Date.now() + TOKEN_TTL_MS).toString();
      await setStorageItem(TOKEN_KEY, data.access_token);
      await setStorageItem(EXPIRES_KEY, expiresAt);
      return data.access_token;
    }
  } catch {
    // 刷新失败，静默处理
  }
  return null;
}

async function refreshToken(): Promise<string | null> {
  if (!_refreshPromise) {
    _refreshPromise = refreshTokenInternal().finally(() => {
      _refreshPromise = null;
    });
  }
  return _refreshPromise;
}

export async function getToken(): Promise<string | null> {
  return getStorageItem(TOKEN_KEY);
}

export async function isTokenValid(): Promise<boolean> {
  const token = await getStorageItem(TOKEN_KEY);
  const expiresAt = await getStorageItem(EXPIRES_KEY);
  if (!token || !expiresAt) return false;
  return Date.now() < parseInt(expiresAt, 10);
}

export async function saveToken(token: string): Promise<void> {
  const expiresAt = (Date.now() + TOKEN_TTL_MS).toString();
  await setStorageItem(TOKEN_KEY, token);
  await setStorageItem(EXPIRES_KEY, expiresAt);
}

export async function clearToken(): Promise<void> {
  await removeStorageItem(TOKEN_KEY);
  await removeStorageItem(EXPIRES_KEY);
}

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 带 Token 自动刷新的 fetch 封装。
 * 当响应为 401 时，自动刷新 Token 并重试一次；
 * 若刷新后仍 401，清除本地 Token（触发重新登录）。
 */
export async function apiFetch(
  input: RequestInfo,
  init?: RequestInit,
  retry = true,
): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // multipart/form-data 必须由运行时自动附带 boundary；若保留 application/json 等 Content-Type 会导致上传失败，部分环境下表现为 Network request failed
  if (init?.body instanceof FormData) {
    headers.delete('Content-Type');
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401 && retry) {
    const newToken = await refreshToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      return apiFetch(input, { ...init, headers }, false);
    }
    // 刷新失败，清除凭证，由各页面处理跳转登录
    await removeStorageItem(TOKEN_KEY);
    await removeStorageItem(EXPIRES_KEY);
  }

  return response;
}
