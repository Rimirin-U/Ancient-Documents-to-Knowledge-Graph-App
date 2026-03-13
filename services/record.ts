import { API_BASE_URL, authHeaders } from './api';

export type RecordImageItem = {
  id: number;
  title: string;
  filename: string;
  uploadTime: string;
  thumbnailUrl: string;
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
        thumbnailUrl: getImageThumbnailUrl(id),
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

export async function getImageSourceHeaders(): Promise<Record<string, string>> {
  return authHeaders();
}

function getImageThumbnailUrl(imageId: number): string {
  return `${API_BASE_URL}/api/v1/images/${imageId}/thumbnail`;
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
