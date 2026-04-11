import { useState } from 'react';
import type { Artifact } from '@/types';
import { ChartArtifact } from './ChartArtifact';
import { TableArtifact } from './TableArtifact';
import { InsightsArtifact } from './InsightsArtifact';
import { CodeArtifact } from './CodeArtifact';
import { ProfileArtifact } from './ProfileArtifact';
import { StatsArtifact } from './StatsArtifact';
import { CorrMatrixArtifact } from './CorrMatrixArtifact';
import { AnomalyReportArtifact } from './AnomalyReportArtifact';
import { PivotArtifact } from './PivotArtifact';
import { HypothesisArtifact } from './HypothesisArtifact';
import { FeatureImportanceArtifact } from './FeatureImportanceArtifact';
import { ConfusionMatrixArtifact } from './ConfusionMatrixArtifact';
import { ExperimentArtifact } from './ExperimentArtifact';
import { PipelineArtifact } from './PipelineArtifact';
import { ModelCardArtifact } from './ModelCardArtifact';
import { DriftReportArtifact } from './DriftReportArtifact';
import { CostAnalysisArtifact } from './CostAnalysisArtifact';
import { SchemaExplorerArtifact } from './SchemaExplorerArtifact';
import { LineageArtifact } from './LineageArtifact';
import { SuggestionsArtifact } from './SuggestionsArtifact';
import { ArtifactFullscreen } from './ArtifactFullscreen';
import { Copy, Download, Maximize2, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

const typeLabels: Record<string, string> = {
  chart: 'CHART', table: 'TABLE', insights: 'INSIGHTS', code: 'CODE',
  profile: 'PROFILE', stats: 'STATS', corr_matrix: 'CORRELATION',
  anomaly_report: 'ANOMALIES', pivot: 'PIVOT', hypothesis: 'HYPOTHESIS',
  feature_importance: 'FEATURES', confusion_matrix: 'CONFUSION MATRIX',
  experiment: 'EXPERIMENT', pipeline: 'PIPELINE', model_card: 'MODEL',
  drift_report: 'DRIFT', cost_analysis: 'COST', schema_explorer: 'SCHEMA',
  lineage: 'LINEAGE', suggestions: 'SUGGESTIONS',
};

function artifactToText(artifact: Artifact): string {
  switch (artifact.type) {
    case 'code': return artifact.code || '';
    case 'insights': return (artifact.insights || []).join('\n');
    case 'table':
    case 'pivot':
      return JSON.stringify(artifact.data || artifact.cells || {}, null, 2);
    case 'stats':
      return (artifact.stats || []).map((s: any) => `${s.label}: ${s.value}`).join('\n');
    case 'hypothesis':
      return `H₀: ${artifact.null_h}\nH₁: ${artifact.alt_h}\nTest: ${artifact.test}\nStatistic: ${artifact.statistic}\np-value: ${artifact.p_value}\nConclusion: ${artifact.conclusion}`;
    default:
      return JSON.stringify(artifact, null, 2);
  }
}

function dataToCsv(data: Record<string, any>[]): string {
  if (!data?.length) return '';
  const cols = Object.keys(data[0]);
  const header = cols.map(c => `"${c}"`).join(',');
  const rows = data.map(r => cols.map(c => {
    const v = r[c];
    return typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v ?? '';
  }).join(','));
  return [header, ...rows].join('\n');
}

function downloadBlob(content: string | Uint8Array, name: string, type: string) {
  const blob = new Blob([content instanceof Uint8Array ? content.buffer as ArrayBuffer : content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function downloadArtifact(artifact: Artifact) {
  const base = (artifact.title || artifact.type).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

  switch (artifact.type) {
    case 'code': {
      const ext = ({ python: 'py', sql: 'sql', r: 'r', bash: 'sh', duckdb: 'sql', dbt: 'sql', airflow: 'py' } as any)[artifact.lang || 'python'] || 'txt';
      downloadBlob(artifact.code || '', `${base}.${ext}`, 'text/plain');
      break;
    }
    case 'table':
    case 'pivot':
    case 'stats':
    case 'feature_importance':
    case 'confusion_matrix':
    case 'corr_matrix': {
      let csvData: Record<string, any>[] = [];
      if (artifact.type === 'table' && artifact.data) csvData = artifact.data;
      else if (artifact.type === 'stats' && artifact.stats) csvData = artifact.stats.map((s: any) => ({ Metric: s.label, Value: s.value }));
      else if (artifact.type === 'feature_importance' && artifact.features) csvData = artifact.features;
      else if (artifact.type === 'confusion_matrix' && artifact.matrix) {
        const labels = artifact.labels || [];
        csvData = artifact.matrix.map((row: number[], i: number) => {
          const obj: any = { Actual: labels[i] || i };
          row.forEach((v: number, j: number) => obj[`Predicted_${labels[j] || j}`] = v);
          return obj;
        });
      } else if (artifact.type === 'corr_matrix' && artifact.matrix) {
        csvData = Object.entries(artifact.matrix).map(([k, v]: [string, any]) => ({ Column: k, ...v }));
      } else {
        csvData = [artifact];
      }
      downloadBlob(dataToCsv(csvData), `${base}.csv`, 'text/csv');
      break;
    }
    case 'chart': {
      // Try to find and export canvas
      const canvas = document.querySelector('.recharts-wrapper canvas') as HTMLCanvasElement;
      if (canvas) {
        canvas.toBlob(blob => {
          if (blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${base}.png`; a.click(); URL.revokeObjectURL(url); }
        });
      } else {
        // Fallback: download chart config as JSON
        downloadBlob(JSON.stringify(artifact, null, 2), `${base}.json`, 'application/json');
      }
      break;
    }
    case 'insights':
    case 'hypothesis':
    case 'model_card':
    case 'experiment': {
      downloadBlob(artifactToText(artifact), `${base}.md`, 'text/markdown');
      break;
    }
    case 'cost_analysis': {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(artifact.items || []);
      XLSX.utils.book_append_sheet(wb, ws, 'Cost Analysis');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      downloadBlob(new Uint8Array(buf), `${base}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      break;
    }
    case 'pipeline':
    case 'lineage':
    case 'schema_explorer':
    case 'anomaly_report':
    case 'drift_report':
    case 'profile': {
      downloadBlob(JSON.stringify(artifact, null, 2), `${base}.json`, 'application/json');
      break;
    }
    default:
      downloadBlob(JSON.stringify(artifact, null, 2), `${base}.json`, 'application/json');
  }
}

function ArtifactBody({ artifact }: { artifact: Artifact }) {
  switch (artifact.type) {
    case 'chart': return <ChartArtifact artifact={artifact} />;
    case 'table': return <TableArtifact artifact={artifact} />;
    case 'insights': return <InsightsArtifact artifact={artifact} />;
    case 'code': return <CodeArtifact artifact={artifact} />;
    case 'profile': return <ProfileArtifact artifact={artifact} />;
    case 'stats': return <StatsArtifact artifact={artifact} />;
    case 'corr_matrix': return <CorrMatrixArtifact artifact={artifact} />;
    case 'anomaly_report': return <AnomalyReportArtifact artifact={artifact} />;
    case 'pivot': return <PivotArtifact artifact={artifact} />;
    case 'hypothesis': return <HypothesisArtifact artifact={artifact} />;
    case 'feature_importance': return <FeatureImportanceArtifact artifact={artifact} />;
    case 'confusion_matrix': return <ConfusionMatrixArtifact artifact={artifact} />;
    case 'experiment': return <ExperimentArtifact artifact={artifact} />;
    case 'pipeline': return <PipelineArtifact artifact={artifact} />;
    case 'model_card': return <ModelCardArtifact artifact={artifact} />;
    case 'drift_report': return <DriftReportArtifact artifact={artifact} />;
    case 'cost_analysis': return <CostAnalysisArtifact artifact={artifact} />;
    case 'schema_explorer': return <SchemaExplorerArtifact artifact={artifact} />;
    case 'lineage': return <LineageArtifact artifact={artifact} />;
    case 'suggestions': return <SuggestionsArtifact artifact={artifact} />;
    default: return <p className="text-xs text-muted-foreground p-3">Unknown artifact type: {artifact.type}</p>;
  }
}

export function ArtifactRenderer({ artifact }: { artifact: Artifact }) {
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(artifactToText(artifact));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="w-full rounded-2xl border border-border bg-card overflow-hidden animate-expand shadow-sm">
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border bg-muted/50">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {typeLabels[artifact.type] || artifact.type.toUpperCase()}
          </span>
          {artifact.title && (
            <span className="text-xs text-foreground font-medium truncate">{artifact.title}</span>
          )}
          <div className="ml-auto flex items-center gap-0.5">
            <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy">
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => downloadArtifact(artifact)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Download">
              <Download className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setFullscreen(true)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Expand">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <ArtifactBody artifact={artifact} />
      </div>
      {fullscreen && (
        <ArtifactFullscreen artifact={artifact} onClose={() => setFullscreen(false)}>
          <ArtifactBody artifact={artifact} />
        </ArtifactFullscreen>
      )}
    </>
  );
}
