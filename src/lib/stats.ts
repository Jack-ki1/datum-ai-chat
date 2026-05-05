import type { ColumnProfile } from '@/types';

/**
 * Semantic-aware type detection. Distinguishes storage type (numeric/string)
 * from semantic role (identifier, ZIP, phone, email, URL, currency, boolean,
 * categorical, continuous).
 */
export type SemanticType =
  | 'identifier' | 'zip' | 'phone' | 'email' | 'url' | 'currency'
  | 'boolean' | 'categorical' | 'numeric' | 'datetime' | 'text' | 'empty';

const ZIP_RE = /^\d{5}(-\d{4})?$/;
const PHONE_RE = /^[\+\(\)\-\.\s\d]{7,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/|www\.)/i;
const CURRENCY_RE = /^[\$€£¥₹]\s?-?\d/;
const BOOL_VALUES = new Set(['true', 'false', 'yes', 'no', 'y', 'n', '0', '1', 't', 'f']);

function looksNumeric(v: any): boolean {
  if (v === '' || v === null || v === undefined || typeof v === 'boolean') return false;
  const n = Number(v);
  return !isNaN(n) && isFinite(n);
}

/** Infer the semantic role of a column. Stops mean/std being computed on ZIP codes. */
export function detectSemanticType(col: string, values: any[]): SemanticType {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'empty';
  const total = nonNull.length;
  const colLower = col.toLowerCase();

  // Header heuristics first — strong signals
  const isIdName = /(^id$|_id$|^uuid$|guid|hash|key)/i.test(col);
  const isZipName = /(^zip$|zipcode|postal|^postcode$)/i.test(col);
  const isPhoneName = /(phone|mobile|fax|tel)/i.test(col);
  const isEmailName = /(email|e-mail)/i.test(col);
  const isUrlName = /(url|link|href|website|domain)/i.test(col);
  const isCurrencyName = /(price|cost|revenue|amount|salary|wage|fee|charge|usd|eur|gbp)/i.test(col);

  const strs = nonNull.map(String);
  const uniqueRatio = new Set(strs).size / total;

  // Identifier: high uniqueness + (id-like name OR mostly unique strings)
  if (isIdName && uniqueRatio > 0.9) return 'identifier';
  if (uniqueRatio > 0.95 && strs.every(s => s.length >= 6 && s.length <= 64)) return 'identifier';

  // Pattern-based detection on non-null values
  const matchRatio = (re: RegExp) => strs.filter(s => re.test(s)).length / total;
  const boolRatio = strs.filter(s => BOOL_VALUES.has(s.toLowerCase())).length / total;

  if (isZipName || matchRatio(ZIP_RE) > 0.8) return 'zip';
  if (isEmailName || matchRatio(EMAIL_RE) > 0.8) return 'email';
  if (isUrlName || matchRatio(URL_RE) > 0.8) return 'url';
  if (matchRatio(CURRENCY_RE) > 0.8 || (isCurrencyName && nonNull.every(looksNumeric))) return 'currency';
  if (isPhoneName && matchRatio(PHONE_RE) > 0.6) return 'phone';
  if (boolRatio > 0.95) return 'boolean';

  // Numeric / datetime / categorical / text fallback
  const numCount = nonNull.filter(looksNumeric).length;
  if (numCount / total > 0.9) {
    // Could be a numeric ID column even without an "id" header
    if (uniqueRatio > 0.95 && strs.every(s => /^\d+$/.test(s))) return 'identifier';
    return 'numeric';
  }
  const dateCount = nonNull.filter(v => !isNaN(Date.parse(String(v))) && String(v).length > 4).length;
  if (dateCount / total > 0.85) return 'datetime';

  if (uniqueRatio < 0.25 && new Set(strs).size <= 50) return 'categorical';
  return 'text';
}

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

/**
 * Linear-interpolation quantile (R's type-7 / numpy default). Replaces the
 * old `nums[Math.floor(nums.length * 0.25)]` index hack which was not Q1.
 */
export function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  if (sorted.length === 1) return sorted[0];
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function buildProfile(data: Record<string, any>[]): ColumnProfile[] {
  if (!data.length) return [];
  const cols = Object.keys(data[0]);
  return cols.map(col => {
    const values = data.map(r => r[col]);
    const semantic = detectSemanticType(col, values);
    // Map semantic → ColumnProfile['type'] (legacy bucket)
    const type: ColumnProfile['type'] =
      semantic === 'numeric' || semantic === 'currency' ? 'numeric'
      : semantic === 'datetime' ? 'datetime'
      : semantic === 'categorical' || semantic === 'boolean' ? 'categorical'
      : semantic === 'empty' ? 'empty'
      : 'text'; // identifier/zip/phone/email/url/text → text (no numeric stats)
    const total = values.length;
    const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueCount = new Set(nonNull.map(String)).size;
    const p: ColumnProfile = { col, type, nullCount, uniqueCount, total, semantic } as ColumnProfile;

    if (type === 'numeric') {
      const nums = nonNull.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
      if (nums.length) {
        p.min = nums[0];
        p.max = nums[nums.length - 1];
        p.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        p.median = quantile(nums, 0.5);
        // sample std (n-1) — matches scipy/pandas default
        p.std = nums.length > 1
          ? Math.sqrt(nums.reduce((s, v) => s + (v - p.mean!) ** 2, 0) / (nums.length - 1))
          : 0;
        p.q1 = quantile(nums, 0.25);
        p.q3 = quantile(nums, 0.75);
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

export function entropy(data: Record<string, any>[], col: string): number {
  const values = data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
  if (!values.length) return 0;
  const counts: Record<string, number> = {};
  values.forEach(v => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
  const n = values.length;
  return -Object.values(counts).reduce((s, c) => {
    const p = c / n;
    return s + (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
}

export function classBalance(data: Record<string, any>[], col: string): { column: string; distribution: Record<string, number>; isImbalanced: boolean } {
  const values = data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
  const counts: Record<string, number> = {};
  values.forEach(v => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
  const n = values.length;
  const distribution: Record<string, number> = {};
  Object.entries(counts).forEach(([k, c]) => { distribution[k] = Math.round((c / n) * 100); });
  const pcts = Object.values(distribution);
  const maxPct = Math.max(...pcts);
  const minPct = Math.min(...pcts);
  return { column: col, distribution, isImbalanced: maxPct / Math.max(minPct, 1) > 3 };
}

export function temporalRange(data: Record<string, any>[], col: string): { min: string; max: string; granularity: string } {
  const dates = data.map(r => new Date(r[col])).filter(d => !isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
  if (dates.length < 2) return { min: 'N/A', max: 'N/A', granularity: 'unknown' };
  const min = dates[0].toISOString().split('T')[0];
  const max = dates[dates.length - 1].toISOString().split('T')[0];
  const diffs = [];
  for (let i = 1; i < Math.min(dates.length, 20); i++) {
    diffs.push(dates[i].getTime() - dates[i - 1].getTime());
  }
  const medianDiff = diffs.sort((a, b) => a - b)[Math.floor(diffs.length / 2)] / 1000;
  let granularity = 'unknown';
  if (medianDiff < 120) granularity = 'seconds';
  else if (medianDiff < 7200) granularity = 'minutes';
  else if (medianDiff < 172800) granularity = 'hourly';
  else if (medianDiff < 864000) granularity = 'daily';
  else if (medianDiff < 3456000) granularity = 'weekly';
  else if (medianDiff < 35000000) granularity = 'monthly';
  else granularity = 'yearly';
  return { min, max, granularity };
}

/**
 * Returns {r, n, warning?}. Previously this returned 0 silently for n<3,
 * hiding genuine correlations. Now it returns the value and a warning string.
 */
export function pearsonCorrDetailed(
  data: Record<string, any>[], colA: string, colB: string
): { r: number; n: number; warning?: string } {
  const pairs = data
    .map(r => [Number(r[colA]), Number(r[colB])])
    .filter(([a, b]) => !isNaN(a) && !isNaN(b));
  const n = pairs.length;
  if (n < 3) {
    return { r: NaN, n, warning: `Insufficient pairs (n=${n}, need ≥3) — correlation undefined` };
  }
  const sumA = pairs.reduce((s, [a]) => s + a, 0);
  const sumB = pairs.reduce((s, [, b]) => s + b, 0);
  const sumAB = pairs.reduce((s, [a, b]) => s + a * b, 0);
  const sumA2 = pairs.reduce((s, [a]) => s + a * a, 0);
  const sumB2 = pairs.reduce((s, [, b]) => s + b * b, 0);
  const denom = Math.sqrt((n * sumA2 - sumA ** 2) * (n * sumB2 - sumB ** 2));
  if (denom === 0) {
    return { r: 0, n, warning: 'Zero variance in one column — correlation undefined' };
  }
  const r = Math.round(((n * sumAB - sumA * sumB) / denom) * 1000) / 1000;
  const warning = n < 10 ? `Small sample (n=${n}) — interpret with caution` : undefined;
  return { r, n, warning };
}

/** Backward-compat wrapper. Returns r, or 0 only as a last resort. */
export function pearsonCorr(data: Record<string, any>[], colA: string, colB: string): number {
  const { r } = pearsonCorrDetailed(data, colA, colB);
  return isNaN(r) ? 0 : r;
}
