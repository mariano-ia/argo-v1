// src/lib/reportV4.ts
// Capa 1 (determinista) del informe v4: arma cada sección del informe a partir de la EvidenceFicha,
// aplicando la CALIBRACIÓN DE VALOR (owner 2026-07-07): SIEMPRE perfil + veta; el tono escala con el
// margen de votos (rotundo/claro/matices/parejo); firme sobre el DATO, presente/tendencia sobre la
// LECTURA (nunca rasgo permanente). La Capa 2 (IA) reescribe este esqueleto sin inventar; si la IA
// cae, este texto determinista ES el informe (fallback por construcción). Empezamos por el encabezado.
// Nombres: docs/archetype-naming.md · Cálculo: docs/METODO-CALCULO-NUEVO.md · Voz validada: informe de Mateo.

import type { EvidenceFicha, Axis, Registro, VotesEvidence } from './evidenceFicha';
import { getMotorInsight, getVetaLabel } from './archetypeContentV4';
import type { ContextId, RecetaItem } from './dischSignals';

// Label del arquetipo del eje (es). en/pt: capa de i18n del render (después).
const AXIS_ARQ_ES: Record<Axis, string> = { D: 'Impulsor', I: 'Conector', S: 'Sostenedor', C: 'Estratega' };

// Palabras de cada eje para el copy (es). `corta` = el color; `larga` = la conducta.
const EJE_WORD_ES: Record<Axis, { corta: string; larga: string }> = {
  D: { corta: 'la acción', larga: 'avanzar y decidir' },
  I: { corta: 'el vínculo con los demás', larga: 'conectar y entusiasmar al grupo' },
  S: { corta: 'el sostén del equipo', larga: 'cuidar al equipo y sostener la calma' },
  C: { corta: 'el detalle y el plan', larga: 'mirar el plan antes de actuar' },
};

const METER_LABELS = ['Parejo', 'Con matices', 'Claro', 'De lleno'];
const METER_LEVEL: Record<Registro, number> = { parejo: 1, matices: 2, claro: 3, rotundo: 4 };

export interface ReportHero {
  nombre: string;
  arquetipoLabel: string;        // "Impulsor con veta Estratega" (SIEMPRE presente)
  primarioLabel: string;         // "Impulsor" (para colorear el título)
  vetaLabel: string | null;      // "con veta Estratega" (para colorear); null si el 2º tuvo 0 votos
  registro: Registro;
  meter: { level: number; labels: string[] };  // el gráfico de confianza (1-4)
  lead: string;                  // el párrafo calibrado, firme sobre el dato + presente sobre la lectura
}

/** El párrafo de encabezado, con el tono según el registro. Firme sobre el número, presente sobre el chico. */
function leadParagraph(v: VotesEvidence, nombre: string): string {
  const p = EJE_WORD_ES[v.ejePrimario];
  const conVeta = v.secondCount >= 1
    ? ` Y detrás de eso asoma algo de ${AXIS_ARQ_ES[v.ejeSecundario].toLowerCase()}: en varias escenas eligió ${EJE_WORD_ES[v.ejeSecundario].larga}.`
    : '';
  switch (v.registro) {
    case 'rotundo':
      return `El juego de ${nombre} se apoya de lleno en ${p.corta}: la eligió en ${v.topCount} de sus 12 momentos.${conVeta} Hoy, su forma de jugar se mueve por ahí.`;
    case 'claro':
      return `El juego de ${nombre} se define con claridad por ${p.corta}: apareció en ${v.topCount} de sus 12 elecciones.${conVeta} Hoy, su forma de jugar se apoya en ${p.larga}.`;
    case 'matices':
      return `El perfil de ${nombre} se inclina hacia ${p.corta}, con una presencia clara de su segundo color.${conVeta} Hoy tiende a moverse por ahí, sin que sea su única nota.`;
    case 'parejo':
    default:
      return `${nombre} juega hoy con dos motores bien parejos: ${p.corta} y ${EJE_WORD_ES[v.ejeSecundario].corta}. No es indefinición: dispone de dos registros y tiende a elegir según lo que pide el momento.`;
  }
}

/** Arma el encabezado del informe desde la ficha. El nombre + veta van SIEMPRE. */
export function buildReportHero(ficha: EvidenceFicha, nombre: string): ReportHero {
  const v = ficha.votes;
  return {
    nombre,
    arquetipoLabel: v.arquetipoLabel,
    primarioLabel: AXIS_ARQ_ES[v.ejePrimario],
    vetaLabel: v.secondCount >= 1 ? getVetaLabel(v.ejeSecundario, 'es') : null,
    registro: v.registro,
    meter: { level: METER_LEVEL[v.registro], labels: METER_LABELS },
    lead: leadParagraph(v, nombre),
  };
}

/** Sección "Su motor". Devuelve null si no es narratable (falta un juego) => el render la omite. */
export function buildMotorSection(ficha: EvidenceFicha, nombre: string): string | null {
  if (!ficha.motor.narratable) return null;
  return getMotorInsight(ficha.motor.tempoZona, 'es').replace(/\{nombre\}/g, nombre);
}

// ── Secciones INDIVIDUALES (usan las señales DISC de la ficha) ──
const CONTEXT_WORD_ES: Record<ContextId, string> = {
  inicio: 'al arrancar algo nuevo', adversidad: 'cuando la cosa se complica',
  esfuerzo: 'cuando hay que sostener el esfuerzo',
  disfrute: '', decision: '', espera: '', equipo: '', meta: '',
};
function listaEs(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/** "Su mezcla" (receta): el orden completo de sus 4 ejes, intra-individual. Es un hecho, siempre presente. */
export function buildRecetaSection(ficha: EvidenceFicha, nombre: string): string {
  const r = ficha.signals.receta;
  const corta = (it: RecetaItem) => EJE_WORD_ES[it.axis].corta;
  const p = r[0];
  const presentes = r.slice(1).filter((x) => x.presencia === 'presente');
  const apenas = r.slice(1).filter((x) => x.presencia === 'apenas');
  const ausentes = r.slice(1).filter((x) => x.presencia === 'ausente');
  let s = `Lo que más mueve a ${nombre} es ${corta(p)}: la eligió en ${p.count} de sus 12 elecciones.`;
  if (presentes.length) s += ` Después aparece ${listaEs(presentes.map(corta))}.`;
  if (apenas.length) s += ` Apenas asoma ${listaEs(apenas.map(corta))}.`;
  if (ausentes.length) s += ` Y casi no aparece ${listaEs(ausentes.map(corta))}: en el juego casi no lo eligió (eso no dice nada de su capacidad para eso).`;
  return s;
}

/** "Cómo cambia según la situación" (contingencia): SOLO patrones robustos; si no hay, se omite (null). */
export function buildContingenciaSection(ficha: EvidenceFicha, nombre: string): string | null {
  const { patrones } = ficha.signals.contingencia;
  if (patrones.length === 0) return null; // nada robusto que afirmar => se omite
  const conducta = (axis: Axis) => EJE_WORD_ES[axis].larga;
  const ctx = (c: ContextId) => CONTEXT_WORD_ES[c];
  const desvios = patrones.filter((pp) => pp.esDesvio);
  const norma = patrones.filter((pp) => !pp.esDesvio);
  if (desvios.length > 0) {
    const d = desvios[0];
    const base = norma.length
      ? `${nombre} tiende a ${conducta(ficha.votes.ejePrimario)} en buena parte del juego`
      : `${nombre} suele ${conducta(ficha.votes.ejePrimario)}`;
    return `${base}, pero ${ctx(d.context)} cambia de registro: ahí eligió ${conducta(d.axis)}. Ese contraste es suyo: no aplica siempre la misma receta, lee lo que pide cada momento.`;
  }
  const ctxs = norma.map((pp) => ctx(pp.context)).filter(Boolean);
  return `En distintos momentos del juego (${ctxs.join('; ')}), ${nombre} sostuvo lo mismo: ${conducta(ficha.votes.ejePrimario)}. Es una señal de consistencia en cómo encara las situaciones.`;
}
