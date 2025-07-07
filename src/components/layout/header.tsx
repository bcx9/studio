'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/theme-toggle';
import { BotMessageSquare } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex items-center gap-3">
            <BotMessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">MeshControl</h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
