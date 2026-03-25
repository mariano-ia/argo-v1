/**
 * Group Balance — Deterministic calculations for team composition analysis.
 * Zero AI tokens. Pure arithmetic on axis distributions.
 */

export type Axis = 'D' | 'I' | 'S' | 'C';
export type Motor = 'Rápido' | 'Medio' | 'Lento';

export interface MemberProfile {
    session_id: string;
    child_name: string;
    child_age: number | null;
    sport: string;
    eje: Axis;
    motor: string;
    eje_secundario: string;
    archetype_label: string;
}

/* ── Distribution ──────────────────────────────────────────────────────────── */

export interface AxisDistribution {
    D: number; // percentage 0-100
    I: number;
    S: number;
    C: number;
}

export interface MotorDistribution {
    Rápido: number;
    Medio: number;
    Lento: number;
}

export function calcAxisDistribution(members: MemberProfile[]): AxisDistribution {
    const total = members.length;
    if (total === 0) return { D: 0, I: 0, S: 0, C: 0 };

    const counts: Record<Axis, number> = { D: 0, I: 0, S: 0, C: 0 };
    members.forEach(m => {
        if (counts[m.eje as Axis] !== undefined) counts[m.eje as Axis]++;
    });

    return {
        D: Math.round((counts.D / total) * 100),
        I: Math.round((counts.I / total) * 100),
        S: Math.round((counts.S / total) * 100),
        C: Math.round((counts.C / total) * 100),
    };
}

export function calcMotorDistribution(members: MemberProfile[]): MotorDistribution {
    const total = members.length;
    if (total === 0) return { Rápido: 0, Medio: 0, Lento: 0 };

    const counts = { Rápido: 0, Medio: 0, Lento: 0 };
    members.forEach(m => {
        if (m.motor === 'Rápido') counts.Rápido++;
        else if (m.motor === 'Lento') counts.Lento++;
        else counts.Medio++;
    });

    return {
        Rápido: Math.round((counts.Rápido / total) * 100),
        Medio: Math.round((counts.Medio / total) * 100),
        Lento: Math.round((counts.Lento / total) * 100),
    };
}

/* ── Group Type ────────────────────────────────────────────────────────────── */

export type GroupType = 'Competitivo' | 'Social' | 'Cohesivo' | 'Metódico' | 'Balanceado';

export function getGroupTypes(dist: AxisDistribution): GroupType[] {
    const types: GroupType[] = [];
    if (dist.D > 35) types.push('Competitivo');
    if (dist.I > 35) types.push('Social');
    if (dist.S > 35) types.push('Cohesivo');
    if (dist.C > 35) types.push('Metódico');
    if (types.length === 0) types.push('Balanceado');
    return types;
}

/* ── Indicators ────────────────────────────────────────────────────────────── */

export type IndicatorLevel =
    | 'equilibrada'     // 15-35%
    | 'moderada'        // 5-14%
    | 'marcada'         // 36-50%
    | 'definido_alto'   // >50%
    | 'definido_bajo';  // <5%

export function getIndicatorLevel(pct: number): IndicatorLevel {
    if (pct > 50) return 'definido_alto';
    if (pct >= 36) return 'marcada';
    if (pct >= 15) return 'equilibrada';
    if (pct >= 5) return 'moderada';
    return 'definido_bajo';
}

export interface IndicatorResult {
    axis: Axis | 'diversity';
    label: string;
    percentage: number;
    level: IndicatorLevel | 'alta' | 'moderada_div' | 'definida';
}

export function calcDiversity(dist: AxisDistribution): number {
    const pcts = [dist.D, dist.I, dist.S, dist.C];
    const ideal = 25;
    const totalDeviation = pcts.reduce((sum, p) => sum + Math.abs(p - ideal), 0);
    // Max possible deviation = 150 (one axis at 100, rest at 0)
    return Math.round(Math.max(0, (1 - totalDeviation / 150) * 100));
}

export type DiversityLevel = 'alta' | 'moderada_div' | 'definida';

export function getDiversityLevel(score: number): DiversityLevel {
    if (score >= 60) return 'alta';
    if (score >= 30) return 'moderada_div';
    return 'definida';
}

/* ── Motor type ────────────────────────────────────────────────────────────── */

export type MotorGroupType = 'Rápido' | 'Medio' | 'Lento' | 'Diverso';

export function getMotorGroupType(dist: MotorDistribution): MotorGroupType {
    if (dist.Rápido > 45) return 'Rápido';
    if (dist.Medio > 45) return 'Medio';
    if (dist.Lento > 45) return 'Lento';
    return 'Diverso';
}

/* ── Simulator: delta calculation ──────────────────────────────────────────── */

export interface SimulatorDelta {
    diversity: number;         // delta in diversity score
    axisDelta: AxisDistribution; // delta per axis percentage
}

export function simulateRemoval(
    currentMembers: MemberProfile[],
    removeSessionId: string,
): SimulatorDelta {
    const currentDist = calcAxisDistribution(currentMembers);
    const currentDiv = calcDiversity(currentDist);

    const newMembers = currentMembers.filter(m => m.session_id !== removeSessionId);
    const newDist = calcAxisDistribution(newMembers);
    const newDiv = calcDiversity(newDist);

    return {
        diversity: newDiv - currentDiv,
        axisDelta: {
            D: newDist.D - currentDist.D,
            I: newDist.I - currentDist.I,
            S: newDist.S - currentDist.S,
            C: newDist.C - currentDist.C,
        },
    };
}

export function simulateAddition(
    currentMembers: MemberProfile[],
    newMember: MemberProfile,
): SimulatorDelta {
    const currentDist = calcAxisDistribution(currentMembers);
    const currentDiv = calcDiversity(currentDist);

    const newMembers = [...currentMembers, newMember];
    const newDist = calcAxisDistribution(newMembers);
    const newDiv = calcDiversity(newDist);

    return {
        diversity: newDiv - currentDiv,
        axisDelta: {
            D: newDist.D - currentDist.D,
            I: newDist.I - currentDist.I,
            S: newDist.S - currentDist.S,
            C: newDist.C - currentDist.C,
        },
    };
}

/* ── Pair analysis ─────────────────────────────────────────────────────────── */

export interface PairResult {
    member1: MemberProfile;
    member2: MemberProfile;
    pairKey: string; // e.g. "D+I"
    type: 'complementaria' | 'afinidad';
}

/**
 * Generate notable pairs from the group.
 * - "complementaria": pairs with different dominant axes
 * - "afinidad": pairs with same dominant axis
 */
export function getNotablePairs(members: MemberProfile[], maxPerType: number = 3): {
    complementarias: PairResult[];
    afinidades: PairResult[];
} {
    const complementarias: PairResult[] = [];
    const afinidades: PairResult[] = [];

    for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
            const m1 = members[i];
            const m2 = members[j];
            const axes = [m1.eje, m2.eje].sort().join('+');

            if (m1.eje !== m2.eje) {
                complementarias.push({ member1: m1, member2: m2, pairKey: axes, type: 'complementaria' });
            } else {
                afinidades.push({ member1: m1, member2: m2, pairKey: axes, type: 'afinidad' });
            }
        }
    }

    // Prioritize most different axes for complementarias (D+S, D+C, I+C > D+I, I+S, S+C)
    const COMPLEMENT_PRIORITY: Record<string, number> = {
        'C+D': 3, 'D+S': 3, 'C+I': 3,
        'D+I': 2, 'I+S': 2, 'C+S': 2,
    };
    complementarias.sort((a, b) =>
        (COMPLEMENT_PRIORITY[b.pairKey] ?? 1) - (COMPLEMENT_PRIORITY[a.pairKey] ?? 1)
    );

    return {
        complementarias: complementarias.slice(0, maxPerType),
        afinidades: afinidades.slice(0, maxPerType),
    };
}
