import type { Artifact } from '@/types';

export function ConfusionMatrixArtifact({ artifact }: { artifact: Artifact }) {
  const labels: string[] = artifact.labels || [];
  const matrix: number[][] = artifact.matrix || [];
  if (!labels.length || !matrix.length) return <p className="text-xs text-muted-foreground p-4">No matrix data</p>;

  const maxVal = Math.max(...matrix.flat());

  return (
    <div className="p-3 space-y-3">
      {/* Metrics row */}
      {artifact.accuracy !== undefined && (
        <div className="flex gap-3 text-[10px] font-mono">
          <span className="text-muted-foreground">Accuracy: <span className="text-datum-cyan">{(artifact.accuracy * 100).toFixed(1)}%</span></span>
          {artifact.precision && Object.entries(artifact.precision as Record<string, number>).slice(0, 3).map(([k, v]) => (
            <span key={k} className="text-muted-foreground">P({k}): <span className="text-datum-green">{(v * 100).toFixed(1)}%</span></span>
          ))}
        </div>
      )}

      {/* Matrix */}
      <div className="overflow-auto">
        <table className="text-[10px] font-mono mx-auto">
          <thead>
            <tr>
              <th className="px-1 py-1 text-[8px] text-muted-foreground" />
              <th colSpan={labels.length} className="text-center text-[8px] text-muted-foreground pb-1">Predicted</th>
            </tr>
            <tr>
              <th className="px-2 py-1" />
              {labels.map(l => (
                <th key={l} className="px-3 py-1 text-center text-muted-foreground font-medium">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((row, i) => (
              <tr key={row}>
                <td className="px-2 py-1 text-muted-foreground font-medium text-right">{row}</td>
                {labels.map((_, j) => {
                  const val = matrix[i]?.[j] || 0;
                  const isDiag = i === j;
                  const opacity = maxVal > 0 ? val / maxVal : 0;
                  return (
                    <td key={j} className="px-3 py-2 text-center rounded-sm"
                      style={{
                        backgroundColor: isDiag
                          ? `rgba(34, 211, 238, ${opacity * 0.5})`
                          : `rgba(248, 113, 113, ${opacity * 0.5})`
                      }}>
                      <span className="text-foreground font-medium">{val}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
