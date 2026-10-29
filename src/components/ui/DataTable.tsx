import './DataTable.css'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dropdown } from 'primereact/dropdown'

export interface DataTableColumn {
  key: string
  label: string
  sortDirection?: 'ascending' | 'descending' | 'none'
  onSort?: () => void
}

interface DataTableProps {
  columns: DataTableColumn[]
  children: ReactNode
  className?: string
  wrapClassName?: string
}

export function DataTable({
  columns,
  children,
  className = '',
  wrapClassName = '',
}: DataTableProps) {
  return (
    <div className={`auran-data-table-wrap ${wrapClassName}`}>
      <table className={`auran-data-table ${className}`}>
        <thead>
          <tr>
            {columns.map(({ key, label, sortDirection, onSort }) => (
              <th key={key} aria-sort={onSort ? (sortDirection ?? 'none') : undefined}>
                {onSort ? (
                  <button type="button" onClick={onSort}>
                    {label}
                    {sortDirection === 'ascending' ? (
                      <ArrowUp size={13} aria-hidden="true" />
                    ) : sortDirection === 'descending' ? (
                      <ArrowDown size={13} aria-hidden="true" />
                    ) : (
                      <ArrowUpDown size={13} aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

interface TablePaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  labels: {
    rowsPerPage: string
    previous: string
    next: string
    page: string
    showing: string
  }
  pageSizeOptions?: number[]
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  labels,
  pageSizeOptions = [5, 10, 20, 50],
}: TablePaginationProps) {
  return (
    <footer className="auran-table-pagination">
      <label>
        {labels.rowsPerPage}
        <Dropdown
          className="auran-prime-field auran-table-page-size"
          value={pageSize}
          options={pageSizeOptions.map((size) => ({ label: String(size), value: size }))}
          optionLabel="label"
          optionValue="value"
          filter
          panelClassName="auran-prime-panel"
          aria-label={labels.rowsPerPage}
          onChange={(event) => onPageSizeChange(Number(event.value))}
        />
      </label>
      <span>{labels.showing}</span>
      <div className="auran-table-page-buttons">
        <button
          type="button"
          aria-label={labels.previous}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <span>{labels.page}</span>
        <button
          type="button"
          aria-label={labels.next}
          disabled={page >= totalPages || totalItems === 0}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
      </div>
    </footer>
  )
}
