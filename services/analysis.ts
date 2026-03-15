// services/analysis.ts
// 图像分析相关 API 调用
import { Platform } from 'react-native';
import { API_BASE_URL, authHeaders } from './api';

type ApiErrorShape = {
  detail?: string;
  message?: string;
  success?: boolean;
};

type PagedIdsResponse = {
  success: boolean;
  data: {
    total: number;
    skip: number;
    limit: number;
    ids: number[];
  };
  detail?: string;
};

type OcrResultDetailResponse = {
  success: boolean;
  data: {
    id: number;
    image_id: number;
    raw_text: string;
    status: 'pending' | 'processing' | 'done' | 'failed';
    created_at: string;
  };
  detail?: string;
};

type StructuredResultDetailResponse = {
  success: boolean;
  data: {
    id: number;
    ocr_result_id: number;
    content: Record<string, unknown>;
    status: 'pending' | 'processing' | 'done' | 'failed';
    created_at: string;
  };
  detail?: string;
};

type RelationGraphDetailResponse = {
  success: boolean;
  data: {
    id: number;
    structured_result_id: number;
    content: unknown;
    status: 'pending' | 'processing' | 'done' | 'failed';
    created_at: string;
  };
  detail?: string;
};

export type OcrAnalysis = {
  id: number;
  imageId: number;
  rawText: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  createdAt: string;
};

export type StructuredAnalysis = {
  id: number;
  ocrResultId: number;
  content: Record<string, unknown>;
  status: 'pending' | 'processing' | 'done' | 'failed';
  createdAt: string;
};

export type RelationGraphAnalysis = {
  id: number;
  structuredResultId: number;
  content: unknown;
  status: 'pending' | 'processing' | 'done' | 'failed';
  createdAt: string;
};




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

export type UploadImageResponse = {
  success: true;
  imageId: number;
  filename: string;
  originalName: string;
  fileSize: number;
  pipeline_started: boolean;
};

export async function uploadImage(uri: string, fileName: string): Promise<UploadImageResponse> {
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
  const response = await fetch(`${API_BASE_URL}/api/v1/images/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  let result: any;
  try {
    result = await response.json();
  } catch {
    throw new Error('上传失败，请稍后重试');
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || result?.detail || '上传失败');
  }

  return result as UploadImageResponse;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const result = (await response.json()) as T & ApiErrorShape;

  if (!response.ok) {
    throw new Error(result.detail || result.message || '请求失败');
  }

  return result;
}

async function getIdsFromList(url: string): Promise<number[]> {
  const headers = await authHeaders();
  const result = await fetchJson<PagedIdsResponse>(url, { headers });
  if (!result.success) {
    throw new Error(result.detail || '查询列表失败');
  }

  return result.data.ids;
}

export async function getImageDataUrl(imageId: number): Promise<string> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/images/${imageId}`, { headers });

  if (!response.ok) {
    throw new Error('获取图片失败');
  }

  const blob = await response.blob();
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(blob);
  });
}

export async function getOcrIdsByImage(imageId: number, limit = 50): Promise<number[]> {
  return getIdsFromList(`${API_BASE_URL}/api/v1/images/${imageId}/ocr-results?skip=0&limit=${limit}`);
}

export async function getOcrDetail(ocrId: number): Promise<OcrAnalysis> {
  const headers = await authHeaders();
  const result = await fetchJson<OcrResultDetailResponse>(
    `${API_BASE_URL}/api/v1/ocr-results/${ocrId}`,
    { headers }
  );

  if (!result.success) {
    throw new Error(result.detail || '获取OCR详情失败');
  }

  return {
    id: result.data.id,
    imageId: result.data.image_id,
    rawText: result.data.raw_text,
    status: result.data.status,
    createdAt: result.data.created_at,
  };
}

export async function getStructuredIdsByOcr(ocrId: number, limit = 50): Promise<number[]> {
  return getIdsFromList(
    `${API_BASE_URL}/api/v1/ocr-results/${ocrId}/structured-results?skip=0&limit=${limit}`
  );
}

export async function getStructuredDetail(structuredId: number): Promise<StructuredAnalysis> {
  const headers = await authHeaders();
  const result = await fetchJson<StructuredResultDetailResponse>(
    `${API_BASE_URL}/api/v1/structured-results/${structuredId}`,
    { headers }
  );

  if (!result.success) {
    throw new Error(result.detail || '获取结构化结果详情失败');
  }

  return {
    id: result.data.id,
    ocrResultId: result.data.ocr_result_id,
    content: result.data.content,
    status: result.data.status,
    createdAt: result.data.created_at,
  };
}

export async function getRelationGraphIdsByStructured(
  structuredResultId: number,
  limit = 50
): Promise<number[]> {
  return getIdsFromList(
    `${API_BASE_URL}/api/v1/structured-results/${structuredResultId}/relation-graphs?skip=0&limit=${limit}`
  );
}

export async function getRelationGraphDetail(relationGraphId: number): Promise<RelationGraphAnalysis> {
  const headers = await authHeaders();
  const result = await fetchJson<RelationGraphDetailResponse>(
    `${API_BASE_URL}/api/v1/relation-graphs/${relationGraphId}`,
    { headers }
  );

  if (!result.success) {
    throw new Error(result.detail || '获取关系图详情失败');
  }

  return {
    id: result.data.id,
    structuredResultId: result.data.structured_result_id,
    content: result.data.content,
    status: result.data.status,
    createdAt: result.data.created_at,
  };
}

export async function triggerImageOcr(imageId: number): Promise<void> {
  const headers = await authHeaders();
  const result = await fetchJson<ApiErrorShape>(`${API_BASE_URL}/api/v1/images/${imageId}/ocr`, {
    method: 'POST',
    headers,
  });

  if (!result.success) {
    throw new Error(result.detail || '触发OCR失败');
  }
}

export async function triggerStructuredAnalysis(ocrResultId: number): Promise<void> {
  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };

  const result = await fetchJson<ApiErrorShape>(`${API_BASE_URL}/api/v1/structured-results`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ocr_result_id: ocrResultId }),
  });

  if (!result.success) {
    throw new Error(result.detail || '触发结构化分析失败');
  }
}

export async function triggerRelationGraphAnalysis(structuredResultId: number): Promise<void> {
  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };

  const result = await fetchJson<ApiErrorShape>(`${API_BASE_URL}/api/v1/relation-graphs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ structured_result_id: structuredResultId }),
  });

  if (!result.success) {
    throw new Error(result.detail || '触发关系图分析失败');
  }
}

export async function getAnalysis(analysisId: string): Promise<any> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/analysis/${analysisId}`, { headers });
  if (!response.ok) {
    throw new Error('获取数据失败');
  }
  return response.json();
}
