// Deterministic, probabilistic, potential-framed description of how a child's profile
// shifted between two re-profilings. NO AI. Voice (Argo guardrails): always potential +
// a concrete action, never affirmative about the child (always probabilistic: parece,
// podría, suele, tiende a). Spec: docs/DESCRIPCION-CAMBIO-PERFIL.md.

export interface PerfilamientoLite {
    answers?: { axis: string }[] | null;
    motor: string;   // 'Rápido' | 'Medio' | 'Lento'
    eje: string;     // 'D' | 'I' | 'S' | 'C'
}

type Lang = 'es' | 'en' | 'pt';
type Axis = 'D' | 'I' | 'S' | 'C';
const AXES: Axis[] = ['D', 'I', 'S', 'C'];
const MOTOR_RANK: Record<string, number> = { 'Rápido': 0, 'Medio': 1, 'Lento': 2 };

function vector(answers: { axis: string }[] | null | undefined): Record<Axis, number> | null {
    if (!Array.isArray(answers) || answers.length === 0) return null;
    const t: Record<Axis, number> = { D: 0, I: 0, S: 0, C: 0 };
    let n = 0;
    for (const a of answers) {
        const ax = a?.axis as Axis;
        if (ax && ax in t) { t[ax]++; n++; }
    }
    if (n === 0) return null;
    return { D: t.D / n, I: t.I / n, S: t.S / n, C: t.C / n };
}
// Histogram intersection: 1 = identical, 0 = disjoint.
function stability(p: Record<Axis, number>, c: Record<Axis, number>): number {
    return AXES.reduce((s, a) => s + Math.min(p[a], c[a]), 0);
}
function grewMost(p: Record<Axis, number>, c: Record<Axis, number>): Axis {
    let best: Axis = 'D', bestD = -Infinity;
    for (const a of AXES) { const d = c[a] - p[a]; if (d > bestD) { bestD = d; best = a; } }
    return best;
}
function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

// ── Lexicon (es / en / pt), probabilistic + potential + action ──
const RASGO: Record<Lang, Record<Axis, string>> = {
    es: { D: 'iniciativa', I: 'ganas de conectar con el grupo', S: 'constancia para sostener al equipo', C: 'atención al detalle' },
    en: { D: 'initiative', I: 'eagerness to connect with the group', S: 'steadiness to support the team', C: 'attention to detail' },
    pt: { D: 'iniciativa', I: 'vontade de se conectar com o grupo', S: 'constância para apoiar o time', C: 'atenção aos detalhes' },
};
const FORTALEZA: Record<Lang, Record<Axis, string>> = {
    es: { D: 'su empuje y sus ganas de tomar la delantera', I: 'su don para conectar con el equipo', S: 'su constancia y su rol de sostén', C: 'su mirada atenta al detalle' },
    en: { D: 'their drive and eagerness to take the lead', I: 'their gift for connecting with the team', S: 'their steadiness and supportive role', C: 'their keen eye for detail' },
    pt: { D: 'sua garra e vontade de tomar a frente', I: 'seu dom de conectar com o time', S: 'sua constância e seu papel de apoio', C: 'seu olhar atento aos detalhes' },
};
const ACCION_EMERGENTE: Record<Lang, Record<Axis, string[]>> = {
    es: {
        D: ['Puedes invitar a {N} a proponer una jugada o a liderar un ejercicio corto.', 'Una idea: darle a {N} la oportunidad de dirigir un momento de la actividad.'],
        I: ['Puedes darle a {N} un rol para animar y unir al grupo.', 'Una idea: invitar a {N} a integrar a quienes están más callados.'],
        S: ['Puedes confiarle a {N} una tarea estable donde su constancia pueda lucirse.', 'Una idea: darle a {N} un rol de referente tranquilo dentro del equipo.'],
        C: ['Puedes explicarle a {N} el porqué de cada jugada o ejercicio.', 'Una idea: invitar a {N} a observar una jugada y compartir lo que nota.'],
    },
    en: {
        D: ["You can invite {N} to suggest a play or lead a short drill.", "An idea: give {N} the chance to run a moment of the session."],
        I: ["You can give {N} a role to energize and bring the group together.", "An idea: invite {N} to include the quieter teammates."],
        S: ["You can entrust {N} with a steady task where that consistency can shine.", "An idea: give {N} a calm, dependable role within the team."],
        C: ["You can explain to {N} the why behind each play or drill.", "An idea: invite {N} to watch a play and share what they notice."],
    },
    pt: {
        D: ['Você pode convidar {N} a propor uma jogada ou liderar um exercício curto.', 'Uma ideia: dar a {N} a chance de conduzir um momento da atividade.'],
        I: ['Você pode dar a {N} um papel para animar e unir o grupo.', 'Uma ideia: convidar {N} a integrar quem está mais quieto.'],
        S: ['Você pode confiar a {N} uma tarefa estável onde essa constância possa brilhar.', 'Uma ideia: dar a {N} um papel de referência tranquila no time.'],
        C: ['Você pode explicar a {N} o porquê de cada jogada ou exercício.', 'Uma ideia: convidar {N} a observar uma jogada e compartilhar o que percebe.'],
    },
};
const ACCION_MANTENER: Record<Lang, Record<Axis, string[]>> = {
    es: {
        D: ['Es un buen momento para seguir dándole a {N} espacios donde liderar.', 'Puedes seguir ofreciéndole a {N} retos donde tomar la iniciativa.'],
        I: ['Es un buen momento para seguir dándole a {N} un lugar para unir al grupo.', 'Puedes seguir apoyándote en {N} para sostener el buen clima del equipo.'],
        S: ['Es un buen momento para seguir confiándole a {N} un rol estable en la actividad.', 'Puedes seguir dándole a {N} tareas donde su constancia sea protagonista.'],
        C: ['Es un buen momento para seguir explicándole a {N} el porqué de las cosas.', 'Puedes seguir invitando a {N} a analizar y proponer ideas.'],
    },
    en: {
        D: ["It's a good time to keep giving {N} chances to lead.", "You can keep offering {N} challenges where they take the initiative."],
        I: ["It's a good time to keep giving {N} a place to bring the group together.", "You can keep leaning on {N} to sustain a good team atmosphere."],
        S: ["It's a good time to keep entrusting {N} with a steady role in the activity.", "You can keep giving {N} tasks where that consistency leads."],
        C: ["It's a good time to keep explaining to {N} the why behind things.", "You can keep inviting {N} to analyze and suggest ideas."],
    },
    pt: {
        D: ['É um bom momento para continuar dando a {N} espaços para liderar.', 'Você pode continuar oferecendo a {N} desafios para tomar a iniciativa.'],
        I: ['É um bom momento para continuar dando a {N} um lugar para unir o grupo.', 'Você pode continuar contando com {N} para manter o bom clima do time.'],
        S: ['É um bom momento para continuar confiando a {N} um papel estável na atividade.', 'Você pode continuar dando a {N} tarefas onde essa constância seja protagonista.'],
        C: ['É um bom momento para continuar explicando a {N} o porquê das coisas.', 'Você pode continuar convidando {N} a analisar e propor ideias.'],
    },
};
type Open = (n: string, x: string) => string;
const OPEN_ESTABLE: Record<Lang, Open[]> = {
    es: [
        (n, x) => `${n} tiende a mantenerse fiel a su esencia, con ${x}.`,
        (n, x) => `${n} suele conservar su forma de ser de siempre, con ${x}.`,
        (n, x) => `${n} parece seguir fiel a su estilo, con ${x}.`,
    ],
    en: [
        (n, x) => `${n} tends to stay true to their essence, with ${x}.`,
        (n, x) => `${n} usually keeps their usual way of being, with ${x}.`,
        (n, x) => `${n} seems to stay true to their style, with ${x}.`,
    ],
    pt: [
        (n, x) => `${n} costuma se manter fiel à sua essência, com ${x}.`,
        (n, x) => `${n} costuma conservar o seu jeito de sempre, com ${x}.`,
        (n, x) => `${n} parece seguir fiel ao seu estilo, com ${x}.`,
    ],
};
const OPEN_MODERADO: Record<Lang, Open[]> = {
    es: [
        (n, x) => `${n} sigue mostrando su esencia de siempre, y parece asomar un poco más de ${x}: un lindo potencial para acompañar.`,
        (n, x) => `${n} tiende a mantener su forma de ser de siempre, y parece ir sumándose un poco más de ${x}, un potencial valioso para nutrir.`,
        (n, x) => `${n} conserva su sello de siempre, y parece empezar a crecer en ${x}: vale la pena darle lugar.`,
    ],
    en: [
        (n, x) => `${n} keeps showing their usual essence, and a bit more ${x} seems to be emerging: a lovely potential to nurture.`,
        (n, x) => `${n} tends to keep their usual way of being, and a bit more ${x} seems to be adding in: a valuable potential to nurture.`,
        (n, x) => `${n} keeps their usual character, and seems to be growing in ${x}: worth making room for.`,
    ],
    pt: [
        (n, x) => `${n} segue mostrando a sua essência de sempre, e parece despontar um pouco mais de ${x}: um belo potencial para acompanhar.`,
        (n, x) => `${n} costuma manter o seu jeito de sempre, e parece ir somando um pouco mais de ${x}, um potencial valioso para nutrir.`,
        (n, x) => `${n} conserva o seu jeito de sempre, e parece começar a crescer em ${x}: vale a pena dar espaço.`,
    ],
};
const OPEN_MAYOR: Record<Lang, Open[]> = {
    es: [
        (n, x) => `En estos meses ${n} parece ir mostrando una faceta nueva, con más ${x}: un potencial valioso para nutrir.`,
        (n, x) => `En este tiempo ${n} parece estar explorando algo nuevo, con más ${x}: un lindo potencial para acompañar.`,
        (n, x) => `Últimamente ${n} parece mostrar una mirada distinta, con más ${x}: vale la pena nutrir ese potencial.`,
    ],
    en: [
        (n, x) => `Over these months ${n} seems to be showing a new facet, with more ${x}: a valuable potential to nurture.`,
        (n, x) => `Lately ${n} seems to be exploring something new, with more ${x}: a lovely potential to nurture.`,
        (n, x) => `These days ${n} seems to show a different outlook, with more ${x}: worth nurturing that potential.`,
    ],
    pt: [
        (n, x) => `Nestes meses ${n} parece ir mostrando uma faceta nova, com mais ${x}: um potencial valioso para nutrir.`,
        (n, x) => `Neste tempo ${n} parece estar explorando algo novo, com mais ${x}: um belo potencial para acompanhar.`,
        (n, x) => `Ultimamente ${n} parece mostrar um olhar diferente, com mais ${x}: vale a pena nutrir esse potencial.`,
    ],
};
const MOTOR: Record<Lang, { faster: string; slower: string }> = {
    es: { faster: 'Además, ahora podría responder de forma más inmediata.', slower: 'Además, ahora podría tomarse un poco más de tiempo para decidir, lo que puede darle más calidad a sus jugadas.' },
    en: { faster: 'Also, {N} might now respond more immediately.', slower: 'Also, {N} might now take a bit more time to decide, which can add quality to their play.' },
    pt: { faster: 'Além disso, agora {N} poderia responder de forma mais imediata.', slower: 'Além disso, agora {N} poderia levar um pouco mais de tempo para decidir, o que pode dar mais qualidade às suas jogadas.' },
};

/**
 * Returns a couple-of-lines, probabilistic, potential-framed description of how the
 * child's profile shifted from `prev` to `curr` (the two most recent resolved
 * perfilamientos). Deterministic per child (variant chosen by a stable hash of childId).
 * Returns null if there isn't enough data (missing answers).
 */
export function describeProfileChange(
    curr: PerfilamientoLite,
    prev: PerfilamientoLite,
    lang: string,
    childId: string,
    childName: string,
): string | null {
    const L: Lang = lang === 'en' || lang === 'pt' ? lang : 'es';
    const vC = vector(curr.answers);
    const vP = vector(prev.answers);
    if (!vC || !vP) return null;

    const N = (childName || '').trim().split(' ')[0] || childName || '';
    const S = stability(vP, vC);
    const v = hashStr(childId);
    const openIdx = v % 3;
    const actIdx = Math.floor(v / 3) % 2;

    const rc = MOTOR_RANK[curr.motor];
    const rp = MOTOR_RANK[prev.motor];
    const motorDir: 'faster' | 'slower' | 'same' =
        rc == null || rp == null ? 'same' : rc < rp ? 'faster' : rc > rp ? 'slower' : 'same';

    let body: string;
    if (S >= 0.85) {
        const axis: Axis = (curr.eje as Axis) in FORTALEZA[L] ? (curr.eje as Axis) : 'S';
        body = `${OPEN_ESTABLE[L][openIdx](N, FORTALEZA[L][axis])} ${ACCION_MANTENER[L][axis][actIdx].replace(/\{N\}/g, N)}`;
    } else {
        const axis = grewMost(vP, vC);
        const open = S >= 0.6 ? OPEN_MODERADO : OPEN_MAYOR;
        body = `${open[L][openIdx](N, RASGO[L][axis])} ${ACCION_EMERGENTE[L][axis][actIdx].replace(/\{N\}/g, N)}`;
    }
    if (motorDir !== 'same') body += ' ' + MOTOR[L][motorDir].replace(/\{N\}/g, N);
    return body;
}
