// services/auth.ts
// 用户认证相关 API 调用
import { API_BASE_URL, getToken, isTokenValid, saveToken, clearToken } from './api';

export { getToken, isTokenValid };

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

export async function logout(): Promise<void> {
  const token = await getToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // 网络失败也要清除本地 Token
    }
  }
  await clearToken();
}
