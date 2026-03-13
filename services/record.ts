import { API_BASE_URL, authHeaders } from './api';

export type RecordImageItem = {
  id: number;
  title: string;
  filename: string;
  uploadTime: string;
  thumbnailDataUrl?: string;
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
