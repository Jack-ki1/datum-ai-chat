import type { Artifact } from '@/types';
import { AlertTriangle } from 'lucide-react';

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: 'text-datum-red bg-datum-red/10 border-datum-red/25',
  MEDIUM: 'text-datum-orange bg-datum-orange/10 border-datum-orange/25',
  LOW: 'text-datum-amber bg-datum-amber/10 border-datum-amber/25',
};

export function AnomalyReportArtifact({ artifact }: { artifact: Artifact }) {
  const anomalies: any[] = artifact.anomalies || [];
  if (!anomalies.length) return <p className="text-xs text-muted-foreground p-4">No anomalies detected</p>;

  return (
    <div className="p-3 space-y-2 max-h-[320px] overflow-auto">
      {anomalies.map((a, i) => (
        <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-secondary/80 border border-border/50">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-datum-orange" />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-foreground">{a.column}</span>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[a.severity || 'MEDIUM']}`}>
                {a.severity || 'MEDIUM'}
              </span>
              {a.method && <span className="text-[8px] font-mono text-muted-foreground">{a.method}</span>}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{a.explanation}</p>
            <div className="flex gap-3 text-[9px] font-mono text-datum-text-3">
              {a.value !== undefined && <span>value: <span className="text-datum-cyan">{a.value}</span></span>}
              {a.z_score !== undefined && <span>z: <span className="text-datum-cyan">{a.z_score}</span></span>}
              {a.row_index !== undefined && <span>row: <span className="text-datum-cyan">{a.row_index}</span></span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
