// services/storage.ts
// Web 端使用 localStorage
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SECURE_STORE_CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = '__chunk_count';

function getChunkCountKey(key: string): string {
  return `${key}${CHUNK_COUNT_SUFFIX}`;
}

function getChunkKey(key: string, index: number): string {
  return `${key}__chunk_${index}`;
}

async function removeChunkedSecureStoreItem(key: string): Promise<void> {
  const chunkCountKey = getChunkCountKey(key);
  const chunkCountRaw = await SecureStore.getItemAsync(chunkCountKey);
  const chunkCount = Number(chunkCountRaw);

  if (Number.isInteger(chunkCount) && chunkCount > 0) {
    for (let index = 0; index < chunkCount; index += 1) {
      await SecureStore.deleteItemAsync(getChunkKey(key, index));
    }
  }

  await SecureStore.deleteItemAsync(chunkCountKey);
}

async function setSecureStoreItemCompat(key: string, value: string): Promise<void> {
  await removeChunkedSecureStoreItem(key);

  if (value.length <= SECURE_STORE_CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const chunks: string[] = [];
  for (let start = 0; start < value.length; start += SECURE_STORE_CHUNK_SIZE) {
    chunks.push(value.slice(start, start + SECURE_STORE_CHUNK_SIZE));
  }

  for (let index = 0; index < chunks.length; index += 1) {
    await SecureStore.setItemAsync(getChunkKey(key, index), chunks[index]);
  }

  await SecureStore.setItemAsync(getChunkCountKey(key), String(chunks.length));
  await SecureStore.deleteItemAsync(key);
}

async function getSecureStoreItemCompat(key: string): Promise<string | null> {
  const directValue = await SecureStore.getItemAsync(key);
  if (directValue !== null) {
    return directValue;
  }

  const chunkCountRaw = await SecureStore.getItemAsync(getChunkCountKey(key));
  const chunkCount = Number(chunkCountRaw);

  if (!Number.isInteger(chunkCount) || chunkCount <= 0) {
    return null;
  }

  const chunks: string[] = [];
  for (let index = 0; index < chunkCount; index += 1) {
    const chunk = await SecureStore.getItemAsync(getChunkKey(key, index));
    if (chunk === null) {
      return null;
    }
    chunks.push(chunk);
  }

  return chunks.join('');
}

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
      return await getSecureStoreItemCompat(key);
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
      await setSecureStoreItemCompat(key, value);
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
      await removeChunkedSecureStoreItem(key);
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
