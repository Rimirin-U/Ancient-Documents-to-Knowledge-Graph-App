import { API_BASE_URL, authHeaders } from './api';

export type ChatSource = {
  index: number;
  doc_id: string | number;
  image_id: string | number;
  filename: string;
  time: string;
  location: string;
  seller: string;
  buyer: string;
  price: string;
  subject: string;
  excerpt: string;
};

export type ChatHistoryTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatResponseData = {
  answer: string;
  sources: ChatSource[];
};

type ChatResponse = {
  success: boolean;
  data: ChatResponseData;
  detail?: string;
};

type KbStatusResponse = {
  success: boolean;
  data: { indexed_count: number };
};

export async function sendChatQuery(
  question: string,
  history?: ChatHistoryTurn[],
): Promise<ChatResponseData> {
  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };

  const body: Record<string, unknown> = { question };
  if (history && history.length > 0) {
    body.history = history.slice(-8); // 最多传最近 8 条（4 轮）
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/chat/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  let result: ChatResponse;
  try {
    result = JSON.parse(rawText) as ChatResponse;
  } catch {
    throw new Error(`服务器响应异常 (HTTP ${response.status}): ${rawText.slice(0, 200)}`);
  }

  if (!response.ok || !result.success) {
    throw new Error(result.detail || '发送消息失败');
  }

  return result.data;
}

export async function getKbStatus(): Promise<number> {
  const headers = await authHeaders();
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/kb-status`, { headers });
    if (!response.ok) return 0;
    const result = (await response.json()) as KbStatusResponse;
    return result.data?.indexed_count ?? 0;
  } catch {
    return 0;
  }
}

export async function triggerReindex(): Promise<string> {
  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/reindex`, {
    method: 'POST',
    headers,
  });
  const result = (await response.json()) as { success: boolean; message?: string; detail?: string };
  if (!response.ok || !result.success) {
    throw new Error(result.detail || '重建索引失败');
  }
  return result.message ?? '已开始重建';
}
