# Feature checklist

Status as of 12 November 2026. "Verified" means the flow was exercised in the production build, not only compiled.

## Core requirements

| Requirement | Status | Where / notes |
| --- | --- | --- |
| Offline-first, no backend | Done | All records in IndexedDB (Dexie); no API calls. Verified offline reload with the server stopped. |
| No accounts or login | Done | App opens directly; no authentication screens. |
| Local-only data | Done | Browser storage only; README and Settings explain this. |
| Full JSON backup and restore | Done | Settings → Backup & restore. Round trip verified (314 KB backup restored). |
| CSV import and export | Done | Income, expenses, products, clients, quotes, bills and other lists. Import + export verified on income. |
| Coherent demo data | Done | Deterministic demo business ("Orange & Oak Studio") with linked records across every module. |
| Empty state / onboarding | Done | Welcome screen when no records exist; empty states inside modules. |
| Demo removal without deleting real data | Done | Only ids starting with `demo-` are deleted; settings restored. Verified. |
| Demo reload after cleanup | Done | Audit logs no longer block a second demo load (fixed during QA). |
| Guarded full reset | Done | Requires typing `RESET`; verified input gating and reset. |
| White / orange design | Done | White surfaces, warm canvas and `#F26A2C` brand accent. |
| Horizontal top navigation with dropdowns | Done | Overview, Finance, Sales, Products, Clients, Planning, Reports, Settings. Responsive slide-out menu on narrow screens. |
| No permanent sidebar | Done | Desktop layout uses a top bar only. |
| Interactive charts | Done | Recharts bar, line, area, pie/donut and horizontal bar charts on overview and reports. |
| No hardcoded dashboard values | Done | KPIs and charts derive from records; demo values come from seeded records, not UI constants. |
| Working buttons, filters and period pickers | Done | Route sweep and CRUD flows exercised; period selector drives KPIs. |

## Modules

| Area | Status | Details |
| --- | --- | --- |
| Income and expenses | Done | CRUD, filters, CSV, accounts, tax, clients/suppliers. |
| Accounts and transfers | Done | Opening balances, derived balances, guarded delete, transfers excluded from profit. |
| Tax tracker | Done | Collected/paid/net with monthly detail. |
| Quotes | Done | CRUD, PDF, status flow, convert to order. Conversion verified. |
| Orders | Done | CRUD, line items, fulfilment/payment status, PDF, convert to invoice, stock movements on completion. |
| Invoices | Done | CRUD, derived status, PDF, payment/refund history, cascading delete. Create → pay verified. |
| Payments and refunds | Done | Payment creates income; refund creates expense; balances recalculated. Payment verified. |
| Product catalog | Done | CRUD, pricing, stock levels, reorder thresholds, CSV. |
| Pricing calculator | Done | Materials, labour, overheads, yield, fees, margin/markup and suggested price. |
| Raw materials | Done | Stock fields, costs, minimums, reorder quantities, expiry. |
| Inventory ledger | Done | Movement types, ledger history, stock recomputation, low-stock views. |
| Suppliers and purchases | Done | Supplier CRUD and purchase records with line items. |
| Client CRM | Done | CRUD, types, balances, detail view, statement PDF, CSV, guarded delete. |
| Tasks | Done | CRUD, statuses, priorities, due-date KPIs, completion toggle. |
| Communication log | Done | CRUD, methods, follow-ups, filters, CSV. |
| Bills and calendar | Done | Recurring bills, calendar month view, pay action creates expense, next occurrence scheduled. |
| Budgets | Done | Category limits, actual spend, remaining/over-budget indicators. |
| Goals | Done | Revenue/profit/savings targets, progress, sync with actuals for revenue and profit. |
| Reports | Done | 12 types, each with KPIs, tables/charts and CSV/PDF/print. All 12 rendered. |

## Tooling and delivery

| Requirement | Status | Notes |
| --- | --- | --- |
| Global search | Done | `Ctrl+K`; searches clients, products, transactions, orders, invoices, quotes, suppliers, bills, tasks. Verified. |
| Quick add | Done | Menu with eight record shortcuts. Verified. |
| Notifications | Done | Overdue invoices, bills due soon, open tasks. |
| Local PDF generation | Done | Invoice, quote, client statement, price list and reports. Invoice PDF verified as a valid `%PDF` file. |
| CSV export correctness | Done | Verified headers and 67 data rows on the income export. |
| PWA manifest and icons | Done | 192, 512 and maskable 512 PNGs plus Apple touch icon; manifest and icons return 200. |
| Service worker / offline | Done | Precache populated, app reloaded with the server stopped. |
| GitHub Pages deployment | Ready | Workflow builds, tests and publishes `dist`; `404.html` and `.nojekyll` generated. Requires Pages source set to GitHub Actions on the remote repository. |
| Local distribution | Done | `npm run build:local` produces a root-path build for any static server. |
| Documentation | Done | README, INSTALLATION, OFFLINE_USAGE, DATA_BACKUP_GUIDE, USER_GUIDE, FEATURE_CHECKLIST, QA_REPORT. |
| Automated tests | Done | 62 unit tests across money, dates, calculations, CSV and backup validation. |

## Deliberately out of scope

- Cloud sync, multi-user access, accounts and passwords (the product is explicitly local-only).
- Automatic background sync between tabs or devices. Use the JSON backup to move data.
- Server-side email, payments or tax filing integrations.
