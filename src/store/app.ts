import { create } from 'zustand'
import {
  db,
  defaultSettings,
  ensureSettings,
  idStartsWithDemo,
  nowISO,
  readAll,
  resetDatabase,
  TABLE_NAMES,
  tableFor,
  uid
} from '../lib/db'
import type { ActivityLog, ActivityType, AppData, BusinessSettings, TableName } from '../lib/types'
import { buildDemoData } from '../lib/seed'

export type ToastTone = 'success' | 'error' | 'info'

interface Toast {
  message: string
  tone: ToastTone
}

interface AppState {
  data: AppData | null
  ready: boolean
  busy: boolean
  error: string | null
  toast: Toast | null
  init: () => Promise<void>
  reload: () => Promise<void>
  put: <T extends Row>(table: TableName, record: T) => Promise<void>
  putMany: <T extends Row>(table: TableName, records: T[]) => Promise<void>
  remove: (table: TableName, id: string) => Promise<void>
  saveSettings: (partial: Partial<BusinessSettings>) => Promise<void>
  allocateNumber: (kind: 'invoice' | 'quote' | 'order') => Promise<string>
  log: (type: ActivityType, message: string, entity: string, entityId?: string | null) => Promise<void>
  loadDemo: () => Promise<void>
  clearDemo: () => Promise<void>
  resetAll: () => Promise<void>
  replaceAll: (data: AppData) => Promise<void>
  notify: (message: string, tone?: ToastTone) => void
  dismissToast: () => void
  dismissError: () => void
}

type Row = { id: string }

function upsert<T extends Row>(rows: T[], record: T): T[] {
  const exists = rows.some((row) => row.id === record.id)
  if (!exists) return [...rows, record]
  return rows.map((row) => (row.id === record.id ? { ...row, ...record } : row))
}

function withTable(data: AppData, table: TableName, rows: unknown[]): AppData {
  return { ...data, [table]: rows } as AppData
}

let toastTimer: number | undefined

export const useApp = create<AppState>((set, get) => ({
  data: null,
  ready: false,
  busy: false,
  error: null,
  toast: null,

  init: async () => {
    set({ busy: true, error: null })
    try {
      await ensureSettings()
      const data = await readAll()
      set({ data, ready: true, busy: false })
    } catch (error) {
      set({
        busy: false,
        error:
          error instanceof Error
            ? error.message
            : 'Local storage could not be opened. Check that IndexedDB is available in this browser.'
      })
    }
  },

  reload: async () => {
    const data = await readAll()
    set({ data, ready: true })
  },

  put: async <T extends Row>(table: TableName, record: T) => {
    await tableFor(table).put(record)
    const state = get()
    if (!state.data) return
    const rows = state.data[table] as unknown as Row[]
    set({ data: withTable(state.data, table, upsert(rows, record)) })
  },

  putMany: async <T extends Row>(table: TableName, records: T[]) => {
    if (!records.length) return
    await tableFor(table).bulkPut(records)
    const state = get()
    if (!state.data) return
    let rows = state.data[table] as unknown as Row[]
    for (const record of records) rows = upsert(rows, record)
    set({ data: withTable(state.data, table, rows) })
  },

  remove: async (table, id) => {
    await tableFor(table).delete(id)
    const state = get()
    if (!state.data) return
    const rows = (state.data[table] as unknown as Row[]).filter((row) => row.id !== id)
    set({ data: withTable(state.data, table, rows) })
  },

  saveSettings: async (partial) => {
    const current = get().data?.settings
    if (!current) return
    const updated: BusinessSettings = {
      ...current,
      ...partial,
      id: 'business',
      updatedAt: nowISO()
    }
    await db.settings.put(updated)
    const state = get()
    if (state.data) set({ data: { ...state.data, settings: updated } })
  },

  allocateNumber: async (kind) => {
    const settings = get().data?.settings
    if (!settings) return ''
    const year = new Date().getFullYear()
    if (kind === 'invoice') {
      const number = `${settings.invoicePrefix}-${year}-${String(settings.nextInvoiceNumber).padStart(4, '0')}`
      await get().saveSettings({ nextInvoiceNumber: settings.nextInvoiceNumber + 1 })
      return number
    }
    if (kind === 'quote') {
      const number = `${settings.quotePrefix}-${year}-${String(settings.nextQuoteNumber).padStart(4, '0')}`
      await get().saveSettings({ nextQuoteNumber: settings.nextQuoteNumber + 1 })
      return number
    }
    const number = `${settings.orderPrefix}-${year}-${String(settings.nextOrderNumber).padStart(4, '0')}`
    await get().saveSettings({ nextOrderNumber: settings.nextOrderNumber + 1 })
    return number
  },

  log: async (type, message, entity, entityId = null) => {
    const entry: ActivityLog = {
      id: uid('log'),
      type,
      message,
      entity,
      entityId,
      at: nowISO()
    }
    await db.activityLogs.put(entry)
    const state = get()
    if (state.data) {
      set({
        data: {
          ...state.data,
          activityLogs: [entry, ...state.data.activityLogs].slice(0, 300)
        }
      })
    }
  },

  loadDemo: async () => {
    set({ busy: true, error: null })
    try {
      const existing = await readAll()
      // Audit logs are not business records: demo actions log entries that would
      // otherwise block a fresh demo load after the demo data was removed.
      const hasRealData = TABLE_NAMES.some(
        (name) =>
          name !== 'activityLogs' &&
          ((existing[name] as unknown as Row[]) || []).some((row) => !idStartsWithDemo(row.id))
      )
      if (hasRealData) {
        throw new Error(
          'This workspace already contains your own records. Reset the workspace to an empty business before loading demo data.'
        )
      }
      if (!existing.settings.demoMode) {
        localStorage.setItem('usbm:settings-backup', JSON.stringify(existing.settings))
      }
      const demo = buildDemoData()
      await db.transaction('rw', db.tables, async () => {
        for (const name of TABLE_NAMES) await tableFor(name).clear()
        await db.settings.clear()
        await db.settings.put(demo.settings)
        for (const name of TABLE_NAMES) {
          const rows = demo[name] as unknown as Row[]
          if (rows.length) await tableFor(name).bulkPut(rows)
        }
      })
      set({ data: demo, ready: true, busy: false })
      get().notify('Demo workspace loaded. You can reset it from Settings at any time.', 'success')
    } catch (error) {
      set({
        busy: false,
        error: error instanceof Error ? error.message : 'Demo data could not be loaded.'
      })
      throw error
    }
  },

  clearDemo: async () => {
    set({ busy: true })
    try {
      const data = await readAll()
      await db.transaction('rw', db.tables, async () => {
        for (const name of TABLE_NAMES) {
          const ids = (data[name] as unknown as Row[])
            .filter((row) => idStartsWithDemo(row.id))
            .map((row) => row.id)
          if (ids.length) await tableFor(name).bulkDelete(ids)
        }
        const backup = localStorage.getItem('usbm:settings-backup')
        let settings = defaultSettings()
        if (backup) {
          try {
            settings = { ...(JSON.parse(backup) as BusinessSettings), demoMode: false, updatedAt: nowISO() }
          } catch {
            settings = defaultSettings()
          }
        }
        await db.settings.put(settings)
      })
      localStorage.removeItem('usbm:settings-backup')
      await get().reload()
      get().notify('Demo data removed. Your own records were left untouched.', 'success')
    } finally {
      set({ busy: false })
    }
  },

  resetAll: async () => {
    set({ busy: true })
    try {
      await resetDatabase()
      const data = await readAll()
      set({ data, ready: true, error: null })
      get().notify('Workspace reset. You now have a clean business.', 'success')
    } finally {
      set({ busy: false })
    }
  },

  replaceAll: async (data) => {
    set({ busy: true })
    try {
      const next: AppData = { ...data, settings: { ...data.settings, id: 'business' } }
      await db.transaction('rw', db.tables, async () => {
        for (const name of TABLE_NAMES) await tableFor(name).clear()
        await db.settings.clear()
        await db.settings.put(next.settings)
        for (const name of TABLE_NAMES) {
          const rows = next[name] as unknown as Row[]
          if (rows.length) await tableFor(name).bulkPut(rows)
        }
      })
      set({ data: next, ready: true, error: null })
      get().notify('Backup restored successfully.', 'success')
    } finally {
      set({ busy: false })
    }
  },

  notify: (message, tone = 'info') => {
    set({ toast: { message, tone } })
    if (toastTimer) window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => set({ toast: null }), 4500)
  },

  dismissToast: () => set({ toast: null }),
  dismissError: () => set({ error: null })
}))
