export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-6 py-3 animate-fade-slide">
      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-primary">D</span>
      </div>
      <div className="flex items-center gap-1 pt-2">
        <span className="w-[5px] h-[5px] rounded-full bg-primary animate-dot-1" />
        <span className="w-[5px] h-[5px] rounded-full bg-primary animate-dot-2" />
        <span className="w-[5px] h-[5px] rounded-full bg-primary animate-dot-3" />
      </div>
    </div>
  );
}
