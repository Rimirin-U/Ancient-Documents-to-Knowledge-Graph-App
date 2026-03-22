// services/config.ts
// 与 app.config.js 中 extra.apiBaseUrl 对齐（EAS 构建与 Expo Go 共用同一套解析逻辑）
import Constants from 'expo-constants';

const fromExtra = String(Constants.expoConfig?.extra?.apiBaseUrl ?? '')
  .trim()
  .replace(/\/$/, '');
const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '');
const fallback = 'http://8.162.9.49:3000';

export const API_BASE_URL =
  fromExtra.length > 0 ? fromExtra : fromEnv && fromEnv.length > 0 ? fromEnv : fallback;
