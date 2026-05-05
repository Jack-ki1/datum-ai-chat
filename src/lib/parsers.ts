/**
 * Parse a CSV/TSV/XLSX/JSON file in a Web Worker (off the main thread)
 * with progress reporting. Replaces the old synchronous, UI-blocking parser.
 */

export interface ParseProgress {
  loaded: number;
  total: number;
  pct: number;
}

export interface ParseOptions {
  onProgress?: (p: ParseProgress) => void;
}

let _worker: Worker | null = null;
let _nextId = 1;

function getWorker(): Worker {
  if (!_worker) {
    _worker = new Worker(new URL('../workers/parse.worker.ts', import.meta.url), { type: 'module' });
  }
  return _worker;
}

export function parseFile(
  file: File,
  opts: ParseOptions = {}
): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const id = _nextId++;
    const handler = (e: MessageEvent) => {
      const msg = e.data;
      if (msg?.id !== id) return;
      if (msg.type === 'progress') {
        const total = msg.total || file.size || 1;
        opts.onProgress?.({ loaded: msg.loaded, total, pct: Math.min(100, Math.round((msg.loaded / total) * 100)) });
      } else if (msg.type === 'done') {
        w.removeEventListener('message', handler);
        opts.onProgress?.({ loaded: file.size, total: file.size, pct: 100 });
        resolve(msg.rows as Record<string, any>[]);
      } else if (msg.type === 'error') {
        w.removeEventListener('message', handler);
        reject(new Error(msg.error || 'Parse failed'));
      }
    };
    w.addEventListener('message', handler);
    w.postMessage({ id, type: 'parse', file });
  });
}
