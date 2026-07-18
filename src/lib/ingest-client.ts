import { supabase } from "@/integrations/supabase/client";

export interface IngestResponse {
  file_hash: string;
  file_name: string;
  row_count: number;
  col_count: number;
  profile: any[];
  correlations: any[];
  advanced: any;
  health_score: number;
  cached: boolean;
}

export async function ingestDataset(
  rows: Record<string, any>[],
  fileName: string
): Promise<IngestResponse> {
  const fileExt = fileName.split(".").pop()?.toLowerCase() || "csv";
  const { data, error } = await supabase.functions.invoke("dataset-ingest", {
    body: { rows, file_name: fileName, file_ext: fileExt },
  });
  if (error) throw new Error(error.message || "Ingest failed");
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as IngestResponse;
}

/** Download dataset rows from Storage by hash (for viewers). */
export async function loadDatasetRows(file_hash: string): Promise<any[]> {
  const { data, error } = await supabase.functions.invoke("dataset-fetch", {
    body: { file_hash },
  });
  if (error) throw new Error(error.message || "Failed to download dataset");
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any[];
}

/** Run a compute tool directly (for the Pyodide alternative path). */
export async function callComputeTool(
  tool: string,
  args: any,
  file_hash: string
) {
  const { data, error } = await supabase.functions.invoke("compute-tools", {
    body: { tool, args, file_hash },
  });
  if (error) throw new Error(error.message);
  return (data as any)?.result;
}