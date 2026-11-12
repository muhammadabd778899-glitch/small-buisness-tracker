import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { db } from '../lib/database'
import { saveAs } from 'file-saver'

export const BackupRestore: React.FC = () => {
  const { isDemo, businessData, isDataLoaded } = useBusinessStore()
  const [backupFormat, setBackupFormat] = useState<'json' | 'csv'>('json')
  const [importProgress, setImportProgress] = useState(0)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  // Create backup
  const createBackup = async () => {
    try {
      // Export all data from Dexie database
      const exportData: any = {}
      
      // List all stores
      const storeNames = [
        'businessSettings', 'accounts', 'incomeTransactions', 'expenseTransactions',
        'products', 'materials', 'suppliers', 'purchases', 'purchaseItems',
        'clients', 'orders', 'orderItems', 'quotes', 'quoteItems',
        'invoices', 'invoiceItems', 'payments', 'refunds', 'bills',
        'tasks', 'communications', 'budgets', 'goals', 'activityLogs'
      ]
      
      // Export each store
      for (const storeName of storeNames) {
        const store = db[storeName as keyof typeof db]
        const data = await store.toArray()
        exportData[storeName] = data
      }
      
      // Add metadata
      exportData.metadata = {
        exportDate: new Date().toISOString(),
        businessName: businessData?.businessName || 'Unknown',
        version: '1.0',
        demoData: isDemo
      }
      
      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2)
      
      // Trigger download
      const blob = new Blob([jsonString], { type: 'application/json' })
      saveAs(blob, `small-business-backup-${new Date().toISOString().slice(0, 10)}.json`)
      
      return jsonString
    } catch (error) {
      console.error('Backup failed:', error)
      throw error
    }
  }

  // Import data
  const importData = async (file: File) => {
    try {
      setImportProgress(0)
      const text = await file.text()
      const importData = JSON.parse(text)
      
      // Validate backup structure
      const requiredStores = ['clients', 'products', 'incomeTransactions', 'expenseTransactions']
      const hasRequired = requiredStores.every(store => importData[store])
      
      if (!hasRequired) {
        throw new Error('Invalid backup file: missing required data stores')
      }
      
      setImportProgress(25)
      
      // Clear existing data (except business settings if they exist)
      await Promise.all([
        db.clients.clear(),
        db.products.clear(),
        db.incomeTransactions.clear(),
        db.expenseTransactions.clear(),
        db.orders.clear(),
        db.orderItems.clear(),
        db.quotes.clear(),
        db.quoteItems.clear(),
        db.invoices.clear(),
        db.invoiceItems.clear(),
        db.payments.clear(),
        db.refunds.clear(),
        db.bills.clear(),
        db.tasks.clear(),
        db.communications.clear(),
        db.budgets.clear(),
        db.goals.clear(),
        db.activityLogs.clear(),
      ])
      
      setImportProgress(50)
      
      // Import data into stores
      const storeNames = Object.keys(importData).filter(
        key => key !== 'metadata' && key !== 'exportDate' && key !== 'businessName' && key !== 'version'
      )
      
      for (const storeName of storeNames) {
        const store = db[storeName as keyof typeof db]
        const records = importData[storeName]
        
        if (Array.isArray(records)) {
          await store.bulkPut(records)
          setImportProgress(50 + (storeNames.indexOf(storeName) / storeNames.length) * 40)
        }
      }
      
      setImportProgress(100)
      
      // Refresh store state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Reload business data
      // Use the store's loadDemoData or initialize business
      
    } catch (error: any) {
      setRestoreError(error.message || 'Import failed')
      console.error('Restore failed:', error)
    } finally {
      setImportProgress(0)
    }
  }

  // Reset demo data
  const resetDemoData = async () => {
    await useBusinessStore.getState().clearDemoData()
    // Reload sample demo data
    await useBusinessStore.getState().loadDemoData()
  }

  // Clear all data
  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all business data? This cannot be undone.')) {
      await useBusinessStore.getState().resetBusiness()
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Backup & Data Management</h2>

      {/* Backup Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Create Backup</h3>
        <p className="text-sm text-[var(--muted)] mb-4">
          Export all your business data to a JSON file for safekeeping.
        </p>
        <button
          onClick={createBackup}
          className="w-full py-3 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors">
          Download Backup JSON
        </button>
        <p className="text-xs text-[var(--muted)] mt-3">
          Warning: Browser storage is local and is not a permanent cloud backup. Regularly export backups.
        </p>
      </div>

      {/* Restore Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Restore from Backup</h3>
        <p className="text-sm text-[var(--muted)] mb-4">
          Upload a previously created backup JSON file to restore your business data.
        </p>
        
        {restoreError && (
          <div className="bg-[var(--soft-bg)] rounded p-3 mb-4">
            <p className="text-[var(--danger)] text-sm">{restoreError}</p>
          </div>
        )}
        
        <input
          type="file"
          accept=".json"
          onChange={(e) => importData(e.target.files[0])}
          className="w-full py-2 rounded border p-2 text-sm mb-4"
        />
        <button
          onClick={resetDemoData}
          className="w-full py-2 rounded bg-[var(--deeporange)] text-white text-sm hover:bg-[var(--danger)] transition-colors"
        >
          Reset to Demo Data
        </button>
        <button
          onClick={clearAllData}
          className="w-full py-2 rounded bg-[var(--danger)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors mt-2"
        >
          Clear All Data
        </button>
      </div>

      {/* Import Progress */}
      {importProgress > 0 && (
        <div className="bg-[var(--soft-bg)] rounded-full h-2 mb-4">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${importProgress}%` }}
            aria-valuemin="0"
            aria-valuemax="100"
          />
          <span className="absolute left-1/2 -translate-x-1/2 text-xs text-[var(--muted)] ml-2">
            {importProgress}%
          </span>
        </div>
      )}

      {/* CSV Export/Import */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">CSV Export/Import</h3>
          <p className="text-sm text-[var(--muted)]">
            Import and export specific data tables in CSV format using PapaParse.
          </p>
          <button className="btn btn-outline text-sm hover-text-[var(--accent)] transition-colors w-full">
            CSV Export
          </button>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">CSV Import</h3>
          <p className="text-sm text-[var(--muted)]">
            Map fields from CSV to database fields. Validation errors will be displayed.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (e) => {
                  const text = e.target.result
                  const result = PapaParse.parse(text as string, { header: true })
                  // Handle CSV import with field mapping
                  console.log('CSV data:', result.data)
                }
                reader.readAsText(file)
              }
            }}
            className="w-full py-2 rounded border p-2 text-sm mb-4"
          />
          <button className="btn btn-outline text-sm hover-text-[var(--accent)] transition-colors w-full">
            Import with Mapping
          </button>
        </div>
      </div>

      {/* Data Information */}
      <div className="mt-8 bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Data Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--muted)]">Database Version</p>
            <p className="text-sm font-medium">{isDemo ? 'Demo (v1)' : 'Business Data'}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Last Backup</p>
            <p className="text-sm font-medium">Never - Create your first backup</p>
          </div>
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">
          Warning: Browser storage is local and is not a permanent cloud backup. Regularly export backups to prevent data loss.
        </p>
      </div>
    </div>
  )
}