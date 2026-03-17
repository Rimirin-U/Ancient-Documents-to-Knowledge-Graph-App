import { API_BASE_URL, authHeaders } from './api';

type ChatResponse = {
  success: boolean;
  data: string;
  detail?: string;
};

export async function sendChatQuery(question: string): Promise<string> {
  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${API_BASE_URL}/api/v1/chat/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ question }),
  });

  const result = (await response.json()) as ChatResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.detail || '发送消息失败');
  }

  return result.data;
}
