import { useState, useRef, useCallback, useMemo } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { parseFile } from '@/lib/parsers';
import { Upload, Sparkles, ArrowUp, Brain, BarChart3, Wrench, Settings, Lightbulb, Bug, BookOpen, FileText } from 'lucide-react';

function getSmartSuggestions(profile: any[] | null): { text: string; prompt: string }[] {
  if (!profile) return [];
  const suggestions: { text: string; prompt: string }[] = [];
  const dateCols = profile.filter(p => p.type === 'datetime');
  const numCols = profile.filter(p => p.type === 'numeric');
  const catCols = profile.filter(p => p.type === 'categorical');
  const nullCols = profile.filter(p => p.nullCount > 0);

  if (dateCols.length > 0) {
    suggestions.push({ text: `📈 Show trends over ${dateCols[0].col}`, prompt: `Show me the time series trends over ${dateCols[0].col}` });
  }
  if (catCols.length > 0 && numCols.length > 0) {
    suggestions.push({ text: `📊 Compare ${numCols[0].col} by ${catCols[0].col}`, prompt: `Compare ${numCols[0].col} across different ${catCols[0].col} categories` });
  }
  if (numCols.length >= 2) {
    suggestions.push({ text: `🔗 Correlation analysis`, prompt: `Run a correlation analysis on all numeric columns and identify the strongest relationships` });
  }
  if (nullCols.length > 0) {
    suggestions.push({ text: `🧹 Handle missing values`, prompt: `Analyze missing value patterns and suggest imputation strategies for ${nullCols.map(c => c.col).join(', ')}` });
  }
  if (catCols.length > 0 && catCols.some((c: any) => c.uniqueCount <= 10)) {
    const target = catCols.find((c: any) => c.uniqueCount <= 10);
    suggestions.push({ text: `🤖 Predict ${target?.col}`, prompt: `Build a classification model to predict ${target?.col} and evaluate its performance` });
  }
  if (numCols.length > 0) {
    suggestions.push({ text: `🔍 Find anomalies`, prompt: `Detect anomalies and outliers across all numeric columns using multiple methods` });
  }

  return suggestions.slice(0, 4);
}

export function InputBar({ onSend }: { onSend?: (text: string) => void }) {
  const { isAiLoading, isLoaded, fileName, profile, ingest, sendMessage } = useDatumStore();
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const smartSuggestions = useMemo(() => getSmartSuggestions(profile), [profile]);
  const showSuggestions = focused && !text.trim() && isLoaded && smartSuggestions.length > 0;

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

  const handleSuggestionClick = async (prompt: string) => {
    setText('');
    onSend?.(prompt);
    await sendMessage(prompt);
  };

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 pb-5 relative">
      {/* Smart suggestions floating panel */}
      {showSuggestions && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border rounded-xl shadow-lg p-2 space-y-1 z-10 animate-fade-slide">
          <div className="flex items-center gap-1.5 px-2 py-1">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-medium text-muted-foreground">Suggested analyses</span>
          </div>
          {smartSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(s.prompt)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
            >
              {s.text}
            </button>
          ))}
        </div>
      )}

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
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
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
        <div className="flex items-center gap-1 px-3 pb-2.5 overflow-x-auto scrollbar-hide">
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
          {isLoaded && (
            <>
              <button onClick={() => setPrompt('Profile all columns in detail')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                <Sparkles className="w-3.5 h-3.5" /> Profile
              </button>
              <button onClick={() => setPrompt('Suggest and build the best ML model for this data')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                <Brain className="w-3.5 h-3.5" /> Model
              </button>
              <button onClick={() => setPrompt('Run a comprehensive statistical analysis on this dataset')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                <BarChart3 className="w-3.5 h-3.5" /> Analyze
              </button>
              <button onClick={() => setPrompt('Design a data pipeline and feature engineering plan')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                <Wrench className="w-3.5 h-3.5" /> Engineer
              </button>
              <button onClick={() => setPrompt('Create a deployment and monitoring plan for this data workflow')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                <Settings className="w-3.5 h-3.5" /> MLOps
              </button>
              <button onClick={() => setPrompt('I have an error to debug — let me paste the traceback')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                <Bug className="w-3.5 h-3.5" /> Debug
              </button>
              <button onClick={() => setPrompt('Create an executive summary and data story for stakeholders')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                <BookOpen className="w-3.5 h-3.5" /> Story
              </button>
              <button onClick={() => setPrompt('Generate documentation for this dataset and analysis')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                <FileText className="w-3.5 h-3.5" /> Docs
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground/60 mt-2.5">
        Enter to send · Shift+Enter for new line · Drag & drop files
      </p>

      <input ref={fileRef} type="file" accept=".csv,.json,.xlsx,.xls,.tsv" multiple className="hidden"
        onChange={(e) => { const files = e.target.files; if (files) Array.from(files).forEach(f => handleFile(f)); e.target.value = ''; }} />
    </div>
  );
}
