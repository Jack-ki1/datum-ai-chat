import { useRef, useEffect } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { WelcomeScreen } from './WelcomeScreen';
import { MessageBubble } from './MessageBubble';
import { InputBar } from './InputBar';
import { TypingIndicator } from './TypingIndicator';

export function ChatWindow() {
  const { messages, isAiLoading, sendMessage } = useDatumStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiLoading]);

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <WelcomeScreen onPrompt={(text) => sendMessage(text)} />
        ) : (
          <div className="py-4">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isAiLoading && <TypingIndicator />}
          </div>
        )}
      </div>
      <InputBar />
    </div>
  );
}
