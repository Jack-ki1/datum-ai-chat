import type { Artifact } from '@/types';
import { ArrowRight } from 'lucide-react';

const NODE_COLORS: Record<string, string> = {
  source: 'border-datum-green/40 bg-datum-green/10 text-datum-green',
  transform: 'border-datum-cyan/40 bg-datum-cyan/10 text-datum-cyan',
  sink: 'border-datum-violet/40 bg-datum-violet/10 text-datum-violet',
};

export function LineageArtifact({ artifact }: { artifact: Artifact }) {
  const nodes: any[] = artifact.nodes || [];
  const edges: any[] = artifact.edges || [];
  if (!nodes.length) return <p className="text-xs text-muted-foreground p-4">No lineage data</p>;

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <div className="p-3 space-y-2 max-h-[300px] overflow-auto">
      {/* Render as a flow list */}
      <div className="flex flex-wrap items-center gap-2">
        {nodes.map((node, i) => (
          <div key={node.id} className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono ${NODE_COLORS[node.type] || NODE_COLORS.transform}`}>
              {node.label}
            </div>
            {i < nodes.length - 1 && <ArrowRight className="w-3 h-3 text-datum-text-3" />}
          </div>
        ))}
      </div>
      {edges.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-border">
          {edges.map((e, i) => (
            <div key={i} className="text-[9px] font-mono text-muted-foreground">
              {nodeMap[e.from]?.label || e.from} → {nodeMap[e.to]?.label || e.to}
              {e.label && <span className="text-datum-amber ml-1">({e.label})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
