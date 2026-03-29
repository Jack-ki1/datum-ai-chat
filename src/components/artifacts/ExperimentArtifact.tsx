import type { Artifact } from '@/types';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

const STATUS_ICON: Record<string, JSX.Element> = {
  completed: <CheckCircle className="w-3 h-3 text-datum-green" />,
  running: <Loader2 className="w-3 h-3 text-datum-amber animate-spin" />,
  failed: <XCircle className="w-3 h-3 text-datum-red" />,
};

export function ExperimentArtifact({ artifact }: { artifact: Artifact }) {
  const experiments: any[] = artifact.experiments || [];
  if (!experiments.length) return <p className="text-xs text-muted-foreground p-4">No experiments</p>;

  return (
    <div className="p-3 overflow-auto max-h-[300px]">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-muted-foreground font-mono text-[9px] uppercase tracking-wider">
            <th className="text-left px-2 py-1.5 border-b border-border">Experiment</th>
            <th className="text-left px-2 py-1.5 border-b border-border">Model</th>
            <th className="text-left px-2 py-1.5 border-b border-border">Metrics</th>
            <th className="text-center px-2 py-1.5 border-b border-border">Status</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp, i) => (
            <tr key={i} className="hover:bg-accent/50 transition-colors">
              <td className="px-2 py-2 border-b border-border/50 font-medium text-foreground">{exp.name}</td>
              <td className="px-2 py-2 border-b border-border/50 font-mono text-datum-cyan">{exp.model}</td>
              <td className="px-2 py-2 border-b border-border/50">
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(exp.metrics || {}).map(([k, v]) => (
                    <span key={k} className="text-[9px] font-mono text-muted-foreground">
                      {k}: <span className="text-datum-amber">{typeof v === 'number' ? (v as number).toFixed(3) : String(v)}</span>
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-2 py-2 border-b border-border/50 text-center">
                {STATUS_ICON[exp.status] || STATUS_ICON.completed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
