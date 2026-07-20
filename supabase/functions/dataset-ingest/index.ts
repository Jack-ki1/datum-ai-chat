// Dataset ingest: hash → store → profile → cache
// Receives the parsed rows (client parses small files), hashes content,
// stores raw file in Storage, computes server-side profile, caches in DB.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface IngestPayload {
  file_name: string;
  file_ext: string;
  // Parsed rows, sent as JSON. (For huge files we'd switch to direct Storage upload.)
  rows: Record<string, any>[];
}

// Keep these in sync with src/lib/constants.ts on the client.
const MAX_PAYLOAD_BYTES = 25 * 1024 * 1024; // 25MB JSON body ceiling
const MAX_ROWS = 250_000;

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── pure-TS stats (mirrors src/lib/stats.ts) ───────────────────────
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/|www\.)/i;
const CURRENCY_RE = /^[\$€£¥₹]\s?-?\d/;
const BOOL_VALUES = new Set(["true","false","yes","no","y","n","0","1","t","f"]);

function looksNumeric(v: any) {
  if (v === "" || v === null || v === undefined || typeof v === "boolean") return false;
  const n = Number(v); return !isNaN(n) && isFinite(n);
}

function detectSemantic(col: string, values: any[]): string {
  const nn = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (!nn.length) return "empty";
  const total = nn.length;
  const strs = nn.map(String);
  const uniqueRatio = new Set(strs).size / total;
  const isIdName = /(^id$|_id$|^uuid$|guid|hash|key)/i.test(col);
  const isZipName = /(^zip$|zipcode|postal|^postcode$)/i.test(col);
  const isEmailName = /(email|e-mail)/i.test(col);
  const isUrlName = /(url|link|href|website|domain)/i.test(col);
  const isCurrencyName = /(price|cost|revenue|amount|salary|wage|fee|charge|usd|eur|gbp)/i.test(col);

  if (isIdName && uniqueRatio > 0.9) return "identifier";
  if (uniqueRatio > 0.95 && strs.every((s) => s.length >= 6 && s.length <= 64)) return "identifier";

  const ratio = (re: RegExp) => strs.filter((s) => re.test(s)).length / total;
  const boolRatio = strs.filter((s) => BOOL_VALUES.has(s.toLowerCase())).length / total;

  if (isZipName || ratio(ZIP_RE) > 0.8) return "zip";
  if (isEmailName || ratio(EMAIL_RE) > 0.8) return "email";
  if (isUrlName || ratio(URL_RE) > 0.8) return "url";
  if (ratio(CURRENCY_RE) > 0.8 || (isCurrencyName && nn.every(looksNumeric))) return "currency";
  if (boolRatio > 0.95) return "boolean";

  const numCount = nn.filter(looksNumeric).length;
  if (numCount / total > 0.9) {
    if (uniqueRatio > 0.95 && strs.every((s) => /^\d+$/.test(s))) return "identifier";
    return "numeric";
  }
  const dateCount = nn.filter((v) => !isNaN(Date.parse(String(v))) && String(v).length > 4).length;
  if (dateCount / total > 0.85) return "datetime";
  if (uniqueRatio < 0.25 && new Set(strs).size <= 50) return "categorical";
  return "text";
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  if (sorted.length === 1) return sorted[0];
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

function semanticToType(s: string): string {
  if (s === "numeric" || s === "currency") return "numeric";
  if (s === "datetime") return "datetime";
  if (s === "categorical" || s === "boolean") return "categorical";
  if (s === "empty") return "empty";
  return "text";
}

function buildProfile(data: Record<string, any>[]): any[] {
  if (!data.length) return [];
  const cols = Object.keys(data[0]);
  return cols.map((col) => {
    const values = data.map((r) => r[col]);
    const semantic = detectSemantic(col, values);
    const type = semanticToType(semantic);
    const total = values.length;
    const nullCount = values.filter(
      (v) => v === null || v === undefined || v === ""
    ).length;
    const nn = values.filter((v) => v !== null && v !== undefined && v !== "");
    const uniqueCount = new Set(nn.map(String)).size;
    const p: any = { col, type, semantic, nullCount, uniqueCount, total };
    if (type === "numeric") {
      const nums = nn.map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
      if (nums.length) {
        p.min = nums[0];
        p.max = nums[nums.length - 1];
        p.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        p.median = quantile(nums, 0.5);
        p.std = nums.length > 1
          ? Math.sqrt(nums.reduce((s, v) => s + (v - p.mean) ** 2, 0) / (nums.length - 1))
          : 0;
        p.q1 = quantile(nums, 0.25);
        p.q3 = quantile(nums, 0.75);
        const iqr = p.q3 - p.q1;
        p.outliers = nums.filter(
          (v) => v < p.q1 - 1.5 * iqr || v > p.q3 + 1.5 * iqr
        ).length;
      }
    } else if (type === "categorical") {
      const counts: Record<string, number> = {};
      nn.forEach((v) => {
        counts[String(v)] = (counts[String(v)] || 0) + 1;
      });
      p.top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([value, count]) => ({
          value,
          count,
          pct: Math.round((count / total) * 100),
        }));
    }
    return p;
  });
}

function pearson(data: any[], a: string, b: string): { r: number; n: number } {
  const pairs = data
    .map((r) => [Number(r[a]), Number(r[b])])
    .filter(([x, y]) => !isNaN(x) && !isNaN(y));
  const n = pairs.length;
  if (n < 3) return { r: NaN, n };
  const sa = pairs.reduce((s, [x]) => s + x, 0);
  const sb = pairs.reduce((s, [, y]) => s + y, 0);
  const sab = pairs.reduce((s, [x, y]) => s + x * y, 0);
  const sa2 = pairs.reduce((s, [x]) => s + x * x, 0);
  const sb2 = pairs.reduce((s, [, y]) => s + y * y, 0);
  const d = Math.sqrt((n * sa2 - sa ** 2) * (n * sb2 - sb ** 2));
  if (d === 0) return { r: 0, n };
  return { r: Math.round(((n * sab - sa * sb) / d) * 1000) / 1000, n };
}

function buildAdvanced(data: any[], profile: any[]) {
  // Only correlate truly numeric columns — never identifiers/zip/currency-as-text
  const numCols = profile
    .filter((p) => p.type === "numeric" && p.semantic !== "identifier")
    .map((p) => p.col);
  const correlations: any[] = [];
  for (let i = 0; i < numCols.length; i++) {
    for (let j = i + 1; j < numCols.length; j++) {
      const { r, n } = pearson(data, numCols[i], numCols[j]);
      if (!isNaN(r) && Math.abs(r) > 0.4) {
        const out: any = { colA: numCols[i], colB: numCols[j], r, n };
        if (n < 10) out.warning = `Small sample (n=${n})`;
        correlations.push(out);
      }
    }
  }
  correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  const dateCols = profile.filter((p) => p.type === "datetime");
  const temporalColumns = dateCols.map((p) => {
    const dates = data
      .map((r) => new Date(r[p.col]))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    if (dates.length < 2) return { col: p.col, min: "N/A", max: "N/A", granularity: "unknown" };
    return {
      col: p.col,
      min: dates[0].toISOString().split("T")[0],
      max: dates[dates.length - 1].toISOString().split("T")[0],
      granularity: "auto",
    };
  });

  const totalCells = profile.reduce((s, p) => s + p.total, 0);
  const nullCells = profile.reduce((s, p) => s + p.nullCount, 0);
  const sparsity = totalCells > 0 ? nullCells / totalCells : 0;

  const suggestedTargets = profile
    .filter((p) => (p.type === "categorical" && p.uniqueCount <= 10) || (p.type === "numeric" && p.uniqueCount === 2))
    .map((p) => p.col);

  return {
    correlations: correlations.slice(0, 20),
    advanced: { temporalColumns, sparsity, suggestedTargets },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: userData, error: userErr } = await anon.auth.getUser(authHeader.slice(7));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user_id = userData.user.id;

    const payload: IngestPayload = await req.json();
    if (!payload?.rows?.length) {
      return new Response(JSON.stringify({ error: "rows is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (payload.rows.length > MAX_ROWS) {
      return new Response(JSON.stringify({ error: `Too many rows (${payload.rows.length}). Max is ${MAX_ROWS}.` }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileName = payload.file_name || "dataset";
    const fileExt = (payload.file_ext || "csv").toLowerCase();
    const rowsJson = JSON.stringify(payload.rows);
    if (rowsJson.length > MAX_PAYLOAD_BYTES) {
      return new Response(JSON.stringify({ error: `Payload too large (${(rowsJson.length / 1024 / 1024).toFixed(1)}MB). Max is ${Math.round(MAX_PAYLOAD_BYTES / 1024 / 1024)}MB.` }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const file_hash = await sha256(rowsJson);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Cache hit? Scoped to this user (file_hash is unique per user).
    const { data: ownedDataset } = await supa
      .from("datasets")
      .select("*")
      .eq("file_hash", file_hash)
      .eq("user_id", user_id)
      .maybeSingle();
    const { data: existingProfile } = ownedDataset ? await supa
      .from("dataset_profiles")
      .select("*")
      .eq("file_hash", file_hash)
      .maybeSingle() : { data: null } as any;

    if (ownedDataset && existingProfile) {
      return new Response(
        JSON.stringify({
          file_hash,
          file_name: ownedDataset.file_name,
          row_count: ownedDataset.row_count,
          col_count: ownedDataset.col_count,
          profile: existingProfile.profile,
          correlations: existingProfile.correlations,
          advanced: existingProfile.advanced,
          health_score: existingProfile.health_score,
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute profile server-side
    const profile = buildProfile(payload.rows);
    const { correlations, advanced } = buildAdvanced(payload.rows, profile);
    const totalCells = profile.reduce((s: number, p: any) => s + p.total, 0);
    const nullCells = profile.reduce((s: number, p: any) => s + p.nullCount, 0);
    const health_score =
      totalCells > 0 ? Math.round((1 - nullCells / totalCells) * 100) : 100;

    // Store raw file in Storage — namespaced by user for privacy
    const storage_path = `${user_id}/${file_hash}.json`;
    const blob = new Blob([rowsJson], { type: "application/json" });
    await supa.storage.from("datasets").upload(storage_path, blob, { upsert: true });

    // Register
    await supa.from("datasets").upsert(
      {
        file_hash,
        user_id,
        file_name: fileName,
        storage_path,
        file_ext: fileExt,
        row_count: payload.rows.length,
        col_count: profile.length,
        size_bytes: rowsJson.length,
      },
      { onConflict: "file_hash,user_id" }
    );

    await supa.from("dataset_profiles").upsert(
      {
        file_hash,
        profile,
        correlations,
        advanced,
        health_score,
      },
      { onConflict: "file_hash" }
    );

    return new Response(
      JSON.stringify({
        file_hash,
        file_name: fileName,
        row_count: payload.rows.length,
        col_count: profile.length,
        profile,
        correlations,
        advanced,
        health_score,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("dataset-ingest error:", e);
    return new Response(
      JSON.stringify({ error: "Failed to ingest dataset. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});