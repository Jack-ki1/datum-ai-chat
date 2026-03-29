import type { Artifact } from '@/types';
import ReactMarkdown from 'react-markdown';

const DOT_COLORS = ['text-datum-cyan', 'text-datum-amber', 'text-datum-green', 'text-datum-violet', 'text-datum-red', 'text-datum-pink'];

export function InsightsArtifact({ artifact }: { artifact: Artifact }) {
  const insights = artifact.insights || [];

  return (
    <div className="p-3 space-y-1.5">
      {insights.map((insight, i) => (
        <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-md bg-secondary/80 border border-border/50">
          <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[i % DOT_COLORS.length]} bg-current`} />
          <span className="text-xs leading-relaxed text-muted-foreground">
            <ReactMarkdown
              components={{
                p: ({ children }) => <span>{children}</span>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                code: ({ children }) => <code className="font-mono text-[10px] bg-accent px-1 rounded text-datum-cyan">{children}</code>,
              }}
            >
              {insight}
            </ReactMarkdown>
          </span>
        </div>
      ))}
    </div>
  );
}
