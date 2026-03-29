import type { Artifact } from '@/types';
import { Brain } from 'lucide-react';

export function ModelCardArtifact({ artifact }: { artifact: Artifact }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-datum-violet" />
        <span className="text-sm font-medium text-foreground">{artifact.model_name || 'Model'}</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-datum-violet/25 bg-datum-violet/10 text-datum-violet">
          {artifact.model_type || 'unknown'}
        </span>
      </div>

      {artifact.target && (
        <div className="text-[10px] font-mono text-muted-foreground">
          Target: <span className="text-datum-amber">{artifact.target}</span>
        </div>
      )}

      {artifact.features?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {artifact.features.map((f: string) => (
            <span key={f} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent text-muted-foreground">{f}</span>
          ))}
        </div>
      )}

      {artifact.metrics && (
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(artifact.metrics as Record<string, number>).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border bg-secondary/50 p-2 text-center">
              <div className="text-sm font-mono text-datum-cyan">{typeof v === 'number' ? v.toFixed(3) : v}</div>
              <div className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{k}</div>
            </div>
          ))}
        </div>
      )}

      {artifact.preprocessing?.length > 0 && (
        <div className="text-[10px] text-muted-foreground">
          <span className="font-mono text-datum-text-3">Preprocessing: </span>
          {artifact.preprocessing.join(' → ')}
        </div>
      )}

      {artifact.recommendations && (
        <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-2">
          {artifact.recommendations}
        </p>
      )}
    </div>
  );
}
