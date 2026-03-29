import { useDatumStore } from '@/store/datum.store';
import { salesData, hrData, stockData } from '@/lib/sample-datasets';

const starters = [
  { icon: '◈', title: 'Profile my dataset', desc: 'Column types, nulls, distributions', prompt: 'Profile all columns in detail' },
  { icon: '◑', title: 'Visualize this data', desc: 'Auto-select the best chart type', prompt: 'Visualize the most interesting patterns in this data' },
  { icon: '◇', title: 'Find anomalies & outliers', desc: 'Statistical irregularities flagged', prompt: 'Find anomalies and outliers in this dataset' },
  { icon: '⚙', title: 'Clean & fix data quality', desc: 'Handle nulls, types, duplicates', prompt: 'Analyze data quality and suggest fixes' },
  { icon: '→', title: 'Write SQL for this', desc: 'Generate an optimized query', prompt: 'Write a SQL query for this dataset' },
  { icon: '◎', title: 'Give me the top 5 insights', desc: 'Most important findings', prompt: 'Give me the top 5 key insights from this data' },
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
      <h1 className="font-display font-extrabold text-5xl bg-gradient-to-r from-primary via-datum-cyan to-datum-violet bg-clip-text text-transparent mb-3">
        DATUM
      </h1>
      <p className="text-muted-foreground text-sm text-center max-w-md mb-10">
        The data analyst that already knows your data. Upload a file and ask anything.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 max-w-2xl w-full mb-8">
        {starters.map(s => (
          <button key={s.title} onClick={() => onPrompt(s.prompt)}
            className="group flex flex-col gap-1 p-3.5 rounded-lg border border-border bg-card hover:border-datum-border-2 hover:bg-datum-raised text-left transition-all duration-150">
            <div className="flex items-center gap-2">
              <span className="text-primary text-sm">{s.icon}</span>
              <span className="text-xs font-medium text-foreground">{s.title}</span>
            </div>
            <span className="text-[10px] text-muted-foreground leading-relaxed">{s.desc}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {samples.map(s => (
          <button key={s.name} onClick={() => ingest(s.data, s.name)}
            className="px-3 py-1.5 rounded-md border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-datum-border-2 transition-colors">
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
