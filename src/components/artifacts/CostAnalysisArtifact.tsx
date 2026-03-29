import type { Artifact } from '@/types';
import { TrendingDown } from 'lucide-react';

export function CostAnalysisArtifact({ artifact }: { artifact: Artifact }) {
  const items: any[] = artifact.items || [];
  if (!items.length) return <p className="text-xs text-muted-foreground p-4">No cost data</p>;

  return (
    <div className="p-3 space-y-2 max-h-[320px] overflow-auto">
      {items.map((item, i) => (
        <div key={i} className="px-3 py-2.5 rounded-lg border border-border bg-secondary/50 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">{item.resource}</span>
            {item.savings && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-datum-green">
                <TrendingDown className="w-3 h-3" /> {item.savings}
              </span>
            )}
          </div>
          <div className="flex gap-4 text-[10px] font-mono">
            <span className="text-muted-foreground">Current: <span className="text-datum-red">{item.current_cost}</span></span>
            <span className="text-muted-foreground">Projected: <span className="text-datum-green">{item.projected_cost}</span></span>
          </div>
          {item.recommendation && (
            <p className="text-[10px] text-datum-amber">{item.recommendation}</p>
          )}
        </div>
      ))}
    </div>
  );
}
