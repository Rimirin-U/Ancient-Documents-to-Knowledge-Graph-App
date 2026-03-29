// services/analysis.ts
// 图像分析相关 API 调用
import { Platform } from 'react-native';
import { apiFetch, API_BASE_URL } from './api';

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

const UPLOAD_NETWORK_RETRIES = 3;

function isTransientNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg === 'Network request failed' ||
    msg.includes('Network request failed') ||
    msg.includes('Failed to fetch')
  );
}

/** 每次上传请求都新建 FormData；重试时必须重建，否则部分环境下 body 只能发送一次。 */
async function buildImageFormData(uri: string, fileName: string): Promise<FormData> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    if (!res.ok) {
      throw new Error('无法读取本地图片，请重新选择');
    }
    const blob = await res.blob();
    const type = blob.type && blob.type.length > 0 ? blob.type : getMimeType(fileName);
    formData.append('image', new File([blob], fileName, { type }));
  } else {
    formData.append('image', {
      uri,
      type: getMimeType(fileName),
      name: fileName,
    } as any);
  }

  return formData;
}

export async function uploadImage(uri: string, fileName: string): Promise<UploadImageResponse> {
  let lastError: unknown;

  for (let attempt = 0; attempt < UPLOAD_NETWORK_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 350 * attempt));
    }

    const formData = await buildImageFormData(uri, fileName);

    let response: Response;
    try {
      response = await apiFetch(`${API_BASE_URL}/api/v1/images/upload`, {
        method: 'POST',
        body: formData,
      });
    } catch (e) {
      lastError = e;
      if (isTransientNetworkError(e) && attempt < UPLOAD_NETWORK_RETRIES - 1) {
        continue;
      }
      if (isTransientNetworkError(e)) {
        throw new Error(
          `无法连接 ${API_BASE_URL}。请检查网络与后端服务；iOS 访问 HTTP 接口需使用 prebuild 后的开发包（Expo Go 不读取本项目的 ATS 配置）。`,
        );
      }
      throw e;
    }

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

  throw lastError instanceof Error ? lastError : new Error('上传失败，请稍后重试');
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(url, init);
  const result = (await response.json()) as T & ApiErrorShape;

  if (!response.ok) {
    throw new Error(result.detail || result.message || '请求失败');
  }

  return result;
}

async function getIdsFromList(url: string): Promise<number[]> {
  const result = await fetchJson<PagedIdsResponse>(url);
  if (!result.success) {
    throw new Error(result.detail || '查询列表失败');
  }

  return result.data.ids;
}

/** React Native 上 blob + FileReader.readAsDataURL 易挂起，改用 arrayBuffer + base64 */
function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  if (typeof globalThis.btoa !== 'function') {
    throw new Error('当前环境不支持 btoa，无法转换图片');
  }
  return `data:${mimeType};base64,${globalThis.btoa(binary)}`;
}

export async function getImageDataUrl(imageId: number): Promise<string> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/images/${imageId}`);

  if (!response.ok) {
    throw new Error('获取图片失败');
  }

  const mimeType = response.headers.get('content-type') || 'image/jpeg';

  if (Platform.OS === 'web') {
    const blob = await response.blob();
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('读取图片失败'));
      reader.readAsDataURL(blob);
    });
  }

  const buffer = await response.arrayBuffer();
  return arrayBufferToDataUrl(buffer, mimeType);
}

export async function getOcrIdsByImage(imageId: number, limit = 50): Promise<number[]> {
  return getIdsFromList(`${API_BASE_URL}/api/v1/images/${imageId}/ocr-results?skip=0&limit=${limit}`);
}

export async function getOcrDetail(ocrId: number): Promise<OcrAnalysis> {
  const result = await fetchJson<OcrResultDetailResponse>(
    `${API_BASE_URL}/api/v1/ocr-results/${ocrId}`,
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
  const result = await fetchJson<StructuredResultDetailResponse>(
    `${API_BASE_URL}/api/v1/structured-results/${structuredId}`,
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
  const result = await fetchJson<RelationGraphDetailResponse>(
    `${API_BASE_URL}/api/v1/relation-graphs/${relationGraphId}`,
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
  const result = await fetchJson<ApiErrorShape>(`${API_BASE_URL}/api/v1/images/${imageId}/ocr`, {
    method: 'POST',
  });

  if (!result.success) {
    throw new Error(result.detail || '触发OCR失败');
  }
}

export async function updateOcrResult(ocrId: number, rawText: string): Promise<OcrAnalysis> {
  const result = await fetchJson<OcrResultDetailResponse>(`${API_BASE_URL}/api/v1/ocr-results/${ocrId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText }),
  });

  if (!result.success) {
    throw new Error(result.detail || '更新OCR结果失败');
  }

  return {
    id: result.data.id,
    imageId: result.data.image_id,
    rawText: result.data.raw_text,
    status: result.data.status,
    createdAt: result.data.created_at,
  };
}

export async function triggerStructuredAnalysis(ocrResultId: number): Promise<void> {
  const result = await fetchJson<ApiErrorShape>(`${API_BASE_URL}/api/v1/structured-results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ocr_result_id: ocrResultId }),
  });

  if (!result.success) {
    throw new Error(result.detail || '触发结构化分析失败');
  }
}

export async function triggerRelationGraphAnalysis(structuredResultId: number): Promise<void> {
  const result = await fetchJson<ApiErrorShape>(`${API_BASE_URL}/api/v1/relation-graphs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structured_result_id: structuredResultId }),
  });

  if (!result.success) {
    throw new Error(result.detail || '触发关系图分析失败');
  }
}

export async function getAnalysis(analysisId: string): Promise<any> {
  const response = await apiFetch(`${API_BASE_URL}/api/analysis/${analysisId}`);
  if (!response.ok) {
    throw new Error('获取数据失败');
  }
  return response.json();
}
