import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ColumnProfile, Session, Artifact, ChangelogEntry } from '@/types';
import { ingestDataset, loadDatasetRows } from '@/lib/ingest-client';
import { MAX_FILE_BYTES } from '@/lib/constants';
import { streamChat } from '@/lib/streaming';
import { parseArtifacts } from '@/lib/artifact-parser';

function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

const MAX_PERSISTED_SESSIONS = 25; // LRU cap
export { MAX_FILE_BYTES };

export interface ExtraDataset {
  fileHash: string;
  fileName: string;
  rowCount: number;
  colCount: number;
}

interface DatumStore {
  // In-memory dataset (NOT persisted to localStorage)
  dataset: Record<string, any>[] | null;
  transformedDataset: Record<string, any>[] | null;
  activeView: 'original' | 'transformed';
  profile: ColumnProfile[] | null;
  correlations: any[] | null;
  advanced: any | null;
  healthScore: number;
  fileName: string;
  fileHash: string | null;
  isLoaded: boolean;
  isIngesting: boolean;
  ingestError: string | null;
  /** Multi-file: every successfully ingested dataset for this session */
  extraDatasets: ExtraDataset[];
  /** Live ingest progress (0-100) — UI-only */
  ingestProgress: number;
  ingestStage: 'idle' | 'parsing' | 'profiling';

  // Connection / async state
  connectionStatus: 'idle' | 'connecting' | 'streaming' | 'error';
  abortController: AbortController | null;

  // Sessions (only refs persist; messages persist for last N sessions)
  sessions: Session[];
  activeSessionId: string;
  messages: ChatMessage[];
  isAiLoading: boolean;
  sidebarOpen: boolean;
  changelog: ChangelogEntry[];
  changelogOpen: boolean;

  // Actions
  ingest: (data: Record<string, any>[], name: string) => Promise<void>;
  setIngestProgress: (pct: number, stage?: 'parsing' | 'profiling') => void;
  cancelIngest: () => void;
  switchActiveDataset: (fileHash: string) => Promise<void>;
  removeExtraDataset: (fileHash: string) => void;
  hydrateActiveDataset: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  cancelStream: () => void;
  newSession: () => void;
  setActiveSession: (id: string) => Promise<void>;
  toggleSidebar: () => void;
  setActiveView: (view: 'original' | 'transformed') => void;
  setTransformedDataset: (data: Record<string, any>[]) => void;
  toggleChangelog: () => void;
  addChangelogEntry: (action: ChangelogEntry['action'], description: string) => void;
  removeChangelogEntry: (id: string) => void;
  regenerateLastMessage: () => void;
}

function generateWelcome(rowCount: number, profile: ColumnProfile[], fileName: string, healthScore: number): ChatMessage {
  const numCols = profile.filter(p => p.type === 'numeric');
  const catCols = profile.filter(p => p.type === 'categorical');
  const nullCols = profile.filter(p => p.nullCount > 0);
  const outlierCols = numCols.filter(p => (p.outliers || 0) > 0);

  const insights = [
    `Dataset contains **${rowCount} rows** and **${profile.length} columns**`,
    `**${numCols.length}** numeric columns, **${catCols.length}** categorical columns`,
    nullCols.length > 0
      ? `**${nullCols.length} columns** have missing values (${nullCols.map(c => c.col).join(', ')})`
      : `All columns are **complete** — no missing values detected`,
    `Data health score: **${healthScore}%** ${healthScore >= 90 ? '✓' : healthScore >= 70 ? '⚠' : '✗'}`,
    outlierCols.length > 0
      ? `**${outlierCols.length} columns** contain statistical outliers`
      : `No statistical outliers detected in numeric columns`,
  ];

  const artifacts: Artifact[] = [
    { type: 'insights', insights, title: 'Dataset Overview' },
  ];

  return {
    id: uid(), role: 'assistant',
    content: `I've loaded and profiled **"${fileName}"** server-side. All future numbers will be computed against the real data via tool-calls. Here's what I found:`,
    artifacts, timestamp: now(),
  };
}

export const useDatumStore = create<DatumStore>()(
  persist(
    (set, get) => {
      const initialSessionId = uid();
      return {
        dataset: null, transformedDataset: null, activeView: 'original' as const,
        profile: null, correlations: null, advanced: null, healthScore: 0,
        fileName: '', fileHash: null, isLoaded: false,
        isIngesting: false, ingestError: null,
        extraDatasets: [],
        ingestProgress: 0,
        ingestStage: 'idle' as const,
        ingestAbort: null as AbortController | null,
        connectionStatus: 'idle' as const,
        abortController: null,
        sessions: [{ id: initialSessionId, title: 'New Session', createdAt: now(), messages: [] }],
        activeSessionId: initialSessionId,
        messages: [], isAiLoading: false, sidebarOpen: true,
        changelog: [], changelogOpen: false,

        ingest: async (data, name) => {
          const ac = new AbortController();
          set({ isIngesting: true, ingestError: null, ingestStage: 'profiling', ingestProgress: 0, ingestAbort: ac });
          try {
            const res = await ingestDataset(data, name, {
              signal: ac.signal,
              onUploadProgress: (pct) => set({ ingestProgress: pct, ingestStage: 'profiling' }),
              onUploaded: () => set({ ingestProgress: 100, ingestStage: 'profiling' }),
            });
            const welcome = generateWelcome(res.row_count, res.profile, res.file_name, res.health_score);
            const { activeSessionId, sessions, extraDatasets, isLoaded } = get();
            const msgs = [welcome];
            const entry: ChangelogEntry = {
              id: uid(),
              action: 'upload',
              description: `Uploaded ${name} (${res.row_count} rows)${res.cached ? ' [cached profile]' : ''}`,
              timestamp: now(),
            };
            // Append to extraDatasets so multi-file uploads keep both around.
            const others = extraDatasets.filter(d => d.fileHash !== res.file_hash);
            const nextExtras: ExtraDataset[] = [
              ...others,
              { fileHash: res.file_hash, fileName: res.file_name, rowCount: res.row_count, colCount: res.col_count },
            ];
            set({
              dataset: data,
              profile: res.profile,
              correlations: res.correlations,
              advanced: res.advanced,
              healthScore: res.health_score,
              fileName: res.file_name,
              fileHash: res.file_hash,
              isLoaded: true,
              isIngesting: false,
              ingestProgress: 100,
              ingestStage: 'idle',
              ingestAbort: null,
              extraDatasets: nextExtras,
              messages: msgs,
              changelog: [...get().changelog, entry],
              sessions: sessions.map(s => s.id === activeSessionId
                ? {
                    ...s,
                    title: name.replace(/\.\w+$/, ''),
                    fileName: name,
                    fileHash: res.file_hash,
                    rowCount: res.row_count,
                    colCount: res.col_count,
                    messages: msgs,
                  }
                : s),
            });
          } catch (e) {
            set({ isIngesting: false, ingestStage: 'idle', ingestProgress: 0, ingestAbort: null, ingestError: e instanceof Error ? e.message : 'Ingest failed' });
            throw e;
          }
        },

        setIngestProgress: (pct, stage) => set({
          ingestProgress: pct,
          ...(stage ? { ingestStage: stage, isIngesting: true } : {}),
        }),

        cancelIngest: () => {
          const ac = (get() as any).ingestAbort as AbortController | null;
          if (ac) ac.abort();
          set({ isIngesting: false, ingestStage: 'idle', ingestProgress: 0, ingestAbort: null });
        },

        switchActiveDataset: async (fileHash) => {
          const extra = get().extraDatasets.find(d => d.fileHash === fileHash);
          if (!extra) return;
          try {
            const rows = await loadDatasetRows(fileHash);
            const res = await ingestDataset(rows, extra.fileName);
            set({
              dataset: rows,
              profile: res.profile,
              correlations: res.correlations,
              advanced: res.advanced,
              healthScore: res.health_score,
              fileName: res.file_name,
              fileHash: res.file_hash,
              isLoaded: true,
            });
          } catch (e) {
            console.warn('switchActiveDataset failed:', e);
          }
        },

        removeExtraDataset: (fileHash) => set(s => ({
          extraDatasets: s.extraDatasets.filter(d => d.fileHash !== fileHash),
        })),

        hydrateActiveDataset: async () => {
          const { fileHash, dataset } = get();
          if (!fileHash || dataset) return;
          try {
            const rows = await loadDatasetRows(fileHash);
            set({ dataset: rows });
          } catch (e) {
            console.warn('Hydrate failed:', e);
          }
        },

        cancelStream: () => {
          const { abortController } = get();
          if (abortController) {
            abortController.abort();
            set({ abortController: null, isAiLoading: false, connectionStatus: 'idle' });
          }
        },

        sendMessage: async (content) => {
          const { profile, correlations, advanced, healthScore, fileName, fileHash, messages, activeSessionId } = get();
          const userMsg: ChatMessage = { id: uid(), role: 'user', content, timestamp: now() };
          const newMsgs = [...messages, userMsg];
          const ac = new AbortController();
          set({ messages: newMsgs, isAiLoading: true, abortController: ac, connectionStatus: 'connecting' });

          const datasetContext = fileHash ? {
            fileName,
            rowCount: get().dataset?.length || (get().sessions.find(s => s.id === activeSessionId)?.rowCount || 0),
            colCount: profile?.length || 0,
            healthScore,
            profile,
            correlations,
            advancedContext: advanced,
            // Privacy + accuracy: never ship raw rows to the LLM.
            // The model must call compute tools for any number it needs.
            sampleData: [],
          } : null;

          const conversationHistory = newMsgs.map(m => ({
            role: m.role,
            content: m.role === 'assistant'
              ? (m.content || '') + (m.artifacts?.length ? ' [artifacts rendered inline]' : '')
              : m.content,
          }));

          const assistantId = uid();
          let fullText = '';
          let attempt = 0;
          const maxAttempts = 3;

          const tryStream = async (): Promise<void> => {
            attempt++;
            try {
              await streamChat({
                messages: conversationHistory,
                datasetContext,
                fileHash: fileHash || undefined,
                signal: ac.signal,
                onConnect: () => set({ connectionStatus: 'streaming' }),
                onDelta: (chunk) => {
                  fullText += chunk;
                  const streamingMsg: ChatMessage = {
                    id: assistantId, role: 'assistant', content: fullText, timestamp: now(),
                  };
                  const cur = get().messages;
                  const last = cur[cur.length - 1];
                  if (last?.id === assistantId) {
                    set({ messages: cur.map(m => m.id === assistantId ? streamingMsg : m) });
                  } else {
                    set({ messages: [...cur, streamingMsg] });
                  }
                },
                onDone: () => {
                  const { cleanText, artifacts } = parseArtifacts(fullText);
                  const { dataset } = get();
                  const enriched = artifacts.map(art => {
                    if (art.type === 'chart' && dataset) return { ...art, data: dataset };
                    if (art.type === 'profile' && profile) return { ...art, profile };
                    return art;
                  });
                  const finalMsg: ChatMessage = {
                    id: assistantId, role: 'assistant',
                    content: cleanText, artifacts: enriched, timestamp: now(),
                  };
                  const cur = get().messages;
                  const finalMsgs = cur.map(m => m.id === assistantId ? finalMsg : m);
                  const sessionsCur = get().sessions;
                  set({
                    messages: finalMsgs,
                    isAiLoading: false,
                    abortController: null,
                    connectionStatus: 'idle',
                    sessions: sessionsCur.map(s => s.id === activeSessionId
                      ? { ...s, messages: finalMsgs, title: s.title === 'New Session' ? content.slice(0, 30) : s.title }
                      : s),
                  });
                },
                onError: (error) => { throw new Error(error); },
              });
            } catch (err: any) {
              if (ac.signal.aborted) {
                set({ isAiLoading: false, abortController: null, connectionStatus: 'idle' });
                return;
              }
              if (attempt < maxAttempts) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(r => setTimeout(r, delay));
                fullText = '';
                return tryStream();
              }
              const errMsg: ChatMessage = {
                id: assistantId, role: 'assistant',
                content: `⚠️ **Error after ${attempt} attempts:** ${err?.message || 'Unknown'}`,
                timestamp: now(),
              };
              const cur = get().messages;
              const last = cur[cur.length - 1];
              const finalMsgs = last?.id === assistantId
                ? cur.map(m => m.id === assistantId ? errMsg : m)
                : [...cur, errMsg];
              set({
                messages: finalMsgs, isAiLoading: false, abortController: null, connectionStatus: 'error',
                sessions: get().sessions.map(s => s.id === activeSessionId ? { ...s, messages: finalMsgs } : s),
              });
            }
          };

          await tryStream();
        },

        newSession: () => {
          const id = uid();
          set(s => ({
            dataset: null, profile: null, correlations: null, advanced: null,
            fileName: '', fileHash: null, isLoaded: false, messages: [],
            activeSessionId: id,
            sessions: [...s.sessions, { id, title: 'New Session', createdAt: now(), messages: [] }],
          }));
        },

        setActiveSession: async (id) => {
          const session = get().sessions.find(s => s.id === id);
          if (!session) return;
          set({
            activeSessionId: id,
            messages: session.messages,
            fileName: session.fileName || '',
            fileHash: session.fileHash || null,
            isLoaded: !!session.fileHash,
            dataset: null,
            profile: null,
          });
          // Lazy hydrate dataset & profile
          if (session.fileHash) {
            try {
              const rows = await loadDatasetRows(session.fileHash);
              // Re-ingest from server cache to get profile (will hit cache)
              const res = await ingestDataset(rows, session.fileName || 'dataset');
              set({
                dataset: rows,
                profile: res.profile,
                correlations: res.correlations,
                advanced: res.advanced,
                healthScore: res.health_score,
              });
            } catch (e) {
              console.warn('Session hydrate failed:', e);
            }
          }
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
          const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user');
          if (lastUserIdx === -1) return;
          const idx = messages.length - 1 - lastUserIdx;
          const lastUser = messages[idx];
          set({ messages: messages.slice(0, idx + 1) });
          get().sendMessage(lastUser.content);
        },
      };
    },
    {
      name: 'finese-ai-store',
      partialize: (state) => {
        // LRU: only persist last N sessions
        const sortedSessions = [...state.sessions]
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
          .slice(0, MAX_PERSISTED_SESSIONS);
        return {
          sessions: sortedSessions,
          activeSessionId: state.activeSessionId,
          sidebarOpen: state.sidebarOpen,
          changelog: state.changelog.slice(-50),
        };
      },
      onRehydrateStorage: () => (state) => {
        // After rehydrate, load active session's dataset from Storage
        if (state) {
          const active = state.sessions.find(s => s.id === state.activeSessionId);
          if (active?.fileHash) {
            // Trigger async hydrate (fire and forget)
            setTimeout(() => useDatumStore.getState().setActiveSession(active.id), 0);
          }
        }
      },
    }
  )
);
