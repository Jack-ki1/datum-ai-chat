let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (msg: any) => void>();

function ensureWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../workers/pyodide.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent) => {
      const { id } = e.data || {};
      const cb = pending.get(id);
      if (cb) { pending.delete(id); cb(e.data); }
    };
  }
  return worker;
}

export interface PyResult { ok: boolean; stdout?: string; value?: string; error?: string; }

export function runPython(code: string, rows?: any[]): Promise<PyResult> {
  const w = ensureWorker();
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, resolve as any);
    w.postMessage({ id, type: "run", code, rows });
  });
}

export function warmupPyodide(): Promise<PyResult> {
  const w = ensureWorker();
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, resolve as any);
    w.postMessage({ id, type: "ping" });
  });
}