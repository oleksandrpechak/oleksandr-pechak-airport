import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query';
import { useUiStore } from '@/stores/ui';

import { AppSidebar, SidebarBrand, SidebarNav } from './app-sidebar';
import { CommandPalette } from './command-palette';
import { TopBar } from './top-bar';

/**
 * Desktop (≥1024px): full sidebar the user can collapse to an icon rail.
 * Tablet: always the icon rail, with the full navigation in a drawer.
 */
export function AppShell() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const collapsedPref = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const { pathname } = useLocation();

  useEffect(() => setMobileNavOpen(false), [pathname, setMobileNavOpen]);

  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar
        collapsed={!isDesktop || collapsedPref}
        canToggle={isDesktop}
        onToggle={toggleSidebar}
      />
      <Sheet open={!isDesktop && mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent className="w-64 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main sections of the console</SheetDescription>
          <SidebarBrand collapsed={false} />
          <SidebarNav collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar isDesktop={isDesktop} />
        <main id="main" className="flex-1 px-4 py-4 lg:px-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
