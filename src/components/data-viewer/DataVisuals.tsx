import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import type { ColumnProfile } from '@/types';

interface DataVisualsProps {
  data: Record<string, any>[];
  profile: ColumnProfile[];
}

export function DataVisuals({ data, profile }: DataVisualsProps) {
  const numericCols = profile.filter(p => p.type === 'numeric');
  const categoricalCols = profile.filter(p => p.type === 'categorical');

  const histograms = useMemo(() => {
    return numericCols.slice(0, 6).map(col => {
      const values = data.map(r => Number(r[col.col])).filter(v => !isNaN(v));
      const min = Math.min(...values);
      const max = Math.max(...values);
      const bucketCount = 10;
      const step = (max - min) / bucketCount || 1;
      const buckets = Array.from({ length: bucketCount }, (_, i) => ({
        range: `${(min + i * step).toFixed(1)}`,
        count: 0,
      }));
      values.forEach(v => {
        const idx = Math.min(Math.floor((v - min) / step), bucketCount - 1);
        if (buckets[idx]) buckets[idx].count++;
      });
      return { col: col.col, data: buckets };
    });
  }, [data, numericCols]);

  const barCharts = useMemo(() => {
    return categoricalCols.slice(0, 4).map(col => {
      const counts: Record<string, number> = {};
      data.forEach(r => {
        const v = String(r[col.col] ?? 'null');
        counts[v] = (counts[v] || 0) + 1;
      });
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([value, count]) => ({ value, count }));
      return { col: col.col, data: sorted };
    });
  }, [data, categoricalCols]);

  const scatterPairs = useMemo(() => {
    const pairs: { x: string; y: string; data: { x: number; y: number }[] }[] = [];
    for (let i = 0; i < Math.min(numericCols.length, 3); i++) {
      for (let j = i + 1; j < Math.min(numericCols.length, 4); j++) {
        const xCol = numericCols[i].col;
        const yCol = numericCols[j].col;
        const pts = data.slice(0, 200).map(r => ({ x: Number(r[xCol]), y: Number(r[yCol]) })).filter(p => !isNaN(p.x) && !isNaN(p.y));
        pairs.push({ x: xCol, y: yCol, data: pts });
      }
    }
    return pairs.slice(0, 3);
  }, [data, numericCols]);

  if (!histograms.length && !barCharts.length) {
    return <p className="text-muted-foreground text-sm p-6">No visualizations available for this dataset.</p>;
  }

  return (
    <div className="space-y-6">
      {histograms.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Numeric Distributions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {histograms.map(h => (
              <div key={h.col} className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] font-medium text-muted-foreground mb-2">{h.col}</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={h.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {barCharts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Categorical Distributions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barCharts.map(b => (
              <div key={b.col} className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] font-medium text-muted-foreground mb-2">{b.col}</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={b.data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis dataKey="value" type="category" tick={{ fontSize: 9 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--datum-cyan))" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {scatterPairs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Scatter Plots</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scatterPairs.map(s => (
              <div key={`${s.x}-${s.y}`} className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] font-medium text-muted-foreground mb-2">{s.x} vs {s.y}</p>
                <ResponsiveContainer width="100%" height={160}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="x" name={s.x} tick={{ fontSize: 9 }} />
                    <YAxis dataKey="y" name={s.y} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Scatter data={s.data} fill="hsl(var(--datum-violet))" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
