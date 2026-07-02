// Brand naming pass — joined wordmarks + registered mark (®).
// Aligned 2026-07-02. See docs/BRAND-NAMING.md.
//
//   node scripts/brandify-frontend.mjs
//
// Idempotent. Walks src/ and applies:
//   • two-weight logo join:  "<span>Argo</span><span> Method</span>" -> "...>Method®</span>"  (=> ArgoMethod®)
//   • contiguous strings:    ArgoOne+/ArgoOne -> ArgoOne+® / ArgoOne®
//                            Argo Puentes/Argo Puente -> ArgoPuente®
//                            Argo Method -> ArgoMethod®
//
// Does NOT touch: code identifiers (guarded lookbehind/lookahead), JSON-LD name fields
// (BlogPost.tsx excluded from contiguous rules), nor the split-span One/One+ wordmarks
// in OnePanel/Landing/ArgoOneLanding (those are hand-edited so ® lands after the "+").

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const EXCLUDE_CONTIGUOUS = new Set([
  'pages/BlogPost.tsx', // JSON-LD Organization name must stay "Argo Method"
]);

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const report = [];
for (const file of walk(SRC)) {
  const orig = fs.readFileSync(file, 'utf8');
  let s = orig;
  const rel = path.relative(SRC, file);

  // Span rules (all files): join the two-weight logo and add ®.
  s = s.replace(/> Method</g, '>Method®<'); // "Argo| Method" -> "Argo|Method®"
  s = s.replace(/>Method</g, '>Method®<');  // no-space variant (ArgoOneLanding header/footer)

  // Contiguous plain-string rules (skip excluded).
  if (!EXCLUDE_CONTIGUOUS.has(rel)) {
    s = s.replace(/(?<![A-Za-z0-9])ArgoOne ?\+(?!®)/g, 'ArgoOne+®');
    s = s.replace(/(?<![A-Za-z0-9])ArgoOne(?![A-Za-z0-9+®])/g, 'ArgoOne®');
    s = s.replace(/Argo Puentes/g, 'ArgoPuente®');
    s = s.replace(/Argo Puente(?!s)/g, 'ArgoPuente®');
    s = s.replace(/Argo Method(?![a-z])/g, 'ArgoMethod®');
  }

  if (s !== orig) {
    fs.writeFileSync(file, s, 'utf8');
    report.push(rel);
  }
}

console.log(report.sort().join('\n'));
console.log(`\nFILES CHANGED: ${report.length}`);
