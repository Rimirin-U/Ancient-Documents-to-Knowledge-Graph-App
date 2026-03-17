// services/api.ts
// API 基础配置和公共函数

import { getToken } from './auth';
import { Platform } from 'react-native';

export const API_BASE_URL = 'http://8.162.9.49:3000';

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}