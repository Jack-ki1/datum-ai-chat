import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
  { keys: ['⌘', 'K'], desc: 'Command palette' },
  { keys: ['⌘', 'N'], desc: 'New chat session' },
  { keys: ['⌘', '/'], desc: 'Focus input' },
  { keys: ['?'], desc: 'Show shortcuts' },
  { keys: ['Enter'], desc: 'Send message' },
  { keys: ['Shift', 'Enter'], desc: 'New line' },
  { keys: ['Esc'], desc: 'Close overlay' },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-expand">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Keyboard Shortcuts</span>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {shortcuts.map(s => (
            <div key={s.desc} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-mono text-foreground border border-border">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
