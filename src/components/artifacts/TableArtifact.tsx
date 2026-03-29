import { useState } from 'react';
import type { Artifact } from '@/types';
import { formatNumber } from '@/lib/stats';

export function TableArtifact({ artifact }: { artifact: Artifact }) {
  const data = artifact.data || [];
  const [expanded, setExpanded] = useState(false);
  if (!data.length) return <p className="text-xs text-muted-foreground p-4">No data</p>;

  const cols = Object.keys(data[0]);
  const rows = expanded ? data : data.slice(0, 80);

  return (
    <div className="overflow-auto max-h-[190px]">
      <table className="w-full text-xs">
        <thead>
          <tr className="sticky top-0 bg-secondary z-10">
            {cols.map(c => (
              <th key={c} className="px-3 py-2 text-left font-mono font-medium text-muted-foreground border-b border-border whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-accent/50 transition-colors">
              {cols.map(c => {
                const v = row[c];
                const isNull = v === null || v === undefined || v === '';
                const isNum = typeof v === 'number';
                return (
                  <td key={c} className={`px-3 py-1.5 border-b border-border/50 whitespace-nowrap ${isNum ? 'text-right text-datum-cyan' : ''} ${isNull ? 'italic text-datum-text-3' : ''}`}>
                    {isNull ? 'null' : isNum ? formatNumber(v) : String(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 80 && (
        <button onClick={() => setExpanded(!expanded)}
          className="w-full py-1.5 text-[10px] font-mono text-primary hover:bg-accent/50 transition-colors">
          {expanded ? 'Collapse' : `Show all ${data.length} rows`}
        </button>
      )}
    </div>
  );
}
