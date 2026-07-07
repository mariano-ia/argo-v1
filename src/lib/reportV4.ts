// src/lib/reportV4.ts
// Capa 1 (determinista) del informe v4: arma cada sección a partir de la EvidenceFicha, en la VOZ APROBADA
// (owner 2026-07-07): párrafos desarrollados y cálidos con **negritas** de lectura + un ejemplo que baja a
// tierra, SIEMPRE por la positiva, firme sobre el DATO (el margen de votos) y presente/tendencia sobre la
// LECTURA (nunca rasgo permanente). El deporte NO aporta detalle propio: solo distingue equipo vs individual
// (afecta a "Cuánto lo mueve el grupo"). La Capa 2 (IA) reescribe este esqueleto sin inventar; si la IA cae,
// este texto ES el informe (fallback por construcción).
// Nombres: docs/archetype-naming.md · Cálculo: docs/METODO-CALCULO-NUEVO.md · Voz validada: maqueta equipo/individual.

import type { EvidenceFicha, Axis, Registro, VotesEvidence } from './evidenceFicha';
import { getMotorInsight, getVetaLabel, getEjeBase } from './archetypeContentV4';
import type { ReportBlock } from './archetypeContentV4';
import type { ContextId, RecetaItem } from './dischSignals';

export type SportFrame = 'equipo' | 'individual';

/** Contexto de render del informe: quién es y el marco de deporte. GÉNERO-NEUTRO por diseño
 *  (owner 2026-07-07: no se recolecta el género del niño; el copy no marca género). */
export interface ReportContext {
  nombre: string;
  frame: SportFrame;    // sportFrame(deporte) — default seguro 'individual'
}

export type { ReportBlock };

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

// ── Léxico por eje (es). en/pt: capa de i18n del render (después). ──
const AXIS_ARQ_ES: Record<Axis, string> = { D: 'Impulsor', I: 'Conector', S: 'Sostenedor', C: 'Estratega' };
const EJE_WORD_ES: Record<Axis, { corta: string; larga: string }> = {
  D: { corta: 'la acción', larga: 'avanzar y decidir' },
  I: { corta: 'el vínculo con los demás', larga: 'conectar y entusiasmar al grupo' },
  S: { corta: 'el sostén del grupo', larga: 'cuidar al grupo y sostener la calma' },
  C: { corta: 'el detalle y el plan', larga: 'mirar el plan antes de actuar' },
};
const EJE_LEAD_ES: Record<Axis, string> = {
  D: 'avanzar, decidir y hacer que las cosas se muevan',
  I: 'conectar, entusiasmar y sumar a los demás',
  S: 'cuidar el clima del grupo y sostener a quienes lo rodean',
  C: 'observar, entender y armar un plan antes de actuar',
};
const RECETA_EJEMPLO_ES: Record<Axis, string> = {
  D: 'preguntarse primero "qué hago" antes que "con quién lo hago"',
  I: 'fijarse primero en "con quién lo hago" y en cómo está el grupo',
  S: 'asegurarse de que todos estén bien antes de arrancar',
  C: 'querer entender "cómo conviene hacerlo" antes de lanzarse',
};
const STORM_EJEMPLO_ES: Record<Axis, string> = {
  D: 'Ante un imprevisto, es probable que se mueva rápido para resolverlo cuanto antes.',
  I: 'Ante un imprevisto, es probable que busque apoyarse en los demás para salir adelante.',
  S: 'Ante un imprevisto, es probable que priorice mantener la calma del grupo.',
  C: 'Ante un imprevisto, es probable que primero busque entender qué pasa y recién después se mueva.',
};
const SUCCESS_ANCHOR_ES: Record<Axis, string> = {
  D: 'suele encenderse enseguida hacia **el próximo objetivo**: disfruta avanzando más que deteniéndose a saborear lo conseguido',
  I: 'suele querer **compartir y celebrar el logro con los demás**: lo vive más pleno cuando lo festeja en grupo',
  S: 'suele alegrarse sobre todo de que **al equipo le vaya bien**, más que del mérito propio',
  C: 'suele querer **repasar cómo lo logró** para entenderlo y hacerlo todavía mejor',
};
const META_CHOICE_ES: Record<Axis, string> = {
  D: 'mirar ya hacia el próximo reto',
  I: 'compartir la alegría con los compañeros',
  S: 'asegurarse de que todo el equipo estuviera bien',
  C: 'repasar cómo había llegado hasta ahí',
};
const CONTEXT_WORD_ES: Record<ContextId, string> = {
  inicio: 'al arrancar algo nuevo', adversidad: 'cuando la cosa se complica',
  esfuerzo: 'cuando hay que sostener el esfuerzo',
  disfrute: '', decision: '', espera: '', equipo: '', meta: '',
};

/** Une una lista en español evitando el choque de "y" cuando un ítem ya contiene " y " (ej. "el detalle y el plan"). */
function listaClara(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  const sep = items.some((it) => / y /.test(it)) ? ' y también ' : ' y ';
  return `${items.slice(0, -1).join(', ')}${sep}${items[items.length - 1]}`;
}
function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function inject(s: string, nombre: string): string {
  return s.replace(/\{nombre\}/g, nombre);
}
function injectBlock(b: ReportBlock, nombre: string): ReportBlock {
  return { cuerpo: inject(b.cuerpo, nombre), ...(b.ejemplo ? { ejemplo: inject(b.ejemplo, nombre) } : {}) };
}

// ── Encabezado ──────────────────────────────────────────────────────────────
const METER_LABELS = ['Parejo', 'Con matices', 'Claro', 'De lleno'];
const METER_LEVEL: Record<Registro, number> = { parejo: 1, matices: 2, claro: 3, rotundo: 4 };

export interface ReportHero {
  nombre: string;
  arquetipoLabel: string;        // "Impulsor con veta Estratega" (SIEMPRE presente)
  primarioLabel: string;
  vetaLabel: string | null;
  ejePrimario: Axis;             // para colorear (AXIS_COLORS[ejePrimario])
  ejeSecundario: Axis;           // para colorear la veta
  registro: Registro;
  meter: { level: number; labels: string[] };
  lead: string;                  // párrafo calibrado por registro (puede tener **negritas**)
}

/** El párrafo de encabezado, con el tono según el registro. Firme sobre el número, presente sobre el chico. */
function leadParagraph(v: VotesEvidence, ctx: ReportContext): string {
  const n = ctx.nombre;
  const p = EJE_WORD_ES[v.ejePrimario];
  const tail = EJE_LEAD_ES[v.ejePrimario];
  const veta = v.secondCount >= 1
    ? ` Y detrás de ese empuje asoma una **veta ${AXIS_ARQ_ES[v.ejeSecundario].toLowerCase()}**: en varias escenas también eligió ${EJE_WORD_ES[v.ejeSecundario].larga}.`
    : '';
  switch (v.registro) {
    case 'rotundo':
      return `El juego de ${n} se apoya **de lleno en ${p.corta}**: la eligió en ${v.topCount} de sus 12 decisiones, una señal muy marcada.${veta} Hoy, su manera de estar en la actividad pasa claramente por ahí: ${tail}.`;
    case 'claro':
      return `El juego de ${n} se apoya **con claridad en ${p.corta}**: fue lo que eligió en ${v.topCount} de sus 12 decisiones.${veta} Hoy, su manera de estar en la actividad pasa por ahí: ${tail}.`;
    case 'matices':
      return `El juego de ${n} se inclina hacia **${p.corta}**, con una presencia clara de su segundo color.${veta} Hoy tiende a moverse por ahí, sin que sea su única nota: ${tail}.`;
    case 'parejo':
    default:
      return `${n} juega hoy con **dos motores bien parejos**: ${listaClara([p.corta, EJE_WORD_ES[v.ejeSecundario].corta])}. No es indefinición, al contrario: dispone de dos registros y tiende a elegir según lo que pide cada momento.`;
  }
}

/** Arma el encabezado del informe desde la ficha. El nombre + veta van SIEMPRE. */
export function buildReportHero(ficha: EvidenceFicha, ctx: ReportContext): ReportHero {
  const v = ficha.votes;
  return {
    nombre: ctx.nombre,
    arquetipoLabel: v.arquetipoLabel,
    primarioLabel: AXIS_ARQ_ES[v.ejePrimario],
    vetaLabel: v.secondCount >= 1 ? getVetaLabel(v.ejeSecundario, 'es') : null,
    ejePrimario: v.ejePrimario,
    ejeSecundario: v.ejeSecundario,
    registro: v.registro,
    meter: { level: METER_LEVEL[v.registro], labels: METER_LABELS },
    lead: leadParagraph(v, ctx),
  };
}

// ── Secciones data-driven (usan las señales DISC de la ficha) ─────────────────

/** "Su mezcla" (receta): el orden completo de sus 4 ejes, por la positiva. Es un hecho, siempre presente. */
export function buildRecetaSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock {
  const n = ctx.nombre;
  const r = ficha.signals.receta;
  const corta = (it: RecetaItem) => EJE_WORD_ES[it.axis].corta;
  const p = r[0];
  const presentes = r.slice(1).filter((x) => x.presencia === 'presente');
  const suaves = r.slice(1).filter((x) => x.presencia === 'apenas' || x.presencia === 'ausente');
  let cuerpo = `En Argo, cada perfil mezcla a su manera los cuatro colores del modelo, y en el de ${n} se destaca un ingrediente: **${corta(p)}**, que eligió en ${p.count} de sus 12 decisiones.`;
  if (presentes.length) {
    const verbo2 = presentes.length > 1 ? 'aparecen' : 'aparece';
    const suman = presentes.length > 1 ? 'suman' : 'suma';
    cuerpo += ` Muy cerca ${verbo2} ${listaClara(presentes.map((it) => `**${corta(it)}**`))}, que le ${suman} matices a su forma de jugar.`;
  }
  if (suaves.length) {
    const verbo = suaves.length > 1 ? 'pesan' : 'pesa';
    cuerpo += ` ${capitalizar(listaClara(suaves.map(corta)))}, en cambio, hoy ${verbo} menos en cómo decide: son colores que también tiene disponibles y que irán tomando su lugar con el tiempo.`;
  }
  return { cuerpo, ejemplo: `Ante una misma situación, ${n} tiende a ${RECETA_EJEMPLO_ES[p.axis]}.` };
}

/** "Cómo cambia según la situación" (contingencia): SOLO patrones robustos; si no hay, se omite (null). */
export function buildContingenciaSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock | null {
  const n = ctx.nombre;
  const { patrones } = ficha.signals.contingencia;
  if (patrones.length === 0) return null;
  const conducta = (axis: Axis) => EJE_WORD_ES[axis].larga;
  const cw = (c: ContextId) => CONTEXT_WORD_ES[c];
  const desvios = patrones.filter((pp) => pp.esDesvio);
  const norma = patrones.filter((pp) => !pp.esDesvio);
  if (desvios.length > 0) {
    const d = desvios[0];
    return {
      cuerpo: `Una de las cosas más lindas de su perfil es que **juega distinto según el momento y lee lo que pide cada situación**. La mayor parte del tiempo, ${n} tiende a ${conducta(ficha.votes.ejePrimario)}. Y ${cw(d.context)}, cambia de registro: ahí se inclina por **${conducta(d.axis)}**. Ese contraste es genuinamente suyo, y habla de alguien que ajusta su manera según lo que tiene delante.`,
      ejemplo: `En un momento tranquilo se lanza sin dudar; en uno más complicado es capaz de frenar un segundo para pensar la mejor salida.`,
    };
  }
  const ctxs = norma.map((pp) => cw(pp.context)).filter(Boolean);
  return {
    cuerpo: `Algo lindo del perfil de ${n} es su **consistencia**: en distintos momentos del juego (${ctxs.join('; ')}) sostuvo la misma manera de encarar, ${conducta(ficha.votes.ejePrimario)}. Cuando algo le funciona, tiende a confiar en su recurso.`,
    ejemplo: `Aunque cambie la situación, es probable que ${n} mantenga su forma de resolver antes que cambiarla de golpe.`,
  };
}

/** "Su patrón de decisión" (ritmo): el acople de ritmo (si es robusto) o la consistencia. Por la positiva. */
export function buildPatronSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock {
  const n = ctx.nombre;
  const r = ficha.signals.ritmoAcople;
  if (!r) {
    return {
      cuerpo: `A lo largo del juego, ${n} **decidió a un ritmo bastante parejo**: sostuvo su compromiso de principio a fin, sin arrancar dudando ni aflojar sobre el final. Es una linda señal de consistencia en cómo se involucra con cada elección.`,
      ejemplo: `Cuando algo le importa, ${n} tiende a mantener la misma dedicación del primer al último momento.`,
    };
  }
  const q = r.direccion === 'primario_rapido'
    ? `resolvió más rápido justo en las elecciones que van con su motor principal`
    : `se dio un poco más de tiempo justo en las elecciones que van con su motor principal`;
  return {
    cuerpo: `A lo largo del juego, ${n} **decidió en ritmos diversos**: ${q}, y ajustó el tiempo en las demás. Ese acople entre lo que elige y cuánto tarda es una huella muy personal, y cuenta algo lindo: **cuando algo le entusiasma de verdad, responde con soltura**.`,
    ejemplo: `Frente a una decisión que le entusiasma, casi no la piensa; frente a una fuera de su terreno, se da su tiempo.`,
  };
}

/** "Su motor": el insight cronométrico (bloque). Devuelve null si no es narratable (falta un juego). */
export function buildMotorSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock | null {
  if (!ficha.motor.narratable) return null;
  return injectBlock(getMotorInsight(ficha.motor.tempoZona, 'es'), ctx.nombre);
}

/** "Ante la tormenta": las 3 escenas de adversidad (Q5-7). Calibrado 3/3, 2/3, disperso; game-anchored, positiva. */
export function buildTormentaSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock {
  const n = ctx.nombre;
  const axes = [5, 6, 7]
    .map((k) => ficha.respuestas.find((r) => r.number === k)?.axis)
    .filter((a): a is Axis => !!a);
  const conducta = (ax: Axis) => EJE_WORD_ES[ax].larga;
  if (axes.length < 2) {
    return { cuerpo: `En las escenas de tormenta del juego no reunimos suficientes elecciones de ${n} para leer una tendencia clara. Es simplemente una parte del juego con menos datos, nada más.` };
  }
  const counts: Partial<Record<Axis, number>> = {};
  axes.forEach((a) => { counts[a] = (counts[a] ?? 0) + 1; });
  const ranked = (Object.entries(counts) as [Axis, number][]).sort((a, b) => b[1] - a[1]);
  const [top, ntop] = ranked[0];
  let cuerpo: string;
  if (ntop === axes.length) {
    cuerpo = `Cuando las cosas se complican, ${n} mostró una **tendencia clara**: en las escenas de tormenta se inclinó una y otra vez por **${conducta(top)}**. En un momento adverso, es probable que ese sea su primer recurso, y es muy valioso saberlo de antemano.`;
  } else if (ntop === 2 && axes.length === 3) {
    const otra = axes.find((a) => a !== top)!;
    cuerpo = `Cuando las cosas se complican, ${n} mostró una preferencia: en dos de las tres escenas de tormenta se inclinó por **${conducta(top)}**, y en la tercera por ${conducta(otra)}. Asoma una tendencia hacia **${conducta(top)}** cuando aprieta, sin que sea su única salida. Es una señal valiosa, porque significa que **bajo presión tiene más de un recurso**.`;
  } else {
    cuerpo = `Cuando las cosas se complican, ${n} **leyó cada escena por separado**: en la tormenta no repitió una sola respuesta, sino que ajustó a lo que cada momento parecía pedir. Hoy tiende a responder a lo adverso con flexibilidad, más que con una reacción fija, y eso también es un recurso.`;
  }
  return { cuerpo, ejemplo: STORM_EJEMPLO_ES[top] };
}

/** "Cuánto lo mueve el grupo": FRAME-AWARE (equipo vs individual). I y S por separado, en positivo. */
export function buildGrupoSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock {
  const n = ctx.nombre;
  const { I, S } = ficha.votes.vector;
  const indiv = ctx.frame === 'individual';
  if (I <= 1 && S <= 1) {
    const intro = indiv ? `En un deporte individual, el "equipo" es sobre todo **el grupo con el que comparte la actividad**. ` : '';
    const costado = indiv ? 'ese costado social' : 'el vínculo con el equipo';
    const rol = indiv ? 'se note dentro del grupo' : 'tenga impacto en el equipo';
    const ejEscena = indiv ? 'marcar el ritmo de un momento compartido de la actividad' : 'liderar el arranque de una jugada compartida';
    return {
      cuerpo: `${intro}Entre los motores de ${n}, ${costado} hoy **aparece más en segundo plano**, y es simplemente parte de su receta de este momento: no dice nada de su vida social ni de sus amistades. Su manera de sumar al grupo pasa hoy **más por el hacer que por lo emocional**, y cuando su aporte se nota, el vínculo suele venir después. Una linda forma de acercar a ${n} es **darle un rol donde su empuje ${rol}**.`,
      ejemplo: `Invitar a ${n} a ${ejEscena} acerca a ${n} al grupo desde su fortaleza, sin empujar a un lugar que hoy no es el suyo.`,
    };
  }
  const partes: string[] = [];
  if (I >= 2) partes.push(I >= 4 ? 'un **empuje fuerte por involucrar y entusiasmar** a los demás' : 'algo de gusto por involucrar a los demás');
  if (S >= 2) partes.push(S >= 4 ? 'una **clara necesidad de que el grupo esté en armonía**' : 'algo de cuidado por que el grupo esté bien');
  const cuerpoPartes = partes.length === 2 ? `${partes[0]}; y, por otro lado, ${partes[1]}` : (partes[0] ?? 'el grupo aparece de a ratos');
  const conQuien = indiv ? 'su grupo' : 'el equipo';
  return {
    cuerpo: `En la relación de ${n} con ${conQuien} aparece ${cuerpoPartes}. Son motores sociales distintos (involucrar no es lo mismo que sostener), y saber cuál pesa más ayuda a acompañar a ${n} desde donde de verdad se siente a gusto.`,
    ejemplo: `Darle lugar a ese costado social, en la medida en que le nace, suele hacer que ${n} se sienta parte.`,
  };
}

/** "Cuando le sale bien": anclado en el PERFIL (medido) + la escena de la meta (Q12) como ejemplo. */
export function buildLogroSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock {
  const n = ctx.nombre;
  const prim = ficha.votes.ejePrimario;
  const q12 = ficha.respuestas.find((r) => r.number === 12)?.axis;
  const ej = q12 ? ` En el juego se vio con claridad, porque al llegar a la meta eligió **${META_CHOICE_ES[q12]}**.` : '';
  return {
    cuerpo: `Cuando a ${n} le sale algo, ${SUCCESS_ANCHOR_ES[prim]}.${ej} Lo vive así, y está muy bien. Acompañar a ${n} es ayudarle a también **registrar y celebrar lo logrado** antes de volver a arrancar.`,
    ejemplo: `Después de un buen resultado, un simple "mira todo lo que conseguiste" ayuda a ${n} a que el disfrute también tenga su lugar.`,
  };
}

// ── Secciones de CONTENIDO por eje (leen el sustrato aprobado; null si el eje aún no tiene voz) ──
export interface PalabrasSection { puente: string[]; ruido: string[]; nota: string; }
export interface GuiaSection { lead: string; antes: string; durante: string; despues: string; ejemplo: string; }

/** "Qué lo enciende" (combustible del eje). null si el eje aún no está redactado en es. */
export function buildCombustibleSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock | null {
  const c = getEjeBase(ficha.votes.ejePrimario, 'es');
  return c ? injectBlock(c.combustible, ctx.nombre) : null;
}

/** "Palabras que conectan (y las que hacen ruido)". null si el eje aún no está redactado. */
export function buildPalabrasSection(ficha: EvidenceFicha, ctx: ReportContext): PalabrasSection | null {
  const c = getEjeBase(ficha.votes.ejePrimario, 'es');
  if (!c) return null;
  return {
    puente: c.palabrasPuente.map((s) => inject(s, ctx.nombre)),
    ruido: c.palabrasRuido.map((s) => inject(s, ctx.nombre)),
    nota: inject(c.palabrasNota, ctx.nombre),
  };
}

/** "Antes, durante y después": guía concreta para acompañar. null si el eje aún no está redactado. */
export function buildGuiaSection(ficha: EvidenceFicha, ctx: ReportContext): GuiaSection | null {
  const c = getEjeBase(ficha.votes.ejePrimario, 'es');
  if (!c) return null;
  const inj = (s: string) => inject(s, ctx.nombre);
  return { lead: inj(c.guia.lead), antes: inj(c.guia.antes), durante: inj(c.guia.durante), despues: inj(c.guia.despues), ejemplo: inj(c.guia.ejemplo) };
}

/** "Un reset que funciona": qué ayuda cuando se frustra. null si el eje aún no está redactado. */
export function buildResetSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock | null {
  const c = getEjeBase(ficha.votes.ejePrimario, 'es');
  return c ? injectBlock(c.reset, ctx.nombre) : null;
}

/** "Más allá del deporte" (ecos): cómo asoma este motor en el día a día. null si el eje aún no está redactado. */
export function buildEcosSection(ficha: EvidenceFicha, ctx: ReportContext): ReportBlock | null {
  const c = getEjeBase(ficha.votes.ejePrimario, 'es');
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
}
export interface ReportV4 {
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
  const hero = buildReportHero(ficha, ctx);
  const secciones: ReportSection[] = [];
  const omitidas: ReportV4['omitidas'] = [];
  const texto = (id: string, titulo: string, b: ReportBlock | null, motivo: 'sin_datos' | 'sin_contenido' = 'sin_datos') => {
    if (b) secciones.push({ id, titulo, kind: 'texto', bloque: b });
    else omitidas.push({ id, motivo });
  };

  // 1. Quién es hoy.
  texto('receta', 'Su mezcla', buildRecetaSection(ficha, ctx));
  texto('contingencia', 'Cómo cambia según la situación', buildContingenciaSection(ficha, ctx));
  texto('patron', 'Su patrón de decisión', buildPatronSection(ficha, ctx));
  texto('motor', 'Su motor', buildMotorSection(ficha, ctx));
  // 2. Cómo se le ve en la actividad.
  texto('tormenta', 'Ante la tormenta', buildTormentaSection(ficha, ctx));
  texto('grupo', 'Cuánto lo mueve el grupo', buildGrupoSection(ficha, ctx));
  texto('logro', 'Cuando le sale bien', buildLogroSection(ficha, ctx));
  // 3. Cómo acompañarlo (contenido de eje).
  texto('combustible', 'Qué lo enciende', buildCombustibleSection(ficha, ctx), 'sin_contenido');
  const palabras = buildPalabrasSection(ficha, ctx);
  if (palabras) secciones.push({ id: 'palabras', titulo: 'Palabras que conectan (y las que hacen ruido)', kind: 'palabras', palabras });
  else omitidas.push({ id: 'palabras', motivo: 'sin_contenido' });
  const guia = buildGuiaSection(ficha, ctx);
  if (guia) secciones.push({ id: 'guia', titulo: 'Antes, durante y después', kind: 'guia', guia });
  else omitidas.push({ id: 'guia', motivo: 'sin_contenido' });
  texto('reset', 'Un reset que funciona', buildResetSection(ficha, ctx), 'sin_contenido');
  // 4. Más allá del deporte.
  texto('ecos', 'Más allá del deporte', buildEcosSection(ficha, ctx), 'sin_contenido');

  return { hero, secciones, omitidas };
}
