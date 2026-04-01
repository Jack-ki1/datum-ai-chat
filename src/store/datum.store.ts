import { create } from 'zustand';
import type { ChatMessage, ColumnProfile, Session, Artifact, ChangelogEntry } from '@/types';
import { buildProfile, healthScore, formatNumber } from '@/lib/stats';
import { buildDatasetContext } from '@/lib/context-builder';
import { streamChat } from '@/lib/streaming';
import { parseArtifacts } from '@/lib/artifact-parser';

function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

interface DatumStore {
  dataset: Record<string, any>[] | null;
  transformedDataset: Record<string, any>[] | null;
  activeView: 'original' | 'transformed';
  profile: ColumnProfile[] | null;
  fileName: string;
  isLoaded: boolean;
  sessions: Session[];
  activeSessionId: string;
  messages: ChatMessage[];
  isAiLoading: boolean;
  sidebarOpen: boolean;
  changelog: ChangelogEntry[];
  changelogOpen: boolean;
  ingest: (data: Record<string, any>[], name: string) => void;
  sendMessage: (content: string) => Promise<void>;
  newSession: () => void;
  setActiveSession: (id: string) => void;
  toggleSidebar: () => void;
  setActiveView: (view: 'original' | 'transformed') => void;
  setTransformedDataset: (data: Record<string, any>[]) => void;
  toggleChangelog: () => void;
  addChangelogEntry: (action: ChangelogEntry['action'], description: string) => void;
  removeChangelogEntry: (id: string) => void;
  regenerateLastMessage: () => void;
}

function generateWelcome(data: Record<string, any>[], profile: ColumnProfile[], fileName: string): ChatMessage {
  const numCols = profile.filter(p => p.type === 'numeric');
  const catCols = profile.filter(p => p.type === 'categorical');
  const nullCols = profile.filter(p => p.nullCount > 0);
  const health = healthScore(profile);
  const outlierCols = numCols.filter(p => (p.outliers || 0) > 0);

  const insights = [
    `Dataset contains **${data.length} rows** and **${profile.length} columns**`,
    `**${numCols.length}** numeric columns, **${catCols.length}** categorical columns`,
    nullCols.length > 0
      ? `**${nullCols.length} columns** have missing values (${nullCols.map(c => c.col).join(', ')})`
      : `All columns are **complete** — no missing values detected`,
    `Data health score: **${health}%** ${health >= 90 ? '✓' : health >= 70 ? '⚠' : '✗'}`,
    outlierCols.length > 0
      ? `**${outlierCols.length} columns** contain statistical outliers`
      : `No statistical outliers detected in numeric columns`,
  ];

  const artifacts: Artifact[] = [
    { type: 'insights', insights, title: 'Dataset Overview' },
    { type: 'table', data: data.slice(0, 5), title: 'First 5 Rows' },
  ];

  return {
    id: uid(), role: 'assistant',
    content: `I've loaded and profiled **"${fileName}"**. Here's what I found:`,
    artifacts, timestamp: now(),
  };
}

export const useDatumStore = create<DatumStore>((set, get) => {
  const initialSessionId = uid();
  return {
    dataset: null, transformedDataset: null, activeView: 'original' as const,
    profile: null, fileName: '', isLoaded: false,
    sessions: [{ id: initialSessionId, title: 'New Session', createdAt: now(), messages: [] }],
    activeSessionId: initialSessionId,
    messages: [], isAiLoading: false, sidebarOpen: true,
    changelog: [], changelogOpen: false,

    ingest: (data, name) => {
      const profile = buildProfile(data);
      const welcome = generateWelcome(data, profile, name);
      const { activeSessionId, sessions } = get();
      const msgs = [welcome];
      const entry: ChangelogEntry = { id: uid(), action: 'upload', description: `Uploaded ${name} (${data.length} rows)`, timestamp: now() };
      set({
        dataset: data, profile, fileName: name, isLoaded: true, messages: msgs,
        changelog: [...get().changelog, entry],
        sessions: sessions.map(s => s.id === activeSessionId
          ? { ...s, title: name.replace(/\.\w+$/, ''), fileName: name, rowCount: data.length, colCount: Object.keys(data[0] || {}).length, messages: msgs }
          : s),
      });
    },

    sendMessage: async (content) => {
      const { dataset, profile, fileName, messages, activeSessionId, sessions } = get();
      const userMsg: ChatMessage = { id: uid(), role: 'user', content, timestamp: now() };
      const newMsgs = [...messages, userMsg];
      set({ messages: newMsgs, isAiLoading: true });

      // Build dataset context for the AI
      const datasetContext = dataset && profile
        ? buildDatasetContext(dataset, profile, fileName)
        : null;

      // Build conversation history for the AI (exclude artifacts from content)
      const conversationHistory = newMsgs.map(m => ({
        role: m.role,
        content: m.role === 'assistant'
          ? (m.content || '') + (m.artifacts?.length ? ' [artifacts rendered inline]' : '')
          : m.content,
      }));

      const assistantId = uid();
      let fullText = '';

      try {
        await streamChat({
          messages: conversationHistory,
          datasetContext,
          onDelta: (chunk) => {
            fullText += chunk;
            // Update the streaming message in real-time
            const streamingMsg: ChatMessage = {
              id: assistantId, role: 'assistant', content: fullText, timestamp: now(),
            };
            const currentMsgs = get().messages;
            const lastMsg = currentMsgs[currentMsgs.length - 1];
            if (lastMsg?.id === assistantId) {
              set({ messages: currentMsgs.map(m => m.id === assistantId ? streamingMsg : m) });
            } else {
              set({ messages: [...currentMsgs, streamingMsg] });
            }
          },
          onDone: () => {
            // Parse artifacts from the completed text
            const { cleanText, artifacts } = parseArtifacts(fullText);

            // Inject data into artifacts
            const enrichedArtifacts = artifacts.map(art => {
              if (art.type === 'chart' && dataset) {
                return { ...art, data: dataset };
              }
              if (art.type === 'profile' && profile) {
                return { ...art, profile };
              }
              return art;
            });

            const finalMsg: ChatMessage = {
              id: assistantId, role: 'assistant',
              content: cleanText, artifacts: enrichedArtifacts, timestamp: now(),
            };

            const currentMsgs = get().messages;
            const finalMsgs = currentMsgs.map(m => m.id === assistantId ? finalMsg : m);
            const { sessions: currentSessions } = get();

            set({
              messages: finalMsgs, isAiLoading: false,
              sessions: currentSessions.map(s => s.id === activeSessionId
                ? { ...s, messages: finalMsgs, title: s.title === 'New Session' ? content.slice(0, 30) : s.title }
                : s),
            });
          },
          onError: (error) => {
            const errorMsg: ChatMessage = {
              id: assistantId, role: 'assistant',
              content: `⚠️ **Error:** ${error}\n\nPlease try again or rephrase your question.`,
              timestamp: now(),
            };
            const currentMsgs = get().messages;
            const lastMsg = currentMsgs[currentMsgs.length - 1];
            const finalMsgs = lastMsg?.id === assistantId
              ? currentMsgs.map(m => m.id === assistantId ? errorMsg : m)
              : [...currentMsgs, errorMsg];

            set({
              messages: finalMsgs, isAiLoading: false,
              sessions: get().sessions.map(s => s.id === activeSessionId ? { ...s, messages: finalMsgs } : s),
            });
          },
        });
      } catch (e) {
        const errorMsg: ChatMessage = {
          id: assistantId, role: 'assistant',
          content: `⚠️ **Connection error:** Unable to reach AI service. Please check your connection and try again.`,
          timestamp: now(),
        };
        const currentMsgs = get().messages;
        const lastMsg = currentMsgs[currentMsgs.length - 1];
        const finalMsgs = lastMsg?.id === assistantId
          ? currentMsgs.map(m => m.id === assistantId ? errorMsg : m)
          : [...currentMsgs, errorMsg];
        set({
          messages: finalMsgs, isAiLoading: false,
          sessions: get().sessions.map(s => s.id === activeSessionId ? { ...s, messages: finalMsgs } : s),
        });
      }
    },

    newSession: () => {
      const id = uid();
      set(s => ({
        dataset: null, profile: null, fileName: '', isLoaded: false, messages: [],
        activeSessionId: id,
        sessions: [...s.sessions, { id, title: 'New Session', createdAt: now(), messages: [] }],
      }));
    },

    setActiveSession: (id) => {
      const session = get().sessions.find(s => s.id === id);
      if (session) set({ activeSessionId: id, messages: session.messages });
    },

    toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
    setActiveView: (view) => set({ activeView: view }),
    setTransformedDataset: (data) => set({ transformedDataset: data }),
    toggleChangelog: () => set(s => ({ changelogOpen: !s.changelogOpen })),
    addChangelogEntry: (action, description) => set(s => ({
      changelog: [...s.changelog, { id: uid(), action, description, timestamp: now() }],
    })),
    removeChangelogEntry: (id) => set(s => ({
      changelog: s.changelog.filter(e => e.id !== id),
    })),
    regenerateLastMessage: () => {
      const { messages } = get();
      // Find the last user message
      const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === 'user');
      if (lastUserMsgIndex === -1) return;
      const actualIndex = messages.length - 1 - lastUserMsgIndex;
      const lastUserMsg = messages[actualIndex];
      // Remove all messages after (and including) the last assistant response
      const trimmed = messages.slice(0, actualIndex + 1);
      set({ messages: trimmed });
      // Re-send
      get().sendMessage(lastUserMsg.content);
    },
  };
});
