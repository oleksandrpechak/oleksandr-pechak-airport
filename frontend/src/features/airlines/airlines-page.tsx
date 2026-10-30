import type { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table/data-table';
import { useServerTableState } from '@/components/data-table/use-server-table-state';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import type { Airline } from '@/lib/api/schema';

import { useAirlines } from './api';

const columns: ColumnDef<Airline>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Airline',
    meta: { orderingField: 'name' },
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  {
    id: 'founded_year',
    accessorKey: 'founded_year',
    header: 'Founded',
    meta: { orderingField: 'founded_year', align: 'right', className: 'w-28' },
    cell: ({ getValue }) => (
      <span className="tabular-nums">{getValue<number | null>() ?? '—'}</span>
    ),
  },
  {
    id: 'is_active',
    accessorKey: 'is_active',
    header: 'Status',
    meta: { className: 'w-28' },
    cell: ({ getValue }) =>
      getValue<boolean | undefined>() === false ? (
        <Badge variant="secondary">Inactive</Badge>
      ) : (
        <Badge variant="success">Active</Badge>
      ),
  },
];

export function AirlinesPage() {
  const table = useServerTableState({ defaultOrdering: 'name' });
  const query = useAirlines(table.params);

  return (
    <div className="space-y-4">
      <PageHeader title="Airlines" description="Carriers operating at the network's airports." />
      <DataTable
        label="Airlines"
        columns={columns}
        query={query}
        state={table}
        getRowId={(row) => String(row.id)}
        searchPlaceholder="Search airlines…"
        emptyTitle="No airlines yet"
        emptyDescription="Airlines added by an administrator will appear here."
      />
    </div>
  );
}
