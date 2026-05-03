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

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── pure-TS stats (mirrors src/lib/stats.ts) ───────────────────────
function detectType(values: any[]): string {
  const nn = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (!nn.length) return "empty";
  const numCount = nn.filter(
    (v) => !isNaN(Number(v)) && v !== "" && v !== true && v !== false
  ).length;
  if (numCount / nn.length > 0.8) return "numeric";
  const uniq = new Set(nn.map(String));
  if (uniq.size / nn.length < 0.25 && uniq.size <= 40) return "categorical";
  const dateCount = nn.filter(
    (v) => !isNaN(Date.parse(String(v))) && String(v).length > 4
  ).length;
  if (dateCount / nn.length > 0.8) return "datetime";
  return "text";
}

function buildProfile(data: Record<string, any>[]): any[] {
  if (!data.length) return [];
  const cols = Object.keys(data[0]);
  return cols.map((col) => {
    const values = data.map((r) => r[col]);
    const type = detectType(values);
    const total = values.length;
    const nullCount = values.filter(
      (v) => v === null || v === undefined || v === ""
    ).length;
    const nn = values.filter((v) => v !== null && v !== undefined && v !== "");
    const uniqueCount = new Set(nn.map(String)).size;
    const p: any = { col, type, nullCount, uniqueCount, total };
    if (type === "numeric") {
      const nums = nn.map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
      if (nums.length) {
        p.min = nums[0];
        p.max = nums[nums.length - 1];
        p.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        p.median = nums[Math.floor(nums.length / 2)];
        p.std = Math.sqrt(
          nums.reduce((s, v) => s + (v - p.mean) ** 2, 0) / nums.length
        );
        p.q1 = nums[Math.floor(nums.length * 0.25)];
        p.q3 = nums[Math.floor(nums.length * 0.75)];
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

function pearson(data: any[], a: string, b: string): number {
  const pairs = data
    .map((r) => [Number(r[a]), Number(r[b])])
    .filter(([x, y]) => !isNaN(x) && !isNaN(y));
  if (pairs.length < 3) return 0;
  const n = pairs.length;
  const sa = pairs.reduce((s, [x]) => s + x, 0);
  const sb = pairs.reduce((s, [, y]) => s + y, 0);
  const sab = pairs.reduce((s, [x, y]) => s + x * y, 0);
  const sa2 = pairs.reduce((s, [x]) => s + x * x, 0);
  const sb2 = pairs.reduce((s, [, y]) => s + y * y, 0);
  const d = Math.sqrt((n * sa2 - sa ** 2) * (n * sb2 - sb ** 2));
  return d === 0 ? 0 : Math.round(((n * sab - sa * sb) / d) * 1000) / 1000;
}

function buildAdvanced(data: any[], profile: any[]) {
  const numCols = profile.filter((p) => p.type === "numeric").map((p) => p.col);
  const correlations: any[] = [];
  for (let i = 0; i < numCols.length; i++) {
    for (let j = i + 1; j < numCols.length; j++) {
      const r = pearson(data, numCols[i], numCols[j]);
      if (Math.abs(r) > 0.4) correlations.push({ colA: numCols[i], colB: numCols[j], r });
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
    const payload: IngestPayload = await req.json();
    if (!payload?.rows?.length) {
      return new Response(JSON.stringify({ error: "rows is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileName = payload.file_name || "dataset";
    const fileExt = (payload.file_ext || "csv").toLowerCase();
    const rowsJson = JSON.stringify(payload.rows);
    const file_hash = await sha256(rowsJson);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Cache hit?
    const { data: existing } = await supa
      .from("dataset_profiles")
      .select("*, datasets!inner(*)")
      .eq("file_hash", file_hash)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          file_hash,
          file_name: (existing as any).datasets.file_name,
          row_count: (existing as any).datasets.row_count,
          col_count: (existing as any).datasets.col_count,
          profile: existing.profile,
          correlations: existing.correlations,
          advanced: existing.advanced,
          health_score: existing.health_score,
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

    // Store raw file in Storage
    const storage_path = `${file_hash}.json`;
    const blob = new Blob([rowsJson], { type: "application/json" });
    await supa.storage.from("datasets").upload(storage_path, blob, { upsert: true });

    // Register
    await supa.from("datasets").upsert(
      {
        file_hash,
        file_name: fileName,
        storage_path,
        file_ext: fileExt,
        row_count: payload.rows.length,
        col_count: profile.length,
        size_bytes: rowsJson.length,
      },
      { onConflict: "file_hash" }
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
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});