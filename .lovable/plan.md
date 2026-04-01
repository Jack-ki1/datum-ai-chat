

# DATUM AI: Major Intelligence Upgrade

## Overview
Three interconnected improvements: (1) dramatically better system prompts for richer AI output, (2) enhanced context pipeline for complex operations, (3) competitive feature additions inspired by Julius AI, ChatGPT Canvas, Hex, and others.

---

## 1. System Prompt Overhaul (Edge Function)

**File:** `supabase/functions/datum-chat/index.ts`

### Current Problems
- Prompt is decent but lacks structured reasoning instructions (chain-of-thought)
- No output quality controls (confidence levels, assumption flagging)
- Missing multi-step analysis patterns (the AI doesn't break complex requests into stages)
- No data-aware formatting rules (e.g. "for small datasets use exact numbers, for large datasets use percentages")

### Changes
- **Add chain-of-thought reasoning block**: Instruct the AI to think step-by-step before answering complex questions — outline approach, check assumptions, then deliver results
- **Add confidence/uncertainty signaling**: AI must flag when sample sizes are small, distributions are non-normal, or results may be unreliable
- **Add multi-artifact orchestration rules**: For complex requests, produce a sequence of artifacts (e.g. "build a model" → stats panel + feature importance + model card + code + experiment tracker)
- **Add smart follow-up generation**: AI generates 3 context-aware follow-up questions as clickable suggestions at the end of each response (rendered as a new `suggestions` artifact type)
- **Add data-size-aware instructions**: Different behavior for <100 rows vs 1K+ vs 10K+ (exact values vs summaries vs sampling strategies)
- **Add "show your work" mode**: For statistical tests, always show the test selection rationale, assumptions checked, and interpretation
- **Improve artifact density rules**: "For analysis requests, ALWAYS include at least one visualization + one statistical summary + one code block"
- **Add error recovery instructions**: When the user's request is ambiguous, generate the most likely interpretation AND suggest alternatives
- **Enable reasoning mode**: Add `reasoning: { effort: "medium" }` to the API call for better complex analysis

### New Prompt Sections
```
RESPONSE QUALITY RULES:
- For every statistical claim, cite the exact number and its context
- Flag assumptions: "⚠️ Assuming normal distribution (Shapiro-Wilk p=0.34)"
- For ML: always compare at least 2 approaches with trade-offs
- End every response with a "💡 Suggested next steps" section with 3 specific actions

MULTI-STEP ANALYSIS PATTERN:
When asked a complex question (model building, pipeline design, full analysis):
1. State what you'll do (1-2 sentences)
2. Check data readiness (missing values, types, distributions)  
3. Execute the analysis with multiple artifacts
4. Summarize findings with business impact
5. Suggest follow-ups

SMART ARTIFACT COMBINATIONS:
- "Analyze" → insights + stats + chart + code
- "Build a model" → profile check + feature importance + model card + confusion matrix + experiment + code
- "Design a pipeline" → schema explorer + pipeline + lineage + cost analysis + code
- "Detect drift" → drift report + stats comparison + chart + anomaly report
```

---

## 2. Enhanced Context Pipeline (Richer Data Sent to AI)

### `src/lib/context-builder.ts` — More Context
- Add **data shape summary**: cardinality ratios, sparsity, class balance for potential target columns
- Add **temporal detection**: identify date/time columns and note time range + granularity
- Add **suggested target columns**: columns likely to be prediction targets (binary, low-cardinality categoricals at end of schema)
- Send **distribution summaries** for numeric columns: skewness direction, modality hints
- Increase sample data from 25 to 50 rows for better AI understanding

### `src/lib/stats.ts` — New Stat Functions
- Add `skewness()` calculation for numeric columns (already partially there, formalize)
- Add `entropy()` for categorical columns to measure information content
- Add `classBalance()` to detect imbalanced classification scenarios
- Add `temporalRange()` to detect date columns and extract min/max/granularity

---

## 3. Competitive Feature Additions

### 3a. Smart Follow-Up Suggestions (Inspired by Julius AI)
**New artifact type: `suggestions`**

After every AI response, the AI can emit a `suggestions` artifact containing 3 clickable follow-up prompts that are contextually relevant.

- **New file:** `src/components/artifacts/SuggestionsArtifact.tsx` — renders 3 clickable cards below the response
- **Modify:** `src/components/artifacts/ArtifactRenderer.tsx` — add `suggestions` case
- **Modify:** `src/types/index.ts` — add `suggestions` to Artifact type docs
- **Modify:** Edge function prompt — instruct AI to always end with `<artifact>{"type":"suggestions","items":[{"text":"...","prompt":"..."},...]}</artifact>`
- When clicked, the suggestion auto-sends as a new message

### 3b. Thinking/Reasoning Indicator (Inspired by ChatGPT/Claude)
Show a "Thinking..." phase with reasoning steps before the final answer appears for complex queries.

- **Modify:** `src/components/chat/MessageBubble.tsx` — detect reasoning tokens (if model returns them) and show a collapsible "Reasoning" section
- **Modify:** `src/components/chat/TypingIndicator.tsx` — show "Analyzing your data..." instead of generic dots when dataset is loaded

### 3c. Response Quality Enhancements
- **Modify:** `src/components/chat/MessageBubble.tsx` — add a "Copy response" button and "Regenerate" button on assistant messages
- **Modify:** `src/store/datum.store.ts` — add `regenerateLastMessage()` action that re-sends the last user message

### 3d. Contextual Input Suggestions (Inspired by Hex/Julius)
When the input bar is focused and empty, show 3-4 smart suggestions based on what the AI hasn't been asked yet about the current dataset.

- **Modify:** `src/components/chat/InputBar.tsx` — add a floating suggestions panel above the input when focused + empty + dataset loaded
- Suggestions derived from dataset profile (e.g. if there are date columns: "Show time series trends", if high-cardinality: "Segment by [top categorical column]")

---

## 4. Summary of File Changes

| Action | File | What |
|--------|------|------|
| Modify | `supabase/functions/datum-chat/index.ts` | Major prompt rewrite + reasoning mode |
| Modify | `src/lib/context-builder.ts` | Richer dataset context (entropy, temporal, targets) |
| Modify | `src/lib/stats.ts` | Add entropy, classBalance, temporalRange |
| Create | `src/components/artifacts/SuggestionsArtifact.tsx` | Clickable follow-up suggestions |
| Modify | `src/components/artifacts/ArtifactRenderer.tsx` | Add suggestions type |
| Modify | `src/components/chat/MessageBubble.tsx` | Copy/Regenerate buttons, reasoning section |
| Modify | `src/components/chat/TypingIndicator.tsx` | Contextual loading text |
| Modify | `src/components/chat/InputBar.tsx` | Smart contextual suggestions when empty |
| Modify | `src/store/datum.store.ts` | Add regenerateLastMessage action |
| Modify | `src/types/index.ts` | Document suggestions artifact type |

