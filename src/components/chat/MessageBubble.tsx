import type { ChatMessage } from '@/types';
import ReactMarkdown from 'react-markdown';
import { ArtifactRenderer } from '@/components/artifacts/ArtifactRenderer';
import { User, Hexagon } from 'lucide-react';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex gap-3.5 px-6 py-4 animate-fade-slide ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
        isUser
          ? 'bg-muted text-muted-foreground'
          : 'bg-primary text-primary-foreground'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Hexagon className="w-4 h-4" strokeWidth={2.5} />}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2.5 max-w-[85%] min-w-0 ${isUser ? 'items-end' : ''}`}>
        {isUser ? (
          <div className="px-4 py-2.5 rounded-2xl rounded-tr-md bg-primary text-primary-foreground text-sm leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-foreground">
            <ReactMarkdown
              components={{
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                code: ({ children }) => <code className="font-mono text-xs bg-primary/8 text-primary px-1.5 py-0.5 rounded-md">{children}</code>,
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Artifacts */}
        {message.artifacts?.map((art, i) => (
          <ArtifactRenderer key={i} artifact={art} />
        ))}

        <span className="text-[10px] text-muted-foreground/50">{time}</span>
      </div>
    </div>
  );
}
