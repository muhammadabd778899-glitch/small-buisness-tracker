import type { AppData, BusinessSettings, TableName } from './types'
import { TABLE_NAMES } from './db'

export const APP_ID = 'ultimate-small-business-manager'
export const SCHEMA_VERSION = 1

export interface BackupFile {
  app: string
  schemaVersion: number
  exportedAt: string
  data: AppData
}

export function makeBackup(data: AppData): BackupFile {
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data
  }
}

export interface ValidationSuccess {
  ok: true
  data: AppData
  exportedAt: string
}

export interface ValidationFailure {
  ok: false
  error: string
}

export function validateBackup(raw: unknown): ValidationSuccess | ValidationFailure {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'The file is not a JSON object.' }
  }
  const candidate = raw as Partial<BackupFile>
  if (candidate.app !== APP_ID) {
    return { ok: false, error: 'This file was not created by Ultimate Small Business Manager.' }
  }
  if (candidate.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, error: `Unsupported backup version: ${String(candidate.schemaVersion)}.` }
  }
  const data = candidate.data as Partial<AppData> | undefined
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'The backup does not contain business data.' }
  }
  const settings = data.settings as Partial<BusinessSettings> | undefined
  if (!settings || typeof settings.businessName !== 'string') {
    return { ok: false, error: 'The backup is missing valid business settings.' }
  }
  for (const name of TABLE_NAMES as TableName[]) {
    const rows = (data as Record<string, unknown>)[name]
    if (!Array.isArray(rows)) {
      return { ok: false, error: `The backup is missing the "${name}" collection.` }
    }
    if (rows.some((row) => !row || typeof row !== 'object' || typeof (row as { id?: unknown }).id !== 'string')) {
      return { ok: false, error: `The "${name}" collection contains invalid records.` }
    }
  }
  return {
    ok: true,
    data: { ...(data as AppData), settings: { ...settings, id: 'business' } as BusinessSettings },
    exportedAt: candidate.exportedAt || new Date().toISOString()
  }
}

export function backupFileName(date = new Date()): string {
  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
  return `business-backup-${stamp}.json`
}
