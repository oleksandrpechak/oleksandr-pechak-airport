import type { RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Backend `ordering` field for this column. Setting it makes the column sortable. */
    orderingField?: string;
    align?: 'left' | 'right' | 'center';
    /** Classes for both header and body cells, e.g. a fixed width. */
    className?: string;
  }
}

export {};
