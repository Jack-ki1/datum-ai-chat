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
import { Copy, Download, Maximize2 } from 'lucide-react';

const typeLabels: Record<string, string> = {
  chart: 'CHART', table: 'TABLE', insights: 'INSIGHTS', code: 'CODE',
  profile: 'PROFILE', stats: 'STATS', corr_matrix: 'CORRELATION',
  anomaly_report: 'ANOMALIES', pivot: 'PIVOT', hypothesis: 'HYPOTHESIS',
  feature_importance: 'FEATURES', confusion_matrix: 'CONFUSION MATRIX',
  experiment: 'EXPERIMENT', pipeline: 'PIPELINE', model_card: 'MODEL',
  drift_report: 'DRIFT', cost_analysis: 'COST', schema_explorer: 'SCHEMA',
  lineage: 'LINEAGE',
};

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
    default: return <p className="text-xs text-muted-foreground p-3">Unknown artifact type: {artifact.type}</p>;
  }
}

export function ArtifactRenderer({ artifact }: { artifact: Artifact }) {
  return (
    <div className="w-full rounded-2xl border border-border bg-card overflow-hidden animate-expand shadow-sm">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border bg-muted/50">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          {typeLabels[artifact.type] || artifact.type.toUpperCase()}
        </span>
        {artifact.title && (
          <span className="text-xs text-foreground font-medium truncate">{artifact.title}</span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Download">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Expand">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <ArtifactBody artifact={artifact} />
    </div>
  );
}
