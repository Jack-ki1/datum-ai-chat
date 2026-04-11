

# FINESE AI: Rebrand + Downloads + New Features + AI Improvements

## 1. Rebrand: DATUM → FINESE AI

Replace all user-facing references to "DATUM" with "FINESE AI" across the entire app.

**Files to modify:**
- `index.html` — title, meta tags, og:title
- `src/components/layout/Sidebar.tsx` — brand name + swap Hexagon icon for the uploaded logo image
- `src/components/chat/WelcomeScreen.tsx` — heading text
- `src/components/chat/ExportButton.tsx` — export header text
- `src/components/chat/MessageBubble.tsx` — assistant avatar (use logo instead of Hexagon)
- `src/components/chat/CommandPalette.tsx` — any DATUM references
- `supabase/functions/datum-chat/index.ts` — PERSONA text: "DATUM AI" → "FINESE AI"
- `src/components/layout/Topbar.tsx` — any DATUM text references

**Logo:** Copy `user-uploads://FINESE_LOGO.jpg` to `src/assets/finese-logo.jpg` and import it where the Hexagon icon currently appears (Sidebar brand, MessageBubble assistant avatar, WelcomeScreen hero).

Note: CSS variable names like `--datum-surf` and tailwind class names like `datum-cyan` are internal and will NOT be renamed (they don't appear to users).

---

## 2. Fully Functional Download Buttons on Artifacts

Currently the Download button in `ArtifactRenderer.tsx` is non-functional (no onClick handler). Implement real download logic that generates the appropriate file type based on the artifact.

**File:** `src/components/artifacts/ArtifactRenderer.tsx`

Add a `downloadArtifact(artifact)` function that handles:

| Artifact Type | Download Format |
|---|---|
| `code` | `.py`, `.sql`, `.r` based on `artifact.lang` |
| `table`, `pivot` | `.csv` (convert data array to CSV) |
| `chart` | `.png` (use canvas export from recharts container) |
| `insights`, `hypothesis`, `model_card`, `experiment` | `.md` (Markdown) |
| `stats`, `feature_importance`, `confusion_matrix` | `.csv` |
| `pipeline`, `lineage`, `schema_explorer` | `.json` |
| `corr_matrix` | `.csv` |
| `anomaly_report`, `drift_report` | `.json` |
| `cost_analysis` | `.xlsx` (using xlsx library already installed) |
| `profile` | `.json` |

Also make the Copy button functional — copies artifact content as text/JSON to clipboard.

Also make the Expand/Maximize button functional — opens artifact in a full-screen dialog overlay.

---

## 3. New Features & Capabilities

### 3a. Keyboard Shortcuts Panel
Add a `?` keyboard shortcut that shows a help overlay listing all shortcuts (Cmd+K, Cmd+N for new chat, Cmd+/ for focus input, etc.)

**New file:** `src/components/chat/KeyboardShortcuts.tsx`
**Modify:** `src/App.tsx` — register shortcuts

### 3b. Message Reactions / Feedback
Add thumbs-up/thumbs-down on AI messages for response quality feedback (stored in local state for now).

**Modify:** `src/components/chat/MessageBubble.tsx` — add ThumbsUp/ThumbsDown buttons

### 3c. Multi-File Upload
Currently only single file upload. Allow multiple files to be uploaded and merged/compared.

**Modify:** `src/components/chat/InputBar.tsx` — change `<input>` to accept `multiple`, show file list

### 3d. Auto-Save Sessions to LocalStorage
Sessions currently reset on refresh. Persist sessions to localStorage.

**Modify:** `src/store/datum.store.ts` — add zustand `persist` middleware

### 3e. Fullscreen Artifact Viewer
When clicking the Maximize button on an artifact, open it in a fullscreen dialog.

**New file:** `src/components/artifacts/ArtifactFullscreen.tsx`
**Modify:** `src/components/artifacts/ArtifactRenderer.tsx` — wire Maximize button

---

## 4. AI Improvements

**File:** `supabase/functions/datum-chat/index.ts`

- Upgrade model from `google/gemini-2.5-pro` to `google/gemini-3.1-pro-preview` for stronger reasoning
- Increase reasoning effort from `medium` to `high`
- Add explicit instructions for file-downloadable outputs: when user asks to "generate a Python script" or "create SQL", produce a `code` artifact with proper `lang` field so the download button works
- Add instructions to always produce well-structured, self-contained code artifacts (not inline code snippets)
- Add PPTX/Document generation instructions: when user asks for "presentation" or "report", generate structured markdown artifacts with clear sections

---

## Summary of File Changes

| Action | File |
|--------|------|
| Copy | `user-uploads://FINESE_LOGO.jpg` → `src/assets/finese-logo.jpg` |
| Modify | `index.html` |
| Modify | `src/components/layout/Sidebar.tsx` |
| Modify | `src/components/chat/WelcomeScreen.tsx` |
| Modify | `src/components/chat/MessageBubble.tsx` |
| Modify | `src/components/chat/ExportButton.tsx` |
| Modify | `src/components/chat/CommandPalette.tsx` |
| Modify | `src/components/chat/InputBar.tsx` |
| Modify | `src/components/layout/Topbar.tsx` |
| Modify | `src/components/artifacts/ArtifactRenderer.tsx` |
| Create | `src/components/artifacts/ArtifactFullscreen.tsx` |
| Create | `src/components/chat/KeyboardShortcuts.tsx` |
| Modify | `src/store/datum.store.ts` |
| Modify | `src/App.tsx` |
| Modify | `supabase/functions/datum-chat/index.ts` |

