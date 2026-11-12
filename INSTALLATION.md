# Installation

There are three ways to use the app: the hosted GitHub Pages version, an installed app on your device, or a local copy you build yourself.

## 1. Use the hosted app

Open <https://muhammadabd778899-glitch.github.io/small-buisness-tracker/>.

The first visit needs an internet connection. After the app shell loads, it is saved on your device and can open again without a connection.

## 2. Install it like an app (PWA)

A PWA (Progressive Web App) is a website that can be installed and opened in its own window, and that keeps working offline after the first load.

### Desktop Chrome or Edge

1. Open the hosted URL.
2. Click the install icon in the address bar, or open the browser menu and choose **Install Ultimate Small Business Manager**.
3. Launch it from your desktop or start menu.

### Android Chrome

1. Open the URL.
2. Open the browser menu and choose **Add to Home screen** / **Install app**.
3. Confirm.

### iPhone or iPad Safari

1. Open the URL in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. Confirm with **Add**.

Installed and browser versions share the same local data as long as they use the same browser profile.

## 3. Run it locally

### Requirements

- Node.js 20 or newer (22 recommended)
- npm (installed with Node.js)

### Development mode

```bash
npm install
npm run dev
```

Open `http://localhost:5173/small-buisness-tracker/`.

### Production build

```bash
npm run build
npm run preview
```

`npm run build` creates a `dist/` folder configured for the GitHub Pages subpath. `404.html` and `.nojekyll` are generated automatically. `npm run preview` serves that build at `http://localhost:4173/small-buisness-tracker/`.

### Build for local or root hosting

```bash
npm run build:local
```

This build uses root-relative asset paths. Serve the `dist/` folder from the root of any static web server, for example:

```bash
cd dist
npx serve .
```

Opening `dist/index.html` directly from the file system (`file://`) does not work for browser security reasons; use a local server.

## 4. Publish your own copy to GitHub Pages

1. Create a repository. The current configuration expects the name `small-buisness-tracker` because the asset base path is `/small-buisness-tracker/`.
2. Push the project to the `main` or `master` branch. The included workflow `.github/workflows/deploy.yml` runs tests, builds the app and publishes `dist/`.
3. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and wait for *Deploy to GitHub Pages* to complete.

If you use a different repository name, change `base` in `vite.config.ts` to `/<your-repo-name>/` and push again.

## Troubleshooting a blank page (white screen)

A white screen almost always means the browser loaded `index.html` but could not load the JavaScript and CSS files.

1. Open the browser developer tools (**F12**) → **Console** and **Network** tabs, then reload.
2. Requests for `/assets/...` returning **404** mean the base path does not match the repository name. Fix `base` in `vite.config.ts`.
3. If **Settings → Pages** is set to *Deploy from a branch* instead of *GitHub Actions*, the wrong folder may be published. Switch it to **GitHub Actions** and re-run the workflow.
4. If the site was previously installed as a PWA, an old service worker may be serving stale files. Clear the site data for the domain, or use **Application → Service Workers → Unregister** in developer tools, then reload.
5. Confirm the deployment finished successfully in the **Actions** tab before testing the URL.

After a new deployment, the app updates itself automatically. If you still see an old version, close all tabs of the app and open it again.
