import './column-meta';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Updater,
} from '@tanstack/react-table';
import type { UseQueryResult } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Loader2,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { Paginated } from '@/lib/api/schema';
import { cn } from '@/lib/utils';

import { PAGE_SIZE_OPTIONS, type ServerTableState } from './use-server-table-state';

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  query: Pick<
    UseQueryResult<Paginated<TData>>,
    'data' | 'error' | 'isPending' | 'isError' | 'isFetching' | 'isPlaceholderData' | 'refetch'
  >;
  state: ServerTableState;
  getRowId?: (row: TData) => string;
  /** Omit to hide the search box (for endpoints without `search_fields`). */
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Accessible name for the table. */
  label: string;
}

/** `-iata_code` → sorting state, matched against each column's `meta.orderingField`. */
function orderingToSorting<T>(ordering: string | undefined, columns: ColumnDef<T>[]): SortingState {
  if (!ordering) return [];
  const [first] = ordering.split(',');
  if (!first) return [];
  const desc = first.startsWith('-');
  const field = desc ? first.slice(1) : first;
  const column = columns.find((c) => c.meta?.orderingField === field);
  return column?.id ? [{ id: column.id, desc }] : [];
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

/**
 * Server-driven table for DRF list endpoints: `limit`/`offset` pagination,
 * `ordering` and `search` all happen on the backend. Column ids must be set
 * (`id` or `accessorKey`) so sorting can map back to `meta.orderingField`.
 */
export function DataTable<TData>({
  columns,
  query,
  state,
  getRowId,
  searchPlaceholder,
  toolbar,
  emptyTitle = 'No results',
  emptyDescription,
  label,
}: DataTableProps<TData>) {
  const { params, setPage, setPageSize, setOrdering, setSearch } = state;
  const { limit, offset, ordering, search } = params;
  const total = query.data?.count ?? 0;
  const pageCount = Math.max(Math.ceil(total / limit), 1);
  const pageIndex = Math.floor(offset / limit);
  const sorting = useMemo(() => orderingToSorting(ordering, columns), [ordering, columns]);

  const onSortingChange = (updater: Updater<SortingState>) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    const [first] = next;
    const field = first ? columns.find((c) => c.id === first.id)?.meta?.orderingField : undefined;
    setOrdering(first && field ? `${first.desc ? '-' : ''}${field}` : undefined);
  };

  const table = useReactTable({
    data: query.data?.results ?? [],
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    enableMultiSort: false,
    sortDescFirst: false,
    pageCount,
    rowCount: total,
    state: { sorting, pagination: { pageIndex, pageSize: limit } },
    onSortingChange,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater({ pageIndex, pageSize: limit }) : updater;
      if (next.pageSize !== limit) setPageSize(next.pageSize);
      else setPage(next.pageIndex);
    },
  });

  // A filter can shrink the result set below the current page: go back to page 1.
  const resultsLength = query.data?.results.length;
  useEffect(() => {
    if (!query.isPlaceholderData && resultsLength === 0 && offset > 0 && total > 0) setPage(0);
  }, [query.isPlaceholderData, resultsLength, offset, total, setPage]);

  const visibleColumns = table.getVisibleLeafColumns().length;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  let body: ReactNode;
  if (query.isPending) {
    body = Array.from({ length: Math.min(limit, 10) }, (_, i) => (
      <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
        {table.getVisibleLeafColumns().map((col) => (
          <TableCell key={col.id}>
            <Skeleton className="h-4 w-full max-w-40" />
          </TableCell>
        ))}
      </TableRow>
    ));
  } else if (query.isError) {
    body = (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={visibleColumns} className="p-0 whitespace-normal">
          <ErrorState
            error={query.error}
            title="Could not load data"
            onRetry={() => void query.refetch()}
          />
        </TableCell>
      </TableRow>
    );
  } else if (table.getRowModel().rows.length === 0) {
    body = (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={visibleColumns} className="p-0 whitespace-normal">
          {search ? (
            <EmptyState
              icon={SearchX}
              title={`No matches for “${search}”`}
              description="Try a different search term or clear the search."
              action={
                <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState title={emptyTitle} description={emptyDescription} />
          )}
        </TableCell>
      </TableRow>
    );
  } else {
    body = table.getRowModel().rows.map((row) => (
      <TableRow key={row.id}>
        {row.getVisibleCells().map((cell) => {
          const meta = cell.column.columnDef.meta;
          return (
            <TableCell
              key={cell.id}
              className={cn(alignClass[meta?.align ?? 'left'], meta?.className)}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          );
        })}
      </TableRow>
    ));
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        {searchPlaceholder !== undefined && (
          <SearchBox value={search ?? ''} onChange={setSearch} placeholder={searchPlaceholder} />
        )}
        {toolbar}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {query.isFetching && !query.isPending && (
            <span className="flex items-center gap-1" role="status">
              <Loader2 className="size-3.5 animate-spin" /> Updating
            </span>
          )}
          {!query.isPending && !query.isError && (
            <span>
              <span className="font-medium text-foreground tabular-nums">
                {total.toLocaleString()}
              </span>{' '}
              {total === 1 ? 'record' : 'records'}
            </span>
          )}
        </div>
      </div>

      <Table aria-label={label} aria-busy={query.isFetching}>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => {
                const meta = header.column.columnDef.meta;
                const sortable = Boolean(meta?.orderingField);
                const sorted = header.column.getIsSorted();
                const content = header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext());
                return (
                  <TableHead
                    key={header.id}
                    className={cn(alignClass[meta?.align ?? 'left'], meta?.className)}
                    aria-sort={
                      sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
                    }
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          '-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-accent hover:text-foreground',
                          sorted && 'text-foreground',
                        )}
                      >
                        {content}
                        {sorted === 'asc' ? (
                          <ArrowUp className="size-3.5" />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className="size-3.5" />
                        ) : (
                          <ChevronsUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      content
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className={cn(query.isPlaceholderData && 'opacity-60 transition-opacity')}>
          {body}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select value={String(limit)} onValueChange={(v) => table.setPageSize(Number(v))}>
            <SelectTrigger className="h-7 w-[70px] text-xs" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums">
            {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
          </span>
          <span className="hidden tabular-nums sm:inline">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft, 300);

  // Follow external changes (back button, "Clear search").
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (debounced.trim() !== value) onChange(debounced);
    // Only react to the debounced draft, not to `value` catching up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft('');
            onChange('');
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
