import React from 'react'
import { useBusinessStore } from '../store/business'

export const Navigation: React.FC = () => {
  const { isDemo, businessData, navigateTo } = useBusinessStore()

  const navLinks = [
    { id: 'overview', label: 'Overview', href: '#overview' },
    { id: 'finance', label: 'Finance', href: '#finance' },
    { id: 'sales', label: 'Sales', href: '#sales' },
    { id: 'products', label: 'Products', href: '#products' },
    { id: 'clients', label: 'Clients', href: '#clients' },
    { id: 'planning', label: 'Planning', href: '#planning' },
    { id: 'reports', label: 'Reports', href: '#reports' },
    { id: 'settings', label: 'Settings', href: '#settings' }
  ]

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-wide">Ultimate Small Business Manager</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className="nav-link py-2 px-3 text-sm font-medium hover:text-[var(--accent)] transition-colors"
              onClick={(e) => {
                e.preventDefault()
                navigateTo(link.id)
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            className="btn btn-ghost text-sm hover:text-[var(--accent)] transition-colors"
            onClick={() => navigateTo('quick-add')}
            title="Quick Add"
          >
            +
          </button>
          <button
            className="btn btn-ghost text-sm hover:text-[var(--accent)] transition-colors"
            onClick={() => navigateTo('settings')}
            title="Settings"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 12l2-2m0 2l2-2m-2 2l2-2m2 2l2-2m7-3v9m-6 0v9m3-3v3m3-3v3m3-3v3m-6-6v3m6 0v3m-3 0v3m0-6h3m-3 0h3m3-3h3m-6 0a6 6 0 0 1 6-6z"/>
            </svg>
          </button>
          <button
            className="btn btn-ghost text-sm hover:text-[var(--accent)] transition-colors"
            onClick={() => navigateTo(isDemo ? 'live' : 'demo')}
            title={isDemo ? 'Live Mode' : 'Demo Mode'}
          >
            {isDemo ? 'Live' : 'Demo'}
          </button>
        </div>
      </div>
    </nav>
  )
}