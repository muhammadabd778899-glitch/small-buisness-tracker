import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CalendarClock,
  ChevronDown,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
  X
} from 'lucide-react'
import { useApp } from '../store/app'
import { Badge, IconButton, Modal } from './ui'
import { todayISO, addDays } from '../lib/dates'
import { invoiceBalance } from '../lib/calc'
import { formatCurrency } from '../lib/money'
import type { BusinessSettings } from '../lib/types'

interface NavItem {
  label: string
  to: string
}

interface NavGroup {
  label: string
  to: string
  icon: React.ReactNode
  items?: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  { label: 'Overview', to: '/', icon: <LayoutDashboard size={15} /> },
  {
    label: 'Finance',
    to: '/finance/income',
    icon: <Wallet size={15} />,
    items: [
      { label: 'Income', to: '/finance/income' },
      { label: 'Expenses', to: '/finance/expenses' },
      { label: 'Accounts & transfers', to: '/finance/accounts' },
      { label: 'Tax tracker', to: '/finance/tax' }
    ]
  },
  {
    label: 'Sales',
    to: '/sales/orders',
    icon: <ShoppingCart size={15} />,
    items: [
      { label: 'Orders', to: '/sales/orders' },
      { label: 'Quotes', to: '/sales/quotes' },
      { label: 'Invoices', to: '/sales/invoices' },
      { label: 'Payments & refunds', to: '/sales/payments' }
    ]
  },
  {
    label: 'Products',
    to: '/products/catalog',
    icon: <Package size={15} />,
    items: [
      { label: 'Product catalog', to: '/products/catalog' },
      { label: 'Pricing calculator', to: '/products/pricing' },
      { label: 'Raw materials', to: '/products/materials' },
      { label: 'Inventory', to: '/products/inventory' },
      { label: 'Suppliers & purchases', to: '/products/suppliers' }
    ]
  },
  {
    label: 'Clients',
    to: '/clients/list',
    icon: <Users size={15} />,
    items: [
      { label: 'Client CRM', to: '/clients/list' },
      { label: 'Tasks', to: '/clients/tasks' },
      { label: 'Communication log', to: '/clients/communication' }
    ]
  },
  {
    label: 'Planning',
    to: '/planning/bills',
    icon: <CalendarClock size={15} />,
    items: [
      { label: 'Bills & calendar', to: '/planning/bills' },
      { label: 'Budgets & goals', to: '/planning/budgets' }
    ]
  },
  { label: 'Reports', to: '/reports', icon: <BarChart3 size={15} /> },
  { label: 'Settings', to: '/settings', icon: <Settings size={15} /> }
]

const QUICK_ACTIONS: { label: string; description: string; to: string }[] = [
  { label: 'Income', description: 'Record money received', to: '/finance/income?new=1' },
  { label: 'Expense', description: 'Record a business cost', to: '/finance/expenses?new=1' },
  { label: 'Client', description: 'Add a customer or company', to: '/clients/list?new=1' },
  { label: 'Product', description: 'Add a product to the catalog', to: '/products/catalog?new=1' },
  { label: 'Order', description: 'Create a new sales order', to: '/sales/orders?new=1' },
  { label: 'Invoice', description: 'Issue an invoice', to: '/sales/invoices?new=1' },
  { label: 'Bill', description: 'Track a recurring bill', to: '/planning/bills?new=1' },
  { label: 'Task', description: 'Add a to-do item', to: '/clients/tasks?new=1' }
]

export function TopNav() {
  const settings = useApp((state) => state.data?.settings)
  const location = useLocation()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const online = useOnline()

  useEffect(() => {
    setOpenGroup(null)
    setMobileOpen(false)
    setNotificationsOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenGroup(null)
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const isGroupActive = (group: NavGroup) =>
    group.to === '/' ? location.pathname === '/' : location.pathname.startsWith(group.to.split('/').slice(0, 2).join('/'))

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur no-print">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-5">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 text-decoration-none" aria-label="Go to overview">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand text-white shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Z" fill="currentColor" opacity="0.95" />
                <path d="m4 12 8 4.5 8-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m4 15.5 8 4.5 8-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
              </svg>
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-[15px] font-bold tracking-tight text-ink">Business Manager</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Offline-first</span>
            </span>
          </Link>

          <nav ref={navRef} className="ml-2 hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
            {NAV_GROUPS.map((group) =>
              group.items ? (
                <div key={group.label} className="relative">
                  <button
                    type="button"
                    className={`nav-link ${isGroupActive(group) ? 'nav-link-active' : ''}`}
                    aria-expanded={openGroup === group.label}
                    aria-haspopup="true"
                    onClick={() => setOpenGroup((current) => (current === group.label ? null : group.label))}
                  >
                    {group.label}
                    <ChevronDown size={13} className={openGroup === group.label ? 'rotate-180 transition-transform' : 'transition-transform'} />
                  </button>
                  {openGroup === group.label ? (
                    <div className="dropdown" role="menu">
                      {group.items.map((item) => (
                        <Link key={item.to} to={item.to} role="menuitem">
                          {item.label}
                          <span className="text-[10px] text-muted">→</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <NavLink
                  key={group.label}
                  to={group.to}
                  end={group.to === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  {group.label}
                </NavLink>
              )
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {settings?.demoMode ? <Badge tone="brand" className="hidden sm:inline-flex">Demo data</Badge> : null}
            {!online ? <Badge tone="warning" className="hidden sm:inline-flex">Offline</Badge> : null}
            <IconButton label="Global search (Ctrl+K)" onClick={() => setSearchOpen(true)}>
              <Search size={18} />
            </IconButton>

            <div className="relative">
              <IconButton label="Notifications" className="relative" onClick={() => setNotificationsOpen((value) => !value)}>
                <Bell size={18} />
                <NotificationDot />
              </IconButton>
              {notificationsOpen ? <NotificationsPanel settings={settings} onClose={() => setNotificationsOpen(false)} /> : null}
            </div>

            <button
              type="button"
              className="btn btn-primary ml-1 hidden sm:inline-flex"
              onClick={() => setQuickOpen(true)}
            >
              <Plus size={16} /> Quick add
            </button>
            <IconButton label="Quick add" className="sm:hidden" onClick={() => setQuickOpen(true)}>
              <Plus size={19} />
            </IconButton>

            <IconButton
              label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden"
              onClick={() => setMobileOpen((value) => !value)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </IconButton>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-line bg-white px-4 pb-4 pt-2 lg:hidden">
            <div className="grid gap-1">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <Link
                    to={group.to}
                    className={`nav-link w-full ${isGroupActive(group) ? 'nav-link-active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {group.icon}
                    {group.label}
                  </Link>
                  {group.items ? (
                    <div className="ml-7 grid gap-0.5 pb-1">
                      {group.items.map((item) => (
                        <Link key={item.to} to={item.to} className="nav-link text-[13px]" onClick={() => setMobileOpen(false)}>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} />
    </>
  )
}

function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}

function NotificationDot() {
  const data = useApp((state) => state.data)
  if (!data) return null
  const today = todayISO()
  const count =
    data.invoices.filter(
      (invoice) =>
        invoiceBalance(invoice, data.payments, data.refunds, today).balance > 0 && invoice.dueDate < today
    ).length +
    data.bills.filter((bill) => bill.status === 'unpaid' && bill.dueDate <= addDays(today, 7)).length +
    data.tasks.filter((task) => task.status !== 'done' && task.dueDate && task.dueDate <= addDays(today, 7)).length
  if (count === 0) return null
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}

interface NotificationItem {
  key: string
  label: string
  meta: string
  to: string
  tone: 'danger' | 'warning' | 'neutral'
}

function NotificationsPanel({ settings, onClose }: { settings?: BusinessSettings; onClose: () => void }) {
  const data = useApp((state) => state.data)
  const items = useMemo<NotificationItem[]>(() => {
    if (!data) return []
    const today = todayISO()
    const result: NotificationItem[] = []
    for (const invoice of data.invoices) {
      const balance = invoiceBalance(invoice, data.payments, data.refunds, today)
      if (balance.balance > 0 && invoice.dueDate < today) {
        result.push({
          key: `invoice-${invoice.id}`,
          label: `${invoice.number} is overdue`,
          meta: settings ? `${formatCurrency(balance.balance, settings)} outstanding` : '',
          to: '/sales/invoices',
          tone: 'danger'
        })
      }
    }
    for (const bill of data.bills) {
      if (bill.status === 'unpaid' && bill.dueDate <= addDays(today, 7)) {
        result.push({
          key: `bill-${bill.id}`,
          label: `${bill.name} ${bill.dueDate < today ? 'is overdue' : 'is due soon'}`,
          meta: settings ? formatCurrency(bill.amount, settings) : '',
          to: '/planning/bills',
          tone: bill.dueDate < today ? 'danger' : 'warning'
        })
      }
    }
    for (const task of data.tasks) {
      if (task.status !== 'done' && task.dueDate && task.dueDate <= addDays(today, 7)) {
        result.push({
          key: `task-${task.id}`,
          label: task.title,
          meta: task.dueDate < today ? 'Task overdue' : 'Task due soon',
          to: '/clients/tasks',
          tone: task.dueDate < today ? 'danger' : 'warning'
        })
      }
    }
    return result.slice(0, 8)
  }, [data, settings])

  return (
    <div className="dropdown right-0 left-auto w-[min(360px,calc(100vw-2rem))]">
      <div className="flex items-center justify-between px-2 py-1.5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Reminders</p>
        <button type="button" className="text-xs text-brand-dark" onClick={onClose}>
          Close
        </button>
      </div>
      {items.length === 0 ? (
        <p className="px-2 py-4 text-xs text-muted">You are all caught up. No overdue invoices, bills or tasks.</p>
      ) : (
        <div className="grid gap-0.5">
          {items.map((item) => (
            <Link key={item.key} to={item.to} className="flex flex-col items-start gap-0.5">
              <span className="flex w-full items-center justify-between gap-2">
                <span className="font-medium">{item.label}</span>
                <Badge tone={item.tone === 'danger' ? 'danger' : item.tone === 'warning' ? 'warning' : 'neutral'}>
                  {item.tone === 'danger' ? 'Overdue' : 'Due soon'}
                </Badge>
              </span>
              <span className="text-[11px] text-muted">{item.meta}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

interface SearchResult {
  key: string
  group: string
  label: string
  meta: string
  to: string
}

function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useApp((state) => state.data)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const results = useMemo<SearchResult[]>(() => {
    if (!data || query.trim().length < 2) return []
    const needle = query.trim().toLowerCase()
    const matches = (value: string | null | undefined) => (value || '').toLowerCase().includes(needle)
    const clientName = (id: string | null) => data.clients.find((client) => client.id === id)?.name || ''
    const rows: SearchResult[] = []

    data.clients.forEach((client) => {
      if (matches(client.name) || matches(client.email) || matches(client.company)) {
        rows.push({ key: `client-${client.id}`, group: 'Clients', label: client.name, meta: client.company || client.email, to: '/clients/list' })
      }
    })
    data.products.forEach((product) => {
      if (matches(product.name) || matches(product.sku)) {
        rows.push({ key: `product-${product.id}`, group: 'Products', label: product.name, meta: product.sku, to: '/products/catalog' })
      }
    })
    data.incomeTransactions.forEach((row) => {
      if (matches(row.description) || matches(row.category) || matches(row.reference)) {
        rows.push({ key: `income-${row.id}`, group: 'Income', label: row.description, meta: `${row.date} · ${row.category}`, to: '/finance/income' })
      }
    })
    data.expenseTransactions.forEach((row) => {
      if (matches(row.description) || matches(row.category) || matches(row.receiptReference)) {
        rows.push({ key: `expense-${row.id}`, group: 'Expenses', label: row.description, meta: `${row.date} · ${row.category}`, to: '/finance/expenses' })
      }
    })
    data.orders.forEach((order) => {
      if (matches(order.number) || matches(clientName(order.clientId))) {
        rows.push({ key: `order-${order.id}`, group: 'Orders', label: order.number, meta: clientName(order.clientId), to: '/sales/orders' })
      }
    })
    data.invoices.forEach((invoice) => {
      if (matches(invoice.number) || matches(clientName(invoice.clientId))) {
        rows.push({ key: `invoice-${invoice.id}`, group: 'Invoices', label: invoice.number, meta: clientName(invoice.clientId), to: '/sales/invoices' })
      }
    })
    data.quotes.forEach((quote) => {
      if (matches(quote.number) || matches(clientName(quote.clientId))) {
        rows.push({ key: `quote-${quote.id}`, group: 'Quotes', label: quote.number, meta: clientName(quote.clientId), to: '/sales/quotes' })
      }
    })
    data.suppliers.forEach((supplier) => {
      if (matches(supplier.name) || matches(supplier.email)) {
        rows.push({ key: `supplier-${supplier.id}`, group: 'Suppliers', label: supplier.name, meta: supplier.email, to: '/products/suppliers' })
      }
    })
    data.bills.forEach((bill) => {
      if (matches(bill.name) || matches(bill.category)) {
        rows.push({ key: `bill-${bill.id}`, group: 'Bills', label: bill.name, meta: `${bill.dueDate} · ${formatSimple(bill.amount)}`, to: '/planning/bills' })
      }
    })
    data.tasks.forEach((task) => {
      if (matches(task.title) || matches(task.description)) {
        rows.push({ key: `task-${task.id}`, group: 'Tasks', label: task.title, meta: task.status, to: '/clients/tasks' })
      }
    })

    return rows.slice(0, 40)
  }, [data, query])

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>()
    for (const result of results) {
      const list = map.get(result.group) || []
      if (list.length < 5) list.push(result)
      map.set(result.group, list)
    }
    return [...map.entries()]
  }, [results])

  const go = (to: string) => {
    navigate(to)
    onClose()
  }

  return (
    <Modal open={open} title="Search your business" description="Find clients, products, transactions, invoices, bills and tasks." onClose={onClose} wide>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          className="input pl-9 text-base"
          placeholder="Search by name, number, category or reference…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search query"
        />
      </div>
      <div className="mt-3 max-h-[55vh] overflow-y-auto">
        {query.trim().length < 2 ? (
          <p className="py-8 text-center text-sm text-muted">Type at least two characters to search.</p>
        ) : grouped.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No matching records.</p>
        ) : (
          <div className="grid gap-4">
            {grouped.map(([group, items]) => (
              <div key={group}>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{group}</p>
                <div className="grid gap-0.5">
                  {items.map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-brand-soft"
                      onClick={() => go(item.to)}
                    >
                      <span className="text-sm font-medium text-ink">{item.label}</span>
                      <span className="text-xs text-muted">{item.meta}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

function formatSimple(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Modal open={open} title="Quick add" description="Choose what you want to record. The form opens with the module's full fields." onClose={onClose}>
      <div className="grid gap-2 sm:grid-cols-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            className="flex items-start gap-3 rounded-xl border border-line bg-white p-3 text-left transition hover:border-brand hover:bg-brand-pale"
            onClick={() => {
              navigate(action.to)
              onClose()
            }}
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
              <Plus size={15} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{action.label}</span>
              <span className="block text-xs text-muted">{action.description}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-canvas p-3 text-xs text-muted">
        Tip: use <kbd className="rounded border border-line bg-white px-1.5 py-0.5">Ctrl</kbd> +{' '}
        <kbd className="rounded border border-line bg-white px-1.5 py-0.5">K</kbd> anywhere to search your whole workspace.
      </div>
    </Modal>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <TopNav />
      <main className="page">{children}</main>
      <footer className="mx-auto max-w-[1400px] px-5 pb-8 text-center text-[11px] text-muted no-print">
        Ultimate Small Business Manager · Your records are stored only in this browser. Export a backup from
        Settings regularly.
      </footer>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl font-bold text-brand">404</p>
      <h1 className="mt-2 text-xl font-bold">Page not found</h1>
      <p className="mt-1 text-sm text-muted">This route does not exist. Use the navigation above to continue.</p>
      <Link to="/" className="btn btn-primary mt-5 inline-flex">
        Back to overview
      </Link>
    </div>
  )
}
