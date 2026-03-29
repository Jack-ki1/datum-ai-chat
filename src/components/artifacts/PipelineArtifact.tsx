import type { Artifact } from '@/types';
import { CheckCircle, Loader2, XCircle, Clock } from 'lucide-react';

const STATUS_CONFIG: Record<string, { icon: JSX.Element; border: string }> = {
  success: { icon: <CheckCircle className="w-3.5 h-3.5 text-datum-green" />, border: 'border-datum-green/30' },
  running: { icon: <Loader2 className="w-3.5 h-3.5 text-datum-amber animate-spin" />, border: 'border-datum-amber/30' },
  failed: { icon: <XCircle className="w-3.5 h-3.5 text-datum-red" />, border: 'border-datum-red/30' },
  pending: { icon: <Clock className="w-3.5 h-3.5 text-datum-text-3" />, border: 'border-border' },
};

export function PipelineArtifact({ artifact }: { artifact: Artifact }) {
  const stages: any[] = artifact.stages || [];
  if (!stages.length) return <p className="text-xs text-muted-foreground p-4">No pipeline data</p>;

  return (
    <div className="p-3 space-y-2">
      {stages.map((stage, i) => {
        const cfg = STATUS_CONFIG[stage.status] || STATUS_CONFIG.pending;
        return (
          <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-secondary/50 ${cfg.border}`}>
            {cfg.icon}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground">{stage.name}</div>
              {stage.details && <div className="text-[10px] text-muted-foreground">{stage.details}</div>}
            </div>
            <div className="text-right shrink-0 space-y-0.5">
              {stage.duration && <div className="text-[10px] font-mono text-datum-text-3">{stage.duration}</div>}
              {stage.records !== undefined && <div className="text-[9px] font-mono text-datum-cyan">{stage.records.toLocaleString()} rows</div>}
            </div>
            {i < stages.length - 1 && (
              <div className="absolute left-[21px] top-full w-px h-2 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}
