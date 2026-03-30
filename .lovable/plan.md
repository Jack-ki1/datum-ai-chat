

# UI Enhancements: Data Viewer Buttons + Changelog Sidebar

## 1. "Original" & "Transformed" Buttons in Topbar

**What:** Two toggle buttons appear in the top-right of the Topbar after a dataset is uploaded. Clicking either navigates to a **Data Viewer page** showing that version of the data.

**New page: `/data/:view` (Original or Transformed)**

The Data Viewer page contains four sections in a tabbed layout:
- **Data Table** — full scrollable view of the dataset
- **Visuals** — auto-generated distribution charts (histograms for numeric, bar charts for categorical), scatter matrix for top correlated pairs
- **Report** — detailed data quality report (completeness, types, outliers, correlations) with a **Download** button (PDF or PPTX via the AI)
- **Upload** — drag-and-drop CSV/XLSX upload area to replace/load data

**Store changes:** Add `transformedDataset` and `activeView` ('original' | 'transformed') to `DatumStore`. The "Transformed" dataset starts as null and gets populated when the AI modifies data (or user uploads a second file).

### Files to create/modify:
- **Create** `src/pages/DataViewer.tsx` — the full data viewer page with tabs
- **Create** `src/components/data-viewer/DataTable.tsx` — scrollable table
- **Create** `src/components/data-viewer/DataVisuals.tsx` — auto-generated charts (histograms, bar charts, scatter)
- **Create** `src/components/data-viewer/DataReport.tsx` — detailed profile report with download button
- **Create** `src/components/data-viewer/DataUpload.tsx` — CSV upload section
- **Modify** `src/components/layout/Topbar.tsx` — add Original/Transformed buttons (visible when `isLoaded`)
- **Modify** `src/store/datum.store.ts` — add `transformedDataset`, `activeView`, and setters
- **Modify** `src/App.tsx` — add `/data/:view` route

---

## 2. Changelog Sidebar (Right Side)

**What:** A collapsible right-side panel on the Chat page that logs every data transformation or AI action as a timeline. Users can click entries to revisit, reorder, or remove them.

**Entries tracked:** dataset uploads, AI-generated transformations, column drops, filters applied, chart generations — each with timestamp and description.

### Files to create/modify:
- **Create** `src/components/layout/ChangelogSidebar.tsx` — collapsible right panel with a vertical timeline of changelog entries. Each entry shows an icon, description, and timestamp. Entries are draggable/reorderable and deletable.
- **Modify** `src/store/datum.store.ts` — add `changelog: ChangelogEntry[]`, `changelogOpen: boolean`, `toggleChangelog()`, `addChangelogEntry()`, `removeChangelogEntry()`, `reorderChangelog()`
- **Modify** `src/types/index.ts` — add `ChangelogEntry` type (`id`, `action`, `description`, `timestamp`, `data?`)
- **Modify** `src/components/layout/AppShell.tsx` — render `ChangelogSidebar` on the right side of the main content area
- **Modify** `src/components/layout/Topbar.tsx` — add a changelog toggle button (clock/history icon)

---

## Summary of All File Changes

| Action | File |
|--------|------|
| Create | `src/pages/DataViewer.tsx` |
| Create | `src/components/data-viewer/DataTable.tsx` |
| Create | `src/components/data-viewer/DataVisuals.tsx` |
| Create | `src/components/data-viewer/DataReport.tsx` |
| Create | `src/components/data-viewer/DataUpload.tsx` |
| Create | `src/components/layout/ChangelogSidebar.tsx` |
| Modify | `src/components/layout/Topbar.tsx` |
| Modify | `src/components/layout/AppShell.tsx` |
| Modify | `src/store/datum.store.ts` |
| Modify | `src/types/index.ts` |
| Modify | `src/App.tsx` |

