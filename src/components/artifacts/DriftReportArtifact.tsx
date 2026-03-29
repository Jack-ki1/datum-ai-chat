import type { Artifact } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  drifted: 'text-datum-red bg-datum-red/10 border-datum-red/25',
  warning: 'text-datum-orange bg-datum-orange/10 border-datum-orange/25',
  stable: 'text-datum-green bg-datum-green/10 border-datum-green/25',
};

export function DriftReportArtifact({ artifact }: { artifact: Artifact }) {
  const features: any[] = artifact.features || [];
  if (!features.length) return <p className="text-xs text-muted-foreground p-4">No drift data</p>;

  return (
    <div className="p-3 overflow-auto max-h-[300px]">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-muted-foreground font-mono text-[9px] uppercase tracking-wider">
            <th className="text-left px-2 py-1.5 border-b border-border">Feature</th>
            <th className="text-right px-2 py-1.5 border-b border-border">Drift Score</th>
            <th className="text-right px-2 py-1.5 border-b border-border">Baseline</th>
            <th className="text-right px-2 py-1.5 border-b border-border">Current</th>
            <th className="text-center px-2 py-1.5 border-b border-border">Status</th>
          </tr>
        </thead>
        <tbody>
          {features.map((f, i) => (
            <tr key={i} className="hover:bg-accent/50 transition-colors">
              <td className="px-2 py-2 border-b border-border/50 font-mono font-medium text-foreground">{f.name}</td>
              <td className="px-2 py-2 border-b border-border/50 text-right font-mono text-datum-cyan">{f.drift_score?.toFixed(3)}</td>
              <td className="px-2 py-2 border-b border-border/50 text-right font-mono text-datum-text-3">{f.baseline_mean?.toFixed(2)}</td>
              <td className="px-2 py-2 border-b border-border/50 text-right font-mono text-datum-text-3">{f.current_mean?.toFixed(2)}</td>
              <td className="px-2 py-2 border-b border-border/50 text-center">
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${STATUS_COLORS[f.status] || STATUS_COLORS.stable}`}>
                  {f.status || 'stable'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
