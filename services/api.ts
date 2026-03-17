// services/api.ts
// API 基础配置和公共函数

import { getToken } from './auth';
import { API_BASE_URL } from './config';

export { API_BASE_URL };

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}