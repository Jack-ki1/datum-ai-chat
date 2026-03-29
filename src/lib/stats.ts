import type { ColumnProfile } from '@/types';

export function detectType(values: any[]): ColumnProfile['type'] {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'empty';
  const numCount = nonNull.filter(v => !isNaN(Number(v)) && v !== '' && v !== true && v !== false).length;
  if (numCount / nonNull.length > 0.8) return 'numeric';
  const unique = new Set(nonNull.map(String));
  if (unique.size / nonNull.length < 0.25 && unique.size <= 40) return 'categorical';
  const dateCount = nonNull.filter(v => !isNaN(Date.parse(String(v))) && String(v).length > 4).length;
  if (dateCount / nonNull.length > 0.8) return 'datetime';
  return 'text';
}

export function buildProfile(data: Record<string, any>[]): ColumnProfile[] {
  if (!data.length) return [];
  const cols = Object.keys(data[0]);
  return cols.map(col => {
    const values = data.map(r => r[col]);
    const type = detectType(values);
    const total = values.length;
    const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueCount = new Set(nonNull.map(String)).size;
    const p: ColumnProfile = { col, type, nullCount, uniqueCount, total };

    if (type === 'numeric') {
      const nums = nonNull.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
      if (nums.length) {
        p.min = nums[0];
        p.max = nums[nums.length - 1];
        p.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        p.median = nums[Math.floor(nums.length / 2)];
        p.std = Math.sqrt(nums.reduce((s, v) => s + (v - p.mean!) ** 2, 0) / nums.length);
        p.q1 = nums[Math.floor(nums.length * 0.25)];
        p.q3 = nums[Math.floor(nums.length * 0.75)];
        const iqr = (p.q3 || 0) - (p.q1 || 0);
        const lo = (p.q1 || 0) - 1.5 * iqr;
        const hi = (p.q3 || 0) + 1.5 * iqr;
        p.outliers = nums.filter(v => v < lo || v > hi).length;
      }
    } else if (type === 'categorical') {
      const counts: Record<string, number> = {};
      nonNull.forEach(v => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
      p.top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([value, count]) => ({ value, count, pct: Math.round(count / total * 100) }));
    }
    return p;
  });
}

export function aggregateData(
  data: Record<string, any>[], xCol: string, yCol: string,
  aggFn: 'sum' | 'mean' | 'count' | 'max' | 'min'
): { x: string; y: number }[] {
  const groups: Record<string, number[]> = {};
  data.forEach(r => {
    const key = String(r[xCol] ?? 'null');
    if (!groups[key]) groups[key] = [];
    const v = Number(r[yCol]);
    if (!isNaN(v)) groups[key].push(v);
  });
  return Object.entries(groups).map(([x, vals]) => {
    let y = 0;
    if (aggFn === 'sum') y = vals.reduce((a, b) => a + b, 0);
    else if (aggFn === 'mean') y = vals.reduce((a, b) => a + b, 0) / vals.length;
    else if (aggFn === 'count') y = vals.length;
    else if (aggFn === 'max') y = Math.max(...vals);
    else if (aggFn === 'min') y = Math.min(...vals);
    return { x, y: Math.round(y * 100) / 100 };
  });
}

export function formatNumber(n: number): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toFixed(2);
}

export function healthScore(profile: ColumnProfile[]): number {
  if (!profile.length) return 100;
  const totalCells = profile.reduce((s, p) => s + p.total, 0);
  const nullCells = profile.reduce((s, p) => s + p.nullCount, 0);
  return Math.round((1 - nullCells / totalCells) * 100);
}

export function pearsonCorr(data: Record<string, any>[], colA: string, colB: string): number {
  const pairs = data
    .map(r => [Number(r[colA]), Number(r[colB])])
    .filter(([a, b]) => !isNaN(a) && !isNaN(b));
  if (pairs.length < 3) return 0;
  const n = pairs.length;
  const sumA = pairs.reduce((s, [a]) => s + a, 0);
  const sumB = pairs.reduce((s, [, b]) => s + b, 0);
  const sumAB = pairs.reduce((s, [a, b]) => s + a * b, 0);
  const sumA2 = pairs.reduce((s, [a]) => s + a * a, 0);
  const sumB2 = pairs.reduce((s, [, b]) => s + b * b, 0);
  const denom = Math.sqrt((n * sumA2 - sumA ** 2) * (n * sumB2 - sumB ** 2));
  return denom === 0 ? 0 : Math.round(((n * sumAB - sumA * sumB) / denom) * 1000) / 1000;
}
