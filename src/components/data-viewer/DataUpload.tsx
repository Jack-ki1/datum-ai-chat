import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, Sparkles, X } from 'lucide-react';
import { parseFile } from '@/lib/parsers';
import { useDatumStore } from '@/store/datum.store';
import { MAX_FILE_BYTES, MAX_FILE_MB } from '@/lib/constants';
import { toast } from 'sonner';

export function DataUpload() {
  const { ingest, cancelIngest, ingestProgress, ingestStage, isIngesting } = useDatumStore();
  const [dragOver, setDragOver] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [localStage, setLocalStage] = useState<'idle' | 'parsing' | 'uploading' | 'profiling'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const loading = isIngesting || localStage !== 'idle';
  const stage = localStage === 'idle'
    ? (ingestStage === 'profiling' ? (ingestProgress < 100 ? 'uploading' : 'profiling') : 'idle')
    : localStage;
  const progress = stage === 'parsing' ? parseProgress
    : stage === 'uploading' ? ingestProgress
    : stage === 'profiling' ? 100 : 0;

  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`File too large`, { description: `Maximum supported size is ${MAX_FILE_MB}MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.` });
      return;
    }
    setLocalStage('parsing');
    setParseProgress(0);
    try {
      const data = await parseFile(file, {
        onProgress: ({ pct }) => setParseProgress(pct),
      });
      setLocalStage('idle'); // hand off to store (upload → profiling)
      await ingest(data, file.name);
      toast.success('Dataset ready', { description: file.name });
    } catch (e) {
      const msg = (e as Error)?.message || 'Unknown error';
      if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('abort')) {
        toast('Upload cancelled');
      } else {
        toast.error('Upload failed', { description: msg });
      }
    } finally {
      setLocalStage('idle');
      setParseProgress(0);
    }
  }, [ingest]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const stageLabel =
    stage === 'parsing' ? `Parsing… ${progress}%`
    : stage === 'uploading' ? `Uploading… ${progress}%`
    : stage === 'profiling' ? 'Profiling on server…'
    : dragOver ? 'Release to analyze'
    : 'Drop your dataset here';

  return (
    <div className="flex items-center justify-center py-12">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !loading && fileRef.current?.click()}
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
            <p className="text-sm font-semibold text-foreground">{stageLabel}</p>
            <p className="text-xs text-muted-foreground mt-1">CSV, TSV, XLSX, or JSON — up to {MAX_FILE_MB}MB</p>
            {loading && (
              <>
                <div className="w-full h-1.5 bg-muted/70 rounded-full overflow-hidden mt-3">
                  <div className={`h-full bg-brand-gradient animate-gradient transition-all duration-150 ${stage === 'profiling' ? 'animate-pulse' : ''}`}
                    style={{ width: `${progress}%` }} />
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); cancelIngest(); setLocalStage('idle'); setParseProgress(0); }}
                  className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-background/80 hover:bg-background border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" /> Cancel upload
                </button>
              </>
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
