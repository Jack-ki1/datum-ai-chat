import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import listSampleDatasetsTool from "./tools/list-sample-datasets";
import getSampleDatasetTool from "./tools/get-sample-dataset";
import listPromptSectorsTool from "./tools/list-prompt-sectors";
import getSamplePromptsTool from "./tools/get-sample-prompts";
import aboutFineseTool from "./tools/about-finese";

export default defineMcp({
  name: "finese-ai-mcp",
  title: "FINESE AI",
  version: "0.1.0",
  instructions:
    "Public tools for FINESE AI, a chat-first data intelligence platform. Use `about_finese` for an overview, `list_sample_datasets` / `get_sample_dataset` to explore built-in sample data (sales, HR, stock), and `list_prompt_sectors` / `get_sample_prompts` to browse the curated prompt library across data analysis, data science, data engineering, and MLOps. `echo` verifies connectivity.",
  tools: [
    aboutFineseTool,
    echoTool,
    listSampleDatasetsTool,
    getSampleDatasetTool,
    listPromptSectorsTool,
    getSamplePromptsTool,
  ],
});