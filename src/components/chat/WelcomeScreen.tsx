import { useDatumStore } from '@/store/datum.store';
import { salesData, hrData, stockData } from '@/lib/sample-datasets';
import { BarChart3, Search, Sparkles, Brain, Bug, FlaskConical, GraduationCap, FileText, Blocks, BookOpen } from 'lucide-react';

const starters = [
  { icon: Sparkles, title: 'Analyze my data', desc: 'Comprehensive analysis with charts & stats', prompt: 'Run a comprehensive analysis on this data — key findings, distributions, and visualizations', color: 'text-primary' },
  { icon: Brain, title: 'Build a model', desc: 'ML pipeline with full evaluation', prompt: 'Suggest and build the best ML model for this data with evaluation metrics', color: 'text-datum-violet' },
  { icon: Bug, title: 'Debug an error', desc: 'Paste error for root cause diagnosis', prompt: 'I have an error to debug — paste your error message or traceback', color: 'text-datum-red' },
  { icon: FlaskConical, title: 'Design experiment', desc: 'A/B test, power analysis, metrics', prompt: 'Help me design an experiment — A/B test setup, metric selection, and power analysis', color: 'text-datum-cyan' },
  { icon: GraduationCap, title: 'Explain a concept', desc: 'Learn any data topic with examples', prompt: 'Explain a data science concept — pick any topic and I will explain it with examples and intuition', color: 'text-datum-amber' },
  { icon: FileText, title: 'Generate documentation', desc: 'Docs, data dictionaries, READMEs', prompt: 'Generate documentation for this dataset — data dictionary, column descriptions, and usage notes', color: 'text-datum-green' },
  { icon: Blocks, title: 'System design', desc: 'Pipelines, architecture, monitoring', prompt: 'Help me design a data system architecture — pipelines, storage, processing, and monitoring', color: 'text-datum-violet' },
  { icon: BookOpen, title: 'Tell the data story', desc: 'Executive summary for stakeholders', prompt: 'Create an executive summary and data story for stakeholders — key findings, impact, and recommendations', color: 'text-primary' },
];

const samples = [
  { label: '📦 Sales Data', data: salesData, name: 'sales_data.csv' },
  { label: '👥 HR Data', data: hrData, name: 'hr_data.csv' },
  { label: '📈 Stock Data', data: stockData, name: 'stock_data.csv' },
];

export function WelcomeScreen({ onPrompt }: { onPrompt: (text: string) => void }) {
  const { ingest } = useDatumStore();

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      {/* Hero */}
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <Sparkles className="w-7 h-7 text-primary" />
      </div>
      <h1 className="font-display font-extrabold text-4xl text-foreground mb-2 tracking-tight">
        What can I help with?
      </h1>
      <p className="text-muted-foreground text-[15px] text-center max-w-md mb-10 leading-relaxed">
        Upload data for analysis, or ask anything — debugging, system design, experiments, research synthesis.
      </p>

      {/* Starter cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full mb-10">
        {starters.map(s => (
          <button key={s.title} onClick={() => onPrompt(s.prompt)}
            className="group flex flex-col gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/25 hover:shadow-md text-left transition-all duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center group-hover:scale-105 transition-transform">
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <span className="text-[13px] font-semibold text-foreground">{s.title}</span>
            </div>
            <span className="text-[11px] text-muted-foreground leading-relaxed pl-[42px]">{s.desc}</span>
          </button>
        ))}
      </div>

      {/* Sample datasets */}
      <div className="flex flex-col items-center gap-2.5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Try a sample dataset</p>
        <div className="flex items-center gap-2">
          {samples.map(s => (
            <button key={s.name} onClick={() => ingest(s.data, s.name)}
              className="px-4 py-2 rounded-xl border border-border bg-card text-[13px] text-muted-foreground hover:text-foreground hover:border-primary/25 hover:shadow-sm transition-all duration-200">
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
