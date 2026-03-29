import type { ColumnProfile } from '@/types';
import { pearsonCorr, healthScore } from '@/lib/stats';

interface DatasetContext {
  fileName: string;
  rowCount: number;
  colCount: number;
  healthScore: number;
  profile: ColumnProfile[];
  correlations: { colA: string; colB: string; r: number }[];
  sampleData: Record<string, any>[];
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

  return {
    fileName,
    rowCount: data.length,
    colCount: profile.length,
    healthScore: healthScore(profile),
    profile,
    correlations: correlations.slice(0, 20),
    sampleData: data.slice(0, 25),
  };
}
