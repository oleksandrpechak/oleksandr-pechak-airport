import { LogOut, Monitor, Moon, PanelLeft, Sun, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { visibleSections } from '@/config/navigation';
import { useCurrentUser, useLogout } from '@/features/auth/hooks';
import { useUiStore } from '@/stores/ui';

interface PaletteEntry {
  group: string;
  label: string;
  icon: LucideIcon;
  keywords?: string[];
  hint?: string;
  run: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const logout = useLogout();
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const setTheme = useUiStore((s) => s.setTheme);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  // Controlled so the query resets on close: Radix keeps the dialog mounted
  // during its exit animation, and a quick reopen would otherwise keep old text.
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUiStore.getState().commandOpen);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  const entries: PaletteEntry[] = [
    ...visibleSections(user.role === 'ADMIN').flatMap((section) =>
      section.items.map((item) => ({
        group: section.title,
        label: item.title,
        icon: item.icon,
        keywords: [section.title, ...(item.keywords ?? [])],
        hint: item.plannedPhase ? 'soon' : undefined,
        run: () => navigate(item.to),
      })),
    ),
    { group: 'Preferences', label: 'Light theme', icon: Sun, run: () => setTheme('light') },
    { group: 'Preferences', label: 'Dark theme', icon: Moon, run: () => setTheme('dark') },
    { group: 'Preferences', label: 'System theme', icon: Monitor, run: () => setTheme('system') },
    { group: 'Preferences', label: 'Toggle sidebar', icon: PanelLeft, run: toggleSidebar },
    { group: 'Account', label: 'Sign out', icon: LogOut, keywords: ['logout'], run: logout },
  ];

  // cmdk ranks items inside a group but does not reliably reorder groups, so
  // while searching show one flat, ranked list; browse mode keeps the sections.
  const groups: [string, PaletteEntry[]][] = [];
  for (const entry of entries) {
    const heading = query.trim() ? 'Results' : entry.group;
    const last = groups.at(-1);
    if (last?.[0] === heading) last[1].push(entry);
    else groups.push([heading, [entry]]);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a page or command…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map(([heading, items]) => (
          <CommandGroup key={heading} heading={heading}>
            {items.map((entry) => (
              <CommandItem
                key={`${entry.group}:${entry.label}`}
                value={entry.label}
                keywords={entry.keywords}
                onSelect={() => {
                  setOpen(false);
                  entry.run();
                }}
              >
                <entry.icon />
                <span>{entry.label}</span>
                {entry.hint && <CommandShortcut>{entry.hint}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
