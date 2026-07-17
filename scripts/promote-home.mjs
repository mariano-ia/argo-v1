/**
 * Post-build home swap.
 *
 * The static marketing home lives at `public/sales/argo-home.html` and is the
 * page we want served at the site root `/`. Vercel serves `dist/index.html`
 * at `/` from the filesystem, which wins over any `rewrite` for `/` — so to
 * put the static home at `/` we make it the actual `dist/index.html`, and move
 * the React SPA shell to `dist/app.html` (the catch-all rewrite in vercel.json
 * points there).
 *
 * Order matters: this MUST run AFTER `scripts/prerender-meta.mjs`, which uses
 * the SPA-shell `dist/index.html` as its template to emit the /blog, /terms,
 * /privacy, /pricing route shells. By the time we run, those are already
 * written, so overwriting dist/index.html here is safe.
 *
 * Result:
 *   dist/index.html            = static marketing home  (served at /)
 *   dist/app.html              = React SPA shell         (catch-all target)
 *   dist/sales/argo-home.html  = same static home        (direct link, canonical -> /)
 */

import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const shell = path.join(DIST, 'index.html');
const app = path.join(DIST, 'app.html');
const home = path.join(DIST, 'sales', 'argo-home.html');

for (const [label, p] of [['SPA shell dist/index.html', shell], ['home dist/sales/argo-home.html', home]]) {
    if (!fs.existsSync(p)) {
        console.error(`[promote-home] ${label} not found — did vite build + prerender run?`);
        process.exit(1);
    }
}

// 1) SPA shell -> app.html (catch-all rewrite target for every app route)
fs.copyFileSync(shell, app);
// 2) static marketing home -> index.html (served at /)
fs.copyFileSync(home, shell);

console.log('[promote-home] dist/index.html = marketing home, dist/app.html = SPA shell');
