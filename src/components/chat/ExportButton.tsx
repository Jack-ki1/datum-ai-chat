import { useState } from 'react';
import { Download, FileText, FileCode } from 'lucide-react';
import { useDatumStore } from '@/store/datum.store';

export function ExportButton() {
  const { messages, fileName } = useDatumStore();
  const [open, setOpen] = useState(false);

  if (messages.length === 0) return null;

  const exportMarkdown = () => {
    const lines = messages.map(m => {
      const role = m.role === 'user' ? '**You**' : '**DATUM AI**';
      const time = new Date(m.timestamp).toLocaleString();
      let text = `### ${role} — ${time}\n\n${m.content}`;
      if (m.artifacts?.length) {
        text += '\n\n' + m.artifacts.map(a => `> [Artifact: ${a.type}${a.title ? ` — ${a.title}` : ''}]`).join('\n');
      }
      return text;
    });
    const md = `# DATUM Chat Export\n**Dataset:** ${fileName || 'None'}\n**Exported:** ${new Date().toLocaleString()}\n\n---\n\n${lines.join('\n\n---\n\n')}`;
    download(md, `datum-export-${Date.now()}.md`, 'text/markdown');
    setOpen(false);
  };

  const exportJSON = () => {
    const json = JSON.stringify({ fileName, exportedAt: new Date().toISOString(), messages }, null, 2);
    download(json, `datum-export-${Date.now()}.json`, 'application/json');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Export conversation"
      >
        <Download className="w-[18px] h-[18px]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-lg z-50 p-1.5 animate-fade-slide">
            <button onClick={exportMarkdown} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
              <FileText className="w-4 h-4 text-muted-foreground" /> Markdown
            </button>
            <button onClick={exportJSON} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
              <FileCode className="w-4 h-4 text-muted-foreground" /> JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function download(content: string, name: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
