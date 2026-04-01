import type { ColumnProfile } from '@/types';
import { pearsonCorr, healthScore, entropy, classBalance, temporalRange } from '@/lib/stats';

interface TemporalInfo {
  col: string;
  min: string;
  max: string;
  granularity: string;
}

interface ClassBalanceInfo {
  column: string;
  distribution: Record<string, number>;
  isImbalanced: boolean;
}

interface AdvancedContext {
  temporalColumns: TemporalInfo[];
  suggestedTargets: string[];
  classBalance: ClassBalanceInfo | null;
  entropy: { col: string; entropy: number }[];
  sparsity: number;
}

interface DatasetContext {
  fileName: string;
  rowCount: number;
  colCount: number;
  healthScore: number;
  profile: ColumnProfile[];
  correlations: { colA: string; colB: string; r: number }[];
  sampleData: Record<string, any>[];
  advancedContext: AdvancedContext;
}

export function buildDatasetContext(
  data: Record<string, any>[],
  profile: ColumnProfile[],
  fileName: string
): DatasetContext {
  const numCols = profile.filter(p => p.type === 'numeric').map(p => p.col);
  
  // Build correlation pairs where |r| > 0.4
  const correlations: { colA: string; colB: string; r: number }[] = [];
  for (let i = 0; i < numCols.length; i++) {
    for (let j = i + 1; j < numCols.length; j++) {
      const r = pearsonCorr(data, numCols[i], numCols[j]);
      if (Math.abs(r) > 0.4) {
        correlations.push({ colA: numCols[i], colB: numCols[j], r });
      }
    }
  }
  correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  // Advanced: temporal detection
  const dateCols = profile.filter(p => p.type === 'datetime');
  const temporalColumns: TemporalInfo[] = dateCols.map(p => {
    const tr = temporalRange(data, p.col);
    return { col: p.col, min: tr.min, max: tr.max, granularity: tr.granularity };
  });

  // Advanced: suggested targets (binary/low-cardinality categoricals near end of schema)
  const suggestedTargets: string[] = [];
  const cols = profile;
  for (let i = cols.length - 1; i >= Math.max(0, cols.length - 5); i--) {
    const p = cols[i];
    if (p.type === 'categorical' && p.uniqueCount <= 10) {
      suggestedTargets.push(p.col);
    }
    if (p.type === 'numeric' && p.uniqueCount === 2) {
      suggestedTargets.push(p.col);
    }
  }

  // Advanced: class balance for first suggested target
  let classBalanceInfo: ClassBalanceInfo | null = null;
  if (suggestedTargets.length > 0) {
    const targetCol = suggestedTargets[0];
    const cb = classBalance(data, targetCol);
    classBalanceInfo = cb;
  }

  // Advanced: entropy for categorical columns
  const entropyInfo = profile
    .filter(p => p.type === 'categorical')
    .map(p => ({ col: p.col, entropy: entropy(data, p.col) }))
    .sort((a, b) => b.entropy - a.entropy)
    .slice(0, 10);

  // Advanced: sparsity
  const totalCells = profile.reduce((s, p) => s + p.total, 0);
  const nullCells = profile.reduce((s, p) => s + p.nullCount, 0);
  const sparsity = totalCells > 0 ? nullCells / totalCells : 0;

  return {
    fileName,
    rowCount: data.length,
    colCount: profile.length,
    healthScore: healthScore(profile),
    profile,
    correlations: correlations.slice(0, 20),
    sampleData: data.slice(0, 50),
    advancedContext: {
      temporalColumns,
      suggestedTargets,
      classBalance: classBalanceInfo,
      entropy: entropyInfo,
      sparsity,
    },
  };
}
