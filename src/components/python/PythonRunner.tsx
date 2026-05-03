import { useState } from "react";
import { Play, Loader2, AlertCircle } from "lucide-react";
import { runPython } from "@/lib/pyodide-runner";
import { useDatumStore } from "@/store/datum.store";
import { loadDatasetRows } from "@/lib/ingest-client";

interface Props { initialCode: string; }

export function PythonRunner({ initialCode }: Props) {
  const fileHash = useDatumStore((s) => s.fileHash);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; stdout?: string; value?: string; error?: string } | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const rows = fileHash ? await loadDatasetRows(fileHash).catch(() => undefined) : undefined;
      const r = await runPython(initialCode, rows);
      setResult(r);
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || String(e) });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Pyodide · runs in your browser{fileHash ? " · df preloaded" : ""}
        </span>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:brightness-110 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          {running ? "Running…" : "Run"}
        </button>
      </div>
      {result && (
        <div className="p-3 text-[11px] font-mono max-h-64 overflow-auto">
          {result.error ? (
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <pre className="whitespace-pre-wrap">{result.error}</pre>
            </div>
          ) : (
            <>
              {result.stdout && <pre className="whitespace-pre-wrap text-foreground">{result.stdout}</pre>}
              {result.value && (
                <pre className="whitespace-pre-wrap text-primary mt-2 border-t border-border pt-2">{result.value}</pre>
              )}
              {!result.stdout && !result.value && <span className="text-muted-foreground">(no output)</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}