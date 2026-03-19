import { API_BASE_URL, authHeaders } from './api';

export type ChatSource = {
  index: number;
  doc_id: string | number;
  image_id: string | number;
  filename: string;
  time: string;
  location: string;
  excerpt: string;
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

export async function sendChatQuery(question: string): Promise<ChatResponseData> {
  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${API_BASE_URL}/api/v1/chat/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ question }),
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
