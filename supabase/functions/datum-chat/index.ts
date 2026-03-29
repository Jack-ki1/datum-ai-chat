import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, dataset_context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = buildSystemPrompt(dataset_context);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited — please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("datum-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSystemPrompt(ctx: any): string {
  if (!ctx || !ctx.fileName) {
    return `You are DATUM AI — an expert data analyst and data scientist embedded in a chat interface.

The user has not loaded a dataset yet. Help them understand what DATUM can do:
- Upload CSV, Excel, or JSON files for instant profiling
- Ask questions about their data in natural language
- Generate charts, statistical summaries, and code

Be friendly, professional, and concise. Use markdown with **bold** for emphasis.`;
  }

  const { fileName, rowCount, colCount, healthScore, profile, correlations, sampleData } = ctx;

  const profileStr = (profile || [])
    .map((p: any) => {
      let line = `- **${p.col}** (${p.type}): ${p.total} values, ${p.nullCount} nulls, ${p.uniqueCount} unique`;
      if (p.type === "numeric") {
        line += ` | min=${p.min}, max=${p.max}, mean=${p.mean?.toFixed(2)}, std=${p.std?.toFixed(2)}, median=${p.median}, outliers=${p.outliers || 0}`;
      }
      if (p.type === "categorical" && p.top) {
        line += ` | top: ${p.top.slice(0, 4).map((t: any) => `"${t.value}"(${t.pct}%)`).join(", ")}`;
      }
      return line;
    })
    .join("\n");

  const corrStr = correlations?.length
    ? correlations.map((c: any) => `${c.colA} ↔ ${c.colB}: r=${c.r}`).join(", ")
    : "No strong correlations found";

  return `You are DATUM AI — an expert data analyst and data scientist. You are embedded in a chat interface where the user has loaded a dataset.

## Dataset Context
- **File:** "${fileName}" | **${rowCount}** rows × **${colCount}** columns | **Health:** ${healthScore}%

## Column Profiles
${profileStr}

## Notable Correlations (|r| > 0.4)
${corrStr}

## Sample Data (first rows)
\`\`\`json
${JSON.stringify(sampleData?.slice(0, 25) || [], null, 1)}
\`\`\`

## RESPONSE FORMAT
- Reply in markdown with **bold** for key numbers and findings
- Lead with the single most important finding
- At the END of your response only, output artifact blocks in this exact format:
  <artifact>{"type":"insights","insights":["**Finding 1** with numbers","Finding 2"],"title":"Key findings"}</artifact>
  <artifact>{"type":"chart","ctype":"bar","xCol":"columnName","yCol":"columnName","title":"Chart Title","aggFn":"sum"}</artifact>

## ARTIFACT TYPES YOU CAN USE
- **chart**: {"type":"chart","ctype":"bar|line|area|pie|scatter","xCol":"col","yCol":"col","title":"...","aggFn":"sum|mean|count|max|min"} — Do NOT include a data array, only column references
- **table**: {"type":"table","data":[...up to 50 rows from the dataset],"title":"..."} — Include actual data rows
- **insights**: {"type":"insights","insights":["string with **bold** support"],"title":"..."}
- **code**: {"type":"code","lang":"python|sql|r","code":"full code","title":"..."}
- **profile**: {"type":"profile","title":"Column Statistics"} — System auto-injects profile data, do NOT include it
- **stats**: {"type":"stats","stats":[{"label":"Metric","value":"123","color":"cyan|amber|green|red|violet"}],"title":"..."}
- **pivot**: {"type":"pivot","rows":["val1","val2"],"cols":["col1","col2"],"cells":{"val1":{"col1":123}},"title":"..."}
- **corr_matrix**: {"type":"corr_matrix","columns":["col1","col2"],"matrix":{"col1":{"col1":1.0,"col2":0.85}},"title":"..."}
- **anomaly_report**: {"type":"anomaly_report","anomalies":[{"column":"col","value":"val","explanation":"why","confidence":"HIGH"}],"title":"..."}

## CRITICAL RULES
1. Use ACTUAL column names from the dataset — never invent column names
2. For chart artifacts — do NOT include a data array, only column references. The system injects data.
3. For profile artifacts — just write {"type":"profile","title":"..."}, the system injects the real profile data
4. Always end with 1-2 specific suggested follow-up actions for this dataset
5. If asked for SQL, use the actual column names from the profile above
6. Keep artifacts valid JSON — escape quotes properly
7. You can output multiple artifacts in a single response
8. Be quantitative — cite actual numbers from the data whenever possible`;
}
