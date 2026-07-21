import { useDatumStore } from '@/store/datum.store';
import fineseLogoAsset from '@/assets/finese-logo.png.asset.json';
const fineseLogo = fineseLogoAsset.url;

export function TypingIndicator() {
  const { isLoaded } = useDatumStore();

  return (
    <div className="flex items-start gap-3.5 px-6 py-4 animate-fade-slide">
      <div className="relative w-8 h-8 shrink-0">
        <span className="absolute inset-0 rounded-xl bg-brand-gradient animate-pulse-ring" aria-hidden />
        <div className="relative w-8 h-8 rounded-xl bg-brand-gradient animate-gradient flex items-center justify-center shadow-sm ring-1 ring-primary/20">
          <img src={fineseLogo} alt="" className="w-5 h-5 rounded-md object-contain opacity-95" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 pt-1.5">
        <span className="text-xs font-medium text-brand-gradient">
          {isLoaded ? 'Analyzing your data…' : 'Thinking…'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-[6px] h-[6px] rounded-full bg-primary animate-dot-1" />
          <span className="w-[6px] h-[6px] rounded-full bg-datum-cyan animate-dot-2" />
          <span className="w-[6px] h-[6px] rounded-full bg-datum-pink animate-dot-3" />
        </div>
      </div>
    </div>
  );
}
