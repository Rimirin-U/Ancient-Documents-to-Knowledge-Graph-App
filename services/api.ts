// services/api.ts
// API 基础配置和公共函数

import { getToken } from './auth';

export const API_BASE_URL = 'http://192.168.43.126:3000';

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}