import { useState } from 'react';
import type { Artifact } from '@/types';
import { Check, Copy } from 'lucide-react';
import { PythonRunner } from '@/components/python/PythonRunner';

export function CodeArtifact({ artifact }: { artifact: Artifact }) {
  const [copied, setCopied] = useState(false);
  const code = artifact.code || '';
  const isPython = (artifact.lang || '').toLowerCase() === 'python';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative">
      <button onClick={handleCopy}
        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-muted-foreground hover:text-foreground bg-accent/80 hover:bg-accent transition-colors z-10">
        {copied ? <><Check className="w-3 h-3 text-datum-green" /> copied</> : <><Copy className="w-3 h-3" /> copy</>}
      </button>
      <pre className="p-4 overflow-x-auto text-datum-cyan font-mono text-[11px] leading-relaxed bg-background/50">
        <code>{code}</code>
      </pre>
      {isPython && code && <PythonRunner initialCode={code} />}
    </div>
  );
}
