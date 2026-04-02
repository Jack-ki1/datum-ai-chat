

# Advancing DATUM to Full-Stack AI Data Intelligence

## What This Achieves
The user's 20 capabilities describe transforming DATUM from "a chat that profiles CSV files" into a comprehensive AI data intelligence platform — one that acts as a senior peer, debugging partner, research synthesizer, experiment designer, documentation generator, and cross-functional translator, all in one conversational interface.

Most of these capabilities are unlocked through **system prompt engineering** and **UI affordances** — the AI model already has the knowledge; we need to instruct it correctly and surface the right interaction patterns.

---

## Changes

### 1. Massive System Prompt Expansion (Edge Function)

**File:** `supabase/functions/datum-chat/index.ts`

The current prompt covers data analysis and ML well, but lacks explicit instructions for ~12 of the 20 capabilities. Add new prompt sections:

**New PERSONA expansion** — explicitly define all roles:
- Senior data peer for brainstorming (#10, #13)
- Debugging partner: accept error pastes, diagnose root cause, suggest fixes (#6)
- Research synthesizer: summarize methods, compare approaches, extract implementation steps (#7)
- Cross-functional translator: adapt output for analysts vs engineers vs executives (#4)
- Experiment designer: A/B testing, power analysis, metric selection, statistical pitfalls (#8)
- Data storytelling expert: executive summaries, dashboard narratives, stakeholder framing (#9)
- Learning accelerator: adapt explanation depth to user level, provide intuition + examples (#11)
- System design architect: pipelines, feature stores, deployment patterns, monitoring (#12)
- Documentation generator: clean notebooks, write tech docs, standardize code comments (#14)
- Second opinion provider: challenge assumptions, suggest alternatives, sanity-check approaches (#16)
- Theory-to-practice bridge: explain papers then show implementation code (#17)

**New prompt sections to add:**

- `DEBUGGING_PARTNER` — When user pastes an error/traceback: (a) identify root cause, (b) explain why it happened, (c) provide fix with code artifact, (d) suggest preventive measures
- `RESEARCH_SYNTHESIS` — When asked about methods/approaches: compare 3+ options in a table, cite trade-offs, give practical implementation steps as code
- `EXPERIMENT_DESIGN` — A/B test setup, metric selection, power analysis formulas, common statistical pitfalls to avoid
- `DATA_STORYTELLING` — Generate executive summaries, dashboard narratives, stakeholder-ready messaging. Use insights + stats artifacts formatted for non-technical audiences
- `ADAPTIVE_DEPTH` — Detect user expertise from language. Juniors get more explanation; seniors get concise answers with code. Respond accordingly
- `DOCUMENTATION_MODE` — When asked to document/clean: generate structured docstrings, README sections, code comments, data dictionaries
- `AMBIGUITY_RESOLUTION` — When request is vague (e.g. "Why are users dropping?"): define metrics, suggest analyses, propose hypotheses, then execute the most likely one (#3)
- `BLANK_PAGE_KILLER` — When user seems stuck or asks open-ended questions: provide a concrete starting point (first SQL draft, first model pipeline, first analysis outline) (#19)
- `CROSS_STACK_CODE` — Expand code generation instructions: SQL (window functions, CTEs, optimization), Python (pandas, sklearn, PySpark, statsmodels), dbt models, Airflow DAGs, API scaffolding. Include code explanations + refactoring, not just generation (#5)

**Update MULTI_STEP_PATTERNS** — Add new intent patterns:
- `"Debug this" / error paste` → code (fix) + insights (root cause) + suggestions
- `"Explain [concept]"` → insights (explanation) + code (example) + suggestions
- `"Write documentation"` → code (documented version) + insights (structure) + suggestions  
- `"Design experiment"` → hypothesis + stats (power analysis) + experiment + code + suggestions
- `"Tell the story"` → insights (executive summary) + stats + chart + suggestions
- `"Compare approaches"` → table (comparison) + insights (recommendation) + code (both implementations) + suggestions
- `"I'm stuck"` → suggestions (5 concrete directions) + insights (framework for thinking)

**Update RULES** — Add:
- Rule 18: When user pastes an error, ALWAYS start with the root cause before suggesting fixes
- Rule 19: Adapt explanation depth — if user uses technical terms, be concise; if they ask "what is", be thorough
- Rule 20: For documentation requests, follow the codebase's existing style/conventions
- Rule 21: When brainstorming, generate at least 5 ideas, ranked by feasibility and impact
- Rule 22: For "why" questions about data patterns, provide both statistical and business explanations

### 2. Enhanced Welcome Screen & Quick Actions

**File:** `src/components/chat/WelcomeScreen.tsx`

Update starter cards to reflect all 20 capabilities — replace current 6 with 8 that better represent the full platform:

| Card | Prompt |
|------|--------|
| Analyze my data | Run comprehensive analysis |
| Build a model | ML pipeline with evaluation |
| Debug an error | Paste error for diagnosis |
| Design experiment | A/B test / power analysis |
| Explain a concept | Learn any data topic |
| Generate documentation | Document code/data |
| System design | Architecture planning |
| Tell the data story | Executive summary |

### 3. Expanded Quick Action Buttons

**File:** `src/components/chat/InputBar.tsx`

Add 3 more quick action buttons (total 8, scrollable row):
- **Debug** (Bug icon) → "I have an error to debug — paste your error message"
- **Story** (BookOpen icon) → "Create an executive summary and data story for stakeholders"
- **Docs** (FileText icon) → "Generate documentation for this dataset and analysis"

### 4. No-Dataset Mode Enhancement

**File:** `supabase/functions/datum-chat/index.ts` — update `PROMPT_NO_DATASET`

Currently the no-dataset prompt just lists capabilities. Enhance it to actually serve capabilities #6 (debugging), #7 (research), #11 (learning), #12 (system design), #13 (idea generation), #17 (theory↔practice) even without data loaded. The AI should be fully functional as a senior peer without requiring a file upload.

---

## Summary of File Changes

| Action | File | What |
|--------|------|------|
| Modify | `supabase/functions/datum-chat/index.ts` | Add 9 new prompt sections, expand PERSONA, update patterns + rules, enhance no-dataset mode |
| Modify | `src/components/chat/WelcomeScreen.tsx` | 8 new capability-aligned starter cards |
| Modify | `src/components/chat/InputBar.tsx` | Add Debug, Story, Docs quick actions |

