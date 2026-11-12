import React from 'react'
import { Container } from './components/ui/layout'
import { Route, Routes } from 'react-router-dom'
import { Overview } from './modules/overview'
import { Finance } from './modules/finance'
import { Sales } from './modules/sales'
import { Products } from './modules/products'
import { Clients } from './modules/clients'
import { Planning } from './modules/planning'
import { Reports } from './modules/reports'
import { GlobalSearchAndQuickActions } from './modules/search-actions'
import { BackupRestore } from './modules/backup-restore'
import { useBusinessStore } from './store/business'

export const App: React.FC = () => {
  const { isLoaded, initializeBusiness } = useBusinessStore()

  // Initialize business data on mount
  React.useEffect(() => {
    if (!isLoaded) {
      initializeBusiness()
    }
  }, [isLoaded])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      {/* Top navigation bar */}
      <nav className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between h-16 px-6">
          {/* Left side: Logo and business name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-wide">Ultimate Small Business Manager</span>
          </div>

          {/* Center: Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#overview" className="nav-link py-2 px-3 text-sm font-medium hover:text-[var(--accent)] transition-colors ring-2 ring-[var(--accent)]">Overview</a>
            <a href="#finance" className="nav-link py-2 px-3 text-sm font-medium hover:text-[var(--accent)] transition-colors ring-2 ring-[var(--accent)]">Finance</a>
            <a href="#sales" className="nav-link py-2 px-3 text-sm font-medium hover:text-[var(--accent)] transition-colors ring-2 ring-[var(--accent)]">Sales</a>
            <a href="#products" className="nav-link py-2 px-3 text-sm font-medium hover:text-[var(--accent)] transition-colors ring-2 ring-[var(--accent)]">Products</a>
            <a href="#clients" className="nav-link py-2 px-3 text-sm font-medium hover:text-[var(--accent)] transition-colors ring-2 ring-[var(--accent)]">Clients</a>
          </div>

          {/* Right side: Utility actions */}
          <div className="flex items-center gap-4">
            <button className="btn btn-ghost text-sm hover:text-[var(--accent)] transition-colors" title="Quick Add">
              +
            </button>
            <button className="btn btn-ghost text-sm hover:text-[var(--accent)] transition-colors" title="Settings">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 12l2-2m0 2l2-2m-2 2l2-2m2 2l2-2m7-3v9m-6 0v9m3-3v3m3-3v3m3-3v3m-6-6v3m6 0v3m-3 0v3m0-6h3m-3 0h3m3-3h3m-6 0a6 6 0 0 1 6-6z"/>
              </svg>
            </button>
            <button className="btn btn-ghost text-sm hover:text-[var(--accent)] transition-colors" title="Demo">
              Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main className="py-6">
        <Container>
          {/* Routes */}
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/products" element={<Products />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>

          {/* Search and Quick Actions */}
          <GlobalSearchAndQuickActions />

          {/* Backup and Restore */}
          <BackupRestore />
        </Container>
      </main>
    </div>
  )
}

export default App
