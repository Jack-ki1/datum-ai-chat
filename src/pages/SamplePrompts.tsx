import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { promptSectors } from '@/lib/sample-prompts';
import { useDatumStore } from '@/store/datum.store';
import { BarChart3, Brain, Wrench, Settings, Layers, ArrowLeft, Copy, Check } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  BarChart3, Brain, Wrench, Settings, Layers,
};

export default function SamplePrompts() {
  const [activeTab, setActiveTab] = useState(promptSectors[0].id);
  const [copied, setCopied] = useState<string | null>(null);
  const navigate = useNavigate();
  const { sendMessage, isLoaded } = useDatumStore();

  const handlePromptClick = (text: string) => {
    if (isLoaded) {
      navigate('/chat');
      setTimeout(() => sendMessage(text), 300);
    } else {
      navigate('/chat');
    }
  };

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const activeSector = promptSectors.find(s => s.id === activeTab)!;

  return (
    <AppShell>
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('/chat')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Sample Prompts</h1>
              <p className="text-sm text-muted-foreground">Browse 250+ expert prompts across data disciplines</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
            {promptSectors.map(sector => {
              const Icon = iconMap[sector.icon] || Layers;
              const isActive = sector.id === activeTab;
              return (
                <button key={sector.id} onClick={() => setActiveTab(sector.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {sector.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {sector.prompts.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Prompts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeSector.prompts.map(prompt => (
              <button key={prompt.id} onClick={() => handlePromptClick(prompt.text)}
                className="group text-left p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                    {prompt.text}
                  </p>
                  <button onClick={(e) => handleCopy(prompt.id, prompt.text, e)}
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                    {copied === prompt.id ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{prompt.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
