import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { Link, useLocation } from 'react-router';

import { findNavEntry } from '@/config/navigation';
import { useUiStore } from '@/stores/ui';

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const entry = findNavEntry(pathname);
  const pageCrumb = useUiStore((s) => s.pageCrumb);
  const crumbs: { label: string; to?: string }[] = [{ label: 'Console', to: '/' }];
  if (entry) {
    if (entry.item.to !== '/') crumbs.push({ label: entry.section.title });
    crumbs.push({ label: entry.item.title, to: entry.item.to });
    if (pageCrumb && pathname !== entry.item.to) crumbs.push({ label: pageCrumb });
  } else if (pathname !== '/') {
    crumbs.push({ label: 'Not found' });
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0 opacity-60" />}
              <li
                className={
                  last ? 'truncate font-medium text-foreground' : 'hidden truncate sm:block'
                }
              >
                {crumb.to && !last ? (
                  <Link to={crumb.to} className="hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined}>{crumb.label}</span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
