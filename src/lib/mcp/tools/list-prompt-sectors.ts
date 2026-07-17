import { defineTool } from "@lovable.dev/mcp-js";
import { promptSectors } from "@/lib/sample-prompts";

export default defineTool({
  name: "list_prompt_sectors",
  title: "List prompt sectors",
  description: "List the public prompt library sectors (Data Analysis, Data Science, Data Engineering, MLOps, etc.) with prompt counts.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const sectors = promptSectors.map(s => ({ id: s.id, label: s.label, promptCount: s.prompts.length }));
    return {
      content: [{ type: "text", text: JSON.stringify(sectors, null, 2) }],
      structuredContent: { sectors },
    };
  },
});