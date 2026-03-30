

# Sample Prompts Page + InputBar Updates + Scrollability Fixes

## 1. Sample Prompts Button in Sidebar + Prompts Page

**Sidebar change** (`src/components/layout/Sidebar.tsx`): Add a "Sample Prompts" button below the "+ New Chat" button that navigates to `/prompts`.

**New page** (`src/pages/SamplePrompts.tsx`): A full page wrapped in `AppShell` with 5 tabbed sections:
- **Data Analysis** (50+ prompts)
- **Data Science** (50+ prompts)
- **Data Engineering** (50+ prompts)
- **MLOps** (50+ prompts)
- **Others** (50+ prompts)

Each section displays prompts as clickable cards in a scrollable grid. Clicking a prompt navigates to `/chat` and sends it (or pre-fills the input). Prompts stored in a new file `src/lib/sample-prompts.ts`.

**New route** in `src/App.tsx`: `/prompts` → `SamplePrompts`.

### Files:
| Action | File |
|--------|------|
| Create | `src/lib/sample-prompts.ts` — 250+ prompts organized by category |
| Create | `src/pages/SamplePrompts.tsx` — tabbed page with prompt cards |
| Modify | `src/components/layout/Sidebar.tsx` — add Sample Prompts button |
| Modify | `src/App.tsx` — add `/prompts` route |

---

## 2. InputBar Quick Actions Update

Replace "Chart" and "Anomalies" buttons with "Model", "Analyze", "Engineer", "MLOps" in `src/components/chat/InputBar.tsx`.

- **Profile** (keep) → `Profile all columns in detail`
- **Model** (new) → `Suggest and build the best ML model for this data`
- **Analyze** (new) → `Run a comprehensive statistical analysis on this dataset`
- **Engineer** (new) → `Design a data pipeline and feature engineering plan`
- **MLOps** (new) → `Create a deployment and monitoring plan for this data workflow`

### Files:
| Action | File |
|--------|------|
| Modify | `src/components/chat/InputBar.tsx` — swap quick action buttons |

---

## 3. Scrollability Fixes

Ensure all pages scroll properly top-to-bottom:
- `ChatWindow.tsx` — already has `overflow-y-auto` on scroll container (verify)
- `DataViewer.tsx` — already has `overflow-auto` (verify)
- `SamplePrompts.tsx` — build with `overflow-y-auto` on main content
- `AppShell.tsx` — ensure main area allows overflow scrolling

### Files:
| Action | File |
|--------|------|
| Modify | `src/components/layout/AppShell.tsx` — ensure `overflow-y-auto` on main |
| Modify | `src/pages/DataViewer.tsx` — confirm scrollability |

---

## Total: 4 files created/modified, 2 new files

