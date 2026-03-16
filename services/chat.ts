import { API_BASE_URL, authHeaders } from './api';

export type ChatQueryResponse = {
  answer: string;
  sources: string[];
};

export async function querySmartChat(question: string): Promise<ChatQueryResponse> {
  const headers = await authHeaders();

  const response = await fetch(`${API_BASE_URL}/api/v1/chat/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ question }),
  });

  const data = await response.json();

  if (!response.ok || !data?.success) {
    throw new Error(data?.detail || '问答请求失败');
  }

  return {
    answer: typeof data.answer === 'string' ? data.answer : '',
    sources: Array.isArray(data.sources)
      ? data.sources.filter((item: unknown): item is string => typeof item === 'string')
      : [],
  };
}
