import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDatumStore } from '@/store/datum.store';

export function ChatSearch() {
  const { messages } = useDatumStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  if (messages.length === 0) return null;

  const results = query.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); setQuery(''); }}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Search messages"
      >
        <Search className="w-[18px] h-[18px]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-80 bg-card border border-border rounded-xl shadow-lg z-50 animate-fade-slide">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search messages…"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <button onClick={() => setOpen(false)} className="p-0.5 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto p-1.5">
              {query.trim() && results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No matches</p>
              )}
              {results.map(m => (
                <div key={m.id} className="px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-semibold uppercase ${m.role === 'user' ? 'text-primary' : 'text-datum-violet'}`}>
                      {m.role === 'user' ? 'You' : 'AI'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground line-clamp-2">{m.content}</p>
                </div>
              ))}
              {!query.trim() && (
                <p className="text-xs text-muted-foreground text-center py-4">Type to search through messages</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
