import type { Artifact } from '@/types';
import { formatNumber } from '@/lib/stats';

const TYPE_COLORS: Record<string, string> = {
  numeric: 'text-datum-cyan bg-datum-cyan/10 border-datum-cyan/20',
  categorical: 'text-datum-violet bg-datum-violet/10 border-datum-violet/20',
  text: 'text-datum-green bg-datum-green/10 border-datum-green/20',
  datetime: 'text-datum-amber bg-datum-amber/10 border-datum-amber/20',
  empty: 'text-datum-text-3 bg-accent border-border',
};

export function ProfileArtifact({ artifact }: { artifact: Artifact }) {
  const profile = artifact.profile || [];

  return (
    <div className="p-3 overflow-auto max-h-[310px]">
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))' }}>
        {profile.map(col => (
          <div key={col.col} className="rounded-lg border border-border bg-secondary/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-foreground truncate">{col.col}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${TYPE_COLORS[col.type]}`}>{col.type}</span>
            </div>

            <div className="flex items-center gap-3 text-[10px]">
              <span className={col.nullCount > 0 ? 'text-datum-red' : 'text-datum-green'}>
                {col.nullCount} nulls ({Math.round(col.nullCount / col.total * 100)}%)
              </span>
              <span className="text-muted-foreground">{col.uniqueCount} unique</span>
            </div>

            {col.type === 'numeric' && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                <Stat label="min" value={formatNumber(col.min!)} />
                <Stat label="max" value={formatNumber(col.max!)} />
                <Stat label="mean" value={formatNumber(col.mean!)} />
                <Stat label="std" value={formatNumber(col.std!)} />
                {(col.outliers || 0) > 0 && (
                  <span className="col-span-2 text-datum-orange">{col.outliers} outliers</span>
                )}
              </div>
            )}

            {col.type === 'categorical' && col.top && (
              <div className="space-y-1">
                {col.top.slice(0, 4).map(t => (
                  <div key={t.value} className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-accent overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${t.pct}%` }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground truncate max-w-[80px]">{t.value}</span>
                    <span className="text-[9px] text-datum-text-3">{t.pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-datum-text-3 font-mono">{label}</span>
      <span className="text-datum-cyan font-mono">{value}</span>
    </div>
  );
}
