# Ultimate Small Business Manager

An offline-first business manager for very small businesses. It runs entirely in the browser: no account, no server, no cloud database. Your records live in this browser's IndexedDB storage and can be exported as a single JSON backup file.

**Live app:** <https://muhammadabd778899-glitch.github.io/small-buisness-tracker/>

> The repository is named `small-buisness-tracker`, so the GitHub Pages path uses that exact spelling. Keep the folder name if you fork or rename the repository.

## What is included

- **Overview** — live revenue, expenses, profit, cash-flow charts, category charts, account balances, stock alerts, upcoming bills and business goals. Every figure is calculated from your records.
- **Finance** — income, expenses, accounts, transfers, tax tracker, CSV import/export and PDF-ready records.
- **Sales** — quotes → orders → invoices → payments and refunds, with automatic income and expense entries so the ledger always matches.
- **Products** — catalog, pricing calculator, raw materials, inventory ledger, suppliers and purchases.
- **Clients** — CRM profiles, tasks and a communication log, plus client statements.
- **Planning** — bills with a calendar and recurring schedules, budgets and business goals.
- **Reports** — 12 report types (financial overview, monthly, quarterly, annual, comparison, category, account, tax, product, inventory, client, invoice) with CSV, PDF and print output.
- **Workspace tools** — global search (`Ctrl+K`), quick add, notifications, demo data that never mixes with your own records, full backup/restore, and a guarded workspace reset.
- **PWA** — installable app shell, offline reload after the first visit, automatic updates.

## How the numbers work

These rules are consistent across the app and the reports:

1. **Revenue** is money recorded as income. An issued invoice is not revenue until a payment is recorded.
2. **Recording an invoice payment** creates a linked income entry automatically.
3. **Recording a refund** creates a linked expense entry automatically.
4. **Invoice balance** = total − payments + refunds.
5. **Account balance** = opening balance + income − expenses + transfers in − transfers out.
6. **Transfers** never count as revenue or expenses.
7. **Stock** changes only through inventory movements. Completing an order posts product sale movements; deleting that order reverses them.

## Tech stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Dexie (IndexedDB) · Zustand · React Router 7 · Recharts · jsPDF · PapaParse · vite-plugin-pwa · Vitest.

## Run locally

Requirements: Node.js 20 or newer (22 recommended) and npm.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/small-buisness-tracker/`).

Useful commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run test` | Unit tests (Vitest) |
| `npm run build` | Type-check, production build for GitHub Pages, write `404.html` and `.nojekyll` |
| `npm run build:local` | Production build with root-relative paths for local/static hosting |
| `npm run preview` | Serve the last GitHub Pages build locally |
| `npm run lint` | Lint the source |

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and publishes the app whenever `main` or `master` is pushed. It also runs the test suite first.

1. Push this project to the repository.
2. In GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Wait for the *Deploy to GitHub Pages* workflow to finish.

The build uses the base path `/small-buisness-tracker/`. If you rename the repository, update `base` in `vite.config.ts`, the `start_url`/`scope` still stay relative, and rebuild.

## Your data and privacy

- All business records are stored in IndexedDB on the device and browser you use.
- Nothing is uploaded. There is no analytics or backend.
- Clearing browser site data deletes the records. Export a JSON backup from **Settings → Backup & restore** regularly and keep it somewhere safe.
- Backups are unencrypted JSON, so store them like any other financial file.

## Documentation

- [Installation](INSTALLATION.md)
- [Offline usage](OFFLINE_USAGE.md)
- [Backup guide](DATA_BACKUP_GUIDE.md)
- [User guide](USER_GUIDE.md)
- [Feature checklist](FEATURE_CHECKLIST.md)
- [QA report](QA_REPORT.md)
