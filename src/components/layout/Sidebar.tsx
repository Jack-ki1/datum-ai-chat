import { useDatumStore } from '@/store/datum.store';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Database, Plus, Search, Hexagon, BookOpen } from 'lucide-react';

export function Sidebar() {
  const { sessions, activeSessionId, setActiveSession, newSession, fileName, isLoaded, dataset, profile, sidebarOpen } = useDatumStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-[260px] min-w-[260px] h-screen flex flex-col border-r border-border bg-card overflow-hidden">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Hexagon className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-display font-extrabold text-foreground text-[17px] tracking-tight">DATUM</span>
            <p className="text-[10px] font-medium text-muted-foreground tracking-wide">AI Data Intelligence</p>
          </div>
        </div>
      </div>

      {/* New session button */}
      <div className="px-4 pb-3">
        <button onClick={newSession}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:shadow-md hover:brightness-105 transition-all duration-200">
          <Plus className="w-4 h-4" /> New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs">
          <Search className="w-3.5 h-3.5" />
          <span>Search sessions…</span>
        </div>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-2.5">Recent</p>
        <div className="space-y-1">
          {sessions.map(s => {
            const active = s.id === activeSessionId;
            return (
              <button key={s.id} onClick={() => setActiveSession(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150
                  ${active
                    ? 'bg-primary/8 text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <MessageSquare className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                <span className="truncate text-[13px]">{s.title}</span>
                {s.rowCount && (
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground opacity-60">{s.rowCount}×{s.colCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer — active dataset */}
      {isLoaded && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/15">
            <Database className="w-4 h-4 text-primary" />
            <div className="min-w-0 flex-1">
              <span className="text-[12px] font-medium text-foreground truncate block">{fileName}</span>
              <span className="text-[10px] text-muted-foreground">
                {dataset?.length} rows · {profile?.length} cols
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
