import { supabase } from '@/integrations/supabase/client';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/datum-chat`;

interface StreamChatParams {
  messages: { role: string; content: string }[];
  datasetContext: any;
  fileHash?: string;
  signal?: AbortSignal;
  onConnect?: () => void;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function streamChat({ messages, datasetContext, fileHash, signal, onConnect, onDelta, onDone, onError }: StreamChatParams) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    onError('You are signed out. Please sign in again.');
    return;
  }
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    signal,
    body: JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      dataset_context: datasetContext,
      file_hash: fileHash,
    }),
  });
  onConnect?.();

  if (!resp.ok) {
    let errMsg = 'AI service error';
    try {
      const err = await resp.json();
      errMsg = err.error || errMsg;
    } catch {}
    onError(errMsg);
    return;
  }

  if (!resp.body) {
    onError('No response stream');
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }

  // Flush remaining
  if (buffer.trim()) {
    for (let raw of buffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {}
    }
  }

  onDone();
}
