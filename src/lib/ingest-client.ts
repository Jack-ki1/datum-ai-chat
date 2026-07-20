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

export interface IngestOptions {
  /** Called with upload progress percentage (0-100) during the POST body upload. */
  onUploadProgress?: (pct: number) => void;
  /** Fires once the request body has finished uploading and we're waiting on the server. */
  onUploaded?: () => void;
  /** Abort in-flight request. */
  signal?: AbortSignal;
}

export async function ingestDataset(
  rows: Record<string, any>[],
  fileName: string,
  opts: IngestOptions = {}
): Promise<IngestResponse> {
  const fileExt = fileName.split(".").pop()?.toLowerCase() || "csv";
  const body = JSON.stringify({ rows, file_name: fileName, file_ext: fileExt });
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  if (!token) throw new Error("You must be signed in to upload a dataset.");
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dataset-ingest`;

  // XHR gives us real upload-progress + cancel; fetch does not expose upload progress.
  return await new Promise<IngestResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string);
    xhr.responseType = "text";

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      opts.onUploadProgress?.(Math.min(100, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.upload.onload = () => {
      opts.onUploadProgress?.(100);
      opts.onUploaded?.();
    };
    xhr.onerror = () => reject(new Error("Network error uploading dataset"));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    xhr.onload = () => {
      let json: any = null;
      try { json = JSON.parse(xhr.responseText); } catch { /* leave null */ }
      if (xhr.status >= 200 && xhr.status < 300 && json) return resolve(json as IngestResponse);
      const msg = json?.error || (xhr.status === 413 ? "File is too large for the server." : `Ingest failed (${xhr.status})`);
      reject(new Error(msg));
    };

    if (opts.signal) {
      if (opts.signal.aborted) { xhr.abort(); return; }
      opts.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(body);
  });
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