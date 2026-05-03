/// <reference lib="webworker" />
// Pyodide worker — runs real Python in the browser. Receives the dataset rows
// as JSON, exposes them as a pandas DataFrame named `df`, runs user code,
// returns stdout + last expression value + any error.

let pyodide: any = null;
let loading: Promise<any> | null = null;

async function load() {
  if (pyodide) return pyodide;
  if (loading) return loading;
  loading = (async () => {
    // @ts-ignore - dynamic import from CDN to keep bundle small
    const { loadPyodide } = await import("https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.mjs");
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/",
    });
    await pyodide.loadPackage(["pandas", "numpy"]);
    return pyodide;
  })();
  return loading;
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, code, rows } = e.data;
  try {
    const py = await load();
    if (type === "ping") {
      (self as any).postMessage({ id, ok: true, ready: true });
      return;
    }
    if (rows) {
      py.globals.set("__rows_json__", JSON.stringify(rows));
      await py.runPythonAsync(`
import json, pandas as pd, numpy as np
df = pd.DataFrame(json.loads(__rows_json__))
`);
    }
    let stdout = "";
    py.setStdout({ batched: (s: string) => { stdout += s + "\n"; } });
    py.setStderr({ batched: (s: string) => { stdout += s + "\n"; } });
    const result = await py.runPythonAsync(code);
    let value = "";
    try {
      if (result !== undefined && result !== null) {
        value = result.toString ? result.toString() : String(result);
      }
    } catch {}
    (self as any).postMessage({ id, ok: true, stdout, value });
  } catch (err: any) {
    (self as any).postMessage({ id, ok: false, error: err?.message || String(err) });
  }
};

export {};