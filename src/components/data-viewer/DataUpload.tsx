import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, Sparkles } from 'lucide-react';
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
        className={`relative w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer overflow-hidden transition-all duration-300
          ${dragOver ? 'border-primary scale-[1.01] shadow-lg shadow-primary/10' : 'border-border hover:border-primary/40'}`}
      >
        {/* soft brand wash */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-brand-gradient-soft transition-opacity duration-300 ${dragOver || loading ? 'opacity-100' : 'opacity-40'}`}
        />
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {(dragOver || loading) && (
              <span aria-hidden className="absolute inset-0 rounded-2xl bg-brand-gradient animate-pulse-ring" />
            )}
            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ring-1 ${dragOver || loading ? 'bg-brand-gradient text-primary-foreground ring-primary/30 shadow-md' : 'bg-card ring-border'}`}>
              {loading ? (
                <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : dragOver ? (
                <Sparkles className="w-6 h-6 text-primary-foreground" strokeWidth={2.2} />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="relative">
            <p className="text-sm font-semibold text-foreground">
              {loading
                ? stage === 'parsing' ? `Parsing… ${progress}%` : 'Profiling on server…'
                : dragOver ? 'Release to analyze' : 'Drop your dataset here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">CSV, TSV, XLSX, or JSON — up to 500MB</p>
            {loading && (
              <div className="w-full h-1.5 bg-muted/70 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-brand-gradient animate-gradient transition-all duration-150"
                  style={{ width: `${stage === 'profiling' ? 100 : progress}%` }} />
              </div>
            )}
          </div>
          <div className="relative flex items-center gap-2 mt-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">or click to browse</span>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.xlsx,.xls,.json" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    </div>
  );
}
