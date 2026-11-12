import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { AppData, TableName } from '../lib/types'
import type { PeriodKind } from '../lib/dates'
import { periodRange } from '../lib/dates'
import { useApp } from '../store/app'

export interface PeriodState {
  kind: PeriodKind
  start: string
  end: string
  label: string
  onChange: (kind: PeriodKind, start: string, end: string) => void
}

export function usePeriod(
  initial: PeriodKind = 'last-12',
  initialStart?: string,
  initialEnd?: string
): PeriodState {
  const [state, setState] = useState(() => {
    const range = periodRange(initial, initialStart, initialEnd)
    return { kind: initial, start: range.start, end: range.end, label: range.label }
  })

  const onChange = useCallback((kind: PeriodKind, start: string, end: string) => {
    const range = periodRange(kind, start, end)
    setState({ kind, start: range.start, end: range.end, label: range.label })
  }, [])

  return { ...state, onChange }
}

/**
 * Gives every module a shared "?new=1" entry point used by Quick add and
 * dashboard buttons, then removes the parameter so a refresh does not reopen
 * the form.
 */
export function useQuickCreate(openCreate: () => void): void {
  const [params, setParams] = useSearchParams()
  const createRef = useRef(openCreate)
  createRef.current = openCreate

  useEffect(() => {
    if (params.get('new') !== '1') return
    createRef.current()
    const next = new URLSearchParams(params)
    next.delete('new')
    setParams(next, { replace: true })
  }, [params, setParams])
}

export function useData(): AppData {
  const data = useApp((state) => state.data)
  if (!data) throw new Error('Workspace data has not finished loading.')
  return data
}

export function useRows<T>(table: TableName): T[] {
  return useApp((state) => (state.data ? (state.data[table] as unknown as T[]) : []))
}
