'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/theme-toggle';
import { BotMessageSquare } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <BotMessageSquare className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">MeshControl</h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
