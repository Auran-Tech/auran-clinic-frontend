import { useState } from 'react'

export function useReportFilters<T extends Record<string, string>>(empty: T) {
  const [applied, setApplied] = useState<T>(empty)
  const [draft, setDraft] = useState<T>(empty)
  const [open, setOpen] = useState(false)

  function openDialog() {
    setDraft(applied)
    setOpen(true)
  }

  function update<K extends keyof T>(key: K, value: T[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function apply() {
    setApplied(draft)
    setOpen(false)
  }

  function clear() {
    setApplied(empty)
    setDraft(empty)
    setOpen(false)
  }

  return {
    applied,
    draft,
    open,
    setOpen,
    openDialog,
    update,
    apply,
    clear,
  }
}
