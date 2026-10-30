import { PanelLeftClose, PanelLeftOpen, PlaneTakeoff } from 'lucide-react';
import { NavLink } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { visibleSections, type NavItem } from '@/config/navigation';
import { useCurrentUser } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring',
          isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
          collapsed && 'justify-center px-0',
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={cn('size-4 shrink-0', isActive ? 'text-sidebar-primary' : 'opacity-70')}
          />
          {!collapsed && <span className="truncate">{item.title}</span>}
          {!collapsed && item.plannedPhase && (
            <Badge variant="outline" className="ml-auto border-dashed px-1 text-[10px] opacity-60">
              soon
            </Badge>
          )}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}

export function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const user = useCurrentUser();
  const sections = visibleSections(user.role === 'ADMIN');
  return (
    <nav aria-label="Main" className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
      {sections.map((section) => (
        <div key={section.title} className="space-y-0.5">
          {collapsed ? (
            <div className="mx-2 mb-1.5 h-px bg-sidebar-border first:hidden" />
          ) : (
            <p className="px-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {section.title}
            </p>
          )}
          {section.items.map((item) => (
            <SidebarLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}

export function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        'flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border px-3',
        collapsed && 'justify-center px-0',
      )}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <PlaneTakeoff className="size-4" />
      </span>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">Airport Ops</p>
          <p className="truncate text-[11px] text-muted-foreground">Operations console</p>
        </div>
      )}
    </div>
  );
}

export function AppSidebar({
  collapsed,
  canToggle,
  onToggle,
}: {
  collapsed: boolean;
  canToggle: boolean;
  onToggle: () => void;
}) {
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'sticky top-0 flex h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      <SidebarBrand collapsed={collapsed} />
      <SidebarNav collapsed={collapsed} />
      {canToggle && (
        <div className="border-t border-sidebar-border p-2">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              'flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed && 'justify-center px-0',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ToggleIcon className="size-4" />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
