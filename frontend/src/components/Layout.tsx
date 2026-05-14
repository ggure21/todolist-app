import type { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  sidebar?: ReactNode;
  children: ReactNode;
}

export function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-page)]">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {sidebar && (
          <aside
            className="hidden md:block w-[286px] flex-shrink-0 bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border)] overflow-y-auto"
            aria-label="사이드바"
          >
            {sidebar}
          </aside>
        )}

        <main className="flex-1 overflow-y-auto bg-[var(--color-bg-base)]">
          {children}
        </main>
      </div>
    </div>
  );
}
