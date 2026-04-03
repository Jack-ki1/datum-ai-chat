import { useRef, useEffect, useState } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { WelcomeScreen } from './WelcomeScreen';
import { MessageBubble } from './MessageBubble';
import { InputBar } from './InputBar';
import { TypingIndicator } from './TypingIndicator';
import { Pin } from 'lucide-react';

export function ChatWindow() {
  const { messages, isAiLoading, sendMessage } = useDatumStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [showPinned, setShowPinned] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiLoading]);

  const togglePin = (id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const pinnedMessages = messages.filter(m => pinnedIds.has(m.id));
  const displayMessages = showPinned && pinnedMessages.length > 0 ? pinnedMessages : messages;

  return (
    <div className="flex flex-col h-full">
      {/* Pinned filter toggle */}
      {pinnedIds.size > 0 && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50">
          <button
            onClick={() => setShowPinned(!showPinned)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              showPinned ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Pin className="w-3 h-3" />
            {pinnedIds.size} pinned
          </button>
          {showPinned && (
            <button onClick={() => setShowPinned(false)} className="text-[11px] text-muted-foreground hover:text-foreground">
              Show all
            </button>
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <WelcomeScreen onPrompt={(text) => sendMessage(text)} />
        ) : (
          <div className="py-4">
            {displayMessages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isPinned={pinnedIds.has(msg.id)}
                onTogglePin={msg.role === 'assistant' ? () => togglePin(msg.id) : undefined}
              />
            ))}
            {isAiLoading && !showPinned && <TypingIndicator />}
          </div>
        )}
      </div>
      <InputBar />
    </div>
  );
}
