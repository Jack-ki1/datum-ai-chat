import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { promptSectors } from "@/lib/sample-prompts";

export default defineTool({
  name: "get_sample_prompts",
  title: "Get sample prompts",
  description: "Return the full list of curated sample prompts for a given sector (analysis, science, engineering, mlops, other).",
  inputSchema: {
    sectorId: z.string().describe("Sector id from list_prompt_sectors."),
    limit: z.number().int().positive().max(200).optional().describe("Optional max prompts to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ sectorId, limit }) => {
    const sector = promptSectors.find(s => s.id === sectorId);
    if (!sector) {
      return {
        content: [{ type: "text", text: `Unknown sector "${sectorId}". Call list_prompt_sectors first.` }],
        isError: true,
      };
    }
    const prompts = limit ? sector.prompts.slice(0, limit) : sector.prompts;
    const payload = { id: sector.id, label: sector.label, prompts };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});