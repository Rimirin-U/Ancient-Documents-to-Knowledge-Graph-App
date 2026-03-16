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

type MultiTaskDetailResponse = {
  success: boolean;
  data: {
    id: number;
    user_id: number;
    status: 'pending' | 'processing' | 'done' | 'failed' | string;
    structured_result_ids: number[];
    created_at: string;
  };
  detail?: string;
};

type MultiRelationGraphDetailResponse = {
  success: boolean;
  data: {
    id: number;
    multi_task_id: number;
    content: unknown;
    status: 'pending' | 'processing' | 'done' | 'failed';
    created_at: string;
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

export type MultiTaskDetail = {
  id: number;
  userId: number;
  status: string;
  structuredResultIds: number[];
  createdAt: string;
};

export type MultiRelationGraphAnalysis = {
  id: number;
  multiTaskId: number;
  content: unknown;
  status: 'pending' | 'processing' | 'done' | 'failed';
  createdAt: string;
};

export type CrossDocImageInfo = {
  id: number;
  filename: string;
  uploadTime: string;
  title: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const result = (await response.json()) as T & ApiErrorShape;

  if (!response.ok) {
    throw new Error(result.detail || result.message || '请求失败');
  }

  return result;
}

export async function getMultiTaskDetail(taskId: number): Promise<MultiTaskDetail> {
  const headers = await authHeaders();
  const result = await fetchJson<MultiTaskDetailResponse>(
    `${API_BASE_URL}/api/v1/multi-tasks/${taskId}`,
    { headers }
  );

  if (!result.success) {
    throw new Error(result.detail || `获取跨文档任务 ${taskId} 失败`);
  }

  return {
    id: result.data.id,
    userId: result.data.user_id,
    status: result.data.status,
    structuredResultIds: result.data.structured_result_ids,
    createdAt: result.data.created_at,
  };
}

export async function getMultiRelationGraphIdsByTask(taskId: number, limit = 50): Promise<number[]> {
  const headers = await authHeaders();
  const result = await fetchJson<PagedIdsResponse>(
    `${API_BASE_URL}/api/v1/multi-tasks/${taskId}/multi-relation-graphs?skip=0&limit=${limit}`,
    { headers }
  );

  if (!result.success) {
    throw new Error(result.detail || `获取跨文档关系图列表失败`);
  }

  return result.data.ids;
}

export async function getMultiRelationGraphDetail(graphId: number): Promise<MultiRelationGraphAnalysis> {
  const headers = await authHeaders();
  const result = await fetchJson<MultiRelationGraphDetailResponse>(
    `${API_BASE_URL}/api/v1/multi-relation-graphs/${graphId}`,
    { headers }
  );

  if (!result.success) {
    throw new Error(result.detail || `获取跨文档关系图 ${graphId} 失败`);
  }

  return {
    id: result.data.id,
    multiTaskId: result.data.multi_task_id,
    content: result.data.content,
    status: result.data.status,
    createdAt: result.data.created_at,
  };
}

export async function triggerMultiRelationGraphAnalysis(taskId: number): Promise<void> {
  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };

  const result = await fetchJson<ApiErrorShape>(`${API_BASE_URL}/api/v1/multi-relation-graphs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ multi_task_id: taskId }),
  });

  if (!result.success) {
    throw new Error(result.detail || '触发跨文档关系图分析失败');
  }
}

export async function getImageInfo(imageId: number): Promise<CrossDocImageInfo> {
  const headers = await authHeaders();
  const result = await fetchJson<ImageInfoResponse>(
    `${API_BASE_URL}/api/v1/images/${imageId}/info`,
    { headers }
  );

  if (!result.success) {
    throw new Error(result.detail || `获取图片 ${imageId} 信息失败`);
  }

  return {
    id: result.data.id,
    filename: result.data.filename,
    uploadTime: result.data.upload_time,
    title: result.data.title,
  };
}
