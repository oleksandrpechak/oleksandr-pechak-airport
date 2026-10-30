import { Menu, PanelLeft, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUiStore } from '@/stores/ui';

import { Breadcrumbs } from './breadcrumbs';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const COMMAND_SHORTCUT_LABEL = isMac ? '⌘K' : 'Ctrl K';

export function TopBar({ isDesktop }: { isDesktop: boolean }) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Button
        variant="ghost"
        size="icon"
        onClick={isDesktop ? toggleSidebar : () => setMobileNavOpen(true)}
        aria-label={isDesktop ? 'Toggle sidebar' : 'Open navigation'}
      >
        {isDesktop ? <PanelLeft /> : <Menu />}
      </Button>
      <Separator orientation="vertical" className="h-5!" />
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          onClick={() => setCommandOpen(true)}
          className="w-9 justify-start px-2 text-muted-foreground md:w-56"
          aria-label="Open command palette"
        >
          <Search />
          <span className="hidden md:inline">Search or jump to…</span>
          <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] md:inline">
            {COMMAND_SHORTCUT_LABEL}
          </kbd>
        </Button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
