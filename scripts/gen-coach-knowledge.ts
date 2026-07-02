// Renders the ArgoCoach GENERATED regions of api/tenant-chat.ts from the
// single sources of truth:
//   - scripts/coach-prompt-source.ts        → SYSTEM_PROMPTS (es/en/pt)
//   - src/lib/situationalGuide{,.en,.pt}.ts → SITUATION_KEYWORDS + SITUATION_CARDS_DATA
//
// Run:   npm run gen:coach          (rewrites api/tenant-chat.ts in place)
// Check: npm run check:coach-gen    (fails if the file drifted from the sources)
//
// Guarantees (roadmap #20 + #13):
// - es/en/pt prompts can never drift: each section must exist in all 3 langs.
// - The chat's situation library can never lag the canonical guide again:
//   every situation id + card comes from src/lib/situationalGuide*.ts.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PROMPT_SECTIONS, SITUATION_KEYWORDS_SOURCE } from './coach-prompt-source';
import { SITUATIONS, SITUATION_CARDS, type SituationCard } from '../src/lib/situationalGuide';
import { SITUATION_CARDS_EN } from '../src/lib/situationalGuide.en';
import { SITUATION_CARDS_PT } from '../src/lib/situationalGuide.pt';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(ROOT, 'api', 'tenant-chat.ts');

const LANGS = ['es', 'en', 'pt'] as const;
type Lang = typeof LANGS[number];

// ─── Validate + build SYSTEM_PROMPTS ────────────────────────────────────────

const escapeTemplate = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

function buildPromptsBlock(): string {
    for (const section of PROMPT_SECTIONS) {
        for (const lang of LANGS) {
            if (!section[lang] || !section[lang].trim()) {
                throw new Error(`Prompt section "${section.key}" is missing lang "${lang}"`);
            }
        }
    }
    const perLang = (lang: Lang) => PROMPT_SECTIONS.map(s => s[lang].trim()).join('\n\n');
    return [
        `const SYSTEM_PROMPTS: Record<string, string> = {`,
        ...LANGS.map(lang => `    ${lang}: \`${escapeTemplate(perLang(lang))}\`,\n`),
        `};`,
    ].join('\n');
}

// ─── Validate + build situations ────────────────────────────────────────────

const IF_NOT: Record<Lang, string> = {
    es: 'Si no responde',
    en: "If they don't respond",
    pt: 'Se não responder',
};

function condense(card: SituationCard, lang: Lang): string {
    const tip = (card.howToAccompany ?? [])[0] ?? '';
    const fallback = card.ifNotResponding ? `${IF_NOT[lang]}: ${card.ifNotResponding}` : '';
    return [card.whatsHappeningForProfile, tip, fallback]
        .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function buildSituationsBlock(): string {
    const guideIds = new Set(SITUATIONS.map(s => s.id));
    const keywordIds = new Set(Object.keys(SITUATION_KEYWORDS_SOURCE));
    for (const id of guideIds) {
        if (!keywordIds.has(id)) throw new Error(`Situation "${id}" exists in situationalGuide.ts but has no keywords in coach-prompt-source.ts`);
    }
    for (const id of keywordIds) {
        if (!guideIds.has(id)) throw new Error(`Keywords entry "${id}" has no situation in situationalGuide.ts`);
    }

    const cardsByLang: Record<Lang, SituationCard[]> = { es: SITUATION_CARDS, en: SITUATION_CARDS_EN, pt: SITUATION_CARDS_PT };
    const data: Record<Lang, Record<string, Record<string, string>>> = { es: {}, en: {}, pt: {} };
    for (const lang of LANGS) {
        for (const card of cardsByLang[lang]) {
            if (!guideIds.has(card.situationId)) throw new Error(`Card for unknown situation "${card.situationId}" (${lang})`);
            (data[lang][card.situationId] ??= {})[card.eje] = condense(card, lang);
        }
    }
    // en/pt fall back to the es card when a translation is missing, so a lagging
    // translation degrades gracefully instead of dropping the situation.
    for (const lang of ['en', 'pt'] as const) {
        for (const [sitId, ejes] of Object.entries(data.es)) {
            for (const eje of Object.keys(ejes)) {
                if (!data[lang][sitId]?.[eje]) {
                    console.warn(`[gen-coach] ${lang} missing card ${sitId}/${eje}; falling back to es`);
                    (data[lang][sitId] ??= {})[eje] = data.es[sitId][eje];
                }
            }
        }
    }

    return [
        `const SITUATION_KEYWORDS: Record<string, string[]> = ${JSON.stringify(SITUATION_KEYWORDS_SOURCE, null, 1)};`,
        ``,
        `// lang → situationId → eje → condensed card ('group' key = group-level card).`,
        `const SITUATION_CARDS_DATA: Record<string, Record<string, Record<string, string>>> = ${JSON.stringify(data, null, 1)};`,
    ].join('\n');
}

// ─── Splice into the target file ────────────────────────────────────────────

interface Region { name: string; content: string }

function splice(source: string, region: Region): string {
    const open = `// >>> GENERATED:${region.name}`;
    const close = `// <<< GENERATED:${region.name}`;
    const start = source.indexOf(open);
    const end = source.indexOf(close);
    if (start === -1 || end === -1) throw new Error(`Markers for ${region.name} not found in api/tenant-chat.ts`);
    const openLineEnd = source.indexOf('\n', start);
    return source.slice(0, openLineEnd + 1) + region.content + '\n' + source.slice(end);
}

const regions: Region[] = [
    { name: 'COACH_PROMPTS', content: buildPromptsBlock() },
    { name: 'COACH_SITUATIONS', content: buildSituationsBlock() },
];

const current = readFileSync(TARGET, 'utf8');
let next = current;
for (const r of regions) next = splice(next, r);

const checkMode = process.argv.includes('--check');
if (checkMode) {
    if (next !== current) {
        console.error('✗ api/tenant-chat.ts GENERATED regions are out of date. Run: npm run gen:coach');
        process.exit(1);
    }
    console.log('✓ ArgoCoach generated regions are in sync with their sources');
} else {
    if (next === current) {
        console.log('✓ ArgoCoach generated regions already up to date');
    } else {
        writeFileSync(TARGET, next);
        console.log('✓ Regenerated SYSTEM_PROMPTS + SITUATION_* in api/tenant-chat.ts');
    }
}
