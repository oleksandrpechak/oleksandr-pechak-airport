import { AxiosError } from 'axios';
import { Navigate, Outlet, useLocation } from 'react-router';

import { ErrorState } from '@/components/states/error-state';
import { FullPageLoader } from '@/components/states/loading-state';
import { ForbiddenPage } from '@/pages/forbidden-page';
import { hasSession, useTokenStore } from '@/lib/api/token-store';

import { useMe } from './hooks';

function loginRedirect(pathname: string, search: string) {
  const next = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
  return `/login${next}`;
}

/** Renders its children only for a signed-in user whose `/users/me/` has loaded. */
export function ProtectedRoute() {
  const location = useLocation();
  const signedIn = useTokenStore(hasSession);
  const me = useMe();

  if (!signedIn) return <Navigate to={loginRedirect(location.pathname, location.search)} replace />;
  if (me.isPending) return <FullPageLoader label="Loading your workspace…" />;
  if (me.isError) {
    if (me.error instanceof AxiosError && me.error.response?.status === 401) {
      return <Navigate to={loginRedirect(location.pathname, location.search)} replace />;
    }
    return (
      <div className="grid min-h-svh place-items-center p-6">
        <ErrorState error={me.error} onRetry={() => void me.refetch()} />
      </div>
    );
  }
  return <Outlet />;
}

/** Nest under `ProtectedRoute`. Non-admins get a 403 page rather than a redirect. */
export function AdminRoute() {
  const { data } = useMe();
  if (data?.role !== 'ADMIN') return <ForbiddenPage />;
  return <Outlet />;
}

/** Login/register: bounce signed-in users to the app. */
export function GuestRoute() {
  const signedIn = useTokenStore(hasSession);
  if (signedIn) return <Navigate to="/" replace />;
  return <Outlet />;
}
