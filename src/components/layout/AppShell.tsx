import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ChangelogSidebar } from './ChangelogSidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-hidden bg-muted/30">{children}</main>
          <ChangelogSidebar />
        </div>
      </div>
    </div>
  );
}
