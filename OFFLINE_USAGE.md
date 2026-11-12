# Offline usage

The app is offline-first: it is a normal website on first load, then becomes a fully local application.

## First visit

1. Open the app while online.
2. Wait until the dashboard or welcome screen appears. At this point the app shell (HTML, JavaScript, CSS, icons and fonts bundled with the app) has been saved by the service worker.
3. Optional: install it from the browser menu (**Install app** / **Add to Home Screen**).

A service worker is a small background script the browser keeps for this site. It serves the saved app files when the network is unavailable.

## Working without a connection

After the first successful load:

- Reloading the app, navigating between modules and opening deep links such as `/reports` still works offline.
- Creating, editing and deleting records works offline.
- Reports, charts, CSV exports, PDF downloads and backups work offline.
- Data is written to IndexedDB, which is local to the device.

The app was tested by stopping the local server and reloading the reports page; it rendered from the service-worker cache.

## What still needs a connection

- The very first visit, because the app files must be downloaded.
- Installing the app from the browser, if the install prompt itself needs the network.
- Opening a URL that was never loaded while online.

## Updates

The app is configured to update automatically. When a new version is deployed:

- The browser downloads it in the background.
- The next time you open or reload the app, the new version starts.
- Your records are kept; updates only replace the app files.

If an old version seems stuck, close all app tabs and reopen. In rare cases, unregister the service worker from the browser's developer tools or clear site data, but **export a backup first** if you do.

## Important: local data is not synchronized

There is no account and no cloud database. This has deliberate consequences:

- Data is tied to one browser profile on one device.
- Another browser, another device, private/incognito windows and some "cleaner" tools will not see the same records.
- Clearing browsing data, resetting the browser, or uninstalling it can delete the records.
- Storage is usually reliable but can be removed by the browser under storage pressure, especially in private windows.

**Treat the JSON backup as your safety copy.** See [DATA_BACKUP_GUIDE.md](DATA_BACKUP_GUIDE.md).

## Multiple tabs

Use one tab at a time for editing. Each tab keeps its own in-memory copy; changes made in one tab may not appear in another until it is reloaded.
