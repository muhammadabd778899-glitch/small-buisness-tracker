// GitHub Pages needs a 404.html copy of the app shell so deep links such as
// /small-buisness-tracker/reports resolve instead of returning a 404 page.
import { copyFile, access, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, 'dist')

const required = [
  'index.html',
  'manifest.webmanifest',
  'favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png'
]

for (const file of required) {
  await access(path.join(dist, file))
}

await copyFile(path.join(dist, 'index.html'), path.join(dist, '404.html'))
await writeFile(path.join(dist, '.nojekyll'), '')

console.log('postbuild: wrote dist/404.html and dist/.nojekyll')
