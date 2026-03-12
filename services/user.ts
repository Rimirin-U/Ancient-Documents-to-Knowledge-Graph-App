import { API_BASE_URL, authHeaders } from './api';

export type UserInfo = {
  id: number;
  username: string;
  email: string;
  created_at: string;
};

export async function getMe(): Promise<UserInfo> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, { headers });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.detail || '获取用户信息失败');
  }
  return data.user as UserInfo;
}

export async function updateMe(params: {
  username?: string;
  password?: string;
  email?: string;
}): Promise<UserInfo> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.detail || '更新失败');
  }
  return data.user as UserInfo;
}
