// services/auth.ts
// 用户认证相关 API 调用，Token 管理
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';
import { API_BASE_URL } from './api';

const TOKEN_KEY = 'auth_token';
const EXPIRES_KEY = 'auth_expires_at';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// 获取当前存储的 Token
export async function getToken(): Promise<string | null> {
  return getStorageItem(TOKEN_KEY);
}

// 检查 Token 是否存在且未过期
export async function isTokenValid(): Promise<boolean> {
  const token = await getStorageItem(TOKEN_KEY);
  const expiresAt = await getStorageItem(EXPIRES_KEY);
  if (!token || !expiresAt) return false;
  return Date.now() < parseInt(expiresAt, 10);
}

// 保存 Token 和过期时间
async function saveToken(token: string): Promise<void> {
  const expiresAt = (Date.now() + TOKEN_TTL_MS).toString();
  await setStorageItem(TOKEN_KEY, token);
  await setStorageItem(EXPIRES_KEY, expiresAt);
}

// 清除 Token 和过期时间
async function clearToken(): Promise<void> {
  await removeStorageItem(TOKEN_KEY);
  await removeStorageItem(EXPIRES_KEY);
}

// 登录接口
// 成功后保存 Token 并返回用户信息
export async function login(
  username: string,
  password: string
): Promise<{ userId: number; username: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.detail || '用户名或密码错误');
  }
  await saveToken(data.access_token);
  return { userId: data.user_id, username: data.username };
}

// 注册接口
export async function register(
  username: string,
  password: string,
  email: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.detail || '注册失败');
  }
}

// 登出接口
// 成功后清除本地 Token
export async function logout(): Promise<void> {
  const token = await getToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // 清除本地 Token
    }
  }
  await clearToken();
}
