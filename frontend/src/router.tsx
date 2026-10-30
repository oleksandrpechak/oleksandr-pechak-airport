import { createBrowserRouter, type RouteObject } from 'react-router';

import { AppShell } from '@/components/layout/app-shell';
import { ALL_NAV_ITEMS } from '@/config/navigation';
import { AdminRoute, GuestRoute, ProtectedRoute } from '@/features/auth/routes';
import { NotFoundPage } from '@/pages/not-found-page';
import { PlaceholderPage } from '@/pages/placeholder-page';

type LazyPage = NonNullable<RouteObject['lazy']>;

/**
 * Real pages, code-split per route. Every other nav entry gets a placeholder
 * until its phase ships.
 */
const PAGES: Record<string, LazyPage> = {
  '/airports': () =>
    import('@/features/airports/airports-page').then((m) => ({ Component: m.AirportsPage })),
  '/airlines': () =>
    import('@/features/airlines/airlines-page').then((m) => ({ Component: m.AirlinesPage })),
  '/flights': () =>
    import('@/features/flights/flights-page').then((m) => ({ Component: m.FlightsPage })),
  '/board': () => import('@/features/flights/board-page').then((m) => ({ Component: m.BoardPage })),
};

const navRoutes = (adminOnly: boolean): RouteObject[] =>
  ALL_NAV_ITEMS.filter(({ item }) => Boolean(item.adminOnly) === adminOnly).map(({ item }) => {
    const page = PAGES[item.to];
    const element = page ? undefined : <PlaceholderPage item={item} />;
    return item.to === '/'
      ? { index: true, lazy: page, element }
      : { path: item.to.slice(1), lazy: page, element };
  });

export const routes: RouteObject[] = [
  {
    element: <GuestRoute />,
    children: [
      {
        path: 'login',
        lazy: () => import('@/features/auth/login-page').then((m) => ({ Component: m.LoginPage })),
      },
      {
        path: 'register',
        lazy: () =>
          import('@/features/auth/register-page').then((m) => ({ Component: m.RegisterPage })),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          ...navRoutes(false),
          {
            path: 'flights/:flightId',
            lazy: () =>
              import('@/features/flights/flight-detail-page').then((m) => ({
                Component: m.FlightDetailPage,
              })),
          },
          { element: <AdminRoute />, children: navRoutes(true) },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
