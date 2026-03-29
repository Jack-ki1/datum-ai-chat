import { useDatumStore } from '@/store/datum.store';
import { MessageSquare, Database, Plus, Search } from 'lucide-react';

export function Sidebar() {
  const { sessions, activeSessionId, setActiveSession, newSession, fileName, isLoaded, dataset, profile, sidebarOpen } = useDatumStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-[220px] min-w-[220px] h-screen flex flex-col border-r border-border bg-secondary overflow-hidden">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            D
          </div>
          <span className="font-display font-extrabold text-primary text-lg tracking-tight">DATUM</span>
        </div>
        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1 pl-[34px]">AI · DATA CHAT</p>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-accent border border-border text-muted-foreground text-xs">
          <Search className="w-3 h-3" />
          <span>Search sessions</span>
        </div>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-2">Sessions</p>
        <div className="space-y-0.5">
          {sessions.map(s => {
            const active = s.id === activeSessionId;
            return (
              <button key={s.id} onClick={() => setActiveSession(s.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-sm transition-all duration-150
                  ${active ? 'bg-primary/10 border border-primary/30 text-foreground' : 'border border-transparent hover:bg-card hover:border-border text-muted-foreground'}`}>
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate text-xs">{s.title}</span>
                {s.rowCount && (
                  <span className="ml-auto text-[9px] font-mono text-muted-foreground">{s.rowCount}×{s.colCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        {isLoaded && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-primary/8 border border-primary/18">
            <Database className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono text-primary truncate">{fileName}</span>
            <span className="ml-auto text-[9px] font-mono text-muted-foreground">
              {dataset?.length}×{profile?.length}
            </span>
          </div>
        )}
        <button onClick={newSession}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs text-muted-foreground hover:bg-card hover:text-foreground transition-colors">
          <Plus className="w-3.5 h-3.5" /> New session
        </button>
      </div>
    </aside>
  );
}
