import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ListFilter } from 'lucide-react'
import { Dialog } from 'primereact/dialog'

interface ReportFilterDialogProps {
  children: ReactNode
  count: number
  open: boolean
  onOpen: () => void
  onHide: () => void
  onApply: () => void
  onClear: () => void
  error?: string
}

export function ReportFilterDialog({
  children,
  count,
  open,
  onOpen,
  onHide,
  onApply,
  onClear,
  error,
}: ReportFilterDialogProps) {
  const { t } = useTranslation('reporting')

  return (
    <>
      <div className="report-filter-toolbar">
        {count > 0 && (
          <button className="button secondary" type="button" onClick={onClear}>
            {t('clearFilters')}
          </button>
        )}
        <button className="button secondary" type="button" onClick={onOpen}>
          <ListFilter size={16} aria-hidden="true" />
          {t('filters')}
          {count > 0 ? ` (${count})` : ''}
        </button>
      </div>
      <Dialog
        header={t('filters')}
        visible={open}
        onHide={onHide}
        className="report-filter-dialog"
        modal
        dismissableMask
      >
        <div className="report-filters">
          {children}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="actions report-filter-actions">
            <button className="button secondary" type="button" onClick={onClear}>
              {t('clearFilters')}
            </button>
            <button
              className="button primary"
              type="button"
              onClick={onApply}
              disabled={Boolean(error)}
            >
              {t('applyFilters')}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
