import { Platform } from 'react-native';

export const API_BASE_URL = 'http://192.168.3.41:3000';

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

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error('上传失败');
  }
  return result;
}

export async function getAnalysis(analysisId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/analysis/${analysisId}`);
  if (!response.ok) {
    throw new Error('获取数据失败');
  }
  return response.json();
}
