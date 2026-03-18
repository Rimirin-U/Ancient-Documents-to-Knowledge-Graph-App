// services/api.ts
// API 基础配置和公共函数

import { getToken } from './auth';

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}