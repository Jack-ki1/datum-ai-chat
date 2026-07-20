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

async function requireUser(req: Request): Promise<string> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Response("Unauthorized", { status: 401 });
  const token = auth.slice(7);
  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) throw new Response("Unauthorized", { status: 401 });
  return data.user.id;
}

async function loadDataset(file_hash: string, user_id: string): Promise<any[]> {
  const { data: meta } = await supa()
    .from("datasets")
    .select("storage_path, user_id")
    .eq("file_hash", file_hash)
    .eq("user_id", user_id)
    .maybeSingle();
  if (!meta) throw new Response(JSON.stringify({ error: "Dataset not found or access denied" }), { status: 403 });
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
// Regularized incomplete beta function I_x(a, b) via Lentz's continued fraction.
// Used for an accurate Student's t two-sided p-value at any df.
function logGamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
function betacf(x: number, a: number, b: number): number {
  const MAXIT = 200, EPS = 3e-7, FPMIN = 1e-30;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(x, a, b)) / a;
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}
// Two-sided Student's t p-value.
function tPValue(t: number, df: number): number {
  if (!isFinite(t) || !isFinite(df) || df <= 0) return NaN;
  const x = df / (df + t * t);
  return ibeta(x, df / 2, 0.5);
}
// Welch's t-test (returns t, df, two-sided p-value)
function welchT(a: number[], b: number[]) {
  const ma = mean(a), mb = mean(b);
  const va = variance(a), vb = variance(b);
  const na = a.length, nb = b.length;
  if (na < 2 || nb < 2) return null;
  const t = (ma - mb) / Math.sqrt(va / na + vb / nb);
  const df = (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
  const p = tPValue(t, df);
  return { t, df, p_value: p, mean_a: ma, mean_b: mb, n_a: na, n_b: nb };
}
// Uniform Fisher-Yates shuffle with an injected RNG.
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

  /**
   * Real classifier: trains a simple multinomial Naive Bayes model on a
   * 70/30 train/test split, returns actual confusion matrix + per-class
   * precision/recall/F1 + permutation feature importance.
   * No fabrication — every number is computed from real predictions.
   */
  train_classifier(args, data) {
    const { target, features } = args as { target: string; features?: string[] };
    if (!target) return { error: "target column required" };

    // Feature selection: use provided list, or auto-pick numeric/categorical cols
    const cols = Object.keys(data[0] || {});
    const featCols = (features && features.length ? features : cols.filter((c) => c !== target)).filter((c) => c !== target);
    if (!featCols.length) return { error: "no usable feature columns" };

    // Build labeled rows
    const rows = data
      .map((r) => ({ y: r[target], x: featCols.map((c) => r[c]) }))
      .filter((r) => r.y !== null && r.y !== undefined && r.y !== "");
    if (rows.length < 20) return { error: `not enough labeled rows (${rows.length}, need ≥20)` };

    const labels = Array.from(new Set(rows.map((r) => String(r.y)))).sort();
    if (labels.length < 2) return { error: "target has only one class" };
    if (labels.length > 20) return { error: `too many classes (${labels.length})` };

    // Encode features: numeric → bucket into 5 quantile bins; categorical → as-is string
    const featMeta = featCols.map((c) => {
      const numericVals = rows.map((r) => Number(r.x[featCols.indexOf(c)])).filter((n) => !isNaN(n));
      const isNumeric = numericVals.length / rows.length > 0.8;
      if (!isNumeric) return { col: c, kind: "cat" as const };
      const sorted = [...numericVals].sort((a, b) => a - b);
      const cuts = [0.2, 0.4, 0.6, 0.8].map((q) => quantile(sorted, q));
      return { col: c, kind: "num" as const, cuts };
    });

    const encode = (xs: any[]): string[] =>
      xs.map((v, i) => {
        const m = featMeta[i];
        if (m.kind === "cat") return String(v ?? "(null)");
        const n = Number(v);
        if (isNaN(n)) return "na";
        let b = 0;
        for (const c of m.cuts!) { if (n > c) b++; }
        return `b${b}`;
      });

    // Deterministic Fisher-Yates shuffle (seeded LCG)
    let seed = 42;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const shuffled = shuffle(rows, rand);
    const split = Math.floor(shuffled.length * 0.7);
    const train = shuffled.slice(0, split);
    const test = shuffled.slice(split);

    // Multinomial Naive Bayes with Laplace smoothing
    const classCounts: Record<string, number> = {};
    // featValueCounts[label][featIdx][token] = count
    const fvc: Record<string, Record<number, Record<string, number>>> = {};
    for (const lab of labels) {
      classCounts[lab] = 0;
      fvc[lab] = {};
      for (let i = 0; i < featCols.length; i++) fvc[lab][i] = {};
    }
    for (const r of train) {
      const lab = String(r.y);
      classCounts[lab]++;
      const enc = encode(r.x);
      enc.forEach((tok, i) => { fvc[lab][i][tok] = (fvc[lab][i][tok] || 0) + 1; });
    }
    const vocabSizes = featMeta.map((m, i) => {
      const s = new Set<string>();
      for (const lab of labels) Object.keys(fvc[lab][i]).forEach((k) => s.add(k));
      return Math.max(s.size, 2);
    });

    const predict = (xs: any[]): string => {
      const enc = encode(xs);
      let best = labels[0]; let bestLog = -Infinity;
      for (const lab of labels) {
        const prior = (classCounts[lab] + 1) / (train.length + labels.length);
        let logP = Math.log(prior);
        enc.forEach((tok, i) => {
          const c = fvc[lab][i][tok] || 0;
          const denom = classCounts[lab] + vocabSizes[i];
          logP += Math.log((c + 1) / denom);
        });
        if (logP > bestLog) { bestLog = logP; best = lab; }
      }
      return best;
    };

    // Real test-set predictions → real confusion matrix
    const idx: Record<string, number> = {}; labels.forEach((l, i) => idx[l] = i);
    const matrix: number[][] = labels.map(() => labels.map(() => 0));
    let correct = 0;
    for (const r of test) {
      const pred = predict(r.x);
      const truth = String(r.y);
      matrix[idx[truth]][idx[pred]]++;
      if (pred === truth) correct++;
    }
    const accuracy = test.length ? correct / test.length : 0;

    // Per-class precision / recall / F1
    const precision: Record<string, number> = {};
    const recall: Record<string, number> = {};
    const f1: Record<string, number> = {};
    labels.forEach((lab, i) => {
      const tp = matrix[i][i];
      const fp = matrix.reduce((s, row, r) => s + (r === i ? 0 : row[i]), 0);
      const fn = matrix[i].reduce((s, v, c) => s + (c === i ? 0 : v), 0);
      precision[lab] = tp + fp > 0 ? tp / (tp + fp) : 0;
      recall[lab] = tp + fn > 0 ? tp / (tp + fn) : 0;
      f1[lab] = precision[lab] + recall[lab] > 0
        ? 2 * precision[lab] * recall[lab] / (precision[lab] + recall[lab]) : 0;
    });

    // Permutation feature importance: shuffle one feature column, measure accuracy drop
    const baseAcc = accuracy;
    const importance: { name: string; importance: number }[] = [];
    for (let f = 0; f < featCols.length; f++) {
      const perm = test;
      const colVals = test.map((r) => r.x[f]);
      let s2 = 7 + f;
      const rng = () => { s2 = (s2 * 9301 + 49297) % 233280; return s2 / 233280; };
      const shuffledCol = shuffle(colVals, rng);
      let permCorrect = 0;
      perm.forEach((r, k) => {
        const xs = [...r.x]; xs[f] = shuffled[k];
        if (predict(xs) === String(r.y)) permCorrect++;
      });
      const permAcc = perm.length ? permCorrect / perm.length : 0;
      importance.push({ name: featCols[f], importance: Math.max(0, baseAcc - permAcc) });
    }
    const totalImp = importance.reduce((s, x) => s + x.importance, 0) || 1;
    importance.forEach((x) => x.importance = Math.round((x.importance / totalImp) * 10000) / 10000);
    importance.sort((a, b) => b.importance - a.importance);

    return {
      verified: true,            // <-- consumed by UI to show a "real" badge
      model: "MultinomialNB (Laplace)",
      target,
      features: featCols,
      labels,
      n_train: train.length,
      n_test: test.length,
      accuracy: Math.round(accuracy * 10000) / 10000,
      precision, recall, f1,
      matrix,
      feature_importance: importance,
    };
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const user_id = await requireUser(req);
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
    const data = await loadDataset(file_hash, user_id);
    const result = TOOLS[tool](args || {}, data);
    return new Response(JSON.stringify({ tool, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Response) {
      const body = await e.text().catch(() => "");
      return new Response(body || JSON.stringify({ error: "Unauthorized" }), {
        status: e.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("compute-tools error:", e);
    return new Response(JSON.stringify({ error: "Compute tool failed. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});