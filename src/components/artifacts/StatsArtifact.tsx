import type { Artifact } from '@/types';

const COLOR_MAP: Record<string, string> = {
  cyan: 'text-datum-cyan',
  amber: 'text-datum-amber',
  green: 'text-datum-green',
  violet: 'text-datum-violet',
  red: 'text-datum-red',
  orange: 'text-datum-orange',
  pink: 'text-datum-pink',
};

export function StatsArtifact({ artifact }: { artifact: Artifact }) {
  const stats = artifact.stats || [];

  return (
    <div className="p-3">
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(136px, 1fr))' }}>
        {stats.map((s, i) => (
          <div key={i} className="rounded-lg border border-border bg-secondary/50 p-3 text-center">
            <div className={`text-lg font-mono font-medium ${COLOR_MAP[s.color || 'cyan'] || 'text-datum-cyan'}`}>
              {s.value}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
