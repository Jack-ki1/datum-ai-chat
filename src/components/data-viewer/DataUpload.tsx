import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { parseFile } from '@/lib/parsers';
import { useDatumStore } from '@/store/datum.store';

const MAX_BYTES = 500 * 1024 * 1024; // 500MB

export function DataUpload() {
  const { ingest } = useDatumStore();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'parsing' | 'profiling'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_BYTES) { alert(`File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB)`); return; }
    setLoading(true);
    setStage('parsing');
    setProgress(0);
    try {
      const data = await parseFile(file, {
        onProgress: ({ pct }) => setProgress(pct),
      });
      setStage('profiling');
      await ingest(data, file.name);
    } catch (e) {
      alert('Failed to parse file: ' + (e as Error).message);
    } finally {
      setLoading(false);
      setStage('idle');
      setProgress(0);
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
              {loading
                ? stage === 'parsing' ? `Parsing… ${progress}%` : 'Profiling on server…'
                : 'Drop your dataset here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">CSV, TSV, XLSX, or JSON — up to 500MB</p>
            {loading && (
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-3">
                <div className="h-full bg-primary transition-all duration-150"
                  style={{ width: `${stage === 'profiling' ? 100 : progress}%` }} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">or click to browse</span>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.xlsx,.xls,.json" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    </div>
  );
}
