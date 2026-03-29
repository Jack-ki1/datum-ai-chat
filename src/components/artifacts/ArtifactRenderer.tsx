import type { Artifact } from '@/types';
import { ChartArtifact } from './ChartArtifact';
import { TableArtifact } from './TableArtifact';
import { InsightsArtifact } from './InsightsArtifact';
import { CodeArtifact } from './CodeArtifact';
import { ProfileArtifact } from './ProfileArtifact';
import { StatsArtifact } from './StatsArtifact';
import { Copy, Download, Maximize2 } from 'lucide-react';

const typeLabels: Record<string, string> = {
  chart: 'CHART', table: 'TABLE', insights: 'INSIGHTS', code: 'CODE', profile: 'PROFILE', stats: 'STATS',
};

function ArtifactBody({ artifact }: { artifact: Artifact }) {
  switch (artifact.type) {
    case 'chart': return <ChartArtifact artifact={artifact} />;
    case 'table': return <TableArtifact artifact={artifact} />;
    case 'insights': return <InsightsArtifact artifact={artifact} />;
    case 'code': return <CodeArtifact artifact={artifact} />;
    case 'profile': return <ProfileArtifact artifact={artifact} />;
    case 'stats': return <StatsArtifact artifact={artifact} />;
    default: return <p className="text-xs text-muted-foreground p-3">Unknown artifact type: {artifact.type}</p>;
  }
}

export function ArtifactRenderer({ artifact }: { artifact: Artifact }) {
  return (
    <div className="w-full rounded-lg border border-border bg-card overflow-hidden animate-expand">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/50">
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
          {typeLabels[artifact.type] || artifact.type.toUpperCase()}
        </span>
        {artifact.title && (
          <span className="text-xs text-foreground font-medium truncate">{artifact.title}</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy">
            <Copy className="w-3 h-3" />
          </button>
          <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Download">
            <Download className="w-3 h-3" />
          </button>
          <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Expand">
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {/* Body */}
      <ArtifactBody artifact={artifact} />
    </div>
  );
}
