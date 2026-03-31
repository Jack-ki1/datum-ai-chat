import { useState, useRef, useCallback } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { parseFile } from '@/lib/parsers';
import { Upload, Sparkles, ArrowUp, Brain, BarChart3, Wrench, Settings } from 'lucide-react';

export function InputBar({ onSend }: { onSend?: (text: string) => void }) {
  const { isAiLoading, isLoaded, fileName, ingest, sendMessage } = useDatumStore();
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    const msg = text.trim();
    if (!msg || isAiLoading) return;
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSend?.(msg);
    await sendMessage(msg);
  }, [text, isAiLoading, sendMessage, onSend]);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { alert('File too large (max 10MB)'); return; }
    try {
      const data = await parseFile(file);
      ingest(data, file.name);
    } catch (e) { alert('Failed to parse file: ' + (e as Error).message); }
  }, [ingest]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const setPrompt = (p: string) => { setText(p); textareaRef.current?.focus(); };

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 pb-5">
      <div
        className={`rounded-2xl border bg-card shadow-sm transition-all duration-200 ${
          dragOver ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border'
        } focus-within:border-primary/40 focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/10`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {/* Textarea + send */}
        <div className="flex items-end gap-3 px-4 py-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
            onKeyDown={handleKeyDown}
            disabled={isAiLoading}
            placeholder={isLoaded ? `Ask about ${fileName}…` : 'Upload a file or try a sample dataset…'}
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none min-h-[24px] max-h-[120px] py-1 leading-relaxed"
          />
          <button onClick={handleSend} disabled={!text.trim() || isAiLoading}
            className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-30 hover:brightness-110 hover:shadow-md transition-all duration-200">
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 px-3 pb-2.5">
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
          {isLoaded && (
            <>
              <button onClick={() => setPrompt('Profile all columns in detail')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Sparkles className="w-3.5 h-3.5" /> Profile
              </button>
              <button onClick={() => setPrompt('Suggest and build the best ML model for this data')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Brain className="w-3.5 h-3.5" /> Model
              </button>
              <button onClick={() => setPrompt('Run a comprehensive statistical analysis on this dataset')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <BarChart3 className="w-3.5 h-3.5" /> Analyze
              </button>
              <button onClick={() => setPrompt('Design a data pipeline and feature engineering plan')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Wrench className="w-3.5 h-3.5" /> Engineer
              </button>
              <button onClick={() => setPrompt('Create a deployment and monitoring plan for this data workflow')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Settings className="w-3.5 h-3.5" /> MLOps
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground/60 mt-2.5">
        Enter to send · Shift+Enter for new line · Drag & drop files
      </p>

      <input ref={fileRef} type="file" accept=".csv,.json,.xlsx,.xls,.tsv" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}
