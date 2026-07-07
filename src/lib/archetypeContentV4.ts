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

/** Un bloque de informe (voz aprobada 2026-07-07): un párrafo desarrollado y cálido con **negritas**
 *  que marcan niveles de lectura, más un ejemplo que baja a tierra. El render interpreta `**...**`. */
export interface ReportBlock {
  cuerpo: string;      // puede contener marcadores **negrita** y {nombre}
  ejemplo?: string;    // la bajada a tierra (el bloque con borde) — sin rótulo
}

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
// {nombre} lo reemplaza la capa de render. La zona sale del score ajustado por edad (§2.3).
// Principios (reformulado 2026-07-07 con feedback del owner): (1) nombra los desafíos
// concretos (reacción y decisión); (2) la cancha es donde el ritmo SE APLICA y se reconoce,
// no donde "recién ahí sirve"; (3) afirma con valor y lenguaje probabilístico ("tiende a"),
// con UNA salvedad de presente, sin ahogar el insight en disclaimers.
type MotorTemplate = { intermedio: ReportBlock; lento: ReportBlock; rapido: ReportBlock };

// Voz aprobada 2026-07-07: sin deporte puntual (marco "la actividad"), género-neutro (usa {nombre}),
// desarrollado + negritas + ejemplo. es está en la voz nueva; en/pt quedan en la voz previa (sin ejemplo)
// hasta el espejo de i18n de Fase 2B.
export const MOTOR_INSIGHT_TEMPLATES: Record<Lang, MotorTemplate> = {
  es: {
    rapido: {
      cuerpo: `En los mini-juegos de reacción y decisión, {nombre} se movió con un **ritmo ágil**: tiende a leer rápido y a confiar en su primer impulso. Suele **arrancar las acciones y resolver con soltura cuando hay que decidir en el momento**. Acompañar a {nombre} es darle lugar para esa velocidad y, de a poco, ofrecerle oportunidades para descubrir cuándo vale la pena tomarse un segundo más.`,
      ejemplo: `Si algo hay que empezar, {nombre} suele estar entre los primeros en arrancar. Sumarle la pregunta "¿y si miro un segundo antes?" ayuda a {nombre} a crecer sin apagar su impulso.`,
    },
    intermedio: {
      cuerpo: `En los mini-juegos de reacción y decisión, {nombre} mostró un **ritmo equilibrado**: tiende a acomodar su tiempo a lo que pide cada momento, sin apurarse ni demorarse. Suele ser **flexible con los tempos**, y ese es un recurso muy valioso. Acompañar a {nombre} es ayudar a reconocer cuándo su juego pide velocidad y cuándo pide una pausa.`,
      ejemplo: `Frente a una decisión, {nombre} puede acelerar si hace falta o tomarse un momento si conviene: esa lectura del tempo es una fortaleza.`,
    },
    lento: {
      cuerpo: `En los mini-juegos de reacción y decisión, {nombre} se movió con un **ritmo medido**: tiende a tomarse un momento para leer la escena antes de moverse. Suele **elegir con criterio, sin apurarse**. Acompañar a {nombre} es valorar esa lectura (sin pedirle que se apure solo por apurarse) y darle confianza para sostener su tiempo cuando la situación lo permite.`,
      ejemplo: `Antes de responder, {nombre} suele mirar un segundo la situación: ese "primero entiendo, después voy" es parte de su fortaleza.`,
    },
  },
  en: {
    rapido: { cuerpo: `In the reaction and decision mini-games, {nombre} played at a quick pace: they tend to read fast and trust their first impulse. Supporting {nombre} well means giving room for that speed, and gradually adding moments to choose when it pays to take an extra second.` },
    intermedio: { cuerpo: `In the reaction and decision mini-games, {nombre} showed a balanced pace: they tend to adjust their timing to what each moment asks, without rushing or lagging. Supporting {nombre} well means helping them recognize when their game calls for speed and when it calls for a pause.` },
    lento: { cuerpo: `In the reaction and decision mini-games, {nombre} played at a measured pace: they tend to take a moment to read the scene before moving. Supporting {nombre} well means valuing that read (without asking them to hurry for its own sake) and giving confidence to hold their timing when the situation allows.` },
  },
  pt: {
    rapido: { cuerpo: `Nos mini-jogos de reação e decisão, {nombre} moveu-se num ritmo ágil: tende a ler rápido e a confiar no primeiro impulso. Acompanhar {nombre} é dar espaço para essa velocidade e, aos poucos, somar momentos para escolher quando vale a pena levar um segundo a mais.` },
    intermedio: { cuerpo: `Nos mini-jogos de reação e decisão, {nombre} mostrou um ritmo equilibrado: tende a ajustar o seu tempo ao que cada momento pede, sem se apressar nem se atrasar. Acompanhar {nombre} é ajudar a reconhecer quando o jogo pede velocidade e quando pede uma pausa.` },
    lento: { cuerpo: `Nos mini-jogos de reação e decisão, {nombre} moveu-se num ritmo comedido: tende a levar um momento para ler a cena antes de se mover. Acompanhar {nombre} é valorizar essa leitura (sem pedir que se apresse à toa) e dar confiança para sustentar o seu tempo quando a situação permite.` },
  },
};

/** Devuelve el bloque de "Su motor" según la zona (null => intermedio como fallback). */
export function getMotorInsight(zona: MotorZona | null, lang: Lang): ReportBlock {
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
  label: string;             // 'Impulsor' (primario puro; el blend lo arma getBlendName)
  combustible: ReportBlock;  // "Qué lo enciende"
  palabrasPuente: string[];  // frases del adulto que conectan con este motor
  palabrasRuido: string[];   // frases que suelen apagar/friccionar este motor
  palabrasNota: string;      // cierre de la sección palabras (tono, no guion)
  guia: { lead: string; antes: string; durante: string; despues: string; ejemplo: string }; // acompañar antes/durante/después
  reset: ReportBlock;        // qué ayuda cuando se frustra o se desborda
  ecos: ReportBlock;         // cómo asoma este motor más allá del deporte
}

// Voz aprobada 2026-07-07: desarrollado + **negritas** + ejemplo + por la positiva, sin deporte puntual,
// género-neutro (usa {nombre} en vez de clíticos). El marco equipo/individual lo aplica reportV4 (solo "grupo").
export const EJE_BASE_DRAFT_ES: Partial<Record<Axis, EjeBaseContent>> = {
  // EJE APROBADO (Impulsor / D). Los otros 3 ejes siguen el mismo molde (Fase 2B, workflow autoral).
  D: {
    eje: 'D',
    label: 'Impulsor',
    combustible: {
      cuerpo: `Lo que más suele encender a {nombre} es **tener un objetivo claro y sentir que su empuje mueve las cosas**. Cuando percibe que su iniciativa deja una marca concreta, se prende de verdad, y reconocer ese impacto es muchas veces su mejor combustible.`,
      ejemplo: `Un "gracias a que arrancaste, esto salió" probablemente motive a {nombre} mucho más que un elogio general.`,
    },
    palabrasPuente: [
      `Arranca tú con esto.`,
      `¿Qué propones para resolverlo?`,
      `Hoy marcas tú el ritmo.`,
      `Muéstrame cómo lo harías.`,
    ],
    palabrasRuido: [
      `Espera, todavía no te toca.`,
      `Hazlo tal cual te digo.`,
      `Mejor quédate al margen y observa.`,
    ],
    palabrasNota: `No es un guion, es una brújula de tono: a {nombre} suele **llegarle más lo que reconoce su iniciativa**, y hacerle ruido lo que frena su impulso sin explicarle por qué. Con eso en mente, las palabras exactas las pones tú.`,
    guia: {
      lead: `Tres momentos donde una pequeña intención cambia mucho.`,
      antes: `Ofrécele un objetivo concreto y un espacio para tomar la iniciativa. Saber que va a poder **arrancar algo suyo** enfoca y entusiasma a {nombre}.`,
      durante: `Si se acelera de más, en lugar de frenarlo, **canaliza su empuje**: reconoce las ganas y súmale una lectura rápida antes de ir. Se trata de sumar, no de apagar.`,
      despues: `Reconoce lo que **puso en movimiento**, no solo el resultado. A un perfil de acción suele llegarle más un "lograste que todo arrancara" que un elogio general.`,
      ejemplo: `Si el sábado hay una actividad nueva, contarle "vas a poder empezar tú" transforma los nervios en ganas.`,
    },
    reset: {
      cuerpo: `Cuando se frustra, a {nombre} le cuesta quedarse a la espera, y eso es muy entendible en un perfil de acción. Lo que **más suele ayudar es una acción pequeña y concreta** para hacer en el momento: una tarea clara, un objetivo corto, algo que devuelva la sensación de estar avanzando.`,
      ejemplo: `En vez de "tranquilízate", un "ocúpate de esto un minuto" suele reencauzar la situación mucho mejor.`,
    },
    ecos: {
      cuerpo: `Este empuje por avanzar **no vive solo en el deporte**. Suele asomar cuando {nombre} organiza un juego, propone planes o quiere resolver algo ya. Verlo en esos momentos ayuda a entender que no es impaciencia: es **su manera de estar en el mundo**.`,
      ejemplo: `Si en casa es de los primeros en decir "dale, hagamos esto", estás viendo el mismo motor que mueve a {nombre} en la actividad.`,
    },
  },
  // I, S, C: TODO — mismo molde en la voz aprobada (Fase 2B, workflow autoral + audit anti-fabricación).
};

/** Devuelve el contenido base del eje si está redactado y aprobado en ese idioma; si no, null
 *  (el render omite la sección: degradación por construcción, no inventa). en/pt: pendientes. */
export function getEjeBase(axis: Axis, lang: Lang): EjeBaseContent | null {
  if (lang !== 'es') return null; // en/pt: pendientes de redacción + revisión de voz
  return EJE_BASE_DRAFT_ES[axis] ?? null;
}
