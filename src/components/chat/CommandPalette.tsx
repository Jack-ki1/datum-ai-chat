import { useState, useEffect, useCallback } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { useNavigate } from 'react-router-dom';
import {
  Search, Sparkles, Brain, BarChart3, Wrench, Settings, Bug,
  BookOpen, FileText, Plus, Database, Layers, MessageSquare, X
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { sendMessage, newSession, isLoaded, sessions, setActiveSession } = useDatumStore();
  const navigate = useNavigate();

  const commands: Command[] = [
    // Actions
    { id: 'new', label: 'New Chat', description: 'Start a fresh session', icon: Plus, action: () => { newSession(); navigate('/chat'); }, category: 'Actions' },
    { id: 'prompts', label: 'Sample Prompts', description: 'Browse prompt library', icon: BookOpen, action: () => navigate('/prompts'), category: 'Actions' },
    { id: 'original', label: 'View Original Data', description: 'Open original dataset', icon: Database, action: () => navigate('/data/original'), category: 'Actions' },
    { id: 'transformed', label: 'View Transformed Data', description: 'Open transformed dataset', icon: Layers, action: () => navigate('/data/transformed'), category: 'Actions' },
    // Quick prompts (only when data loaded)
    ...(isLoaded ? [
      { id: 'profile', label: 'Profile Dataset', description: 'Run full column profiling', icon: Sparkles, action: () => sendMessage('Profile all columns in detail'), category: 'Analysis' },
      { id: 'model', label: 'Build ML Model', description: 'Auto-select and train a model', icon: Brain, action: () => sendMessage('Suggest and build the best ML model for this data'), category: 'Analysis' },
      { id: 'stats', label: 'Statistical Analysis', description: 'Comprehensive stats', icon: BarChart3, action: () => sendMessage('Run a comprehensive statistical analysis'), category: 'Analysis' },
      { id: 'engineer', label: 'Feature Engineering', description: 'Design features and pipeline', icon: Wrench, action: () => sendMessage('Design a data pipeline and feature engineering plan'), category: 'Analysis' },
      { id: 'mlops', label: 'MLOps Plan', description: 'Deployment and monitoring', icon: Settings, action: () => sendMessage('Create a deployment and monitoring plan'), category: 'Analysis' },
    ] : []),
    // General
    { id: 'debug', label: 'Debug Error', description: 'Paste an error to diagnose', icon: Bug, action: () => sendMessage('I have an error to debug — let me paste the traceback'), category: 'General' },
    { id: 'story', label: 'Data Story', description: 'Executive summary', icon: BookOpen, action: () => sendMessage('Create an executive summary and data story for stakeholders'), category: 'General' },
    { id: 'docs', label: 'Generate Docs', description: 'Auto-generate documentation', icon: FileText, action: () => sendMessage('Generate documentation for this dataset and analysis'), category: 'General' },
    // Sessions
    ...sessions.slice(0, 5).map(s => ({
      id: `session-${s.id}`, label: s.title, description: s.fileName || 'No dataset', icon: MessageSquare,
      action: () => { setActiveSession(s.id); navigate('/chat'); }, category: 'Sessions',
    })),
  ];

  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    (acc[cmd.category] ??= []).push(cmd);
    return acc;
  }, {});

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen(o => !o);
      setQuery('');
    }
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-expand">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
          <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto p-2">
          {Object.entries(grouped).map(([cat, cmds]) => (
            <div key={cat}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 py-2">{cat}</p>
              {cmds.map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => { cmd.action(); setOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left hover:bg-muted transition-colors"
                >
                  <cmd.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cmd.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{cmd.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-[10px] text-muted-foreground">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
