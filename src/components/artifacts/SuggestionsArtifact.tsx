import type { Artifact } from '@/types';
import { useDatumStore } from '@/store/datum.store';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SuggestionItem {
  text: string;
  prompt: string;
}

export function SuggestionsArtifact({ artifact }: { artifact: Artifact }) {
  const { sendMessage, isAiLoading } = useDatumStore();
  const items: SuggestionItem[] = artifact.items || [];

  if (!items.length) return null;

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Suggested next steps</span>
      </div>
      <div className="grid gap-2">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => !isAiLoading && sendMessage(item.prompt)}
            disabled={isAiLoading}
            className="group flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 disabled:opacity-50"
          >
            <span className="text-sm text-foreground group-hover:text-primary transition-colors flex-1">
              {item.text}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
