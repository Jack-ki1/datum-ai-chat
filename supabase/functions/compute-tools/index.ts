// Real compute tools that the LLM calls — never hallucinated.
// Each tool loads the dataset from Storage by file_hash, runs a real
// computation in pure TS, returns the structured result.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function supa() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

async function loadDataset(file_hash: string): Promise<any[]> {
  const { data: meta } = await supa()
    .from("datasets")
    .select("storage_path")
    .eq("file_hash", file_hash)
    .maybeSingle();
  if (!meta) throw new Error("Dataset not found: " + file_hash);
  const { data: blob, error } = await supa().storage
    .from("datasets")
    .download(meta.storage_path);
  if (error || !blob) throw new Error("Failed to load dataset: " + (error?.message || ""));
  const text = await blob.text();
  return JSON.parse(text);
}

// ── pure-TS stat helpers ───────────────────────────────────────────
function num(v: any): number {
  const n = Number(v);
  return isNaN(n) ? NaN : n;
}
function nums(data: any[], col: string): number[] {
  return data.map((r) => num(r[col])).filter((n) => !isNaN(n));
}
function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function variance(arr: number[]): number {
  const m = mean(arr);
  return arr.length > 1 ? arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1) : 0;
}
function std(arr: number[]): number {
  return Math.sqrt(variance(arr));
}
function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
function pearsonR(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const mx = mean(xs.slice(0, n)), my = mean(ys.slice(0, n));
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const d = Math.sqrt(dx * dy);
  return d === 0 ? 0 : num / d;
}
// Welch's t-test (returns t, df, two-sided p-value approx)
function welchT(a: number[], b: number[]) {
  const ma = mean(a), mb = mean(b);
  const va = variance(a), vb = variance(b);
  const na = a.length, nb = b.length;
  if (na < 2 || nb < 2) return null;
  const t = (ma - mb) / Math.sqrt(va / na + vb / nb);
  const df = (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
  // Approx p-value via normal approximation for large df, else rough
  const z = Math.abs(t);
  const p = 2 * (1 - 0.5 * (1 + erf(z / Math.SQRT2)));
  return { t, df, p_value: p, mean_a: ma, mean_b: mb, n_a: na, n_b: nb };
}
function erf(x: number): number {
  // Abramowitz & Stegun approximation
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// ── tool implementations ───────────────────────────────────────────
const TOOLS: Record<string, (args: any, data: any[]) => any> = {
  describe_column(args, data) {
    const { column } = args;
    const vals = nums(data, column);
    if (!vals.length) {
      const counts: Record<string, number> = {};
      data.forEach((r) => {
        const k = String(r[column] ?? "(null)");
        counts[k] = (counts[k] || 0) + 1;
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      return { column, type: "categorical", n: data.length, top };
    }
    const sorted = [...vals].sort((a, b) => a - b);
    return {
      column,
      type: "numeric",
      n: vals.length,
      mean: mean(vals),
      std: std(vals),
      min: sorted[0],
      q1: quantile(sorted, 0.25),
      median: quantile(sorted, 0.5),
      q3: quantile(sorted, 0.75),
      max: sorted[sorted.length - 1],
    };
  },

  group_by_aggregate(args, data) {
    const { group_col, value_col, agg } = args;
    const groups: Record<string, number[]> = {};
    data.forEach((r) => {
      const k = String(r[group_col] ?? "(null)");
      const v = Number(r[value_col]);
      if (!groups[k]) groups[k] = [];
      if (!isNaN(v)) groups[k].push(v);
    });
    const result = Object.entries(groups).map(([k, vs]) => {
      let y = 0;
      switch (agg) {
        case "sum": y = vs.reduce((a, b) => a + b, 0); break;
        case "mean": y = mean(vs); break;
        case "median": y = quantile([...vs].sort((a, b) => a - b), 0.5); break;
        case "min": y = Math.min(...vs); break;
        case "max": y = Math.max(...vs); break;
        case "count":
        default: y = vs.length;
      }
      return { group: k, value: Math.round(y * 1000) / 1000, n: vs.length };
    }).sort((a, b) => b.value - a.value);
    return { group_col, value_col, agg, rows: result };
  },

  correlation(args, data) {
    const { col_a, col_b } = args;
    const pairs = data
      .map((r) => [Number(r[col_a]), Number(r[col_b])])
      .filter(([a, b]) => !isNaN(a) && !isNaN(b));
    const xs = pairs.map((p) => p[0]);
    const ys = pairs.map((p) => p[1]);
    const r = pearsonR(xs, ys);
    return { col_a, col_b, n: pairs.length, pearson_r: Math.round(r * 10000) / 10000 };
  },

  ttest(args, data) {
    const { value_col, group_col, group_a, group_b } = args;
    const a = data.filter((r) => String(r[group_col]) === String(group_a)).map((r) => num(r[value_col])).filter((n) => !isNaN(n));
    const b = data.filter((r) => String(r[group_col]) === String(group_b)).map((r) => num(r[value_col])).filter((n) => !isNaN(n));
    return welchT(a, b);
  },

  outliers(args, data) {
    const { column, method = "iqr" } = args;
    const vals = nums(data, column);
    const sorted = [...vals].sort((a, b) => a - b);
    if (method === "iqr") {
      const q1 = quantile(sorted, 0.25);
      const q3 = quantile(sorted, 0.75);
      const iqr = q3 - q1;
      const lo = q1 - 1.5 * iqr;
      const hi = q3 + 1.5 * iqr;
      const outliers = vals.filter((v) => v < lo || v > hi);
      return { column, method, n: vals.length, n_outliers: outliers.length, lower: lo, upper: hi, sample_outliers: outliers.slice(0, 20) };
    }
    const m = mean(vals), s = std(vals);
    const outliers = vals.filter((v) => Math.abs((v - m) / s) > 3);
    return { column, method: "zscore", n: vals.length, n_outliers: outliers.length, sample_outliers: outliers.slice(0, 20) };
  },

  filter_count(args, data) {
    const { column, op, value } = args;
    const v = isNaN(Number(value)) ? value : Number(value);
    const matched = data.filter((r) => {
      const x = isNaN(Number(r[column])) ? r[column] : Number(r[column]);
      switch (op) {
        case "eq": return x === v;
        case "neq": return x !== v;
        case "gt": return x > v;
        case "gte": return x >= v;
        case "lt": return x < v;
        case "lte": return x <= v;
        case "contains": return String(x).includes(String(v));
        default: return false;
      }
    });
    return { n_matched: matched.length, total: data.length, sample: matched.slice(0, 10) };
  },

  histogram(args, data) {
    const { column, bins = 10 } = args;
    const vals = nums(data, column);
    if (!vals.length) return { column, bins: [] };
    const min = Math.min(...vals), max = Math.max(...vals);
    const w = (max - min) / bins || 1;
    const counts = Array(bins).fill(0);
    vals.forEach((v) => {
      const idx = Math.min(Math.floor((v - min) / w), bins - 1);
      counts[idx]++;
    });
    return {
      column,
      bins: counts.map((c, i) => ({
        range: [Math.round((min + i * w) * 100) / 100, Math.round((min + (i + 1) * w) * 100) / 100],
        count: c,
      })),
    };
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { tool, args, file_hash } = await req.json();
    if (!tool || !TOOLS[tool]) {
      return new Response(JSON.stringify({ error: "Unknown tool: " + tool }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!file_hash) {
      return new Response(JSON.stringify({ error: "file_hash required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await loadDataset(file_hash);
    const result = TOOLS[tool](args || {}, data);
    return new Response(JSON.stringify({ tool, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compute-tools error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});