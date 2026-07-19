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

import type { Axis, MotorZona, VetaBanda } from './evidenceFicha';
import { EJE_BASE_EN, EJE_BASE_PT, MOTOR_EN, MOTOR_PT } from './reportEjeContentI18n';

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

/** El label de arquetipo del eje ("Impulsor" / "Driver" / "Impulsionador"), por idioma. */
export function getArchetypeLabel(axis: Axis, lang: Lang): string {
  return AXIS_ARCHETYPE_LABEL[lang][axis];
}

/**
 * Conector de la veta GRADUADO por su fuerza (B2), owner D2 (2026-07-08): en los blends NO opuestos
 * el conector carga la confianza. afirmada (B2≥4) = "con veta"; tentativa (B2 2-3) = "con tonos de";
 * sin (B2≤1) = "con destellos de". Ej: "Conector con destellos de Impulsor". La veta OPUESTA (D↔S,
 * I↔C) NO se nombra (owner 2026-07-13, §3.2): el llamador (buildReportHero / buildVotesEvidence) no
 * invoca esta función en ese caso y el opuesto se narra en el cuerpo.
 */
export function getVetaLabel(axis: Axis, lang: Lang, banda: VetaBanda = 'afirmada'): string {
  const label = AXIS_ARCHETYPE_LABEL[lang][axis];
  if (lang === 'en') {
    if (banda === 'tentativa') return `with ${label} tones`;
    if (banda === 'sin') return `with a hint of ${label}`;
    return `with a ${label} lean`;
  }
  if (lang === 'pt') {
    if (banda === 'tentativa') return `com tons de ${label}`;
    if (banda === 'sin') return `com um toque de ${label}`;
    return `com veta ${label}`;
  }
  if (banda === 'tentativa') return `con tonos de ${label}`;
  if (banda === 'sin') return `con destellos de ${label}`;
  return `con veta ${label}`;
}

/** Nombre-blend completo (siempre compuesto), con el conector graduado por la banda de la veta. */
export function getBlendName(primario: Axis, secundario: Axis, lang: Lang, banda: VetaBanda = 'afirmada'): string {
  return `${AXIS_ARCHETYPE_LABEL[lang][primario]} ${getVetaLabel(secundario, lang, banda)}`;
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
  // en/pt en la VOZ NUEVA (con ejemplo), generados desde bodies.motor (reportEjeContentI18n).
  en: MOTOR_EN,
  pt: MOTOR_PT,
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
      durante: `Si se acelera de más, en lugar de frenar el envión, **canaliza su empuje**: reconoce las ganas y súmale una lectura rápida antes de ir. Se trata de sumar, no de apagar.`,
      despues: `Reconoce lo que **pone en movimiento**, no solo el resultado. A un perfil de acción suele llegarle más un "lograste que todo arrancara" que un elogio general.`,
      ejemplo: `Si el sábado hay una actividad nueva, contarle "vas a poder empezar tú" transforma los nervios en ganas.`,
    },
    reset: {
      cuerpo: `Cuando se frustra, a {nombre} suele costarle quedarse a la espera, y eso es muy entendible en un perfil de acción. Lo que **más suele ayudar es una acción pequeña y concreta** para hacer en el momento: una tarea clara, un objetivo corto, algo que devuelva la sensación de estar avanzando.`,
      ejemplo: `En vez de "tranquilízate", un "ocúpate de esto un minuto" suele reencauzar la situación mucho mejor.`,
    },
    ecos: {
      cuerpo: `Este empuje por avanzar **no vive solo en el deporte**. Suele asomar cuando {nombre} organiza un juego, propone planes o quiere resolver algo ya. Verlo en esos momentos ayuda a entender que no es impaciencia: es **su manera de estar en el mundo**.`,
      ejemplo: `Si en casa es de los primeros en decir "dale, hagamos esto", estás viendo el mismo motor que mueve a {nombre} en la actividad.`,
    },
  },
  // CONECTOR (I): lo social, el entusiasmo, el vínculo.
  I: {
    eje: 'I',
    label: 'Conector',
    combustible: {
      cuerpo: `Lo que más suele encender a {nombre} es **sentirse parte y poder contagiar su entusiasmo a los demás**. Cuando el clima es bueno y hay con quién compartir, se prende de verdad. Sentir que su energía suma al grupo es muchas veces su mejor combustible.`,
      ejemplo: `Un "se nota cuando estás, contagias las ganas" probablemente llegue a {nombre} más que un elogio a solas.`,
    },
    palabrasPuente: [
      `Cuéntale al grupo lo que se te ocurre.`,
      `Tú puedes levantar el ánimo de todos.`,
      `¿A quién sumamos para esto?`,
      `Me encanta tu energía, contágiala.`,
    ],
    palabrasRuido: [
      `Ahora no es momento de hablar.`,
      `Trabaja en silencio, por tu cuenta.`,
      `Deja de dispersar al grupo.`,
    ],
    palabrasNota: `No es un guion, es una brújula de tono: a {nombre} suele **llegarle más lo que celebra su forma de conectar**, y hacerle ruido lo que apaga su chispa o corta el vínculo. Con eso en mente, las palabras exactas las pones tú.`,
    guia: {
      lead: `Tres momentos donde una pequeña intención cambia mucho.`,
      antes: `Dale un espacio donde su entusiasmo tenga lugar y a alguien con quien compartirlo. Saber que va a poder **sumar a los demás** enfoca y entusiasma a {nombre}.`,
      durante: `Si la energía se dispersa, en lugar de pedirle silencio, **canaliza su chispa**: dale un rol donde su entusiasmo empuje al grupo hacia la tarea.`,
      despues: `Reconoce **cuando suma al ánimo del grupo**, no solo el resultado. A un perfil conector suele llegarle más un "contagiaste las ganas de todos" que un elogio general.`,
      ejemplo: `Si el sábado hay una actividad nueva, contarle "vas a conocer un montón de gente" transforma los nervios en ganas.`,
    },
    reset: {
      cuerpo: `Cuando se frustra, a {nombre} suele pesarle sentirse a un lado, y lo que necesita es reconectar. Lo que **más suele ayudar es un momento de vínculo**: escuchar a {nombre}, nombrar lo que siente y recordarle que no está en esto en soledad. Con el clima recompuesto, suele volver a encenderse.`,
      ejemplo: `En vez de "resuélvelo solo", un "vamos a verlo juntos" suele reencauzar la situación mucho mejor.`,
    },
    ecos: {
      cuerpo: `Esta forma de conectar **no vive solo en el deporte**. Suele asomar cuando {nombre} junta a los amigos, anima una salida o se pone a charlar con quien tenga cerca. Verlo en esos momentos ayuda a entender que no es "hablar de más": es **su manera de estar en el mundo**.`,
      ejemplo: `Si en casa es quien propone planes con amigos y organiza la salida, estás viendo el mismo motor que mueve a {nombre} en la actividad.`,
    },
  },
  // SOSTENEDOR (S): la estabilidad, la armonía, el apoyo confiable.
  S: {
    eje: 'S',
    label: 'Sostenedor',
    combustible: {
      cuerpo: `Lo que más suele encender a {nombre} es **sentir que el grupo está bien y poder ser un apoyo confiable**. Un clima tranquilo, sin sobresaltos, y saber que los demás cuentan con su apoyo, hacen sentir a {nombre} en su lugar. Sentirse de confianza es muchas veces su mejor combustible.`,
      ejemplo: `Un "sé que puedo contar contigo" probablemente llegue a {nombre} más que un elogio ruidoso.`,
    },
    palabrasPuente: [
      `Cuento contigo para esto.`,
      `Gracias por sostener al grupo.`,
      `Tómate el tiempo que necesites.`,
      `Tu calma le hace bien a todos.`,
    ],
    palabrasRuido: [
      `Vamos, apúrate, no hay tiempo.`,
      `Cambiamos todo sobre la marcha.`,
      `Si no te gusta, arréglatelas.`,
    ],
    palabrasNota: `No es un guion, es una brújula de tono: a {nombre} suele **llegarle más lo que valora su constancia y su calma**, y hacerle ruido el apuro o los cambios bruscos sin aviso. Con eso en mente, las palabras exactas las pones tú.`,
    guia: {
      lead: `Tres momentos donde una pequeña intención cambia mucho.`,
      antes: `Dale previsibilidad: cuéntale qué va a pasar y cuál es su lugar. Saber que **el terreno es firme y que hay un lugar para su aporte** enfoca y tranquiliza a {nombre}.`,
      durante: `Si algo le genera tensión, en lugar de meterle prisa, **acompaña con calma**: baja el ritmo un momento y dale seguridad de que todo está en orden.`,
      despues: `Reconoce **cuando sostiene al grupo**, no solo el resultado. A un perfil sostenedor suele llegarle más un "fuiste el apoyo de todos" que un elogio general.`,
      ejemplo: `Si el sábado hay una actividad nueva, contarle "vas a saber en todo momento qué sigue" transforma los nervios en tranquilidad.`,
    },
    reset: {
      cuerpo: `Cuando se frustra, a {nombre} suele pesarle el ruido y la tensión, y lo que necesita es recuperar la calma. Lo que **más suele ayudar es bajar un cambio y volver a lo conocido**: un momento tranquilo, una rutina familiar, la seguridad de que todo está en orden. Con el clima sereno, suele reacomodarse.`,
      ejemplo: `En vez de "vamos, sigue ya", un "tómate un minuto, no hay apuro" suele reencauzar la situación mucho mejor.`,
    },
    ecos: {
      cuerpo: `Esta forma de sostener **no vive solo en el deporte**. Suele asomar cuando {nombre} cuida a un hermano, calma una discusión o es a quien todos buscan cuando algo se complica. Verlo en esos momentos ayuda a entender que su calma no es pasividad: es **su manera de estar en el mundo**.`,
      ejemplo: `Si en casa es quien pone paz y en quien todos se apoyan, estás viendo el mismo motor que mueve a {nombre} en la actividad.`,
    },
  },
  // ESTRATEGA (C): el análisis, el plan, el detalle, entender el porqué.
  C: {
    eje: 'C',
    label: 'Estratega',
    combustible: {
      cuerpo: `Lo que más suele encender a {nombre} es **entender cómo funcionan las cosas y tener un plan claro**. Cuando puede analizar, anticipar y hacer las cosas bien, se prende de verdad. Sentir que su mirada cuidadosa marca la diferencia es muchas veces su mejor combustible.`,
      ejemplo: `Un "buenísimo cómo lo pensaste" probablemente llegue a {nombre} más que un elogio general.`,
    },
    palabrasPuente: [
      `¿Cómo lo pensarías tú?`,
      `Tú ves los detalles que a otros se les escapan.`,
      `Tómate un momento para analizarlo.`,
      `Muéstrame tu plan.`,
    ],
    palabrasRuido: [
      `No preguntes tanto y hazlo.`,
      `Improvisa, ya veremos.`,
      `No hace falta entender, hazlo y ya.`,
    ],
    palabrasNota: `No es un guion, es una brújula de tono: a {nombre} suele **llegarle más lo que valora su análisis y su cuidado**, y hacerle ruido que lo apuren o le pidan improvisar sin entender. Con eso en mente, las palabras exactas las pones tú.`,
    guia: {
      lead: `Tres momentos donde una pequeña intención cambia mucho.`,
      antes: `Dale información y un momento para pensar. Saber que va a poder **entender antes de actuar** enfoca y tranquiliza a {nombre}.`,
      durante: `Si se traba analizando, en lugar de meterle presión, **acompaña la decisión**: ayúdale a elegir con la info que ya tiene y a soltar la búsqueda del plan perfecto.`,
      despues: `Reconoce **cuando piensa y cuida los detalles**, no solo el resultado. A un perfil estratega suele llegarle más un "se nota que lo tenías bien pensado" que un elogio general.`,
      ejemplo: `Si el sábado hay una actividad nueva, contarle con tiempo "esto es lo que vamos a hacer, estos son los pasos" transforma los nervios en confianza.`,
    },
    reset: {
      cuerpo: `Cuando se frustra, a {nombre} suele costarle la sensación de no entender o de tener que improvisar. Lo que **más suele ayudar es darle claridad**: explicarle qué está pasando, ordenar la información y darle un momento para pensar. Con el panorama claro, suele reacomodarse.`,
      ejemplo: `En vez de "no lo pienses tanto", un "veamos juntos cómo sigue" suele reencauzar la situación mucho mejor.`,
    },
    ecos: {
      cuerpo: `Esta forma de analizar **no vive solo en el deporte**. Suele asomar cuando {nombre} arma una estrategia en un juego, pregunta cómo funcionan las cosas o quiere entender el porqué de todo. Verlo en esos momentos ayuda a entender que no es "complicarla de más": es **su manera de estar en el mundo**.`,
      ejemplo: `Si en casa es quien quiere entender cómo funciona cada cosa y arma su plan, estás viendo el mismo motor que mueve a {nombre} en la actividad.`,
    },
  },
};

/** Devuelve el contenido base del eje en el idioma pedido; null si no está redactado
 *  (el render omite la sección: degradación por construcción, no inventa). es aprobado por el
 *  owner; en/pt de las traducciones verificadas (reportEjeContentI18n, fixes del verificador aplicados). */
export function getEjeBase(axis: Axis, lang: Lang): EjeBaseContent | null {
  if (lang === 'en') return EJE_BASE_EN[axis] ?? null;
  if (lang === 'pt') return EJE_BASE_PT[axis] ?? null;
  return EJE_BASE_DRAFT_ES[axis] ?? null;
}
