// services/storage.ts
// Web 端使用 localStorage
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * 获取存储值
 */
export async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // Web 端使用 localStorage
      const value = localStorage.getItem(key);
      return value;
    } else {
      // 移动端使用 expo-secure-store
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error(`Failed to get storage item ${key}:`, error);
    return null;
  }
}

/**
 * 设置存储值
 */
export async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Web 端使用 localStorage
      localStorage.setItem(key, value);
    } else {
      // 移动端使用 expo-secure-store
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`Failed to set storage item ${key}:`, error);
  }
}

/**
 * 删除存储值
 */
export async function removeStorageItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Web 端使用 localStorage
      localStorage.removeItem(key);
    } else {
      // 移动端使用 expo-secure-store
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`Failed to remove storage item ${key}:`, error);
  }
}

/**
 * 清空所有存储值
 */
export async function clearStorage(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Web 端使用 localStorage
      localStorage.clear();
    } else {
      // 移动端逐个删除
      await removeStorageItem('auth_token');
      await removeStorageItem('auth_expires_at');
    }
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}
