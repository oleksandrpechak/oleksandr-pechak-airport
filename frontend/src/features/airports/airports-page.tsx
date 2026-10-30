import type { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table/data-table';
import { useServerTableState } from '@/components/data-table/use-server-table-state';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import type { Airport } from '@/lib/api/schema';

import { useAirports } from './api';

const columns: ColumnDef<Airport>[] = [
  {
    id: 'iata_code',
    accessorKey: 'iata_code',
    header: 'IATA',
    meta: { orderingField: 'iata_code', className: 'w-24' },
    cell: ({ getValue }) => <Badge variant="mono">{getValue<string>()}</Badge>,
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Airport',
    meta: { orderingField: 'name' },
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  {
    id: 'city_name',
    accessorKey: 'city_name',
    header: 'City',
  },
  {
    id: 'country_code',
    accessorKey: 'country_code',
    header: 'Country',
    meta: { className: 'w-28' },
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">{getValue<string>()}</span>
    ),
  },
  {
    id: 'airlines',
    header: 'Airlines',
    accessorFn: (row) => row.airline.length,
    meta: { align: 'right', className: 'w-24' },
    cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
  },
];

export function AirportsPage() {
  const table = useServerTableState({ defaultOrdering: 'iata_code' });
  const query = useAirports(table.params);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Airports"
        description="Airports served by the network. Search by name, IATA code, city or country."
      />
      <DataTable
        label="Airports"
        columns={columns}
        query={query}
        state={table}
        getRowId={(row) => String(row.id)}
        searchPlaceholder="Search airports…"
        emptyTitle="No airports yet"
        emptyDescription="Airports added by an administrator will appear here."
      />
    </div>
  );
}
