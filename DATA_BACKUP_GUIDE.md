# Data backup guide

Everything the app stores lives in your browser. A backup is the only copy that survives clearing browser data, changing devices or reinstalling the operating system.

## What a backup contains

A backup is a single JSON file named like `business-backup-2026-11-12.json`. It contains:

- Business settings (profile, currency, tax, numbering, categories, units)
- Accounts, income and expenses, transfers
- Products, materials, inventory movements, suppliers, purchases
- Clients, orders, quotes, invoices, line items, payments, refunds
- Bills, tasks, communications, budgets, goals and activity logs

JSON is a plain text format; the file is readable but **not encrypted**. Store it like any other financial record.

## Download a backup

1. Open **Settings**.
2. In **Backup & restore**, click **Download backup**.
3. Save the file outside the browser's data folder, for example in cloud storage or on an external drive.

The Settings page also shows how many records are stored and how much browser storage is used.

## Restore a backup

1. Open **Settings → Backup & restore**.
2. Click **Restore from file** and choose a `.json` backup.
3. Check the confirmation message; restoring **replaces every current record** with the contents of the file.
4. Confirm.

The app validates the file first. It rejects files from other apps, unsupported backup versions, missing collections and records without an `id`.

Before restoring, download a backup of the current workspace if there is any chance you will need it.

## CSV import and export

CSV (comma-separated values) is for exchanging individual lists with spreadsheets. It is not a full backup.

- Modules with **Export** download the current filtered list as CSV.
- Modules with **Import** accept a CSV with the columns shown in the import dialog. Column order does not matter and common alternative headings are detected.
- Use **Download template** in an import dialog to get the expected headings.
- Dates can be `YYYY-MM-DD` or `MM/DD/YYYY`; amounts can include a currency symbol.

CSV exports do not include settings or records from other modules. Use the JSON backup for a complete copy.

## Demo data

The demo workspace is tagged with identifiers starting with `demo-`.

- **Settings → Demo workspace → Remove demo data** deletes only those tagged records and restores the business profile that existed before the demo was loaded.
- Records you created yourself are kept.
- Loading the demo again replaces the workspace with a fresh sample. It is blocked when real business records exist, so the demo cannot overwrite your data; use the full reset first if that is really what you want.

## Reset the workspace

**Settings → Danger zone → Reset entire workspace** deletes all records and returns to default settings. It requires typing `RESET` and can be cancelled. It cannot be undone, so export a backup first.

## Moving to another device

1. On the old device: **Settings → Download backup**.
2. On the new device: open the app, then **Settings → Restore from file**.
3. Check the dashboard totals and the record count before continuing.
4. Keep the backup file until you are satisfied.

## Suggested routine

- Export a backup after each significant bookkeeping session.
- Keep at least one copy off the device (cloud drive or external disk).
- Before changing browsers, clearing browser data, or resetting a computer, export first.
- Once a month, restore the latest backup into a spare browser profile to confirm it opens correctly.
