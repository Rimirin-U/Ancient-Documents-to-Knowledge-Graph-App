// services/http.ts
// HTTP 请求工具函数

import { getToken } from './auth';
import { API_BASE_URL } from './constants';

export { API_BASE_URL };

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
