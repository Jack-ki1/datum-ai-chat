import type { ChatMessage } from '@/types';
import ReactMarkdown from 'react-markdown';
import { ArtifactRenderer } from '@/components/artifacts/ArtifactRenderer';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex gap-3 px-6 py-3 animate-fade-slide ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
        isUser
          ? 'bg-datum-cyan/15 border-datum-cyan/30'
          : 'bg-primary/15 border-primary/30'
      }`}>
        <span className={`text-[10px] font-bold ${isUser ? 'text-datum-cyan' : 'text-primary'}`}>
          {isUser ? 'U' : 'D'}
        </span>
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[85%] min-w-0 ${isUser ? 'items-end' : ''}`}>
        <div className={`text-sm leading-relaxed ${isUser ? 'text-right' : ''}`}>
          <ReactMarkdown
            components={{
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              code: ({ children }) => <code className="font-mono text-xs bg-accent px-1 py-0.5 rounded text-datum-cyan">{children}</code>,
              p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>,
              li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Artifacts */}
        {message.artifacts?.map((art, i) => (
          <ArtifactRenderer key={i} artifact={art} />
        ))}

        <span className="text-[9px] font-mono text-datum-text-3">{time}</span>
      </div>
    </div>
  );
}
