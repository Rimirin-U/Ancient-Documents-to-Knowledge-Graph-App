import { API_BASE_URL, authHeaders } from './http';

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

  const rawText = await response.text();
  let data: any = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  const payload = data?.data && typeof data.data === 'object' ? data.data : data;

  if (!response.ok || !data?.success) {
    throw new Error(
      (typeof data?.detail === 'string' && data.detail) ||
        (typeof data?.message === 'string' && data.message) ||
        (rawText.trim() ? rawText.trim() : undefined) ||
        '问答请求失败'
    );
  }

  return {
    answer: typeof payload?.answer === 'string' ? payload.answer : '',
    sources: Array.isArray(payload?.sources)
      ? payload.sources.filter((item: unknown): item is string => typeof item === 'string')
      : [],
  };
}
