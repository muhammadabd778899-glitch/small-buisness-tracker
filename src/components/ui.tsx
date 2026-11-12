import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import type { BusinessSettings } from '../lib/types'
import type { PeriodKind } from '../lib/dates'
import { PERIOD_OPTIONS } from '../lib/dates'
import { useApp } from '../store/app'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  small?: boolean
}

export function Button({ variant = 'secondary', small, className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}${small ? ' btn-sm' : ''}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export function IconButton({ label, className = '', type = 'button', ...props }: IconButtonProps) {
  return (
    <button type={type} className={`icon-btn ${className}`.trim()} aria-label={label} title={label} {...props} />
  )
}

export function Card({
  children,
  className = '',
  padded = true
}: {
  children: React.ReactNode
  className?: string
  padded?: boolean
}) {
  return <div className={`card ${padded ? 'p-4 sm:p-5' : ''} ${className}`.trim()}>{children}</div>
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  eyebrow?: string
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
        ) : null}
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

export function Badge({
  children,
  tone = 'neutral',
  className = ''
}: {
  children: React.ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return <span className={`badge badge-${tone} ${className}`.trim()}>{children}</span>
}

const STATUS_TONES: Record<string, BadgeTone> = {
  paid: 'success',
  completed: 'success',
  fulfilled: 'success',
  received: 'success',
  active: 'success',
  done: 'success',
  converted: 'success',
  accepted: 'success',
  sent: 'brand',
  partial: 'warning',
  'in-progress': 'warning',
  ready: 'brand',
  confirmed: 'brand',
  unpaid: 'warning',
  upcoming: 'warning',
  todo: 'neutral',
  draft: 'neutral',
  ordered: 'brand',
  overdue: 'danger',
  declined: 'danger',
  cancelled: 'danger',
  void: 'danger',
  expired: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'neutral'
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] || 'neutral'}>{labelize(status)}</Badge>
}

export function labelize(value: string): string {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function KpiCard({
  label,
  value,
  hint,
  tone = 'neutral',
  icon
}: {
  label: string
  value: string
  hint?: string
  tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'brand'
  icon?: React.ReactNode
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'danger'
        ? 'text-danger'
        : tone === 'warning'
          ? 'text-warning'
          : tone === 'brand'
            ? 'text-brand-dark'
            : 'text-ink'
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
        {icon ? <span className="text-brand">{icon}</span> : null}
      </div>
      <p className={`mt-2 text-[24px] font-bold leading-tight ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="empty">
      {icon ? <div className="mb-1 text-brand">{icon}</div> : null}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="max-w-md text-xs leading-relaxed">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = ''
}: {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="error-text">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}

export function FormGrid({ children, columns = 2 }: { children: React.ReactNode; columns?: 2 | 3 }) {
  return <div className={`grid gap-3 ${columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>{children}</div>
}

export interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}

export function Modal({ open, title, description, onClose, children, footer, wide }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={`modal ${wide ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 className="text-base font-bold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
          </div>
          <IconButton label="Close dialog" onClick={onClose}>
            <X size={17} />
          </IconButton>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  busy,
  onCancel,
  onConfirm
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-[#4c4742]">{message}</p>
    </Modal>
  )
}

export interface Column<T> {
  key: string
  label: string
  render: (row: T, index: number) => React.ReactNode
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
  className?: string
}

export interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  searchable?: (row: T) => string
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  toolbar?: React.ReactNode
  initialSort?: { key: string; direction: 'asc' | 'desc' }
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchable,
  pageSize = 10,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  toolbar,
  initialSort
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | undefined>(initialSort)

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return rows
    const needle = query.trim().toLowerCase()
    return rows.filter((row) => searchable(row).toLowerCase().includes(needle))
  }, [rows, searchable, query])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const column = columns.find((item) => item.key === sort.key)
    if (!column?.sortValue) return filtered
    const copy = [...filtered]
    copy.sort((a, b) => {
      const left = column.sortValue!(a)
      const right = column.sortValue!(b)
      if (typeof left === 'number' && typeof right === 'number') {
        return sort.direction === 'asc' ? left - right : right - left
      }
      return sort.direction === 'asc'
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left))
    })
    return copy
  }, [filtered, sort, columns])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const visible = sorted.slice(start, start + pageSize)

  const toggleSort = (column: Column<T>) => {
    if (!column.sortValue) return
    setSort((current) => {
      if (!current || current.key !== column.key) return { key: column.key, direction: 'asc' }
      return { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    })
  }

  return (
    <div>
      {(searchable || toolbar) && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {searchable ? (
            <div className="relative w-full sm:max-w-xs">
              <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input pl-8"
                placeholder="Search…"
                aria-label="Search records"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
              />
            </div>
          ) : (
            <span />
          )}
          {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`${column.sortValue ? 'sortable' : ''} ${column.className || ''}`.trim()}
                      style={{ textAlign: column.align || 'left' }}
                      aria-sort={
                        sort?.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                      }
                      onClick={() => toggleSort(column)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {column.label}
                        {sort?.key === column.key ? (
                          sort.direction === 'asc' ? (
                            <ArrowUp size={12} />
                          ) : (
                            <ArrowDown size={12} />
                          )
                        ) : null}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, index) => (
                  <tr key={row.id}>
                    {columns.map((column) => (
                      <td key={column.key} style={{ textAlign: column.align || 'left' }} className={column.className}>
                        {column.render(row, start + index)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}
            </span>
            {pageCount > 1 ? (
              <div className="flex items-center gap-1">
                <Button small onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={14} /> Prev
                </Button>
                <span className="px-2">
                  Page {currentPage} of {pageCount}
                </span>
                <Button
                  small
                  onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                  disabled={currentPage === pageCount}
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

export function PeriodPicker({
  kind,
  start,
  end,
  onChange
}: {
  kind: PeriodKind
  start: string
  end: string
  onChange: (kind: PeriodKind, start: string, end: string) => void
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="label" htmlFor="period-select">
          Reporting period
        </label>
        <select
          id="period-select"
          className="select min-w-[170px]"
          value={kind}
          onChange={(event) => onChange(event.target.value as PeriodKind, start, end)}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {kind === 'custom' ? (
        <>
          <div>
            <label className="label" htmlFor="period-start">
              From
            </label>
            <input
              id="period-start"
              type="date"
              className="input"
              value={start}
              onChange={(event) => onChange(kind, event.target.value, end)}
            />
          </div>
          <div>
            <label className="label" htmlFor="period-end">
              To
            </label>
            <input
              id="period-end"
              type="date"
              className="input"
              value={end}
              onChange={(event) => onChange(kind, start, event.target.value)}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

export function SectionTitle({
  title,
  description,
  action
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Money({ value, settings }: { value: number; settings: BusinessSettings }) {
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: settings.currencyPrecision,
    maximumFractionDigits: settings.currencyPrecision
  })
  return (
    <span>
      {settings.currencySymbol}
      {formatted}
    </span>
  )
}

export function Toast() {
  const toast = useApp((state) => state.toast)
  const dismiss = useApp((state) => state.dismissToast)
  if (!toast) return null
  return (
    <div className={`toast toast-${toast.tone}`} role="status">
      <span className="flex-1">{toast.message}</span>
      <button type="button" className="text-white/80 hover:text-white" onClick={dismiss} aria-label="Dismiss message">
        <X size={15} />
      </button>
    </div>
  )
}

export function LoadingScreen({ label = 'Loading your workspace…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-muted">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-soft border-t-brand" />
      {label}
    </div>
  )
}

export function PageTabs({ tabs }: { tabs: { label: string; to: string }[] }) {
  return (
    <div className="tabs mb-4" role="tablist">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          role="tab"
          className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
