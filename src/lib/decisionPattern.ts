/**
 * Decision pattern classification from question response times.
 * Translates raw responseTimeMs data into coach-friendly language.
 *
 * 4 patterns × 3 languages (ES / EN / PT) = 12 combinations, all covered.
 */

export type DecisionPattern = 'constante' | 'arranque_lento' | 'cierre_desgaste' | 'contexto';

interface AnswerWithTime {
    responseTimeMs?: number;
}

/**
 * Classifies the decision pattern from an array of question answers.
 * Returns null if there is insufficient data (< 6 answers with valid times).
 *
 * Algorithm:
 *  1. Filter outliers (< 300ms = accidental tap, > 60s = walked away)
 *  2. High coefficient of variation (CV > 0.45) → 'contexto'
 *  3. Compare first-half avg vs second-half avg with 20% threshold:
 *       faster at end  → 'arranque_lento'
 *       slower at end  → 'cierre_desgaste'
 *       stable         → 'constante'
 */
export function classifyDecisionPattern(answers: AnswerWithTime[]): DecisionPattern | null {
    const times = answers
        .map(a => a.responseTimeMs)
        .filter((t): t is number => typeof t === 'number' && t >= 300 && t <= 60000);

    if (times.length < 6) return null;

    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length;
    const cv = Math.sqrt(variance) / mean;

    if (cv > 0.45) return 'contexto';

    const half = Math.floor(times.length / 2);
    const avgFirst  = times.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const avgSecond = times.slice(half).reduce((a, b) => a + b, 0) / (times.length - half);
    const diff      = avgSecond - avgFirst;
    const threshold = mean * 0.20;

    if (diff < -threshold) return 'arranque_lento';
    if (diff >  threshold) return 'cierre_desgaste';
    return 'constante';
}

/* ── Copy ────────────────────────────────────────────────────────────────── */

interface PatternCopy {
    label: string;
    desc:  string;
    imp:   string;
}

type PatternMap = Record<DecisionPattern, PatternCopy>;

const ES: PatternMap = {
    constante: {
        label: 'Decisor constante',
        desc:  'Toma decisiones con la misma claridad al principio y al final.',
        imp:   'Puedes darle instrucciones complejas en cualquier momento del partido. Responde igual en el primer minuto que en el último.',
    },
    arranque_lento: {
        label: 'Arranque progresivo',
        desc:  'Necesita los primeros minutos para activarse. Una vez que entra en ritmo, es muy difícil de frenar.',
        imp:   'No le asignes responsabilidades críticas al inicio. Dale tiempo para calentar también la cabeza, no solo el cuerpo.',
    },
    cierre_desgaste: {
        label: 'Energía de inicio',
        desc:  'Sus mejores decisiones llegan al principio. Con el tiempo, la toma de decisiones le demanda más esfuerzo.',
        imp:   'Dosifica la carga de decisiones a lo largo del partido. Su momento de mayor claridad es el arranque.',
    },
    contexto: {
        label: 'Decisor de contexto',
        desc:  'Su capacidad de decisión varía mucho según cómo llega ese día.',
        imp:   'Vale la pena tomarte 2 minutos antes de cada sesión para leer cómo está. Una pregunta simple puede cambiar todo.',
    },
};

const EN: PatternMap = {
    constante: {
        label: 'Consistent decider',
        desc:  'Makes decisions with the same clarity at the start and at the end.',
        imp:   'You can give complex instructions at any point in the session. Responds just as well in the first minute as in the last.',
    },
    arranque_lento: {
        label: 'Progressive starter',
        desc:  'Needs the first few minutes to get going. Once in rhythm, very hard to stop.',
        imp:   'Avoid assigning critical responsibilities at the start. Give them time to warm up mentally, not just physically.',
    },
    cierre_desgaste: {
        label: 'Front-loaded energy',
        desc:  'Best decisions come early. Over time, decision-making demands more effort.',
        imp:   'Pace decision demands throughout the session. Their peak clarity is at the start.',
    },
    contexto: {
        label: 'Context-based decider',
        desc:  'Decision-making ability varies a lot depending on how they arrive that day.',
        imp:   'Worth taking 2 minutes before each session to check in. A simple question can change everything.',
    },
};

const PT: PatternMap = {
    constante: {
        label: 'Decisor constante',
        desc:  'Toma decisões com a mesma clareza no início e no final.',
        imp:   'Pode dar instruções complexas em qualquer momento da sessão. Responde igual no primeiro minuto que no último.',
    },
    arranque_lento: {
        label: 'Início progressivo',
        desc:  'Precisa dos primeiros minutos para se ativar. Uma vez em ritmo, é muito difícil de parar.',
        imp:   'Evite atribuir responsabilidades críticas no início. Dê tempo para aquecer também a cabeça, não só o corpo.',
    },
    cierre_desgaste: {
        label: 'Energia de início',
        desc:  'Suas melhores decisões chegam no começo. Com o tempo, tomar decisões exige mais esforço.',
        imp:   'Distribua a carga de decisões ao longo da sessão. Seu momento de maior clareza é o início.',
    },
    contexto: {
        label: 'Decisor de contexto',
        desc:  'Sua capacidade de decisão varia muito conforme como chega naquele dia.',
        imp:   'Vale a pena tirar 2 minutos antes de cada sessão para perceber como está. Uma pergunta simples pode mudar tudo.',
    },
};

export const PATTERN_DATA: Record<string, PatternMap> = { es: ES, en: EN, pt: PT };

export function getPatternCopy(pattern: DecisionPattern, lang: string): PatternCopy {
    return (PATTERN_DATA[lang] ?? ES)[pattern];
}

export function getPatternSectionLabel(lang: string): string {
    if (lang === 'en') return 'Decision pattern';
    if (lang === 'pt') return 'Padrão de decisão';
    return 'Patrón de decisión';
}

export function getImplicationLabel(lang: string): string {
    if (lang === 'en') return 'What this means for training';
    if (lang === 'pt') return 'O que isso significa no treino';
    return 'Qué significa para el entrenamiento';
}

/* ── Sparkline SVG ───────────────────────────────────────────────────────── */

/**
 * Returns an SVG string (80 × 24 px) for the dashboard.
 * Uses inline attributes — safe for dangerouslySetInnerHTML.
 */
export function buildSparklineSvg(answers: AnswerWithTime[], color: string): string {
    const times = answers
        .map(a => a.responseTimeMs)
        .filter((t): t is number => typeof t === 'number' && t > 0);

    if (times.length < 2) return '';

    const W = 80, H = 24, PAD = 3;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const range = max - min || 1;

    const pts = times.map((t, i) => {
        const x = PAD + (i / (times.length - 1)) * (W - 2 * PAD);
        const y = H - PAD - ((t - min) / range) * (H - 2 * PAD);
        return [+(x.toFixed(1)), +(y.toFixed(1))] as [number, number];
    });

    const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ');
    const dots = pts.map(([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="1.8" fill="${color}" opacity="0.4"/>`
    ).join('');

    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>${dots}</svg>`;
}

/* ── Email-safe HTML block ───────────────────────────────────────────────── */

/**
 * Returns an email-safe HTML card for the pattern section.
 * Uses inline styles only — no Tailwind, no CSS classes.
 */
export function buildPatternEmailHtml(pattern: DecisionPattern, lang: string): string {
    const p = getPatternCopy(pattern, lang);
    const sectionLabel = getPatternSectionLabel(lang);
    const impLabel = getImplicationLabel(lang);

    return `<div style="background:#ffffff;border-radius:14px;padding:24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">` +
        `<p style="font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#AEAEB2;margin:0 0 10px 0;">${sectionLabel}</p>` +
        `<p style="font-size:15px;font-weight:600;color:#1D1D1F;margin:0 0 6px 0;">${p.label}</p>` +
        `<p style="font-size:13px;color:#424245;line-height:1.7;margin:0 0 14px 0;">${p.desc}</p>` +
        `<p style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#AEAEB2;margin:0 0 6px 0;">${impLabel}</p>` +
        `<div style="background:#F8F8FA;border-left:2px solid #EDE5F5;border-radius:0 8px 8px 0;padding:12px 16px;">` +
        `<p style="font-size:13px;color:#424245;line-height:1.7;margin:0;">${p.imp}</p>` +
        `</div></div>`;
}
