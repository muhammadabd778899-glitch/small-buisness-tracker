import React from 'react'
import { Container } from './components/ui/layout'
import { Navigation } from './components/ui/navigation'
import { Route, Routes, useRoutes } from 'react-router-dom'
import { Overview } from './modules/overview'
import { Finance } from './modules/finance'
import { Sales } from './modules/sales'
import { Products } from './modules/products'
import { Clients } from './modules/clients'
import { Planning } from './modules/planning'
import { Reports } from './modules/reports'
import { SearchAndQuickActions } from './modules/search-actions'
import { BackupRestore } from './modules/backup-restore'
import { useBusinessStore } from './store/business'

export const App: React.FC = () => {
  const { isDemo, businessData, loadDemoData, clearDemoData, resetBusiness, isLoaded, initializeBusiness, setIsDemo } = useBusinessStore()
  const { settings } = useBusinessStore()

  // Initialize business data on mount
  React.useEffect(() => {
    if (!isLoaded) {
      initializeBusiness()
    }
  }, [isLoaded])

  // If demo mode is selected, load demo data
  React.useEffect(() => {
    if (isDemo && businessData?.businessName !== 'Orange & Oak Studio') {
      loadDemoData()
    }
  }, [isDemo, businessData?.businessName])
}

export default App