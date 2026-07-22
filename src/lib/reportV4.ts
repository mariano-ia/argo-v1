// src/lib/reportV4.ts
// Capa 1 (determinista) del informe v4: arma cada sección a partir de la EvidenceFicha, en la VOZ APROBADA
// (owner 2026-07-07): párrafos desarrollados y cálidos con **negritas** de lectura + un ejemplo que baja a
// tierra, SIEMPRE por la positiva, firme sobre el DATO (el margen de votos) y presente/tendencia sobre la
// LECTURA (nunca rasgo permanente). El deporte NO aporta detalle propio: solo distingue equipo vs individual
// (afecta a "Cuánto lo mueve el grupo"). La Capa 2 (IA) reescribe este esqueleto sin inventar; si la IA cae,
// este texto ES el informe (fallback por construcción).
// i18n (2026-07-07): la LÓGICA (qué rama, counts, particiones) vive acá; el COPY (léxico + templates por
// idioma) vive en reportV4Copy.ts. Este módulo computa slots y llama fill(COPY[lang].xxx, slots). es =
// fuente de verdad (snapshot-guarded, reportV4.snapshot.test.ts); en/pt de las traducciones verificadas.
// Nombres: docs/archetype-naming.md · Cálculo: docs/METODO-CALCULO-NUEVO.md · i18n: docs/METODO-V4-EN-PT-INTEGRACION.md.

import type { EvidenceFicha, Axis, Registro, VotesEvidence, VetaBanda } from './evidenceFicha';
import { getMotorInsight, getVetaLabel, getArchetypeLabel, getBlendName, getEjeBase } from './archetypeContentV4';
import type { ReportBlock, Lang } from './archetypeContentV4';
import { COPY, fill, listaClara } from './reportV4Copy';
import type { CopyPack } from './reportV4Copy';
import type { ContextId, RecetaItem } from './dischSignals';

export type SportFrame = 'equipo' | 'individual';

/** Contexto de render del informe: quién es, el marco de deporte y el idioma. GÉNERO-NEUTRO por diseño
 *  (owner 2026-07-07: no se recolecta el género del niño; el copy no marca género). */
export interface ReportContext {
  nombre: string;
  frame: SportFrame;    // sportFrame(deporte) — default seguro 'individual'
  lang?: Lang;          // idioma del informe (default 'es'). El pipeline lo inyecta desde opts.lang.
}

export type { ReportBlock };

const langOf = (ctx: ReportContext): Lang => ctx.lang ?? 'es';
const packOf = (ctx: ReportContext): CopyPack => COPY[langOf(ctx)];

// Deportes de equipo => 'equipo'; el resto (individuales, duelo) => 'individual' (default seguro:
// el grupo con el que se comparte la actividad aplica a cualquier chico, un equipo de partido no).
const TEAM_SPORTS = new Set([
  'futbol', 'fútbol', 'football', 'soccer', 'basquet', 'básquet', 'basketball', 'baloncesto',
  'handball', 'handbol', 'balonmano', 'hockey', 'voley', 'vóley', 'voleibol', 'volleyball',
  'rugby', 'waterpolo', 'futsal', 'cestoball', 'softbol', 'beisbol', 'béisbol',
]);
export function sportFrame(deporte: string | null | undefined): SportFrame {
  if (!deporte) return 'individual';
  return TEAM_SPORTS.has(deporte.trim().toLowerCase()) ? 'equipo' : 'individual';
}

// ── Helpers puros (lang-agnósticos) ──────────────────────────────────────────
function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function inject(s: string, nombre: string): string {
  return s.replace(/\{nombre\}/g, nombre);
}
function injectBlock(b: ReportBlock, nombre: string): ReportBlock {
  return { cuerpo: inject(b.cuerpo, nombre), ...(b.ejemplo ? { ejemplo: inject(b.ejemplo, nombre) } : {}) };
}

// Cuantificador de proporción por conteo del eje (de 12): reemplaza el número absoluto ("N de 12")
// por una palabra ("casi todas / la mayoría / muchas / varias / algunas"). Owner 2026-07-21: abrir el
// algoritmo con cifras genera desconfianza en quien no lo domina; la palabra dice lo mismo por la positiva.
// Las bandas nunca chocan con el adjetivo del registro: por la aritmética de 12 respuestas, 'rotundo'
// (B≥6) ⟹ topCount≥8 y 'claro' (B≥4) ⟹ topCount≥6, así que la cita siempre cae en muchas/mayoría/casi todas.
function cuantasKey(count: number): string {
  if (count >= 10) return 'casi_todas';
  if (count >= 8) return 'mayoria';
  if (count >= 6) return 'muchas';
  if (count >= 4) return 'varias';
  return 'algunas';
}

// ── Encabezado ──────────────────────────────────────────────────────────────
const METER_LEVEL: Record<Registro, number> = { parejo: 1, matices: 2, claro: 3, rotundo: 4 };

export interface ReportHero {
  nombre: string;
  arquetipoLabel: string;        // "Impulsor con veta Estratega" (primario PURO si 2º=0 votos o veta opuesta §3.2)
  primarioLabel: string;
  vetaLabel: string | null;
  // Piezas para pintar el H1 con color por idioma: "con veta"/"with a"/"com veta" + arquetipo + sufijo
  // (en: "with a" + "Strategist" + "lean"; es/pt: prefijo + palabra, post vacío). null si no hay veta.
  veta: { pre: string; word: string; post: string } | null;
  ejePrimario: Axis;             // para colorear (AXIS_COLORS[ejePrimario])
  ejeSecundario: Axis;           // para colorear la veta
  vetaBanda: VetaBanda;          // fuerza de la veta ('sin'|'tentativa'|'afirmada'): dimensiona el orbe secundario del hero
  registro: Registro;
  meter: { level: number; labels: string[] };
  // "Su mezcla": los 4 ejes en orden D,I,S,C con su proporción (%) de las 12 respuestas. Redondeo por
  // resto mayor (Hamilton) para que los 4 sumen exactamente 100. Un eje con 0 votos queda en 0% (parte
  // del perfil). Alimenta el radar de orbes del render; NO expone el conteo absoluto ("N de 12").
  mezcla: { axis: Axis; pct: number }[];
  lead: string;                  // párrafo calibrado por registro (puede tener **negritas**)
}

/** Reparte los 4 ejes (D,I,S,C) en % de sus votos, con redondeo por resto mayor para que sumen 100. */
function computeMezcla(receta: RecetaItem[]): { axis: Axis; pct: number }[] {
  const order: Axis[] = ['D', 'I', 'S', 'C'];
  const counts = order.map((ax) => receta.find((r) => r.axis === ax)?.count ?? 0);
  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) return order.map((axis) => ({ axis, pct: 0 }));
  const raw = counts.map((c) => (c / total) * 100);
  const pcts = raw.map(Math.floor);
  const remainder = 100 - pcts.reduce((s, c) => s + c, 0);               // entero en {0,1,2,3}
  const byFrac = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) pcts[byFrac[k].i]++;
  return order.map((axis, i) => ({ axis, pct: pcts[i] }));
}

/** El párrafo de encabezado, con el tono según el registro. Firme sobre el número, presente sobre el chico. */
function leadParagraph(v: VotesEvidence, ctx: ReportContext): string {
  const pack = packOf(ctx);
  const n = ctx.nombre;
  const corta = pack.eje_word[v.ejePrimario].corta;
  const tail = pack.eje_lead[v.ejePrimario];
  // La cláusula de veta del lead se omite si la veta es OPUESTA (§3.2): el opuesto se narra en el
  // cuerpo (contingencia/receta), no como "veta" en el encabezado. En 'parejo' el lead usa dosCortas.
  const veta = (v.secondCount >= 1 && !v.vetaOpuesta)
    ? fill(pack.lead.veta_clause, { vetaLabel: pack.veta_word[v.ejeSecundario], largaSec: pack.eje_word[v.ejeSecundario].larga })
    : '';
  const dosCortas = listaClara([corta, pack.eje_word[v.ejeSecundario].corta], pack.bodies.receta_verbos.y, pack.bodies.receta_verbos.ytambien);
  const cuantas = pack.cuantas[cuantasKey(v.topCount)];
  return fill(pack.lead[v.registro], { n, corta, cuantas, veta, tail, dosCortas });
}

/** Arma el encabezado del informe desde la ficha. El nombre + veta van SIEMPRE. */
export function buildReportHero(ficha: EvidenceFicha, ctx: ReportContext): ReportHero {
  const lang = langOf(ctx);
  const pack = COPY[lang];
  const v = ficha.votes;
  // arquetipoLabel lang-aware: reproduce la regla de nombre del resolver. Muestra primario + veta salvo
  // (a) 2º eje con 0 votos o (b) veta OPUESTA (§3.2): en esos casos, primario PURO y el opuesto se narra
  // en el cuerpo. getBlendName es idéntico al label es del resolver (snapshot-guarded).
  const nameVeta = v.secondCount >= 1 && !v.vetaOpuesta;
  const arquetipoLabel = nameVeta
    ? getBlendName(v.ejePrimario, v.ejeSecundario, lang, v.vetaBanda)
    : getArchetypeLabel(v.ejePrimario, lang);
  const vetaLabel = nameVeta ? getVetaLabel(v.ejeSecundario, lang, v.vetaBanda) : null;
  // Descompone el vetaLabel en (prefijo, arquetipo, sufijo) para pintar cada parte con su color.
  let veta: ReportHero['veta'] = null;
  if (nameVeta) {
    const word = getArchetypeLabel(v.ejeSecundario, lang);
    const full = vetaLabel ?? word;
    const idx = full.indexOf(word);
    veta = idx >= 0
      ? { pre: full.slice(0, idx).trim(), word, post: full.slice(idx + word.length).trim() }
      : { pre: '', word: full, post: '' };
  }
  return {
    nombre: ctx.nombre,
    arquetipoLabel,
    primarioLabel: getArchetypeLabel(v.ejePrimario, lang),
    vetaLabel,
    veta,
    ejePrimario: v.ejePrimario,
    ejeSecundario: v.ejeSecundario,
    vetaBanda: v.vetaBanda,
    registro: v.registro,
    meter: { level: METER_LEVEL[v.registro], labels: pack.meter_labels },
    mezcla: computeMezcla(ficha.signals.receta),
    lead: leadParagraph(v, ctx),
  };
}

// ── Secciones data-driven (usan las señales DISC de la ficha) ─────────────────

/** "Su mezcla" (receta): el orden completo de sus 4 ejes, por la positiva. Es un hecho, siempre presente. */
export function buildRecetaSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock {
  const pack = packOf(ctx);
  const b = pack.bodies;
  const rv = b.receta_verbos;
  const n = ctx.nombre;
  const r = ficha.signals.receta;
  const corta = (it: RecetaItem) => pack.eje_word[it.axis].corta;
  const p = r[0];
  const presentes = r.slice(1).filter((x) => x.presencia === 'presente');
  const suaves = r.slice(1).filter((x) => x.presencia === 'apenas' || x.presencia === 'ausente');
  let cuerpo = fill(b.receta_base, { n, corta: corta(p), cuantas: pack.cuantas[cuantasKey(p.count)] });
  if (presentes.length) {
    const verbo2 = presentes.length > 1 ? rv.aparecen : rv.aparece;
    const suman = presentes.length > 1 ? rv.suman : rv.suma;
    const lista = listaClara(presentes.map((it) => `**${corta(it)}**`), rv.y, rv.ytambien);
    cuerpo += fill(b.receta_presentes, { verbo2, lista, suman });
  }
  if (suaves.length) {
    const verbo = suaves.length > 1 ? rv.pesan : rv.pesa;
    const listaCap = capitalizar(listaClara(suaves.map(corta), rv.y, rv.ytambien));
    cuerpo += fill(b.receta_suaves, { listaCap, verbo });
  }
  return { cuerpo, ejemplo: fill(b.receta_ejemplo, { n, rec: pack.receta_ejemplo[p.axis] }) };
}

/** "Cómo cambia según la situación" (contingencia): SOLO patrones robustos; si no hay, se omite (null). */
export function buildContingenciaSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock | null {
  const pack = packOf(ctx);
  const b = pack.bodies;
  const n = ctx.nombre;
  const { patrones } = ficha.signals.contingencia;
  if (patrones.length === 0) return null;
  const conducta = (axis: Axis) => pack.eje_word[axis].larga;
  const cw = (c: ContextId) => pack.context_word[c] ?? '';
  const desvios = patrones.filter((pp) => pp.esDesvio);
  const norma = patrones.filter((pp) => !pp.esDesvio);
  if (desvios.length > 0) {
    const d = desvios[0];
    return {
      cuerpo: fill(b.conting_desvio, { n, conductaPrim: conducta(ficha.votes.ejePrimario), ctxDesvio: cw(d.context), conductaDesvio: conducta(d.axis) }),
      ejemplo: b.conting_desvio_ej,
    };
  }
  const ctxs = norma.map((pp) => cw(pp.context)).filter(Boolean);
  return {
    cuerpo: fill(b.conting_norma, { n, ctxs: ctxs.join('; '), conductaPrim: conducta(ficha.votes.ejePrimario) }),
    ejemplo: fill(b.conting_norma_ej, { n }),
  };
}

/** "Su patrón de decisión" (ritmo): el acople de ritmo (si es robusto) o la consistencia. Por la positiva. */
export function buildPatronSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock {
  const pack = packOf(ctx);
  const b = pack.bodies;
  const n = ctx.nombre;
  const r = ficha.signals.ritmoAcople;
  if (!r) {
    return { cuerpo: fill(b.patron_null, { n }), ejemplo: fill(b.patron_null_ej, { n }) };
  }
  const q = r.direccion === 'primario_rapido' ? b.patron_rapido : b.patron_lento;
  return { cuerpo: fill(b.patron_acople, { n, q }), ejemplo: b.patron_acople_ej };
}

/** "Su motor": el insight cronométrico (bloque). Devuelve null si no es narratable (falta un juego). */
export function buildMotorSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock | null {
  if (!ficha.motor.narratable) return null;
  return injectBlock(getMotorInsight(ficha.motor.tempoZona, langOf(ctx)), ctx.nombre);
}

/** "Ante la tormenta": las 3 escenas de adversidad (Q5-7). Calibrado 3/3, 2/3, disperso; game-anchored, positiva. */
export function buildTormentaSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock {
  const pack = packOf(ctx);
  const b = pack.bodies;
  const n = ctx.nombre;
  const axes = [5, 6, 7]
    .map((k) => ficha.respuestas.find((r) => r.number === k)?.axis)
    .filter((a): a is Axis => !!a);
  const conducta = (ax: Axis) => pack.eje_word[ax].larga;
  if (axes.length < 2) {
    return { cuerpo: fill(b.tormenta_insuf, { n }) };
  }
  const counts: Partial<Record<Axis, number>> = {};
  axes.forEach((a) => { counts[a] = (counts[a] ?? 0) + 1; });
  const ranked = (Object.entries(counts) as [Axis, number][]).sort((a, b) => b[1] - a[1]);
  const [top, ntop] = ranked[0];
  let cuerpo: string;
  if (ntop === axes.length) {
    cuerpo = fill(b.tormenta_firme, { n, top: conducta(top) });
  } else if (ntop === 2 && axes.length === 3) {
    const otra = axes.find((a) => a !== top)!;
    cuerpo = fill(b.tormenta_dos, { n, top: conducta(top), otra: conducta(otra) });
  } else {
    cuerpo = fill(b.tormenta_disperso, { n });
  }
  return { cuerpo, ejemplo: pack.storm_ejemplo[top] };
}

/** "Cuánto lo mueve el grupo": FRAME-AWARE (equipo vs individual). I y S por separado, en positivo. */
export function buildGrupoSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock {
  const pack = packOf(ctx);
  const b = pack.bodies;
  const gw = b.grupo_words;
  const gp = b.grupo_partes;
  const n = ctx.nombre;
  const { I, S } = ficha.votes.vector;
  const indiv = ctx.frame === 'individual';
  if (I <= 1 && S <= 1) {
    const intro = indiv ? b.grupo_intro_indiv : '';
    const costado = indiv ? gw.costado_indiv : gw.costado_equipo;
    const rol = indiv ? gw.rol_indiv : gw.rol_equipo;
    const ejEscena = indiv ? gw.esc_indiv : gw.esc_equipo;
    return {
      cuerpo: fill(b.grupo_low, { intro, n, costado, rol }),
      ejemplo: fill(b.grupo_low_ej, { n, ejEscena }),
    };
  }
  const partes: string[] = [];
  if (I >= 2) partes.push(I >= 4 ? gp.i_fuerte : gp.i_algo);
  if (S >= 2) partes.push(S >= 4 ? gp.s_fuerte : gp.s_algo);
  const partesStr = partes.length === 2 ? `${partes[0]}${b.grupo_join}${partes[1]}` : (partes[0] ?? b.grupo_fallback);
  const conQuien = indiv ? gw.conquien_indiv : gw.conquien_equipo;
  return {
    cuerpo: fill(b.grupo_present, { n, conQuien, partes: partesStr }),
    ejemplo: fill(b.grupo_present_ej, { n }),
  };
}

/** "Cuando le sale bien": anclado en el PERFIL (medido) + la escena de la meta (Q12) como ejemplo. */
export function buildLogroSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock {
  const pack = packOf(ctx);
  const b = pack.bodies;
  const n = ctx.nombre;
  const prim = ficha.votes.ejePrimario;
  const q12 = ficha.respuestas.find((r) => r.number === 12)?.axis;
  const ej = q12 ? fill(b.logro_ej_clause, { metaChoice: pack.meta_choice[q12] }) : '';
  return {
    cuerpo: fill(b.logro, { n, anchor: pack.success_anchor[prim], ej }),
    ejemplo: fill(b.logro_ejemplo, { n }),
  };
}

/** "Cuando le sale mal": espejo de logro. Anclado en el eje primario (siempre presente), SIEMPRE por la
 *  positiva y con compasión: nombra suave el tropiezo, lee la reacción como algo con su valor y da el
 *  acompañamiento. Contenido DISC (panel de expertos, es fuente de verdad, revisado contra el guard). */
export function buildMalSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock {
  const pack = packOf(ctx);
  const b = pack.bodies;
  const n = ctx.nombre;
  const prim = ficha.votes.ejePrimario;
  return {
    cuerpo: fill(b.mal, { n, anchor: pack.mal_anchor[prim], acompanar: pack.mal_acompanar[prim] }),
    ejemplo: fill(pack.mal_ejemplo[prim], { n }),
  };
}

// ── Secciones de CONTENIDO por eje (leen el sustrato aprobado; null si el eje aún no tiene voz) ──
export interface PalabrasSection { puente: string[]; ruido: string[]; nota: string; }
export interface GuiaSection { lead: string; antes: string; durante: string; despues: string; ejemplo: string; }

/** "Qué lo motiva" (combustible del eje). null si el eje aún no está redactado en ese idioma. */
export function buildCombustibleSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock | null {
  const c = getEjeBase(ficha.votes.ejePrimario, langOf(ctx));
  return c ? injectBlock(c.combustible, ctx.nombre) : null;
}

/** "Palabras que conectan (y las que hacen ruido)". null si el eje aún no está redactado. */
export function buildPalabrasSection(ficha: EvidenceFicha, ctx: ReportContext): PalabrasSection | null {
  const c = getEjeBase(ficha.votes.ejePrimario, langOf(ctx));
  if (!c) return null;
  return {
    puente: c.palabrasPuente.map((s) => inject(s, ctx.nombre)),
    ruido: c.palabrasRuido.map((s) => inject(s, ctx.nombre)),
    nota: inject(c.palabrasNota, ctx.nombre),
  };
}

/** "Antes, durante y después": guía concreta para acompañar. null si el eje aún no está redactado. */
export function buildGuiaSection(ficha: EvidenceFicha, ctx: ReportContext): GuiaSection | null {
  const c = getEjeBase(ficha.votes.ejePrimario, langOf(ctx));
  if (!c) return null;
  const inj = (s: string) => inject(s, ctx.nombre);
  return { lead: inj(c.guia.lead), antes: inj(c.guia.antes), durante: inj(c.guia.durante), despues: inj(c.guia.despues), ejemplo: inj(c.guia.ejemplo) };
}

/** "Un reset que funciona": qué ayuda cuando se frustra. null si el eje aún no está redactado. */
export function buildResetSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock | null {
  const c = getEjeBase(ficha.votes.ejePrimario, langOf(ctx));
  return c ? injectBlock(c.reset, ctx.nombre) : null;
}

/** "Más allá del deporte" (ecos): cómo asoma este motor en el día a día. null si el eje aún no está redactado. */
export function buildEcosSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock | null {
  const c = getEjeBase(ficha.votes.ejePrimario, langOf(ctx));
  return c ? injectBlock(c.ecos, ctx.nombre) : null;
}

// ── Ensamblador: hero + secciones (omitiendo null), con trazabilidad de omisiones ──
export type ReportSectionKind = 'texto' | 'palabras' | 'guia';
export interface ReportSection {
  id: string;
  titulo: string;
  kind: ReportSectionKind;
  bloque?: ReportBlock;        // kind 'texto'
  palabras?: PalabrasSection;  // kind 'palabras'
  guia?: GuiaSection;          // kind 'guia'
  // Marcador de espectro (0..1) para el render: hairline con un mini-orbe que respira. Sale de la señal
  // REAL de la sección (motor: tempoZona; patrón: si hay acople de ritmo), así el marcador nunca
  // contradice el texto. Opcional: informes v4 viejos (sin este campo) simplemente no lo pintan.
  spectrum?: { pos: number };
}
export interface ReportV4 {
  lang: Lang;                  // idioma en el que se armó (para que el render use el mismo COPY)
  hero: ReportHero;
  secciones: ReportSection[];
  omitidas: { id: string; motivo: 'sin_datos' | 'sin_contenido' }[];
}

/**
 * Arma el informe v4 completo desde la ficha (Capa 1 determinista). Este objeto ES el fallback:
 * si la Capa 2 (IA) no está o falla, se renderiza tal cual. Cada sección se omite (no se inventa)
 * cuando no hay dato robusto (contingencia/motor) o el eje no tiene voz aprobada (secciones de contenido).
 */
export function buildReportV4(ficha: EvidenceFicha, ctx: ReportContext): ReportV4 {
  const st = packOf(ctx).section_titles;
  const hero = buildReportHero(ficha, ctx);
  const secciones: ReportSection[] = [];
  const omitidas: ReportV4['omitidas'] = [];
  const texto = (id: string, b: ReportBlock | null, motivo: 'sin_datos' | 'sin_contenido' = 'sin_datos') => {
    if (b) secciones.push({ id, titulo: st[id], kind: 'texto', bloque: b });
    else omitidas.push({ id, motivo });
  };

  // 1. Quién es hoy.
  texto('receta', buildRecetaSection(ficha, ctx));
  texto('contingencia', buildContingenciaSection(ficha, ctx));
  texto('patron', buildPatronSection(ficha, ctx));
  texto('motor', buildMotorSection(ficha, ctx));
  // 2. Cómo se le ve en la actividad.
  texto('tormenta', buildTormentaSection(ficha, ctx));
  texto('grupo', buildGrupoSection(ficha, ctx));
  texto('logro', buildLogroSection(ficha, ctx));
  texto('mal', buildMalSection(ficha, ctx));
  // 3. Cómo acompañarlo (contenido de eje).
  texto('combustible', buildCombustibleSection(ficha, ctx), 'sin_contenido');
  const palabras = buildPalabrasSection(ficha, ctx);
  if (palabras) secciones.push({ id: 'palabras', titulo: st.palabras, kind: 'palabras', palabras });
  else omitidas.push({ id: 'palabras', motivo: 'sin_contenido' });
  const guia = buildGuiaSection(ficha, ctx);
  if (guia) secciones.push({ id: 'guia', titulo: st.guia, kind: 'guia', guia });
  else omitidas.push({ id: 'guia', motivo: 'sin_contenido' });
  texto('reset', buildResetSection(ficha, ctx), 'sin_contenido');
  // 4. Más allá del deporte.
  texto('ecos', buildEcosSection(ficha, ctx), 'sin_contenido');

  // Marcadores de espectro (render): posición REAL de la señal de cada sección, así el mini-orbe nunca
  // contradice el texto. Motor: tempoZona (lento/intermedio/rápido). Patrón: si hay acople de ritmo,
  // decidió en ritmos diversos; si no, parejo. Solo se adjuntan si la sección existe.
  const MOTOR_POS: Record<'lento' | 'intermedio' | 'rapido', number> = { lento: 0.18, intermedio: 0.5, rapido: 0.82 };
  const motorPos = ficha.motor.tempoZona ? MOTOR_POS[ficha.motor.tempoZona] : 0.5;
  const patronPos = ficha.signals.ritmoAcople ? 0.74 : 0.26;
  for (const s of secciones) {
    if (s.id === 'motor') s.spectrum = { pos: motorPos };
    if (s.id === 'patron') s.spectrum = { pos: patronPos };
  }

  return { lang: langOf(ctx), hero, secciones, omitidas };
}
