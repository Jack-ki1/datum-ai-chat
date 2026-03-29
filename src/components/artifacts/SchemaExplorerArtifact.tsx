import type { Artifact } from '@/types';
import { Database } from 'lucide-react';

export function SchemaExplorerArtifact({ artifact }: { artifact: Artifact }) {
  const tables: any[] = artifact.tables || [];
  if (!tables.length) return <p className="text-xs text-muted-foreground p-4">No schema data</p>;

  return (
    <div className="p-3 space-y-2 max-h-[350px] overflow-auto">
      {tables.map((table, i) => (
        <div key={i} className="rounded-lg border border-border bg-secondary/50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-accent/30">
            <Database className="w-3 h-3 text-datum-violet" />
            <span className="text-xs font-mono font-medium text-foreground">{table.name}</span>
            {table.row_count !== undefined && (
              <span className="text-[9px] font-mono text-datum-text-3 ml-auto">{table.row_count.toLocaleString()} rows</span>
            )}
          </div>
          <div className="divide-y divide-border/50">
            {(table.columns || []).map((col: any, j: number) => (
              <div key={j} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono">
                <span className={`${col.pk ? 'text-datum-amber' : 'text-foreground'}`}>{col.name}</span>
                <span className="text-datum-cyan">{col.type}</span>
                {col.pk && <span className="text-[8px] text-datum-amber">PK</span>}
                {col.nullable === false && <span className="text-[8px] text-datum-red">NOT NULL</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
