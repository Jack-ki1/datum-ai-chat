import { useDatumStore } from '@/store/datum.store';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { formatNumber, healthScore } from '@/lib/stats';

export function Topbar() {
  const { fileName, isLoaded, dataset, profile, sidebarOpen, toggleSidebar, sessions, activeSessionId } = useDatumStore();
  const session = sessions.find(s => s.id === activeSessionId);
  const health = profile ? healthScore(profile) : 0;
  const numCols = profile?.filter(p => p.type === 'numeric').length || 0;
  const catCols = profile?.filter(p => p.type === 'categorical').length || 0;

  return (
    <header className="h-12 min-h-[48px] flex items-center gap-3 px-4 border-b border-border bg-secondary">
      <button onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground transition-colors">
        {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
      </button>

      <span className="text-sm font-medium text-foreground truncate">
        {session?.title || 'New Session'}
      </span>

      {isLoaded && (
        <div className="flex items-center gap-1.5 ml-auto">
          <Chip color="amber">{fileName}</Chip>
          <Chip color="cyan">{formatNumber(dataset?.length || 0)} rows</Chip>
          <Chip color="violet">{profile?.length} cols</Chip>
          {numCols > 0 && <Chip color="amber">{numCols} numeric</Chip>}
          {catCols > 0 && <Chip color="green">{catCols} cat</Chip>}
          <Chip color={health >= 90 ? 'green' : health >= 70 ? 'amber' : 'red'}>
            ♥ {health}%
          </Chip>
        </div>
      )}
    </header>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'text-datum-amber bg-datum-amber/8 border-datum-amber/18',
    cyan: 'text-datum-cyan bg-datum-cyan/8 border-datum-cyan/18',
    violet: 'text-datum-violet bg-datum-violet/8 border-datum-violet/18',
    green: 'text-datum-green bg-datum-green/8 border-datum-green/18',
    red: 'text-datum-red bg-datum-red/8 border-datum-red/18',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${colorMap[color] || colorMap.amber}`}>
      {children}
    </span>
  );
}
