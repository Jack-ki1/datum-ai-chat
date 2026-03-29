import type { Artifact } from '@/types';
import { CheckCircle, XCircle } from 'lucide-react';

export function HypothesisArtifact({ artifact }: { artifact: Artifact }) {
  const rejected = artifact.conclusion === 'reject';

  return (
    <div className="p-4 space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-start gap-2 text-xs">
          <span className="text-datum-text-3 font-mono shrink-0">H₀:</span>
          <span className="text-muted-foreground">{artifact.null_h || 'Not specified'}</span>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <span className="text-datum-text-3 font-mono shrink-0">H₁:</span>
          <span className="text-muted-foreground">{artifact.alt_h || 'Not specified'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Test" value={artifact.test || '—'} />
        <Stat label="Statistic" value={artifact.statistic?.toFixed(4) || '—'} />
        <Stat label="p-value" value={artifact.p_value !== undefined ? artifact.p_value < 0.001 ? '<0.001' : artifact.p_value.toFixed(4) : '—'} />
      </div>

      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
        rejected
          ? 'bg-datum-red/10 border-datum-red/25 text-datum-red'
          : 'bg-datum-green/10 border-datum-green/25 text-datum-green'
      }`}>
        {rejected ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        <span className="text-xs font-medium">
          {rejected ? 'Reject H₀' : 'Fail to reject H₀'} at α = {(1 - (artifact.confidence || 0.95)).toFixed(2)}
        </span>
      </div>

      {artifact.details && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">{artifact.details}</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/50 p-2 text-center">
      <div className="text-sm font-mono text-datum-cyan">{value}</div>
      <div className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
