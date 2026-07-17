import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "about_finese",
  title: "About FINESE AI",
  description: "Return a short description of FINESE AI, its capabilities, and the modes it supports.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const about = {
      name: "FINESE AI",
      tagline: "Chat-first AI data intelligence for data professionals.",
      capabilities: [
        "Automatic dataset profiling (types, nulls, outliers, correlations)",
        "Server-side statistical compute via tool-calls",
        "Chart, table, profile, stats, hypothesis, pivot, and code artifacts",
        "Feature importance, confusion matrix, model card, drift, and pipeline artifacts",
        "Debugging, experiment design, data storytelling, and documentation modes",
        "In-browser Python execution via Pyodide",
      ],
      sectors: ["Data Analysis", "Data Science", "Data Engineering", "MLOps", "Other"],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(about, null, 2) }],
      structuredContent: about,
    };
  },
});