import type { Artifact } from '@/types';

export function FeatureImportanceArtifact({ artifact }: { artifact: Artifact }) {
  const features: any[] = (artifact.features || []).sort((a: any, b: any) => b.importance - a.importance);
  if (!features.length) return <p className="text-xs text-muted-foreground p-4">No feature data</p>;

  const max = features[0]?.importance || 1;

  return (
    <div className="p-3 space-y-1.5 max-h-[320px] overflow-auto">
      {artifact.model && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-mono text-muted-foreground">Model:</span>
          <span className="text-[10px] font-mono text-datum-cyan">{artifact.model}</span>
          {artifact.target && <>
            <span className="text-[9px] font-mono text-muted-foreground">Target:</span>
            <span className="text-[10px] font-mono text-datum-amber">{artifact.target}</span>
          </>}
        </div>
      )}
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground w-[100px] truncate shrink-0" title={f.name}>{f.name}</span>
          <div className="flex-1 h-4 bg-accent rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${f.direction === 'negative' ? 'bg-datum-red/70' : 'bg-datum-cyan/70'}`}
              style={{ width: `${(f.importance / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-datum-cyan w-[45px] text-right">{(f.importance * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
