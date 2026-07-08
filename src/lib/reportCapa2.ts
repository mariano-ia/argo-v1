// src/lib/reportCapa2.ts
// Capa 2 (variación por IA) — el NÚCLEO SEGURO. Toma el informe determinista de Capa 1 (fuente de verdad)
// y una "variante" reescrita por IA, y ARMA un candidato donde la IA SOLO cambia la PROSA. Lo estructural
// queda inmutable de Capa 1: arquetipo, ejes, contadores, el medidor, y las PALABRAS PUENTE/RUIDO curadas
// (su tono está calibrado; no se tocan). Esto acota la alucinación por construcción: la IA no puede cambiar
// la lectura DISC porque esos campos no salen de la IA. Encima corren 3 recaudos antes de aceptar la Capa 2:
//   1. DISTINCIÓN: debe leerse distinto a la Capa 1 (similitud de trigramas por debajo de un umbral).
//   2. HECHOS: todo número (contadores, "8 de 12") y el arquetipo de Capa 1 deben seguir presentes.
//   3. GATE: el pipeline corre el qualityGate completo sobre el candidato (prohibidas, determinista, veta,
//      placeholders, procedencia). Si algo falla en cualquiera de los 3 => sale la Capa 1 (fallback seguro).
// El resultado es un informe que se lee como OTRO documento pero sigue anclado al mismo perfil real.
// Diseño: docs/METODO-FALLBACK-INFORME.md (Capa 2) · Gate: reportQuality.ts · Pipeline: reportPipeline.ts

import type { ReportV4, ReportSection, ReportContext } from './reportV4';
import type { EvidenceFicha } from './evidenceFicha';

/** La variante que devuelve la IA: SOLO prosa, por sección. Campos ausentes/ vacíos => queda la Capa 1. */
export interface Capa2Variant {
  lead?: string;                                                   // reescritura del párrafo del encabezado
  sections?: Record<string, { cuerpo?: string; ejemplo?: string }>; // por id de sección de texto
  guia?: { lead?: string; antes?: string; durante?: string; despues?: string; ejemplo?: string };
  palabrasNota?: string;                                           // cierre de la sección "palabras" (opcional)
}

// Umbral de distinción: similitud (Jaccard de trigramas de palabras) MÁXIMA aceptable entre Capa 1 y Capa 2.
// Por encima => la reescritura no varió lo suficiente y se descarta (sale Capa 1). Bajar = exigir más variación.
const MAX_SIMILARITY = 0.55;

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const has = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;

/** Concatena toda la prosa visible del informe (para distinción + hechos). */
export function fullText(r: ReportV4): string {
  const parts: string[] = [r.hero.lead];
  for (const s of r.secciones) {
    if (s.bloque) parts.push(s.bloque.cuerpo, s.bloque.ejemplo ?? '');
    if (s.palabras) parts.push(...s.palabras.puente, ...s.palabras.ruido, s.palabras.nota);
    if (s.guia) parts.push(s.guia.lead, s.guia.antes, s.guia.durante, s.guia.despues, s.guia.ejemplo);
  }
  return parts.join('\n');
}

/** Trigramas de palabras (mismo criterio que el check de repetición del gate). */
function trigrams(text: string): Set<string> {
  const w = text.toLowerCase().replace(/[*.,;:()"¿?¡!]/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + 2 < w.length; i++) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
  return out;
}
export function textSimilarity(a: string, b: string): number {
  const A = trigrams(a), B = trigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Números presentes en un texto (contadores, "8 de 12", edades). Multiset por conteo mínimo. */
function numbersOf(text: string): string[] {
  return (text.match(/\d+/g) ?? []);
}

/**
 * ¿La Capa 2 preserva los HECHOS de la Capa 1? Verifica que (a) todo número de la Capa 1 siga presente en
 * la Capa 2 (contadores no alterados: "8 de 12" no puede volverse "7 de 12" ni desaparecer) y (b) el
 * arquetipo (label del hero) siga textual. Es un juez DETERMINISTA (sin segunda llamada de IA).
 */
export function factsPreserved(base: ReportV4, candidate: ReportV4): { ok: boolean; missing: string[] } {
  const baseText = fullText(base), candText = fullText(candidate);
  const missing: string[] = [];
  // (a) números: cada número de Capa 1 (con su multiplicidad) debe aparecer en Capa 2.
  const candNums = numbersOf(candText);
  const remaining = [...candNums];
  for (const n of numbersOf(baseText)) {
    const idx = remaining.indexOf(n);
    if (idx === -1) missing.push(`num:${n}`);
    else remaining.splice(idx, 1);
  }
  // (b) arquetipo: el label del hero es inmutable (viene de Capa 1), pero por si acaso lo re-chequeamos.
  if (base.hero.arquetipoLabel !== candidate.hero.arquetipoLabel) missing.push('arquetipoLabel');
  return { ok: missing.length === 0, missing };
}

/**
 * Arma el candidato de Capa 2: clona la Capa 1 y reemplaza SOLO la prosa que la variante trajo. Todo lo
 * demás (labels, meter, ejes, palabras puente/ruido) queda intacto. Devuelve el informe + los ids de las
 * secciones reescribibles que quedaron en Capa 1 (fallbackSectionIds, que alimenta la procedencia del gate:
 * si la IA reescribió poco, el gate lo retiene y sale la Capa 1).
 */
export function assembleCapa2(base: ReportV4, variant: Capa2Variant): { report: ReportV4; fallbackSectionIds: string[] } {
  const report = clone(base);
  const fallback: string[] = [];

  if (has(variant.lead)) report.hero.lead = variant.lead!.trim();
  // (si la IA no trajo lead, queda el de Capa 1: no lo contamos como fallback de sección)

  for (const s of report.secciones as ReportSection[]) {
    if (s.kind === 'texto' && s.bloque) {
      const v = variant.sections?.[s.id];
      let reworded = false;
      if (has(v?.cuerpo)) { s.bloque.cuerpo = v!.cuerpo!.trim(); reworded = true; }
      if (has(v?.ejemplo)) { s.bloque.ejemplo = v!.ejemplo!.trim(); }
      if (!reworded) fallback.push(s.id);
    } else if (s.kind === 'guia' && s.guia) {
      const g = variant.guia;
      let reworded = false;
      if (has(g?.lead)) { s.guia.lead = g!.lead!.trim(); }
      if (has(g?.antes)) { s.guia.antes = g!.antes!.trim(); reworded = true; }
      if (has(g?.durante)) { s.guia.durante = g!.durante!.trim(); reworded = true; }
      if (has(g?.despues)) { s.guia.despues = g!.despues!.trim(); reworded = true; }
      if (has(g?.ejemplo)) { s.guia.ejemplo = g!.ejemplo!.trim(); }
      if (!reworded) fallback.push(s.id);
    } else if (s.kind === 'palabras' && s.palabras) {
      // Las palabras puente/ruido NO se tocan (tono curado). Solo la nota, si vino.
      if (has(variant.palabrasNota)) s.palabras.nota = variant.palabrasNota!.trim();
      // no participa de fallbackSectionIds (no es objetivo de reescritura)
    }
  }
  return { report, fallbackSectionIds: fallback };
}

/** Motivo por el que un candidato de Capa 2 se descartó antes del gate del pipeline. */
export type Capa2Reject = 'sin_variante' | 'poco_distinto' | 'hechos_alterados';

export interface Capa2Options { maxSimilarity?: number; }

/**
 * Fábrica del hook `capa2` del pipeline. Devuelve una función (base, ficha, ctx) que arma el candidato y
 * aplica los recaudos DISTINCIÓN + HECHOS. Si algo no da, devuelve null y el pipeline queda con la Capa 1.
 * Si da, devuelve { report, fallbackSectionIds } y el pipeline lo pasa por el qualityGate completo.
 * `onReject` (opcional) permite telemetría del motivo.
 */
export function makeCapa2(
  variant: Capa2Variant | null | undefined,
  opts: Capa2Options = {},
  onReject?: (reason: Capa2Reject, detail?: string) => void,
) {
  const maxSim = opts.maxSimilarity ?? MAX_SIMILARITY;
  return (base: ReportV4, _ficha: EvidenceFicha, _ctx: ReportContext): { report: ReportV4; fallbackSectionIds: string[] } | null => {
    if (!variant || (!has(variant.lead) && !variant.sections && !variant.guia)) {
      onReject?.('sin_variante');
      return null;
    }
    const { report, fallbackSectionIds } = assembleCapa2(base, variant);

    // Recaudo 1 — DISTINCIÓN: debe leerse distinto a la Capa 1.
    const sim = textSimilarity(fullText(base), fullText(report));
    if (sim >= maxSim) { onReject?.('poco_distinto', sim.toFixed(2)); return null; }

    // Recaudo 2 — HECHOS: números + arquetipo preservados.
    const facts = factsPreserved(base, report);
    if (!facts.ok) { onReject?.('hechos_alterados', facts.missing.join(',')); return null; }

    // Recaudo 3 — el GATE completo lo corre el pipeline sobre `report` (prohibidas, determinista, veta,
    // placeholders, procedencia con fallbackSectionIds). Si falla, el pipeline cae a Capa 1.
    return { report, fallbackSectionIds };
  };
}
