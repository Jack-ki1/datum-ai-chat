import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { parseFile } from '@/lib/parsers';
import { useDatumStore } from '@/store/datum.store';

export function DataUpload() {
  const { ingest } = useDatumStore();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { alert('File too large (max 10MB)'); return; }
    setLoading(true);
    try {
      const data = await parseFile(file);
      ingest(data, file.name);
    } catch (e) {
      alert('Failed to parse file: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [ingest]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex items-center justify-center py-12">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
          ${dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${dragOver ? 'bg-primary/15' : 'bg-muted'}`}>
            {loading ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className={`w-6 h-6 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {loading ? 'Processing…' : 'Drop your dataset here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">CSV, XLSX, or JSON — up to 10MB</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">or click to browse</span>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    </div>
  );
}
