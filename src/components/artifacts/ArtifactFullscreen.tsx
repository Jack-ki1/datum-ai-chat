import type { Artifact } from '@/types';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export function ArtifactFullscreen({ artifact, onClose, children }: {
  artifact: Artifact;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[90vw] h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-expand">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/50">
          <span className="text-sm font-semibold text-foreground">{artifact.title || artifact.type.toUpperCase()}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
