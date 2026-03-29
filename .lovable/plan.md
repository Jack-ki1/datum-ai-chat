

# Real AI Integration for DATUM

## Current State
- Chat uses a **mock response generator** that pattern-matches keywords ("profile", "chart", "outlier") and returns hardcoded artifacts
- No Supabase setup, no edge functions, no real AI calls
- `LOVABLE_API_KEY` is available (Lovable AI Gateway)
- Artifact parser already exists (`parseArtifacts`) to extract `<artifact>` JSON blocks from AI text

## Plan

### 1. Enable Lovable Cloud & Create Supabase Client
- Set up `src/integrations/supabase/client.ts` with env vars
- This enables edge function calls from the frontend

### 2. Create Edge Function: `supabase/functions/datum-chat/index.ts`
- Receives: `{ messages, dataset_context }` from frontend
- Builds a **rich system prompt** containing:
  - DATUM AI persona and response format instructions
  - Full column profile (types, stats, nulls, outliers, correlations)
  - First 25 rows as sample data
  - Dataset metadata (filename, row/col counts, health score)
  - All 14 artifact type schemas with examples
  - Instructions to use `<artifact>` tags for structured output
- Calls Lovable AI Gateway (`google/gemini-2.5-flash`) with **streaming SSE**
- Handles 429/402 rate limit errors gracefully

### 3. Create Context Builder: `src/lib/context-builder.ts`
- `buildSystemPrompt(dataset, profile, fileName)` — assembles the full system prompt
- Includes correlation matrix for numeric columns (|r| > 0.4)
- Includes data quality summary
- Instructs the AI on all artifact types and when to use each

### 4. Refactor Store: Replace Mock with Real AI
- `sendMessage()` calls the edge function with streaming
- Streams tokens into the assistant message in real-time (token-by-token rendering)
- On stream complete, runs `parseArtifacts()` to extract artifact blocks
- Injects `art.data = dataset` for chart artifacts and `art.profile = profile` for profile artifacts
- Error handling: shows error as a styled AI message with red indicator

### 5. Update Frontend for Streaming
- Show partial assistant text as it streams in
- Artifacts only render after stream completes (since they appear at the end)
- Typing indicator shows during streaming
- Input disabled during streaming

## Technical Details

**System prompt structure:**
```
You are DATUM AI — an expert data analyst...
Dataset: "{filename}" | {rows} rows × {cols} columns | Health: {health}%
Column profiles: [detailed stats per column]
Correlations: [pairs with |r| > 0.4]
Sample data: [first 25 rows as JSON]

RESPONSE FORMAT:
- Use markdown with **bold** for key numbers
- Output artifact blocks at the END: <artifact>{"type":"chart",...}</artifact>
- For charts: only reference column names, do NOT include data arrays
- For profile: just {"type":"profile"}, system injects data
```

**Edge function model:** `google/gemini-2.5-flash` (fast, capable, cost-effective for data analysis)

**Streaming approach:** SSE line-by-line parsing, token-by-token UI updates, final artifact extraction

### Files to Create/Modify
1. **Create** `supabase/functions/datum-chat/index.ts` — edge function with streaming
2. **Create** `src/lib/context-builder.ts` — system prompt builder
3. **Create** `src/integrations/supabase/client.ts` — Supabase client setup
4. **Modify** `src/store/datum.store.ts` — replace `generateMockResponse` with real streaming AI calls
5. **Modify** `src/components/chat/MessageBubble.tsx` — handle streaming partial content
6. **Modify** `src/lib/stats.ts` — add `buildCorrMatrix` for correlation context

