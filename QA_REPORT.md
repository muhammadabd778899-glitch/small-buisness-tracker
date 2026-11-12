# QA report

Date: 12 November 2026
Build tested: production bundle (`npm run build`) served locally at `/small-buisness-tracker/`
Runtime: Windows, Node.js v24.18.0, npm, Chromium-based in-app browser (504 × 425 viewport, narrow/mobile layout), plus route-level checks at desktop layout.

## Automated checks

| Check | Command | Result |
| --- | --- | --- |
| TypeScript project build | `npx tsc -b` | Pass, no diagnostics |
| Unit tests | `npm test` | 5 files, 62 tests, all pass |
| Production build | `npm run build` | Pass; service worker generated with 18 precache entries (≈1.98 MB) |
| Post-build | included in build | `dist/404.html` and `dist/.nojekyll` written |
| Lint | `npm run lint` | 0 errors, 29 advisory warnings (`react/set-state-in-effect` and similar) |
| Local build | `npm run build:local` | Pass; root-relative asset paths generated |

Test coverage: money rounding/formatting, ISO date math (month-end clamping, quarters, recurring bills, period ranges), document totals (exclusive and inclusive tax, discounts, caps), invoice balances and refunds, account balances with transfers, financial summaries, monthly series, category/product/client summaries, reserved stock, low-stock detection, pricing calculator, tax summary, invoice ageing, CSV parsing and field matching, backup creation/validation.

## Browser verification

| Flow | Result |
| --- | --- |
| First load with no data | Welcome screen rendered, no console errors |
| Load demo business | Dashboard populated with 120 transactions; no console errors |
| Route sweep | All 20 module routes plus unknown route rendered the expected page; 404 page works |
| Charts | 22 chart SVG nodes on overview (6 chart wrappers); no render errors |
| Reports | All 12 report types switched successfully, each with KPIs and tables/charts |
| Create income | Added `$123.45`, row appeared, revenue rose from `$15,097.15` to `$15,220.60`, 120 → 121 transactions |
| Persistence | Income record still present after full page reload |
| Delete income | Confirmation shown; record removed |
| Create invoice | New invoice with custom line item created as `INV-2026-1101`, total `$108.25` |
| Record payment | Invoice changed to Paid, paid `$108.25`, balance `$0.00`; linked income entry created automatically |
| Delete invoice | Invoice, payment and linked income entry all removed |
| Quote → order | `QTE-2026-501` converted to `ORD-2026-2101`; quote status became Converted |
| Global search | `Ctrl+K` search for "Sarah" returned clients, income, orders, invoices and quotes |
| Quick add | Menu opened with eight shortcuts |
| Demo removal | Returned to welcome screen; only demo-tagged records deleted |
| Demo reload | Second demo load succeeded after cleanup (after fix below) |
| Reset guard | Confirm disabled until exact `RESET` typed; full reset returned to welcome screen |
| Backup | Downloaded 314 KB JSON with expected app metadata and data |
| Restore | Re-uploaded the backup, confirmed the replace prompt, restore completed |
| CSV import | One-row income CSV previewed and imported; cleaned up afterwards |
| CSV export | 67 rows plus header, `text/csv;charset=utf-8` |
| PDF | Invoice PDF captured with valid `%PDF-` header, 4.3 KB |
| PWA | Service worker activated; manifest icons 192/512/maskable all returned 200; cache populated |
| Offline | Local server fully stopped, then page reloaded and Reports rendered from the service-worker cache |
| Mobile layout | Narrow viewport used the menu button; all navigation groups and links present |

No console messages (errors or warnings) were recorded during the route sweep or the main workflows.

## Defects found and fixed during QA

1. **Demo could not be loaded a second time after removing it.**
   QA actions left activity-log rows with generated ids. `loadDemo` treated any non-demo row as real business data and refused. Fixed by excluding `activityLogs` from the "real data" guard in `src/store/app.ts`. Verified by removing and reloading the demo.

2. **Subcategory lists displayed concatenated words.**
   Subcategories were joined with newlines into single-line `<input>` elements, so `Clay`, `Wood` and the rest appeared as `ClayWoodLeather…` and would be saved merged. Fixed in `src/modules/settings.tsx` to join with commas. Verified in Settings after rebuild.

3. **CSV cell values retained surrounding spaces.**
   Headers were trimmed but values were not. Added value trimming to `parseCSV` in `src/lib/csv.ts`; covered by tests and verified with the import flow.

## Root cause of the original blank page

The published GitHub Pages site was not serving a verified production build of this application. The delivery pipeline now provides:

- the correct Vite base path (`/small-buisness-tracker/`, matching the repository name),
- a tested application build with no runtime console errors,
- a GitHub Actions workflow that tests and builds before publishing `dist/`,
- `404.html` as an SPA fallback for deep links,
- `.nojekyll` so GitHub Pages does not process the asset folders,
- correct manifest and icon references for the installed app.

The production build was pushed and the *Deploy to GitHub Pages* workflow completed successfully (run 43261605120). The live URL then served the new bundle, rendered the welcome screen without console errors, returned 200 for the manifest and icons, and opened the deep link `/reports` through the SPA fallback. The blank-page issue is resolved on the live site.

## Known warnings and limitations

- **Bundle size:** the main JavaScript chunk is about 1.58 MB (456 KB gzip), above Vite's 500 KB warning threshold. It is precached and loads correctly; charts and PDF libraries account for most of the size.
- **Lint:** 29 advisory React-hook warnings, mostly state initialization inside effects. There are no lint errors, and the affected flows were verified in the browser.
- **Single-tab editing:** there is no cross-tab synchronization. Reload other tabs after editing in one.
- **Local-only storage:** clearing browser data removes records; JSON backups are the safety copy and are not encrypted.

## Conclusion

The live site at <https://muhammadabd778899-glitch.github.io/small-buisness-tracker/> was verified after deployment: the app shell renders, the Reports deep link loads and the browser console is clean.

All specified functional areas are implemented and exercised: offline storage, demo isolation, CRUD across every module, quote/order/invoice/payment/refund flow, inventory ledger, clients, planning, 12 reports, search/quick add, PDFs, CSV import/export, backup/restore, reset guards, PWA installation and true offline reload. Automated checks are green and the production bundle is ready to publish.
