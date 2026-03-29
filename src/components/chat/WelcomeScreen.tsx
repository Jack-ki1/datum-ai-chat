import { useDatumStore } from '@/store/datum.store';
import { salesData, hrData, stockData } from '@/lib/sample-datasets';
import { BarChart3, Search, Sparkles, FileText, Code2, Lightbulb } from 'lucide-react';

const starters = [
  { icon: Sparkles, title: 'Profile my dataset', desc: 'Column types, nulls, distributions', prompt: 'Profile all columns in detail', color: 'text-datum-violet' },
  { icon: BarChart3, title: 'Visualize this data', desc: 'Auto-select the best chart type', prompt: 'Visualize the most interesting patterns in this data', color: 'text-datum-cyan' },
  { icon: Search, title: 'Find anomalies', desc: 'Statistical irregularities flagged', prompt: 'Find anomalies and outliers in this dataset', color: 'text-datum-red' },
  { icon: FileText, title: 'Clean data quality', desc: 'Handle nulls, types, duplicates', prompt: 'Analyze data quality and suggest fixes', color: 'text-datum-green' },
  { icon: Code2, title: 'Write SQL for this', desc: 'Generate an optimized query', prompt: 'Write a SQL query for this dataset', color: 'text-datum-amber' },
  { icon: Lightbulb, title: 'Top 5 insights', desc: 'Most important findings', prompt: 'Give me the top 5 key insights from this data', color: 'text-primary' },
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
        What can I analyze?
      </h1>
      <p className="text-muted-foreground text-[15px] text-center max-w-md mb-10 leading-relaxed">
        Upload a dataset and ask anything — from quick stats to deep ML analysis.
      </p>

      {/* Starter cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl w-full mb-10">
        {starters.map(s => (
          <button key={s.title} onClick={() => onPrompt(s.prompt)}
            className="group flex flex-col gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/25 hover:shadow-md text-left transition-all duration-200">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl bg-muted flex items-center justify-center group-hover:scale-105 transition-transform`}>
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
