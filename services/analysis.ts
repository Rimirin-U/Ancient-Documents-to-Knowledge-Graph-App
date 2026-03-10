// services/analysis.ts
// 图像分析相关 API 调用
import { Platform } from 'react-native';
import { getToken } from './auth';
import { API_BASE_URL } from './api';

// 获取带有认证信息的请求头
async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}


// API 待修改


const getMimeType = (fileName: string): string => {
  const ext = fileName.toLowerCase().split('.').pop();
  const mimeTypes: { [key: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
  };
  return mimeTypes[ext || ''] || 'image/jpeg';
};

export async function uploadImage(uri: string, fileName: string): Promise<{ analysisId: string }> {
  const formData = new FormData();

  if (Platform.OS === 'web' && uri.startsWith('blob:')) {
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append('image', new File([blob], fileName, { type: blob.type }));
  } else {
    formData.append('image', {
      uri,
      type: getMimeType(fileName),
      name: fileName,
    } as any);
  }

  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error('上传失败');
  }
  return result;
}

export async function getAnalysis(analysisId: string): Promise<any> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/analysis/${analysisId}`, { headers });
  if (!response.ok) {
    throw new Error('获取数据失败');
  }
  return response.json();
}
