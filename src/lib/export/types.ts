export type ExportColumn<T> = {
  header: string;
  accessor: (row: T) => string;
};
