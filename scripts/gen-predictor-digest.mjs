#!/usr/bin/env node
// Generates the PREDICTOR_DIGEST region of api/predictor-example.ts from
// src/lib/situationalGuide{,.en,.pt}.ts (Vercel functions can't import src/,
// so the digest must live inline — same pattern as the tenant-chat GENERATED
// regions). Run `npm run gen:predictor` after editing situation content;
// `npm run check:predictor-gen` (--check) fails when the file drifts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_FILE = path.join(ROOT, 'api', 'predictor-example.ts');
const CHECK = process.argv.includes('--check');

function extractArray(file, declPrefix) {
    const t = fs.readFileSync(file, 'utf8');
    const i = t.indexOf(declPrefix);
    if (i === -1) throw new Error(`${declPrefix} not found in ${file}`);
    const s = t.indexOf('[', i);
    const e = t.indexOf('\n];', s);
    // eslint-disable-next-line no-eval
    return (0, eval)('(' + t.slice(s, e + 2) + ')');
}

function buildLang(file, suffix) {
    const situations = extractArray(file, `export const SITUATIONS${suffix}`);
    const cards = extractArray(file, `export const SITUATION_CARDS${suffix}`);
    const vetas = extractArray(file, `export const VETA_NUANCES${suffix}`);
    const digest = { situations: {}, cards: {}, vetas: {} };
    for (const s of situations) {
        if (s.category === 'Grupal') continue; // group situation has no per-child example
        digest.situations[s.id] = { title: s.title, whatYouSee: s.whatYouSee, whatsHappening: s.whatsHappening };
    }
    for (const c of cards) {
        if (c.eje === 'group') continue;
        digest.cards[`${c.situationId}|${c.eje}`] = c.whatsHappeningForProfile;
    }
    for (const v of vetas) {
        digest.vetas[`${v.situationId}|${v.primary}_${v.veta}`] = v.text;
    }
    return digest;
}

const digest = {
    es: buildLang(path.join(ROOT, 'src/lib/situationalGuide.ts'), ''),
    en: buildLang(path.join(ROOT, 'src/lib/situationalGuide.en.ts'), '_EN'),
    pt: buildLang(path.join(ROOT, 'src/lib/situationalGuide.pt.ts'), '_PT'),
};

// Sanity: every lang has the same shape.
for (const lang of ['es', 'en', 'pt']) {
    const d = digest[lang];
    const nSit = Object.keys(d.situations).length;
    const nCards = Object.keys(d.cards).length;
    const nVetas = Object.keys(d.vetas).length;
    if (nSit !== 21 || nCards !== 84 || nVetas !== 168) {
        console.error(`${lang}: unexpected digest shape (situations=${nSit} want 21, cards=${nCards} want 84, vetas=${nVetas} want 168)`);
        process.exit(1);
    }
}

const START = '// >>> GENERATED:PREDICTOR_DIGEST';
const END = '// <<< GENERATED:PREDICTOR_DIGEST';
const body = `${START}
const PREDICTOR_DIGEST: Record<string, {
    situations: Record<string, { title: string; whatYouSee: string; whatsHappening: string }>;
    cards: Record<string, string>;          // \`\${situationId}|\${eje}\` → whatsHappeningForProfile
    vetas: Record<string, string>;          // \`\${situationId}|\${primary}_\${veta}\` → nuance text
}> = ${JSON.stringify(digest)};
${END}`;

const current = fs.readFileSync(API_FILE, 'utf8');
const re = new RegExp(`${START}[\\s\\S]*?${END}`);
if (!re.test(current)) { console.error('GENERATED:PREDICTOR_DIGEST markers not found in api/predictor-example.ts'); process.exit(1); }
const next = current.replace(re, body);

if (CHECK) {
    if (next !== current) {
        console.error('api/predictor-example.ts digest is stale. Run: npm run gen:predictor');
        process.exit(1);
    }
    console.log('predictor digest: in sync.');
} else {
    fs.writeFileSync(API_FILE, next);
    console.log(`predictor digest written (${(body.length / 1024).toFixed(0)} KB) → api/predictor-example.ts`);
}
