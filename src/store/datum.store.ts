import { create } from 'zustand';
import type { ChatMessage, ColumnProfile, Session, Artifact } from '@/types';
import { buildProfile, healthScore, formatNumber } from '@/lib/stats';

function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

interface DatumStore {
  dataset: Record<string, any>[] | null;
  profile: ColumnProfile[] | null;
  fileName: string;
  isLoaded: boolean;
  sessions: Session[];
  activeSessionId: string;
  messages: ChatMessage[];
  isAiLoading: boolean;
  sidebarOpen: boolean;
  ingest: (data: Record<string, any>[], name: string) => void;
  sendMessage: (content: string) => Promise<void>;
  newSession: () => void;
  setActiveSession: (id: string) => void;
  toggleSidebar: () => void;
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

function generateMockResponse(content: string, data: Record<string, any>[], profile: ColumnProfile[]): { text: string; artifacts: Artifact[] } {
  const q = content.toLowerCase();
  const numCols = profile.filter(p => p.type === 'numeric');
  const catCols = profile.filter(p => p.type === 'categorical');
  const artifacts: Artifact[] = [];
  let text = '';

  if (q.includes('profile') || q.includes('describe') || q.includes('column')) {
    text = `Here's a detailed statistical profile of all **${profile.length} columns** across **${data.length} rows**:`;
    artifacts.push({ type: 'profile', title: 'Column Statistics', profile });
  } else if (q.includes('chart') || q.includes('visual') || q.includes('plot') || q.includes('graph')) {
    const x = catCols[0]?.col || profile[0]?.col;
    const y = numCols[0]?.col || profile[1]?.col;
    if (x && y) {
      text = `Here's a visualization of **${y}** by **${x}**:`;
      artifacts.push({ type: 'chart', ctype: 'bar', xCol: x, yCol: y, title: `${y} by ${x}`, aggFn: 'sum', data });
    } else {
      text = 'I need at least two columns to create a visualization. Try uploading a dataset with both categorical and numeric data.';
    }
  } else if (q.includes('anomal') || q.includes('outlier')) {
    const outlierCols = numCols.filter(p => (p.outliers || 0) > 0);
    const insights = outlierCols.length > 0
      ? outlierCols.map(c => `**${c.col}**: ${c.outliers} outliers detected (range: ${formatNumber(c.min!)} – ${formatNumber(c.max!)}, IQR bounds: ${formatNumber(c.q1!)} – ${formatNumber(c.q3!)})`)
      : ['No statistical outliers detected using the IQR method across all numeric columns.'];
    text = outlierCols.length > 0
      ? `Found outliers in **${outlierCols.length} columns**:`
      : 'Great news — your data looks clean:';
    artifacts.push({ type: 'insights', insights, title: 'Anomaly Analysis' });
    if (numCols.length > 0) {
      artifacts.push({
        type: 'stats', title: 'Numeric Summary',
        stats: numCols.slice(0, 6).map(c => ({ label: c.col, value: formatNumber(c.mean || 0), color: (c.outliers || 0) > 0 ? 'orange' : 'cyan' })),
      });
    }
  } else if (q.includes('insight') || q.includes('top') || q.includes('finding') || q.includes('key')) {
    const insights: string[] = [];
    if (numCols.length > 0) {
      const maxCol = numCols.reduce((a, b) => (a.max || 0) > (b.max || 0) ? a : b);
      insights.push(`Highest value found in **${maxCol.col}**: **${formatNumber(maxCol.max!)}**`);
      insights.push(`Average **${numCols[0].col}** is **${formatNumber(numCols[0].mean!)}** with std dev of **${formatNumber(numCols[0].std!)}**`);
    }
    if (catCols.length > 0 && catCols[0].top) {
      insights.push(`Most common **${catCols[0].col}**: "${catCols[0].top[0].value}" (${catCols[0].top[0].pct}%)`);
    }
    const nulls = profile.filter(p => p.nullCount > 0);
    insights.push(nulls.length > 0 ? `**${nulls.length} columns** have missing data` : 'Dataset is **100% complete** — no missing values');
    insights.push(`Dataset has **${data.length} records** across **${profile.length} features**`);
    text = 'Here are the key insights from your data:';
    artifacts.push({ type: 'insights', insights, title: 'Key Insights' });
    if (catCols.length > 0 && numCols.length > 0) {
      artifacts.push({ type: 'chart', ctype: 'bar', xCol: catCols[0].col, yCol: numCols[0].col, title: `${numCols[0].col} by ${catCols[0].col}`, aggFn: 'sum', data });
    }
  } else if (q.includes('table') || q.includes('show') || q.includes('head') || q.includes('preview')) {
    text = `Here are the first 10 rows of your dataset:`;
    artifacts.push({ type: 'table', data: data.slice(0, 10), title: 'Data Preview' });
  } else if (q.includes('sql') || q.includes('query')) {
    const cols = profile.map(p => p.col).join(', ');
    text = 'Here\'s a SQL query for your data:';
    artifacts.push({
      type: 'code', lang: 'sql', title: 'Generated SQL',
      code: `SELECT ${cols}\nFROM dataset\nWHERE 1=1\nORDER BY ${profile[0]?.col || 'id'}\nLIMIT 100;`,
    });
  } else if (q.includes('clean') || q.includes('fix') || q.includes('quality')) {
    const nullCols = profile.filter(p => p.nullCount > 0);
    const insights = [
      `Health score: **${healthScore(profile)}%**`,
      ...nullCols.map(c => `**${c.col}**: ${c.nullCount} missing values (${Math.round(c.nullCount / c.total * 100)}%)`),
      nullCols.length === 0 ? 'No missing values detected ✓' : '',
      `Total columns: **${profile.length}** | Numeric: **${numCols.length}** | Categorical: **${catCols.length}**`,
    ].filter(Boolean);
    text = 'Here\'s a data quality assessment:';
    artifacts.push({ type: 'insights', insights, title: 'Data Quality Report' });
  } else {
    text = `Based on your question about the data, here's what I found:\n\n`;
    const insights = [
      `Your dataset has **${data.length} rows** and **${profile.length} columns**`,
      numCols.length > 0 ? `Average **${numCols[0].col}**: **${formatNumber(numCols[0].mean!)}**` : 'No numeric columns found',
    ];
    artifacts.push({ type: 'insights', insights, title: 'Quick Analysis' });
    if (catCols.length > 0 && numCols.length > 0) {
      artifacts.push({ type: 'chart', ctype: 'bar', xCol: catCols[0].col, yCol: numCols[0].col, title: `${numCols[0].col} by ${catCols[0].col}`, aggFn: 'sum', data });
    }
  }
  text += '\n\n**Suggested follow-ups:**\n- Try "profile all columns" for detailed statistics\n- Ask me to "visualize" any specific columns';
  return { text, artifacts };
}

export const useDatumStore = create<DatumStore>((set, get) => {
  const initialSessionId = uid();
  return {
    dataset: null, profile: null, fileName: '', isLoaded: false,
    sessions: [{ id: initialSessionId, title: 'New Session', createdAt: now(), messages: [] }],
    activeSessionId: initialSessionId,
    messages: [], isAiLoading: false, sidebarOpen: true,

    ingest: (data, name) => {
      const profile = buildProfile(data);
      const welcome = generateWelcome(data, profile, name);
      const { activeSessionId, sessions } = get();
      const msgs = [welcome];
      set({
        dataset: data, profile, fileName: name, isLoaded: true, messages: msgs,
        sessions: sessions.map(s => s.id === activeSessionId
          ? { ...s, title: name.replace(/\.\w+$/, ''), fileName: name, rowCount: data.length, colCount: Object.keys(data[0] || {}).length, messages: msgs }
          : s),
      });
    },

    sendMessage: async (content) => {
      const { dataset, profile, messages, activeSessionId, sessions } = get();
      const userMsg: ChatMessage = { id: uid(), role: 'user', content, timestamp: now() };
      const newMsgs = [...messages, userMsg];
      set({ messages: newMsgs, isAiLoading: true });

      await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));

      if (!dataset || !profile) {
        const aiMsg: ChatMessage = {
          id: uid(), role: 'assistant', timestamp: now(),
          content: 'Please upload a dataset first! You can drag and drop a CSV, Excel, or JSON file, or try one of the sample datasets below.',
          artifacts: [],
        };
        const final = [...newMsgs, aiMsg];
        set({ messages: final, isAiLoading: false, sessions: sessions.map(s => s.id === activeSessionId ? { ...s, messages: final } : s) });
        return;
      }

      const { text, artifacts } = generateMockResponse(content, dataset, profile);
      const aiMsg: ChatMessage = { id: uid(), role: 'assistant', content: text, artifacts, timestamp: now() };
      const final = [...newMsgs, aiMsg];
      set({
        messages: final, isAiLoading: false,
        sessions: sessions.map(s => s.id === activeSessionId ? { ...s, messages: final, title: s.title === 'New Session' ? content.slice(0, 30) : s.title } : s),
      });
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
  };
});
