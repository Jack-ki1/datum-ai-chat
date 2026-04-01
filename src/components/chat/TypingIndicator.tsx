import { Hexagon } from 'lucide-react';
import { useDatumStore } from '@/store/datum.store';

export function TypingIndicator() {
  const { isLoaded } = useDatumStore();

  return (
    <div className="flex items-start gap-3.5 px-6 py-4 animate-fade-slide">
      <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
        <Hexagon className="w-4 h-4" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-1.5 pt-1.5">
        <span className="text-xs text-muted-foreground font-medium">
          {isLoaded ? 'Analyzing your data…' : 'Thinking…'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-[6px] h-[6px] rounded-full bg-primary/60 animate-dot-1" />
          <span className="w-[6px] h-[6px] rounded-full bg-primary/60 animate-dot-2" />
          <span className="w-[6px] h-[6px] rounded-full bg-primary/60 animate-dot-3" />
        </div>
      </div>
    </div>
  );
}
