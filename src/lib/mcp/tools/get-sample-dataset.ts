import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { salesData, hrData, stockData } from "../../sample-datasets";

const MAP: Record<string, { name: string; data: Record<string, unknown>[] }> = {
  sales: { name: "Sales Data", data: salesData },
  hr: { name: "HR Data", data: hrData },
  stock: { name: "Stock Data", data: stockData },
};

export default defineTool({
  name: "get_sample_dataset",
  title: "Get sample dataset",
  description: "Return the full rows of a built-in public sample dataset (sales, hr, or stock).",
  inputSchema: {
    id: z.enum(["sales", "hr", "stock"]).describe("Which sample dataset to fetch."),
    limit: z.number().int().positive().max(500).optional().describe("Optional max rows to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ id, limit }) => {
    const ds = MAP[id];
    const rows = limit ? ds.data.slice(0, limit) : ds.data;
    const payload = { id, name: ds.name, rowCount: rows.length, columns: Object.keys(ds.data[0] ?? {}), rows };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});