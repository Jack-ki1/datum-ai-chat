import { useState, useRef, useCallback } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { parseFile } from '@/lib/parsers';
import { Send, Upload, X, BarChart3, Search, Sparkles } from 'lucide-react';

export function InputBar({ onSend }: { onSend?: (text: string) => void }) {
  const { isAiLoading, isLoaded, fileName, ingest, sendMessage } = useDatumStore();
  const [text, setText] = useState('');
  const [pendingFile, setPendingFile] = useState<string | null>(null);
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
      setPendingFile(null);
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
    <div className="w-full max-w-[840px] mx-auto px-4 pb-4">
      <div
        className={`rounded-xl border bg-card transition-all duration-150 ${dragOver ? 'border-primary shadow-[0_0_0_2px_rgba(245,158,11,0.3)]' : 'border-border'} focus-within:border-primary/35 focus-within:shadow-[0_0_0_2px_rgba(245,158,11,0.15)]`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {/* Action buttons */}
        <div className="flex items-center gap-1 px-3 pt-2.5">
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Upload className="w-3 h-3" /> Upload file
          </button>
          {isLoaded && (
            <>
              <button onClick={() => setPrompt('Profile all columns in detail')}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Sparkles className="w-3 h-3" /> Profile
              </button>
              <button onClick={() => setPrompt('Visualize the most interesting patterns')}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <BarChart3 className="w-3 h-3" /> Chart
              </button>
              <button onClick={() => setPrompt('Find anomalies and outliers')}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Search className="w-3 h-3" /> Anomalies
              </button>
            </>
          )}
          {pendingFile && (
            <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary">
              {pendingFile}
              <button onClick={() => setPendingFile(null)}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>

        {/* Textarea + send */}
        <div className="flex items-end gap-2 px-3 pb-2.5 pt-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
            onKeyDown={handleKeyDown}
            disabled={isAiLoading}
            placeholder={isLoaded ? `Ask about ${fileName}...` : 'Upload a file or try a sample dataset...'}
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-datum-text-3 resize-none outline-none min-h-[24px] max-h-[120px] py-1"
          />
          <button onClick={handleSend} disabled={!text.trim() || isAiLoading}
            className="w-[33px] h-[33px] rounded-[7px] bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 disabled:opacity-35 hover:brightness-110 hover:shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all duration-200">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-center text-[10px] font-mono text-datum-text-3 mt-2">
        Enter to send · Shift+Enter for new line · Drag & drop files directly
      </p>

      <input ref={fileRef} type="file" accept=".csv,.json,.xlsx,.xls,.tsv" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}
