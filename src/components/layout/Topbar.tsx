import { useDatumStore } from '@/store/datum.store';
import { PanelLeftClose, PanelLeft, Clock, Database, Layers } from 'lucide-react';
import { formatNumber, healthScore } from '@/lib/stats';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/chat/ExportButton';
import { ChatSearch } from '@/components/chat/ChatSearch';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Topbar() {
  const { fileName, isLoaded, dataset, profile, sidebarOpen, toggleSidebar, sessions, activeSessionId, changelogOpen, toggleChangelog } = useDatumStore();
  const navigate = useNavigate();
  const session = sessions.find(s => s.id === activeSessionId);
  const health = profile ? healthScore(profile) : 0;
  const numCols = profile?.filter(p => p.type === 'numeric').length || 0;
  const catCols = profile?.filter(p => p.type === 'categorical').length || 0;

  return (
    <header className="h-14 min-h-[56px] flex items-center gap-4 px-5 border-b border-border bg-card/80 backdrop-blur-sm">
      <button onClick={toggleSidebar} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        {sidebarOpen ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeft className="w-[18px] h-[18px]" />}
      </button>

      <span className="text-sm font-semibold text-foreground truncate">
        {session?.title || 'New Session'}
      </span>

      {/* Keyboard shortcut hint */}
      <kbd className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border cursor-pointer hover:bg-accent transition-colors"
        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
        ⌘K
      </kbd>

      {isLoaded && (
        <div className="flex items-center gap-2 ml-auto">
          <Chip color="blue">{fileName}</Chip>
          <Chip color="cyan">{formatNumber(dataset?.length || 0)} rows</Chip>
          <Chip color="violet">{profile?.length} cols</Chip>
          {numCols > 0 && <Chip color="amber">{numCols} numeric</Chip>}
          {catCols > 0 && <Chip color="green">{catCols} cat</Chip>}
          <Chip color={health >= 90 ? 'green' : health >= 70 ? 'amber' : 'red'}>
            ♥ {health}%
          </Chip>

          <div className="h-5 w-px bg-border mx-1" />

          <Button size="sm" variant="outline" onClick={() => navigate('/data/original')} className="gap-1.5 text-[11px] h-7 px-2.5 rounded-lg">
            <Database className="w-3 h-3" /> Original
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/data/transformed')} className="gap-1.5 text-[11px] h-7 px-2.5 rounded-lg">
            <Layers className="w-3 h-3" /> Transformed
          </Button>
        </div>
      )}

      {!isLoaded && <div className="ml-auto" />}

      {/* Right-side actions */}
      <div className="flex items-center gap-0.5">
        <ChatSearch />
        <ExportButton />
        <ThemeToggle />
        <button onClick={toggleChangelog} className={`p-1.5 rounded-lg transition-colors ${changelogOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
          <Clock className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-primary bg-primary/8 border-primary/15',
    amber: 'text-datum-amber bg-datum-amber/8 border-datum-amber/15',
    cyan: 'text-datum-cyan bg-datum-cyan/8 border-datum-cyan/15',
    violet: 'text-datum-violet bg-datum-violet/8 border-datum-violet/15',
    green: 'text-datum-green bg-datum-green/8 border-datum-green/15',
    red: 'text-datum-red bg-datum-red/8 border-datum-red/15',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-medium border ${colorMap[color] || colorMap.blue}`}>
      {children}
    </span>
  );
}
