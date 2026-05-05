/// <reference lib="webworker" />
// Streaming CSV parser worker. Parses in chunks off the main thread and posts
// progress events. Falls back to in-worker XLSX/JSON parsing for those formats.
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface StartMsg {
  id: number;
  type: 'parse';
  file: File;
}

self.onmessage = async (e: MessageEvent<StartMsg>) => {
  const { id, file } = e.data;
  const ext = file.name.split('.').pop()?.toLowerCase();
  try {
    const rows = await parseAny(file, ext, (loaded, total) => {
      (self as any).postMessage({ id, type: 'progress', loaded, total });
    });
    (self as any).postMessage({ id, type: 'done', rows, count: rows.length });
  } catch (err: any) {
    (self as any).postMessage({ id, type: 'error', error: err?.message || String(err) });
  }
};

async function parseAny(
  file: File,
  ext: string | undefined,
  onProgress: (loaded: number, total: number) => void,
): Promise<any[]> {
  if (ext === 'csv' || ext === 'tsv') return parseCsvStream(file, onProgress);
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file, onProgress);
  if (ext === 'json') return parseJson(file, onProgress);
  throw new Error('Unsupported file type: ' + ext);
}

function parseCsvStream(file: File, onProgress: (l: number, t: number) => void): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];
    const total = file.size;
    let processed = 0;
    Papa.parse<File>(file as any, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: false, // we're already in a worker
      chunkSize: 1024 * 1024 * 4, // 4MB chunks
      chunk: (results, parser) => {
        for (const r of results.data) rows.push(r);
        processed = (results.meta as any).cursor || processed;
        onProgress(Math.min(processed, total), total);
        // Hard cap for safety: 5M rows
        if (rows.length > 5_000_000) { parser.abort(); }
      },
      complete: () => { onProgress(total, total); resolve(rows); },
      error: (err) => reject(err),
    });
  });
}

function parseExcel(file: File, onProgress: (l: number, t: number) => void): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (ev) => { if (ev.lengthComputable) onProgress(ev.loaded, ev.total); };
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(ws) as any[]);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function parseJson(file: File, onProgress: (l: number, t: number) => void): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (ev) => { if (ev.lengthComputable) onProgress(ev.loaded, ev.total); };
    reader.onload = (e) => {
      try {
        let d = JSON.parse(e.target?.result as string);
        if (!Array.isArray(d)) d = [d];
        resolve(d);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export {};