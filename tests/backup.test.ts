import { describe, expect, it } from 'vitest'
import { APP_ID, SCHEMA_VERSION, backupFileName, makeBackup, validateBackup } from '../src/lib/backup'
import { emptyData, makeClient } from './fixtures'

describe('makeBackup', () => {
  it('wraps data with app metadata', () => {
    const data = emptyData({ clients: [makeClient()] })
    const backup = makeBackup(data)
    expect(backup.app).toBe(APP_ID)
    expect(backup.schemaVersion).toBe(SCHEMA_VERSION)
    expect(backup.data.clients).toHaveLength(1)
    expect(Number.isNaN(Date.parse(backup.exportedAt))).toBe(false)
  })
})

describe('validateBackup', () => {
  it('accepts a backup produced by the app', () => {
    const result = validateBackup(makeBackup(emptyData({ clients: [makeClient()] })))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.clients[0].name).toBe('Ada Lovelace')
      expect(result.data.settings.id).toBe('business')
    }
  })

  it('rejects files from other apps', () => {
    const backup = makeBackup(emptyData())
    const result = validateBackup({ ...backup, app: 'something-else' })
    expect(result).toEqual({ ok: false, error: 'This file was not created by Ultimate Small Business Manager.' })
  })

  it('rejects unsupported schema versions', () => {
    const backup = makeBackup(emptyData())
    const result = validateBackup({ ...backup, schemaVersion: 99 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Unsupported backup version')
  })

  it('rejects missing collections and invalid records', () => {
    const backup = makeBackup(emptyData())
    const missing = validateBackup({ ...backup, data: { ...backup.data, clients: undefined } })
    expect(missing.ok).toBe(false)

    const invalid = validateBackup({
      ...backup,
      data: { ...backup.data, clients: [{ name: 'No id' }] }
    })
    expect(invalid.ok).toBe(false)
    if (!invalid.ok) expect(invalid.error).toContain('clients')
  })

  it('rejects non-object input and missing settings', () => {
    expect(validateBackup(null).ok).toBe(false)
    expect(validateBackup('text').ok).toBe(false)
    const backup = makeBackup(emptyData())
    const noSettings = validateBackup({ ...backup, data: { ...backup.data, settings: { id: 'business' } } })
    expect(noSettings.ok).toBe(false)
  })
})

describe('backupFileName', () => {
  it('stamps the local date', () => {
    expect(backupFileName(new Date(2026, 2, 9))).toBe('business-backup-2026-03-09.json')
  })
})
