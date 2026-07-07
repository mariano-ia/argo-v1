// src/lib/archetypeContentV4.ts
// ═══════════════════════════════════════════════════════════════════════════════
// BORRADOR de Fase 2B (contenido) — PARA REVISIÓN DEL OWNER (copy sensible).
// ADITIVO: no toca el ARCHETYPE_DATA viejo (12 eje×tempo). Cuando el copy quede
// aprobado, los consumidores (Fase 5/6) leen de acá en vez de ARCHETYPE_DATA.
//
// Arquitectura nueva (decisión #4): 4 bases por eje + veta (TENDENCIA_CONTENT, ya
// eje×eje) + motor como sección aparte. El `motorDesc` disposicional del esquema
// viejo ("ritmo naturalmente ágil/equilibrado/profundo") SALE y se reemplaza por
// MOTOR_INSIGHT_TEMPLATES (cronométrico, honesto, con "foto del momento" + margen).
//
// Qué falta para cerrar 2B (tras tu ok al copy de acá):
//   1. EJE_BASE completo: re-keyar los campos de personalidad (perfil, bienvenida,
//      combustible, corazón, guía, checklist, ecos, reseteo, palabras) desde las 4
//      variantes "Medio" del ARCHETYPE_DATA viejo, DEPURADAS de tempo. Abajo va
//      Impulsor como ejemplo trabajado; los otros 3 son el mismo procedimiento.
//   2. Auditar los 4 pares OPUESTOS de TENDENCIA_CONTENT (D_S, S_D, I_C, C_I): que
//      no digan "raro/en tensión/pero"; se narran como co-ocurrencia (spec §3.2).
//   3. Espejar EJE_BASE + MOTOR_INSIGHT_TEMPLATES en en/pt (acá van es + en/pt de lo NUEVO).
// ═══════════════════════════════════════════════════════════════════════════════

import type { Axis, MotorZona } from './evidenceFicha';

export type Lang = 'es' | 'en' | 'pt';

// ─── Veta labels (el 2º término del nombre) ──────────────────────────────────────
const AXIS_ARCHETYPE_LABEL: Record<Lang, Record<Axis, string>> = {
  es: { D: 'Impulsor', I: 'Conector', S: 'Sostenedor', C: 'Estratega' },
  en: { D: 'Driver', I: 'Connector', S: 'Sustainer', C: 'Strategist' },
  pt: { D: 'Impulsionador', I: 'Conector', S: 'Sustentador', C: 'Estrategista' },
};

/** "con veta Estratega" / "with a Strategist lean" / "com veta Estrategista". */
export function getVetaLabel(axis: Axis, lang: Lang): string {
  const label = AXIS_ARCHETYPE_LABEL[lang][axis];
  if (lang === 'en') return `with a ${label} lean`;
  if (lang === 'pt') return `com veta ${label}`;
  return `con veta ${label}`;
}

/** Nombre-blend completo (cuando la veta entra al nombre). */
export function getBlendName(primario: Axis, secundario: Axis, lang: Lang): string {
  return `${AXIS_ARCHETYPE_LABEL[lang][primario]} ${getVetaLabel(secundario, lang)}`;
}

// ─── "Su motor" — insight cronométrico per-child (reemplaza motorDesc disposicional) ──
// {nombre} lo reemplaza la capa de render. Con las normas semilla actuales, la zona es
// SIEMPRE 'intermedio' (no se afirma rápido/lento): la plantilla que se renderiza hoy es
// la de zona=null. lento/rapido quedan listas para cuando existan normas reales (§14.1).
type MotorTemplate = { intermedio: string; lento: string; rapido: string };

export const MOTOR_INSIGHT_TEMPLATES: Record<Lang, MotorTemplate> = {
  es: {
    intermedio: `En los juegos de ritmo, {nombre} respondió a un ritmo intermedio para su edad. Es una foto de este momento, no una etiqueta. Lo más útil es observarlo en la cancha, en distintos días, para conocer su ritmo real.`,
    lento: `En los juegos, {nombre} tendió a tomarse un poco más de tiempo antes de responder, comparado con el promedio de su edad. Tomarse ese tiempo no significa "menos capaz". Puede ser su forma de asegurarse, o simplemente parte de su maduración. Es una foto del momento, con un margen amplio.`,
    rapido: `En los juegos, {nombre} tendió a responder rápido, por encima del promedio de su edad. Responder rápido no es en sí mejor ni peor. Es su ritmo de hoy. Es una foto del momento, con un margen amplio.`,
  },
  en: {
    intermedio: `In the timed games, {nombre} responded at a middle pace for their age. This is a snapshot of the moment, not a label. The most useful thing is to watch it on the field, across different days, to learn their real pace.`,
    lento: `In the games, {nombre} tended to take a little more time before responding than the average for their age. Taking that time does not mean "less capable". It may be their way of making sure, or simply part of their development. A snapshot of the moment, with a wide margin.`,
    rapido: `In the games, {nombre} tended to respond quickly, above the average for their age. Responding quickly is not in itself better or worse. It is their pace today. A snapshot of the moment, with a wide margin.`,
  },
  pt: {
    intermedio: `Nos jogos de ritmo, {nombre} respondeu num ritmo intermediário para a idade. É uma foto deste momento, não um rótulo. O mais útil é observar na quadra, em dias diferentes, para conhecer o ritmo real.`,
    lento: `Nos jogos, {nombre} tendeu a levar um pouco mais de tempo antes de responder, comparado com a média da idade. Levar esse tempo não significa "menos capaz". Pode ser a forma de se assegurar, ou simplesmente parte do amadurecimento. Uma foto do momento, com margem ampla.`,
    rapido: `Nos jogos, {nombre} tendeu a responder rápido, acima da média da idade. Responder rápido não é em si melhor nem pior. É o ritmo de hoje. Uma foto do momento, com margem ampla.`,
  },
};

/** Devuelve la plantilla de "Su motor" según la zona (null => intermedio, la que rinde hoy). */
export function getMotorInsight(zona: MotorZona | null, lang: Lang): string {
  const t = MOTOR_INSIGHT_TEMPLATES[lang];
  if (zona === 'lento') return t.lento;
  if (zona === 'rapido') return t.rapido;
  return t.intermedio;
}

// ─── Pares de ejes OPUESTOS (no forman nombre; se narran en el cuerpo, spec §3.2) ──
// Estos 4 keys de TENDENCIA_CONTENT necesitan auditoría: co-ocurrencia sin "raro/pero".
export const OPPOSITE_TENDENCIA_KEYS = ['D_S', 'S_D', 'I_C', 'C_I'] as const;

// ─── 4 bases por eje (ejemplo: Impulsor). Los otros 3 = mismo procedimiento ──────
// El base es la personalidad del EJE, depurada de tempo (fuente: variante "Medio"
// del ARCHETYPE_DATA viejo). El motor ya NO vive acá (va a "Su motor"). Este es el
// contrato; el copy completo se completa tras tu ok.
export interface EjeBaseContent {
  eje: Axis;
  label: string;         // 'Impulsor' (primario puro; el blend lo arma getBlendName)
  perfil: string;        // 1-2 frases, sin tempo
  combustible: string;   // qué lo enciende
  // ... (bienvenida, corazon, palabrasPuente/Ruido, guia, checklist, reseteo, ecos):
  //     se re-keyan desde la variante "Medio", depuradas de tempo, en la completación de 2B.
}

export const EJE_BASE_DRAFT_ES: Partial<Record<Axis, EjeBaseContent>> = {
  // EJEMPLO TRABAJADO (Impulsor / D), depurado de tempo. Los otros 3 son idénticos en método.
  D: {
    eje: 'D',
    label: 'Impulsor',
    perfil: `El perfil de {nombre} se inclina hacia la acción y la iniciativa: tiende a ir al frente, a decidir y a poner el cuerpo en movimiento para que las cosas avancen.`,
    combustible: `A {nombre} suele encenderlo tener un objetivo claro y sentir que su empuje mueve la aguja. Reconocer el impacto de su iniciativa tiende a ser su mejor combustible.`,
  },
  // I, S, C: TODO — re-keyar de conector_relacional / sosten_confiable / estratega_analitico,
  //          depurados de tempo, en la completación de 2B (mismo procedimiento).
};
