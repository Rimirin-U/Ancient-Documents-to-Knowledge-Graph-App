import { API_BASE_URL, apiFetch } from './api';

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

export type CrossDocStatistics = {
  doc_count?: number;
  time_range?: {
    start?: number;
    end?: number;
    span?: number;
    docs_with_time?: number;
  };
  unique_people?: number;
  cross_role_people?: string[];
  top_people?: Array<{
    name: string;
    doc_count: number;
    roles: string[];
  }>;
  top_locations?: Array<{
    name: string;
    count: number;
  }>;
  land_chains?: Array<{
    location: string;
    transaction_count: number;
    years?: number[];
  }>;
  land_chain_count?: number;
};

export type MultiRelationGraphAnalysis = {
  id: number;
  multiTaskId: number;
  content: unknown;
  status: 'pending' | 'processing' | 'done' | 'failed';
  createdAt: string;
  statistics?: CrossDocStatistics;
  insights?: string;
};

export type CrossDocImageInfo = {
  id: number;
  filename: string;
  uploadTime: string;
  title: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(url, init);
  const result = (await response.json()) as T & ApiErrorShape;

  if (!response.ok) {
    throw new Error(result.detail || result.message || '请求失败');
  }

  return result;
}

export async function getMultiTaskDetail(taskId: number): Promise<MultiTaskDetail> {
  const result = await fetchJson<MultiTaskDetailResponse>(
    `${API_BASE_URL}/api/v1/multi-tasks/${taskId}`,
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
  const result = await fetchJson<PagedIdsResponse>(
    `${API_BASE_URL}/api/v1/multi-tasks/${taskId}/multi-relation-graphs?skip=0&limit=${limit}`,
  );

  if (!result.success) {
    throw new Error(result.detail || `获取跨文档关系图列表失败`);
  }

  return result.data.ids;
}

export async function getMultiRelationGraphDetail(graphId: number): Promise<MultiRelationGraphAnalysis> {
  const result = await fetchJson<MultiRelationGraphDetailResponse>(
    `${API_BASE_URL}/api/v1/multi-relation-graphs/${graphId}`,
  );

  if (!result.success) {
    throw new Error(result.detail || `获取跨文档关系图 ${graphId} 失败`);
  }

  const rawContent = result.data.content as Record<string, unknown> | null | undefined;

  return {
    id: result.data.id,
    multiTaskId: result.data.multi_task_id,
    content: result.data.content,
    status: result.data.status,
    createdAt: result.data.created_at,
    statistics: rawContent?.statistics as CrossDocStatistics | undefined,
    insights: typeof rawContent?.insights === 'string' ? rawContent.insights : undefined,
  };
}

export async function triggerMultiRelationGraphAnalysis(taskId: number): Promise<void> {
  const result = await fetchJson<ApiErrorShape>(`${API_BASE_URL}/api/v1/multi-relation-graphs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ multi_task_id: taskId }),
  });

  if (!result.success) {
    throw new Error(result.detail || '触发跨文档关系图分析失败');
  }
}

export async function getImageInfo(imageId: number): Promise<CrossDocImageInfo> {
  const result = await fetchJson<ImageInfoResponse>(
    `${API_BASE_URL}/api/v1/images/${imageId}/info`,
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
