import { API_BASE_URL, authHeaders } from './api';

export type RecordImageItem = {
  id: number;
  title: string;
  filename: string;
  uploadTime: string;
  thumbnailDataUrl?: string;
};

export type CrossDocRecordItem = {
  id: number;
  title: string;
  filename: string;
  uploadTime: string;
  previewThumbnailDataUrls: string[];
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

type ImageInfoResponse = {
  success: boolean;
  data: {
    id: number;
    filename: string;
    upload_time: string;
    title: string;
  };
  detail?: string;
};

type MultiTaskDetailResponse = {
  success: boolean;
  data: {
    id: number;
    user_id: number;
    status: string;
    structured_result_ids: number[];
    created_at: string;
  };
  detail?: string;
};

type StructuredResultResponse = {
  success: boolean;
  data: {
    id: number;
    ocr_result_id: number;
  };
  detail?: string;
};

type OcrResultResponse = {
  success: boolean;
  data: {
    id: number;
    image_id: number;
  };
  detail?: string;
};

export async function getImageRecordList(params?: {
  skip?: number;
  limit?: number;
}): Promise<RecordImageItem[]> {
  const skip = params?.skip ?? 0;
  const limit = params?.limit ?? 50;
  const headers = await authHeaders();

  const listResponse = await fetch(
    `${API_BASE_URL}/api/v1/users/images?skip=${skip}&limit=${limit}`,
    { headers }
  );
  const listResult = (await listResponse.json()) as PagedIdsResponse;

  if (!listResponse.ok || !listResult.success) {
    throw new Error(listResult.detail || '获取图片记录失败');
  }

  const items = await Promise.all(
    listResult.data.ids.map(async (id) => {
      const info = await getImageInfo(id);
      return {
        id,
        title: info.title || `图片 ${id}`,
        filename: info.filename,
        uploadTime: info.upload_time,
        thumbnailDataUrl: await getImageThumbnailDataUrl(id),
      } satisfies RecordImageItem;
    })
  );

  return items;
}

export async function getCrossDocRecordList(params?: {
  skip?: number;
  limit?: number;
}): Promise<CrossDocRecordItem[]> {
  const skip = params?.skip ?? 0;
  const limit = params?.limit ?? 50;
  const headers = await authHeaders();

  const listResponse = await fetch(
    `${API_BASE_URL}/api/v1/users/multi-tasks?skip=${skip}&limit=${limit}`,
    { headers }
  );
  const listResult = (await listResponse.json()) as PagedIdsResponse;

  if (!listResponse.ok || !listResult.success) {
    throw new Error(listResult.detail || '获取跨文档记录失败');
  }

  const items = await Promise.all(
    listResult.data.ids.map(async (id) => {
      const detail = await getMultiTaskDetail(id);
      const imageIds = await getPreviewImageIdsFromStructuredResults(detail.structured_result_ids);
      const previewThumbnailDataUrls = (
        await Promise.all(imageIds.map((imageId) => getImageThumbnailDataUrl(imageId)))
      ).filter((url) => Boolean(url));

      const createdDate = new Date(detail.created_at);
      const month = createdDate.getMonth() + 1;
      const day = createdDate.getDate();
      const hhmm = createdDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
      return {
        id,
        title: `跨文档分析 · ${month}月${day}日 ${hhmm}`,
        filename: `共 ${detail.structured_result_ids.length} 份文书`,
        uploadTime: detail.created_at,
        previewThumbnailDataUrls,
      } satisfies CrossDocRecordItem;
    })
  );

  return items;
}

export async function triggerImageAnalysis(imageId: number): Promise<void> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/images/${imageId}/ocr`, {
    method: 'POST',
    headers,
  });
  const result = (await response.json()) as { success?: boolean; detail?: string };

  if (!response.ok || !result.success) {
    throw new Error(result.detail || `图片 ${imageId} 分析失败`);
  }
}

type MultiTaskFromImagesResponse = {
  success: boolean;
  multi_task_id?: number;
  detail?: string;
};

type TriggerMultiRelationResponse = {
  success?: boolean;
  detail?: string;
};

type DeleteImageResponse = {
  success?: boolean;
  detail?: string;
};

export async function deleteImageRecord(imageId: number): Promise<void> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/images/${imageId}`, {
    method: 'DELETE',
    headers,
  });
  const result = (await response.json()) as DeleteImageResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.detail || `删除图片 ${imageId} 失败`);
  }
}

export async function createCrossDocTaskFromImages(imageIds: number[]): Promise<number> {
  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };
  const createResponse = await fetch(`${API_BASE_URL}/api/v1/multi-tasks/from-images`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image_ids: imageIds }),
  });
  const createResult = (await createResponse.json()) as MultiTaskFromImagesResponse;

  if (!createResponse.ok || !createResult.success || !createResult.multi_task_id) {
    throw new Error(createResult.detail || '创建跨文档任务失败');
  }

  const analyzeResponse = await fetch(`${API_BASE_URL}/api/v1/multi-relation-graphs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ multi_task_id: createResult.multi_task_id }),
  });
  const analyzeResult = (await analyzeResponse.json()) as TriggerMultiRelationResponse;

  if (!analyzeResponse.ok || !analyzeResult.success) {
    throw new Error(analyzeResult.detail || '触发跨文档分析失败');
  }

  return createResult.multi_task_id;
}

async function getImageThumbnailDataUrl(imageId: number): Promise<string> {
  const headers = await authHeaders();
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/images/${imageId}/thumbnail`, {
      headers,
    });
    if (!response.ok) {
      throw new Error(`获取缩略图失败: ${response.status}`);
    }
    const blob = await response.blob();
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`获取缩略图 ${imageId} 失败`, error);
    return '';
  }
}

async function getMultiTaskDetail(taskId: number): Promise<MultiTaskDetailResponse['data']> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/multi-tasks/${taskId}`, {
    headers,
  });
  const result = (await response.json()) as MultiTaskDetailResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.detail || `获取跨文档任务 ${taskId} 失败`);
  }

  return result.data;
}

async function getPreviewImageIdsFromStructuredResults(structuredResultIds: number[]): Promise<number[]> {
  const limitedIds = structuredResultIds.slice(0, 3);
  const imageIds = await Promise.all(
    limitedIds.map(async (structuredResultId) => {
      const structuredResult = await getStructuredResult(structuredResultId);
      const ocrResult = await getOcrResult(structuredResult.ocr_result_id);
      return ocrResult.image_id;
    })
  );

  return Array.from(new Set(imageIds)).slice(0, 3);
}

async function getStructuredResult(
  structuredResultId: number
): Promise<StructuredResultResponse['data']> {
  const headers = await authHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/structured-results/${structuredResultId}`,
    { headers }
  );
  const result = (await response.json()) as StructuredResultResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.detail || `获取结构化结果 ${structuredResultId} 失败`);
  }

  return result.data;
}

async function getOcrResult(ocrResultId: number): Promise<OcrResultResponse['data']> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/ocr-results/${ocrResultId}`, {
    headers,
  });
  const result = (await response.json()) as OcrResultResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.detail || `获取OCR结果 ${ocrResultId} 失败`);
  }

  return result.data;
}

export async function deleteCrossDocTask(taskId: number): Promise<void> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/multi-tasks/${taskId}`, {
    method: 'DELETE',
    headers,
  });
  const result = (await response.json()) as { success?: boolean; detail?: string };

  if (!response.ok || !result.success) {
    throw new Error(result.detail || `删除跨文档任务 ${taskId} 失败`);
  }
}

async function getImageInfo(imageId: number): Promise<ImageInfoResponse['data']> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/images/${imageId}/info`, {
    headers,
  });
  const result = (await response.json()) as ImageInfoResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.detail || `获取图片 ${imageId} 信息失败`);
  }

  return result.data;
}
