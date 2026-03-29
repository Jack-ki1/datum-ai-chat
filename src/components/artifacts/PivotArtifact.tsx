import type { Artifact } from '@/types';

export function PivotArtifact({ artifact }: { artifact: Artifact }) {
  const rows: string[] = artifact.rows || [];
  const cols: string[] = artifact.cols || [];
  const cells: Record<string, Record<string, any>> = artifact.cells || {};
  if (!rows.length || !cols.length) return <p className="text-xs text-muted-foreground p-4">No pivot data</p>;

  return (
    <div className="overflow-auto max-h-[250px] p-3">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="sticky top-0 bg-secondary z-10">
            <th className="px-3 py-2 text-left text-muted-foreground border-b border-border" />
            {cols.map(c => (
              <th key={c} className="px-3 py-2 text-right text-muted-foreground border-b border-border whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r} className="hover:bg-accent/50 transition-colors">
              <td className="px-3 py-1.5 border-b border-border/50 font-medium text-foreground">{r}</td>
              {cols.map(c => (
                <td key={c} className="px-3 py-1.5 text-right border-b border-border/50 text-datum-cyan">
                  {cells[r]?.[c] !== undefined ? cells[r][c] : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
