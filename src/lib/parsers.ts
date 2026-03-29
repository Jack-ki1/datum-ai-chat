import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export function parseFile(file: File): Promise<Record<string, any>[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv' || ext === 'tsv') return parseCSV(file);
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file);
  if (ext === 'json') return parseJSON(file);
  return Promise.reject(new Error('Unsupported file type: ' + ext));
}

function parseCSV(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data as Record<string, any>[]),
      error: (e) => reject(e),
    });
  });
}

function parseExcel(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(ws) as Record<string, any>[]);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function parseJSON(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let d = JSON.parse(e.target?.result as string);
        if (!Array.isArray(d)) d = [d];
        resolve(d);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
