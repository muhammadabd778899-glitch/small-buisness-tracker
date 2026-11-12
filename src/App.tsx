import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './store/app'
import { NotFound, Shell } from './components/layout'
import { Button, LoadingScreen, Toast } from './components/ui'
import { Overview } from './modules/overview'
import { AccountsPage, ExpensesPage, IncomePage, TaxPage } from './modules/finance'
import { InvoicesPage, OrdersPage, PaymentsPage, QuotesPage } from './modules/sales'
import { CatalogPage, PricingPage } from './modules/products'
import { InventoryPage, MaterialsPage, SuppliersPage } from './modules/inventory'
import { ClientsPage, CommunicationPage, TasksPage } from './modules/clients'
import { BillsPage, BudgetsPage } from './modules/planning'
import { ReportsPage } from './modules/reports'
import { SettingsPage } from './modules/settings'

export default function App() {
  const init = useApp((state) => state.init)
  const ready = useApp((state) => state.ready)
  const error = useApp((state) => state.error)
  const dismissError = useApp((state) => state.dismissError)

  useEffect(() => {
    void init()
  }, [init])

  if (error && !ready) {
    return (
      <div className="page">
        <div className="mx-auto mt-16 max-w-lg">
          <div className="card p-6 text-center">
            <h1 className="text-lg font-bold text-ink">Your workspace could not be opened</h1>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <p className="mt-2 text-xs text-muted">
              This app stores everything in your browser. If you are in private mode or blocked storage, allow site
              data for this page and try again.
            </p>
            <Button variant="primary" className="mt-4" onClick={() => void init()}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="page">
        <LoadingScreen />
      </div>
    )
  }

  return (
    <>
      <Shell>
        {error ? (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
            <span>{error}</span>
            <button type="button" className="font-semibold" onClick={dismissError}>
              Dismiss
            </button>
          </div>
        ) : null}
        <Routes>
          <Route path="/" element={<Overview />} />

          <Route path="/finance" element={<Navigate to="/finance/income" replace />} />
          <Route path="/finance/income" element={<IncomePage />} />
          <Route path="/finance/expenses" element={<ExpensesPage />} />
          <Route path="/finance/accounts" element={<AccountsPage />} />
          <Route path="/finance/tax" element={<TaxPage />} />

          <Route path="/sales" element={<Navigate to="/sales/orders" replace />} />
          <Route path="/sales/orders" element={<OrdersPage />} />
          <Route path="/sales/quotes" element={<QuotesPage />} />
          <Route path="/sales/invoices" element={<InvoicesPage />} />
          <Route path="/sales/payments" element={<PaymentsPage />} />

          <Route path="/products" element={<Navigate to="/products/catalog" replace />} />
          <Route path="/products/catalog" element={<CatalogPage />} />
          <Route path="/products/pricing" element={<PricingPage />} />
          <Route path="/products/materials" element={<MaterialsPage />} />
          <Route path="/products/inventory" element={<InventoryPage />} />
          <Route path="/products/suppliers" element={<SuppliersPage />} />

          <Route path="/clients" element={<Navigate to="/clients/list" replace />} />
          <Route path="/clients/list" element={<ClientsPage />} />
          <Route path="/clients/tasks" element={<TasksPage />} />
          <Route path="/clients/communication" element={<CommunicationPage />} />

          <Route path="/planning" element={<Navigate to="/planning/bills" replace />} />
          <Route path="/planning/bills" element={<BillsPage />} />
          <Route path="/planning/budgets" element={<BudgetsPage />} />

          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Shell>
      <Toast />
    </>
  )
}
