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

/** 非流式问答（保留作备用） */
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
    body.history = history.slice(-8);
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

/** SSE 流式问答回调类型 */
export type StreamCallbacks = {
  /** 每个文本增量块到达时调用 */
  onText: (delta: string) => void;
  /** 引用来源就绪（通常在文本流之前触发）*/
  onSources: (sources: ChatSource[]) => void;
  /** 流正常结束 */
  onDone: () => void;
  /** 发生错误，status 为 HTTP 状态码（若有） */
  onError: (message: string, status?: number) => void;
};

/**
 * 流式问答（SSE）。
 * 后端依次推送：sources → text delta × N → done
 */
export async function sendChatQueryStream(
  question: string,
  history: ChatHistoryTurn[] | undefined,
  callbacks: StreamCallbacks,
): Promise<void> {
  const { onText, onSources, onDone, onError } = callbacks;

  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };

  const body: Record<string, unknown> = { question };
  if (history && history.length > 0) {
    body.history = history.slice(-8);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/chat/query-stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    onError(err instanceof Error ? err.message : '网络连接失败，请检查网络后重试');
    return;
  }

  if (!response.ok) {
    let detail = `服务器错误 (${response.status})`;
    try {
      const text = await response.text();
      detail = JSON.parse(text).detail || detail;
    } catch {}
    onError(detail, response.status);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError('当前环境不支持流式响应，请尝试升级客户端');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按换行切割，保留末尾未完成的行
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const event = JSON.parse(jsonStr) as {
            type: string;
            delta?: string;
            sources?: ChatSource[];
            message?: string;
          };

          if (event.type === 'text' && event.delta) {
            onText(event.delta);
          } else if (event.type === 'sources' && event.sources) {
            onSources(event.sources);
          } else if (event.type === 'done') {
            onDone();
            return;
          } else if (event.type === 'error') {
            onError(event.message || '未知错误，请稍后重试');
            return;
          }
        } catch {
          // 忽略格式异常的行
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  onDone();
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
