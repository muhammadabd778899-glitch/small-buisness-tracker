# User guide

This guide follows the navigation, from left to right. The app has a horizontal top bar with dropdown menus; there is no permanent sidebar. On a narrow screen, open the menu button to see the same links.

## First run

You have two starting points:

- **Explore demo business** loads a complete fictional studio ("Orange & Oak Studio") with connected records. It is tagged as demo data and can be removed without touching your own records.
- **Start with my own income** opens the income form. You can also add products, clients and accounts in any order.

The dashboard recalculates from your own records as soon as you start entering data.

## Top bar

- **Search** (`Ctrl+K` or the magnifier): searches clients, products, income, expenses, orders, invoices, quotes, suppliers, bills and tasks.
- **Notifications** (bell): overdue invoices, bills due soon and open tasks.
- **Quick add**: shortcuts to the main record forms.
- **Menus**: Overview, Finance, Sales, Products, Clients, Planning, Reports, Settings.

Many pages share a **reporting period** selector: this month, last month, this quarter, this year, last year, last 12 months, custom range or all time. The period applies to the KPIs and charts on that page.

## Overview

- KPI cards: revenue, expenses, net profit, outstanding invoices, orders, low-stock products, bills due in 14 days and tax collected.
- Charts: monthly revenue vs expenses, profit trend, income and expense categories, sales by product, sales by month.
- Lists: account balances, recent transactions, unpaid invoices, recent orders, low-stock products, upcoming bills, top products and recent clients.
- Goals progress.

Every number is computed from the ledger; demo figures are not hardcoded into the dashboard.

## Finance

### Income and expenses

- Add, edit, delete, filter, sort and page through records.
- Each record has a date, description, category, account and payment method. Tax is optional and tracked separately for the tax report.
- Income can be linked to a client and an invoice; expenses can be linked to a supplier.
- CSV import and export are available on both pages.

### Accounts and transfers

- Create accounts with a type and opening balance.
- Balances are calculated from opening balance, income, expenses and transfers.
- A transfer moves money between two accounts. It never counts as revenue or as an expense.
- Delete is guarded when an account is still used by transactions.

### Tax tracker

Shows tax collected on income, tax paid on expenses and the net position for the selected period, with a monthly detail table.

## Sales

The intended flow is **quote → order → invoice → payment**, but you can start at any step.

### Orders

- Customer, dates, status, fulfilment status and payment status.
- Line items with quantity, unit price, discount and tax.
- When an order is completed, product stock is reduced through inventory sale movements. Changing it back or deleting the order reverses those movements.
- **Create invoice** converts an order into an invoice.
- Orders can be downloaded as PDFs.

### Quotes

- Send a quote, then click **Convert** to create an order with the same client and line items. The quote becomes *converted* and cannot be converted twice.
- Quote PDFs and CSV export are included.

### Invoices

- Issue an invoice for a client with line items, discount, tax and terms.
- Status is derived from payments and due date: sent, partial, paid or overdue. Draft and void remain under your control.
- **Pay** opens the payment form for that invoice.
- Invoice PDFs include payments and refunds.
- Deleting an invoice also deletes its line items, payments, refunds and the linked income/expense entries, because those records belong to it.

### Payments and refunds

- Every payment creates a matching income entry automatically.
- Every refund creates a matching expense entry automatically.
- The list shows received, refunded and net amounts.
- Deleting a payment or refund removes the linked ledger entry and recalculates the invoice balance.

Invoices are not revenue by themselves. Revenue appears when a payment is recorded.

## Products

### Product catalog

Name, SKU, category, unit, cost, price, current stock, reorder threshold and active state. Low-stock indicators appear across the app. CSV import/export is available.

### Pricing calculator

Enter material lines, labour hours and rate, packaging, overhead, other costs and batch yield. Set the selling price, platform fee percentage and target margin. The calculator shows:

- total batch cost and unit cost
- fee per unit, net proceeds, profit per unit, margin and markup
- a suggested price for the target margin

### Raw materials

Track opening stock, received, consumed, waste, adjustments and current stock, plus unit cost, minimum stock, reorder quantity and expiry date.

### Inventory

The inventory ledger is the source of truth for stock. Post movements for purchases, production, consumption, sales, returns, waste and adjustments. Product and material stock is recalculated from movements, and the page shows the movement history.

### Suppliers and purchases

Maintain supplier contacts and record purchases with line items, status and totals. Purchases can feed received stock through inventory movements.

## Clients

### Client CRM

- Individuals or businesses, with contact details and notes.
- Filters, KPIs (total clients, businesses, clients with an open balance, average lifetime sales) and a per-client summary.
- Client detail view: balances, invoices, orders, open tasks and communication history.
- **Statement PDF** summarises the client's invoices, payments and outstanding balance.
- CSV import/export is available. Deleting a client is blocked while orders, invoices, quotes, tasks or communications reference it.

### Tasks

Status, priority, due date and optional client. Filter by status, priority or client. KPIs highlight open, overdue, due within seven days and completed tasks. Mark tasks done from the list.

### Communication log

Log emails, calls, meetings and other contact with a subject, summary and optional follow-up date. Filter, export to CSV and delete entries.

## Planning

### Bills and calendar

- Track one-off and recurring bills with amount, category, due date, account, frequency and notes.
- The calendar shows bills per day, coloured by status, with month navigation.
- **Pay** creates an expense transaction and, for recurring bills, schedules the next occurrence.
- KPIs: unpaid value, overdue, due in seven days and paid this month.
- CSV export is available.

### Budgets and goals

- A budget sets a spending limit for an expense category over a period. The page calculates actual spend and shows remaining amount and over-budget state.
- Goals track revenue, profit or a saved amount against a target. Revenue and profit goals can sync with the current reporting period's actual figures.

## Reports

Choose a period and one of 12 report types:

1. Financial overview
2. Monthly report
3. Quarterly report
4. Annual report
5. Period comparison (current vs previous)
6. Category report
7. Account report
8. Tax report
9. Product report
10. Inventory report
11. Client report
12. Invoice report (status and ageing)

Each report shows KPIs, detail tables and charts where relevant. Use **Export CSV**, **Download PDF** or **Print** for a copy.

## Settings

- **Business profile**: name, type, contact details, address and logo. These appear on documents.
- **Money & documents**: currency and symbol, decimal places, date format, default tax rate and tax mode, fiscal year start, payment terms and document prefixes/next numbers.
- **Categories & units**: lists that populate the dropdowns throughout the app, including per-category subcategories.
- **Backup & restore**: download or restore the full JSON backup.
- **Demo workspace**: load or remove demo data.
- **Recent activity**: the last actions recorded in the workspace.
- **Danger zone**: reset everything, guarded by typing `RESET`.

## Quick reference

| Question | Answer |
| --- | --- |
| Where is my data? | In this browser's IndexedDB, on this device only. |
| Does an invoice count as revenue? | No. Revenue is recorded income; invoice payments create it. |
| Do transfers affect profit? | No. They only move money between accounts. |
| How does stock change? | Only through inventory movements; order completion posts sale movements. |
| How do I move to a new computer? | Download a JSON backup, then restore it on the new device. |
| What happens if I clear browser data? | The records are deleted unless you have a backup. |
| Can I run two businesses? | Use separate browser profiles, each with its own data and backup. |
