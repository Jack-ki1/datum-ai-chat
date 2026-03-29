import type { Artifact } from '@/types';

export function CorrMatrixArtifact({ artifact }: { artifact: Artifact }) {
  const columns: string[] = artifact.columns || [];
  const matrix: Record<string, Record<string, number>> = artifact.matrix || {};
  if (!columns.length) return <p className="text-xs text-muted-foreground p-4">No correlation data</p>;

  const getColor = (r: number) => {
    const abs = Math.abs(r);
    if (r > 0) return `rgba(34, 211, 238, ${abs * 0.8})`; // cyan
    return `rgba(248, 113, 113, ${abs * 0.8})`; // red
  };

  return (
    <div className="p-3 overflow-auto max-h-[320px]">
      <table className="text-[10px] font-mono">
        <thead>
          <tr>
            <th className="px-2 py-1" />
            {columns.map(c => (
              <th key={c} className="px-2 py-1 text-muted-foreground font-medium truncate max-w-[60px]" title={c}>
                {c.length > 8 ? c.slice(0, 7) + '…' : c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map(row => (
            <tr key={row}>
              <td className="px-2 py-1 text-muted-foreground font-medium truncate max-w-[80px]" title={row}>
                {row.length > 10 ? row.slice(0, 9) + '…' : row}
              </td>
              {columns.map(col => {
                const val = matrix[row]?.[col] ?? 0;
                return (
                  <td key={col} className="px-2 py-1 text-center rounded-sm"
                    style={{ backgroundColor: getColor(val) }}
                    title={`${row} × ${col}: ${val.toFixed(3)}`}>
                    <span className="text-foreground">{val.toFixed(2)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
