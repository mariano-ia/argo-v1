// Unit tests for Argo Coach pure helpers (canonical naming + name matching).
// Run: npx tsx --test scripts/qa/coach-helpers.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    canonicalArchetype,
    canonicalMotorDisplay,
    normalizeName,
    nameIsMentioned,
    classifyNameMention,
    tokenizeMessage,
    unknownNameTokens,
    COMMON_WORD_NAMES_ES_PT,
    COMMON_WORD_NAMES_EN,
    PROPER_NAME_DENYLIST,
} from '../../api/tenant-chat.ts';

test('canonicalArchetype derives from eje+motor (es)', () => {
    assert.equal(canonicalArchetype('S', 'Medio', 'es'), 'Sostenedor Rítmico');
    assert.equal(canonicalArchetype('D', 'Rápido', 'es'), 'Impulsor Dinámico');
    assert.equal(canonicalArchetype('S', 'Lento', 'es'), 'Sostenedor Sereno');
});

test('canonicalArchetype handles C+Lento = Observador', () => {
    assert.equal(canonicalArchetype('C', 'Lento', 'es'), 'Estratega Observador');
    assert.equal(canonicalMotorDisplay('C', 'Lento', 'es'), 'Observador');
    // Other axes with Lento stay "Sereno".
    assert.equal(canonicalMotorDisplay('S', 'Lento', 'es'), 'Sereno');
});

test('canonicalArchetype reverses word order in English, keeps axis-first in pt', () => {
    assert.equal(canonicalArchetype('D', 'Rápido', 'en'), 'Dynamic Driver');
    assert.equal(canonicalArchetype('C', 'Lento', 'en'), 'Observant Strategist');
    assert.equal(canonicalArchetype('S', 'Medio', 'pt'), 'Sustentador Rítmico');
});

test('normalizeName strips accents and lowercases', () => {
    assert.equal(normalizeName('Iván'), 'ivan');
    assert.equal(normalizeName('Ángel'), 'angel');
    assert.equal(normalizeName('JOSÉ'), 'jose');
});

test('nameIsMentioned: lowercase + accent-insensitive', () => {
    assert.equal(nameIsMentioned('Keven', '¿qué perfil tiene keven?'), true);
    assert.equal(nameIsMentioned('Iván', 'cómo está ivan hoy'), true);
    assert.equal(nameIsMentioned('ivan', 'cómo está Iván hoy'), true);
});

test('nameIsMentioned: no substring false positives', () => {
    assert.equal(nameIsMentioned('Ana', 'hablame de Mariana'), false);
    assert.equal(nameIsMentioned('Ana', 'qué hago con Ana'), true);
});

test('nameIsMentioned: common-word names vetoed by literal-noun context, not by casing', () => {
    // Capitalization is no longer required (that gate silently missed lowercase
    // mentions). A common-word name is only rejected on literal-noun context.
    assert.equal(nameIsMentioned('Sol', 'hace mucho sol hoy'), false);   // weather
    assert.equal(nameIsMentioned('Sol', 'cómo motivo a Sol'), true);     // person
    assert.equal(nameIsMentioned('León', 'juega como un león'), false);  // "un león" = animal
    assert.equal(nameIsMentioned('León', 'qué hago con León'), true);    // person
});

test('nameIsMentioned: real names (not common words) match in lowercase', () => {
    // Regression: "olivia" is a proper name, not an everyday word. It was
    // wrongly listed as a common-word name, so a coach typing it lowercase
    // ("crees que olivia...") failed to inject the player's report.
    assert.equal(nameIsMentioned('Olivia', 'crees que olivia puede ser buena capitana?'), true);
    assert.equal(nameIsMentioned('Olivia', '¿cómo está Olivia hoy?'), true);
});

test('nameIsMentioned: full names match', () => {
    assert.equal(nameIsMentioned('Juan Pérez', '¿qué hago con Juan Pérez?'), true);
});

test('unknownNameTokens: ignores roster vocabulary, flags real proper nouns', () => {
    assert.deepEqual(unknownNameTokens('cómo motivo a un Impulsor Dinámico'), []);
    assert.deepEqual(unknownNameTokens('qué hago con Pedro'), ['Pedro']);
    // Sentence-initial archetype word is not treated as an unknown name.
    assert.deepEqual(unknownNameTokens('Estratega es un eje analítico'), []);
});

// ─── Golden fixture: roster-name matcher across es/en/pt ─────────────────────
// Curated adversarial battery. Every future name-match incident should be
// appended here. This makes the Olivia-class silent-miss (a lowercase real name
// dropped because it was mis-listed as a common word) impossible to reintroduce
// without failing CI. Models the caller: full-name match, else first-name fallback.
function resolvePlayer(rosterName: string, message: string, lang: string): boolean {
    const full = rosterName.trim();
    const ctx = { normMsg: normalizeName(message), tokens: tokenizeMessage(message) };
    if (/\s/.test(full) && classifyNameMention(full, message, lang, ctx).match) return true;
    const first = full.split(/\s+/)[0];
    return classifyNameMention(first, message, lang, ctx).match;
}

const MATCHER_BATTERY: Array<{ name: string; msg: string; lang: string; expected: boolean; cat: string }> = [
    { name: "Sol", msg: "cómo la ayudo a sol con la ansiedad antes de los partidos?", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Sol", msg: "hoy hace mucho sol así que entrenamos temprano", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Sol", msg: "los mandé a tomar sol un rato en el descanso", lang: "es", expected: false, cat: "fixed-phrase" },
    { name: "Sol", msg: "sol viene bajoneada esta semana, algún consejo?", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Sol", msg: "quiero salir campeón bajo el sol de la final", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Sol", msg: "sol no quiso pasar la pelota en todo el partido", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Sol", msg: "Sol viene floja de confianza", lang: "es", expected: true, cat: "capitalized-control" },
    { name: "Sol", msg: "sol", lang: "es", expected: true, cat: "bare-name-weak-accept" },
    { name: "Sol", msg: "hablé con la mamá de soledad ayer", lang: "es", expected: false, cat: "substring" },
    { name: "Sol", msg: "consuelo entrenó aparte hoy por la lesión", lang: "es", expected: false, cat: "substring" },
    { name: "Luna", msg: "luna no quiere pasar al arco, cómo la motivo?", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Luna", msg: "entrenamos de noche con la luna llena, hermoso", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Luna", msg: "luna se frustró cuando la sacamos en el segundo tiempo", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Luna", msg: "me preocupa luna, se frustra cuando pierde", lang: "es", expected: true, cat: "person-cue" },
    { name: "Paz", msg: "paz se pone nerviosa cuando la miran, qué hago?", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Paz", msg: "los chicos por fin jugaron en paz sin peleas hoy", lang: "es", expected: false, cat: "fixed-phrase" },
    { name: "Paz", msg: "necesito que haya más paz en el vestuario", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Paz", msg: "paz necesita más minutos de juego", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Alba", msg: "alba se frustra cuando pierde la pelota", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Alba", msg: "citamos a todos al alba para el amistoso", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Rosa", msg: "rosa lidera al grupo sin darse cuenta", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Rosa", msg: "usamos las pecheras color rosa en la práctica", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Rosa", msg: "le regalamos una rosa al final del torneo", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Flor", msg: "flor le cuesta arrancar pero después no para", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Flor", msg: "le regalaron una flor al terminar el torneo", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Flor", msg: "flor se lastimó el tobillo en el primer tiempo", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Cruz", msg: "cruz mete pilas pero se desconcentra rápido", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Cruz", msg: "hizo la señal de la cruz antes de patear", lang: "es", expected: false, cat: "fixed-phrase" },
    { name: "Luz", msg: "luz necesita más confianza para tirar al arco", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Luz", msg: "se cortó la luz y suspendimos la práctica", lang: "es", expected: false, cat: "fixed-phrase" },
    { name: "Mar", msg: "mar se pone a la defensiva si la corrijo", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Mar", msg: "el club queda frente al mar, entrenan en la playa", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "León", msg: "leon empuja al equipo cuando van perdiendo", lang: "es", expected: true, cat: "accent" },
    { name: "León", msg: "juegan como un león cuando están concentrados", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Ángel", msg: "angel se pone ansioso en los penales", lang: "es", expected: true, cat: "accent" },
    { name: "Ángel", msg: "jugó como un angel toda la primera parte", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Pilar", msg: "pilar es el pilar del mediocampo, la copio siempre", lang: "es", expected: true, cat: "homonym-in-sentence" },
    { name: "Pilar", msg: "el equipo se apoya en un solo pilar y eso preocupa", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Victoria", msg: "victoria se pone líder natural en los partidos", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Victoria", msg: "los chicos merecían la victoria de hoy", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Abril", msg: "abril arrancó tímida pero ya se soltó", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Abril", msg: "el torneo arranca en abril si no llueve", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Rocío", msg: "rocio se esconde en los partidos importantes", lang: "es", expected: true, cat: "accent" },
    { name: "Rocío", msg: "la cancha estaba mojada por el rocío de la mañana", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Milagros", msg: "fue un partido de milagros para nosotros", lang: "es", expected: false, cat: "common-word-as-noun" },
    { name: "Olivia", msg: "olivia se traba cuando la marcan de cerca", lang: "es", expected: true, cat: "non-common-lowercase" },
    { name: "Olivia", msg: "¿olivia mejoró su actitud esta semana?", lang: "es", expected: true, cat: "punctuation" },
    { name: "Olivia", msg: "olivia, contame cómo la ves", lang: "es", expected: true, cat: "punctuation" },
    { name: "Keven", msg: "keven falta mucho y pierde ritmo", lang: "es", expected: true, cat: "non-common-lowercase" },
    { name: "Iván", msg: "cómo motivo a ivan cuando se enoja?", lang: "es", expected: true, cat: "accent" },
    { name: "Sofía", msg: "SOFIA está imparable últimamente", lang: "es", expected: true, cat: "mixed-case" },
    { name: "José", msg: "jose necesita más confianza", lang: "es", expected: true, cat: "accent" },
    { name: "Ana", msg: "mariana viene mejorando mucho su cabeza", lang: "es", expected: false, cat: "substring" },
    { name: "Ana", msg: "ana se puso a la defensiva", lang: "es", expected: true, cat: "lowercase-person" },
    { name: "Ana", msg: "Ana y Mariana se llevan muy bien en la cancha", lang: "es", expected: true, cat: "substring-plus-standalone" },
    { name: "Juan Pablo", msg: "juan pablo se distrae cuando lo cambian de posición", lang: "es", expected: true, cat: "multiword" },
    { name: "Juan Pablo", msg: "juan estuvo callado hoy", lang: "es", expected: true, cat: "multiword-firstname-fallback" },
    { name: "María José", msg: "maria jose viene jugando de 9", lang: "es", expected: true, cat: "multiword" },
    { name: "Lucas", msg: "lucas y lucas chocaron en el área", lang: "es", expected: true, cat: "homonym-per-name-true" },
    { name: "Leo", msg: "Leo⚽ la rompió hoy, tremendo partido", lang: "es", expected: true, cat: "emoji-adjacency" },
    { name: "Sky", msg: "the sky was totally clear during the match, no rain", lang: "en", expected: false, cat: "en-common-word-as-noun" },
    { name: "Sky", msg: "Sky played left back and looked nervous today", lang: "en", expected: true, cat: "lowercase-person" },
    { name: "Sky", msg: "we practiced under a clear sky but sky needs to press higher", lang: "en", expected: true, cat: "en-homonym-in-sentence" },
    { name: "Hope", msg: "i hope she starts on saturday, fingers crossed", lang: "en", expected: false, cat: "en-common-word-as-noun" },
    { name: "Hope", msg: "Hope struggled with the high press in the second half", lang: "en", expected: true, cat: "lowercase-person" },
    { name: "Grace", msg: "she moves with real grace on the ball", lang: "en", expected: false, cat: "en-common-word-as-noun" },
    { name: "Grace", msg: "how should i talk to grace about sharing the ball more?", lang: "en", expected: true, cat: "en-lowercase-person-cue" },
    { name: "Faith", msg: "i just need to have faith the team will click eventually", lang: "en", expected: false, cat: "en-common-word-as-noun" },
    { name: "Sunny", msg: "it was a sunny afternoon so the kids were tired", lang: "en", expected: false, cat: "en-common-word-as-noun" },
    { name: "Sunny", msg: "Sunny keeps drifting out of position, any tips?", lang: "en", expected: true, cat: "lowercase-person" },
    { name: "Summer", msg: "we lose a lot of players over summer break", lang: "en", expected: false, cat: "en-common-word-as-noun" },
    { name: "Thiago", msg: "como ajudo o thiago a se soltar em campo?", lang: "pt", expected: true, cat: "non-common-lowercase" },
    { name: "Vitória", msg: "a vitória foi dela no jogo de ontem", lang: "pt", expected: false, cat: "pt-common-word-as-noun" },
    { name: "Vitória", msg: "vitória travou na hora do pênalti", lang: "pt", expected: true, cat: "pt-lowercase-person" },
    { name: "Vitória", msg: "foi uma vitória suada mas merecida no fim", lang: "pt", expected: false, cat: "pt-common-word-as-noun" },
    { name: "Léo", msg: "o leo anda mais confiante", lang: "pt", expected: true, cat: "accent" },
    { name: "Céu", msg: "o céu estava limpo, deu pra treinar de tarde", lang: "pt", expected: false, cat: "pt-common-word-as-noun" },
    { name: "Céu", msg: "ceu não apareceu no treino de novo, tô preocupado", lang: "pt", expected: true, cat: "pt-accent-lowercase-person" },
    { name: "Estrela", msg: "esse time joga que é uma estrela, muito bonito", lang: "pt", expected: false, cat: "pt-common-word-as-noun" },
    { name: "Estrela", msg: "Estrela chorou quando perdemos nos pênaltis", lang: "pt", expected: true, cat: "lowercase-person" },
    { name: "Luz", msg: "faltou luz no campo, o jogo quase parou", lang: "pt", expected: false, cat: "pt-common-word-as-noun" },
    { name: "Mel", msg: "mel é doce demais com os adversários, precisa competir mais", lang: "pt", expected: true, cat: "non-common-lowercase" },
    { name: "Bella", msg: "la bella jugada del gol vino de un contragolpe", lang: "es", expected: false, cat: "list-incompleteness-flag" },
];

test('roster-name matcher: golden battery (es/en/pt)', () => {
    const fails: string[] = [];
    for (const c of MATCHER_BATTERY) {
        const got = resolvePlayer(c.name, c.msg, c.lang);
        if (got !== c.expected) fails.push(`[${c.lang}/${c.cat}] ${JSON.stringify(c.name)} <= ${JSON.stringify(c.msg)} exp=${c.expected} got=${got}`);
    }
    assert.equal(fails.length, 0, `\n${fails.join('\n')}`);
});

// KNOWN LIMITATION (pre-existing, not caused by the matcher rewrite): compound-name
// disambiguation and plural morphology. The current caller falls back to the first
// name, so a split/reversed compound still resolves via its first name, and a plural
// ("dos juanes") is not stemmed. These are pinned here so the behavior is explicit;
// fixing them is separate future work (proper compound-name handling).
test('roster-name matcher: documented residuals (compound/plural)', () => {
    assert.equal(resolvePlayer('Juan Pablo', 'vino Juan pero Pablo faltó a la práctica', 'es'), true); // ideal: false
    assert.equal(resolvePlayer('María José', 'jose maria confundí el orden', 'es'), true); // ideal: false
    assert.equal(resolvePlayer('Juan', 'tengo dos juanes: cuál de los dos?', 'es'), false); // ideal: true
});

test('confidence: lowercase common-word with no cue is a weak accept, person cue is strong', () => {
    assert.equal(classifyNameMention('Sol', 'sol', 'es').confidence, 'weak');
    assert.equal(classifyNameMention('Sol', 'cómo motivo a sol', 'es').confidence, 'strong');
    // Ordinary (non common-word) names are always strong when present.
    assert.equal(classifyNameMention('Olivia', 'olivia se traba', 'es').confidence, 'strong');
});

// ─── Prevention lint: the common-word sets can never silently break a real name ──
test('lint: no proper name is mis-listed as a common word (Olivia guard)', () => {
    for (const set of [COMMON_WORD_NAMES_ES_PT, COMMON_WORD_NAMES_EN]) {
        for (const w of set) {
            assert.ok(!PROPER_NAME_DENYLIST.has(w), `"${w}" is a real proper name and must not be in a common-word set`);
        }
    }
});

test('lint: every common-word entry is normalized (lowercase, no accents)', () => {
    for (const set of [COMMON_WORD_NAMES_ES_PT, COMMON_WORD_NAMES_EN]) {
        for (const w of set) {
            assert.equal(w, normalizeName(w), `common-word entry "${w}" must be stored normalized`);
        }
    }
});
