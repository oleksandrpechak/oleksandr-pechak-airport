import {
  ArrowLeftRight,
  Building2,
  CreditCard,
  LayoutDashboard,
  MapPin,
  MessagesSquare,
  Plane,
  PlaneTakeoff,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  to: string;
  icon: LucideIcon;
  description: string;
  adminOnly?: boolean;
  /** Extra words the command palette matches on. */
  keywords?: string[];
  /** Which delivery phase builds the real page; undefined means it is live. */
  plannedPhase?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
}

/**
 * Single source for the sidebar, breadcrumbs, command palette and placeholder
 * routes. The console is operations-first; booking is one module of it.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      {
        title: 'Overview',
        to: '/',
        icon: LayoutDashboard,
        description: 'Today at a glance: movements, load factors and alerts.',
        keywords: ['dashboard', 'home'],
        plannedPhase: 5,
      },
      {
        title: 'Departures & Arrivals',
        to: '/board',
        icon: ArrowLeftRight,
        description: 'Live board of departing and arriving flights.',
        keywords: ['fids', 'board', 'live'],
      },
      {
        title: 'Flights',
        to: '/flights',
        icon: PlaneTakeoff,
        description: 'Search flights, inspect seat maps and manage flight status.',
        keywords: ['schedule', 'status'],
      },
    ],
  },
  {
    title: 'Commercial',
    items: [
      {
        title: 'Bookings',
        to: '/bookings',
        icon: Ticket,
        description: 'Bookings, tickets and cancellations.',
        keywords: ['tickets', 'reservations'],
        plannedPhase: 3,
      },
      {
        title: 'Payments',
        to: '/payments',
        icon: CreditCard,
        description: 'Checkout sessions and payment status.',
        keywords: ['stripe', 'checkout'],
        plannedPhase: 3,
      },
    ],
  },
  {
    title: 'Reference data',
    items: [
      {
        title: 'Airports',
        to: '/airports',
        icon: MapPin,
        description: 'Airports served by the network.',
        keywords: ['iata', 'city', 'country'],
      },
      {
        title: 'Airlines',
        to: '/airlines',
        icon: Building2,
        description: 'Operating carriers.',
        keywords: ['carrier'],
      },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        title: 'Chat',
        to: '/chat',
        icon: MessagesSquare,
        description: 'Assistant and support conversations.',
        keywords: ['messages', 'support'],
        plannedPhase: 6,
      },
    ],
  },
  {
    title: 'Administration',
    adminOnly: true,
    items: [
      {
        title: 'Users',
        to: '/admin/users',
        icon: Users,
        description: 'Accounts and roles.',
        adminOnly: true,
        keywords: ['accounts', 'roles'],
        plannedPhase: 4,
      },
      {
        title: 'Fleet',
        to: '/admin/fleet',
        icon: Plane,
        description: 'Aircraft, seat layouts and fleet assignments.',
        adminOnly: true,
        keywords: ['aircraft', 'airplanes', 'seats'],
        plannedPhase: 4,
      },
    ],
  },
];

export function visibleSections(isAdmin: boolean): NavSection[] {
  return NAV_SECTIONS.filter((s) => isAdmin || !s.adminOnly).map((s) => ({
    ...s,
    items: s.items.filter((i) => isAdmin || !i.adminOnly),
  }));
}

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({ section, item })),
);

/** Longest-prefix match so `/airports/12` resolves to the Airports entry. */
export function findNavEntry(pathname: string) {
  let best: (typeof ALL_NAV_ITEMS)[number] | undefined;
  for (const entry of ALL_NAV_ITEMS) {
    const { to } = entry.item;
    const matches =
      to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);
    if (matches && (!best || to.length > best.item.to.length)) best = entry;
  }
  return best;
}
