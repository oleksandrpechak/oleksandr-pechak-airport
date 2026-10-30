# Airport Operations — frontend

React console for the Django airport API in this repository. Operations-first: the main
screen is the operations console (departures/arrivals board, flight status), and booking,
payments and chat are modules inside it.

**Stack:** Vite · React 19 · TypeScript (strict) · React Router 7 · TanStack Query / Table ·
Zustand (client state only) · Axios · React Hook Form + Zod · Tailwind 4 + shadcn/ui ·
Lucide · Sonner · Vitest + Testing Library.

## Getting started

Requires Node ≥ 20.19 and the Django API on `http://localhost:8000`.

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The app only ever calls **relative** URLs (`/api`, `/ws`). In development the Vite dev
server proxies them to Django; in production nginx will do the same. No `VITE_*` API URL
is baked into the bundle.

If port 8000 is taken, point the dev proxy elsewhere. The variable is read by the dev server
only and never reaches the bundle:

```bash
API_PROXY_TARGET=http://localhost:8010 npm run dev
```

The backend's CORS settings allow `http://localhost:5173` and `:3000`, which matters only
when calling Django directly instead of through the proxy.

## Scripts

| Script              | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `npm run dev`       | Vite dev server with the `/api` + `/ws` proxy                     |
| `npm run build`     | Type-check (`tsc -b`) and production build to `dist/`             |
| `npm run typecheck` | `tsc -b` only                                                     |
| `npm run lint`      | ESLint, zero warnings allowed                                     |
| `npm run format`    | Prettier write (`format:check` to verify)                         |
| `npm test`          | Vitest, single run (`test:watch` for watch mode)                  |
| `npm run gen:api`   | Regenerate `src/types/api.d.ts` from the committed `openapi.yaml` |

## API types

Hand-written API types are not allowed. Types come from the backend's OpenAPI schema:

1. From the repo root, refresh the committed schema. It validates with zero warnings:
   ```bash
   python manage.py spectacular --file frontend/openapi.yaml --validate
   ```
2. In `frontend/`, regenerate the types:
   ```bash
   npm run gen:api
   ```

`src/lib/api/schema.ts` holds named aliases (`Airport`, `CurrentUser`, `Paginated<T>`,
`ListParams`, …) derived from the generated `components` and `paths`. Import from there.

Backend names are kept exactly as the API ships them. For example, the payment response key
is `chekout_url`, and flights expose the airline object as `airline_name`.

## Auth

- **Login:** `POST /api/token/` with `{email, password}` → `{access, refresh}`.
- **Current user:** `GET /api/users/me/` → `{id, first_name, last_name, role, email}`,
  cached by TanStack Query. `ProtectedRoute` waits for it, and `AdminRoute` requires
  `role === "ADMIN"`; other users get a 403 page.
- **Register:** `POST /api/users/customusers/`. The backend ignores `role`, so every new
  account is a `USER`. The app signs in right after.
- **401 handling** (`src/lib/api/client.ts`):
  - On a 401, the client runs **one** `POST /api/token/refresh/`.
  - Concurrent failing requests wait on that same refresh, then each is retried once.
  - If the refresh fails, the session is cleared and the user goes back to `/login?next=…`.
- **DRF errors** (`src/lib/api/errors.ts`, `form-errors.ts`):
  - Field errors show inline under their inputs.
  - `detail` and `non_field_errors` show in a banner above the form.

### Token storage — known trade-off

- The **access token** lives in memory only and is never persisted.
- The **refresh token** is kept in `localStorage` (`airport-session`), so a reload keeps the
  session: the first request 401s, refreshes, and retries.
- This means an XSS bug could read the refresh token. **Moving it to an `httpOnly` cookie
  needs a backend change.** SimpleJWT's views take and return the token in the JSON body.
  The backend would need to:
  - set and read a `Secure; HttpOnly; SameSite=Strict` cookie on `/api/token/` and
    `/api/token/refresh/`;
  - add a logout endpoint that clears it;
  - add CSRF protection for those endpoints.
- Note also that `SIMPLE_JWT` currently issues 365-day access and refresh tokens, a
  development setting.

## Layout

```
src/
  app.tsx, router.tsx        providers and the route tree (feature pages are lazy-loaded)
  config/navigation.ts       single source for sidebar, breadcrumbs, ⌘K palette, placeholders
  components/
    ui/                      shadcn/ui primitives (new-york style, see components.json)
    layout/                  app shell: sidebar, top bar, breadcrumbs, user menu, ⌘K palette
    data-table/              server-driven DataTable + URL-synced table state
    states/                  loading / empty / error states
  features/
    auth/                    login, register, guards, hooks
    airports/                airports list (public /api/aviation/airports/)
    airlines/                airlines list (public /api/aviation/airlines/)
    flights/                 flights list + URL filters, flight detail + seat map,
                             departures/arrivals board (30s auto-refresh)
  lib/api/                   axios client, token store, error parsing, schema aliases
  stores/ui.ts               Zustand: theme, sidebar, palette (client state only)
  types/api.d.ts             GENERATED — do not edit
```

## DataTable

`DataTable` + `useServerTableState` map directly to DRF:

- `LimitOffsetPagination`: `limit` and `offset`, default 20, clamped to the backend
  max of 100. Responses are `{count, next, previous, results}`.
- `ordering`: a column becomes sortable when its `meta.orderingField` is set.
- `search`: debounced by 300 ms.

Table state lives in the URL (`?limit=&offset=&ordering=&search=`), so views can be shared
and survive reloads. The table has loading skeletons, an empty state, a no-match state, and
an error state with retry. The DRF `next`/`previous` links aren't used: when proxied they
point at the backend host, so the client computes offsets itself.

```tsx
const table = useServerTableState({ defaultOrdering: 'iata_code' });
const query = useAirports(table.params); // useQuery + keepPreviousData
<DataTable
  label="Airports"
  columns={columns}
  query={query}
  state={table}
  searchPlaceholder="Search airports…"
/>;
```

## Theming

Design tokens are CSS variables in `src/index.css` (shadcn naming), with a `.dark`
override. Light, dark and system themes are available from the user menu or ⌘K. The
choice is saved, and an inline script in `index.html` applies it before first paint.
The base font size is 14px for a dense console layout.

## Responsive behaviour

- **≥ 1024px:** full sidebar, collapsible to an icon rail. The choice is saved.
- **768–1023px (tablet):** icon rail, with the full navigation in a drawer from the top-bar
  menu button.

## Known backend gaps (phase 2)

- **Flight status can't change through the API.** `flight_status` is read-only in every
  serializer, and no task or endpoint updates it. The board and lists show whatever is in the
  database. Status management in the ops console needs an admin endpoint, for example
  `PATCH /api/flights/flights/{id}/status/`.
- **No arrival-time filter.** The flights endpoint filters only on departure time. The
  arrivals board asks for a departure window one day wider and trims the results to the
  selected day on the client.
- **No gate data.** The board has no gate column because the API has no gate field.
