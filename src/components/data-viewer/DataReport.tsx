import type { ColumnProfile } from '@/types';
import { formatNumber, healthScore } from '@/lib/stats';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataReportProps {
  data: Record<string, any>[];
  profile: ColumnProfile[];
  fileName: string;
}

export function DataReport({ data, profile, fileName }: DataReportProps) {
  const health = healthScore(profile);
  const numCols = profile.filter(p => p.type === 'numeric');
  const catCols = profile.filter(p => p.type === 'categorical');
  const nullCols = profile.filter(p => p.nullCount > 0);
  const outlierCols = numCols.filter(p => (p.outliers || 0) > 0);

  const downloadReport = () => {
    const lines = [
      `DATA QUALITY REPORT — ${fileName}`,
      `Generated: ${new Date().toLocaleString()}`,
      `${'='.repeat(50)}`,
      '',
      `SUMMARY`,
      `  Rows: ${formatNumber(data.length)}`,
      `  Columns: ${profile.length}`,
      `  Numeric: ${numCols.length}  |  Categorical: ${catCols.length}`,
      `  Health Score: ${health}%`,
      '',
      `COMPLETENESS`,
      ...profile.map(p => `  ${p.col}: ${((1 - p.nullCount / p.total) * 100).toFixed(1)}% complete (${p.nullCount} nulls)`),
      '',
      `COLUMN PROFILES`,
      ...profile.map(p => {
        const parts = [`  ${p.col} [${p.type}] — ${p.uniqueCount} unique`];
        if (p.type === 'numeric') {
          parts.push(`    min=${p.min} max=${p.max} mean=${p.mean?.toFixed(2)} std=${p.std?.toFixed(2)} median=${p.median}`);
          if (p.outliers) parts.push(`    outliers: ${p.outliers}`);
        }
        if (p.top?.length) parts.push(`    top values: ${p.top.map(t => `${t.value}(${t.count})`).join(', ')}`);
        return parts.join('\n');
      }),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName.replace(/\.\w+$/, '')}_report.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Data Quality Report</h3>
        <Button size="sm" variant="outline" onClick={downloadReport} className="gap-2 text-xs">
          <FileDown className="w-3.5 h-3.5" /> Download Report
        </Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Rows" value={formatNumber(data.length)} color="primary" />
        <StatCard label="Columns" value={profile.length} color="primary" />
        <StatCard label="Health" value={`${health}%`} color={health >= 90 ? 'datum-green' : health >= 70 ? 'datum-amber' : 'datum-red'} />
        <StatCard label="Missing Cols" value={nullCols.length} color={nullCols.length ? 'datum-amber' : 'datum-green'} />
      </div>

      {/* Column details table */}
      <div className="rounded-xl border border-border bg-card overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Column</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Type</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Unique</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Nulls</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Completeness</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Outliers</th>
            </tr>
          </thead>
          <tbody>
            {profile.map(p => (
              <tr key={p.col} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-4 py-2 text-[12px] font-medium text-foreground">{p.col}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                    p.type === 'numeric' ? 'bg-primary/10 text-primary' :
                    p.type === 'categorical' ? 'bg-datum-violet/10 text-datum-violet' :
                    'bg-muted text-muted-foreground'
                  }`}>{p.type}</span>
                </td>
                <td className="px-4 py-2 text-right text-[12px] text-foreground">{p.uniqueCount}</td>
                <td className="px-4 py-2 text-right text-[12px] text-foreground">{p.nullCount}</td>
                <td className="px-4 py-2 text-right text-[12px] text-foreground">
                  {((1 - p.nullCount / p.total) * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-2 text-right text-[12px] text-foreground">{p.outliers || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 text-${color}`}>{value}</p>
    </div>
  );
}
