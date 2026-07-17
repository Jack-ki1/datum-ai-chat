import { defineTool } from "@lovable.dev/mcp-js";
import { salesData, hrData, stockData } from "@/lib/sample-datasets";

export default defineTool({
  name: "list_sample_datasets",
  title: "List sample datasets",
  description: "List the built-in public sample datasets available in FINESE AI (sales, HR, stock) with row counts, column names, and a small preview.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const datasets = [
      { id: "sales", name: "Sales Data", data: salesData },
      { id: "hr", name: "HR Data", data: hrData },
      { id: "stock", name: "Stock Data", data: stockData },
    ].map(d => ({
      id: d.id,
      name: d.name,
      rowCount: d.data.length,
      columns: Object.keys(d.data[0] ?? {}),
      preview: d.data.slice(0, 3),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(datasets, null, 2) }],
      structuredContent: { datasets },
    };
  },
});