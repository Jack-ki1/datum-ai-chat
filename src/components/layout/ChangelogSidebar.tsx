import { useDatumStore } from '@/store/datum.store';
import { X, Upload, Wand2, Filter, Trash2, BarChart3, Search, Clock, GripVertical } from 'lucide-react';
import type { ChangelogEntry } from '@/types';

const actionIcons: Record<string, React.ElementType> = {
  upload: Upload,
  transform: Wand2,
  filter: Filter,
  drop: Trash2,
  chart: BarChart3,
  analysis: Search,
  other: Clock,
};

const actionColors: Record<string, string> = {
  upload: 'text-primary bg-primary/10',
  transform: 'text-datum-violet bg-datum-violet/10',
  filter: 'text-datum-cyan bg-datum-cyan/10',
  drop: 'text-datum-red bg-datum-red/10',
  chart: 'text-datum-green bg-datum-green/10',
  analysis: 'text-datum-amber bg-datum-amber/10',
  other: 'text-muted-foreground bg-muted',
};

export function ChangelogSidebar() {
  const { changelog, changelogOpen, toggleChangelog, removeChangelogEntry } = useDatumStore();

  if (!changelogOpen) return null;

  return (
    <aside className="w-[260px] min-w-[260px] h-full flex flex-col border-l border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Changelog</span>
        </div>
        <button onClick={toggleChangelog} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {changelog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground">No changes recorded yet.</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">Actions will appear here as you work.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {changelog.map((entry, idx) => (
              <ChangelogItem key={entry.id} entry={entry} isLast={idx === changelog.length - 1} onRemove={() => removeChangelogEntry(entry.id)} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function ChangelogItem({ entry, isLast, onRemove }: { entry: ChangelogEntry; isLast: boolean; onRemove: () => void }) {
  const Icon = actionIcons[entry.action] || Clock;
  const colorClasses = actionColors[entry.action] || actionColors.other;

  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="group relative flex gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorClasses}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[12px] font-medium text-foreground leading-tight">{entry.description}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{timeStr}</p>
      </div>

      {/* Remove button */}
      <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0 self-start">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
