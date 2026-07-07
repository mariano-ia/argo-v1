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
// {nombre} lo reemplaza la capa de render. La zona sale del score ajustado por edad (§2.3).
// Principios (reformulado 2026-07-07 con feedback del owner): (1) nombra los desafíos
// concretos (reacción y decisión); (2) la cancha es donde el ritmo SE APLICA y se reconoce,
// no donde "recién ahí sirve"; (3) afirma con valor y lenguaje probabilístico ("tiende a"),
// con UNA salvedad de presente, sin ahogar el insight en disclaimers.
type MotorTemplate = { intermedio: string; lento: string; rapido: string };

export const MOTOR_INSIGHT_TEMPLATES: Record<Lang, MotorTemplate> = {
  es: {
    rapido: `En los mini-juegos de reacción y decisión, {nombre} resolvió con un ritmo ágil: tiende a leer rápido y a confiar en su primer impulso. En la cancha esto suele verse en un chico que arranca las jugadas y decide sin titubear bajo presión. Acompañarlo bien es darle espacio para esa velocidad, y de a poco sumarle momentos para elegir cuándo conviene tomarse un segundo más.`,
    intermedio: `En los mini-juegos de reacción y decisión, {nombre} mostró un ritmo equilibrado: tiende a acomodar su tiempo a lo que pide cada momento, sin apurarse ni demorarse. En la cancha esto suele verse en un chico flexible con los tempos. Acompañarlo bien es ayudarlo a reconocer cuándo su juego pide velocidad y cuándo pide una pausa.`,
    lento: `En los mini-juegos de reacción y decisión, {nombre} resolvió con un ritmo medido: tiende a tomarse un momento para leer la escena antes de moverse. En la cancha esto suele verse en un chico que no se apura y elige con criterio. Acompañarlo bien es valorar esa lectura (sin pedirle que se apure solo por apurarlo) y darle confianza para sostener su tiempo cuando la jugada lo permite.`,
  },
  en: {
    rapido: `In the reaction and decision mini-games, {nombre} played at a quick pace: they tend to read fast and trust their first impulse. On the field this often shows up as a kid who starts the plays and decides without hesitating under pressure. Supporting them well means giving room for that speed, and gradually adding moments to choose when it pays to take an extra second.`,
    intermedio: `In the reaction and decision mini-games, {nombre} showed a balanced pace: they tend to adjust their timing to what each moment asks, without rushing or lagging. On the field this often shows up as a kid who is flexible with tempo. Supporting them well means helping them recognize when their game calls for speed and when it calls for a pause.`,
    lento: `In the reaction and decision mini-games, {nombre} played at a measured pace: they tend to take a moment to read the scene before moving. On the field this often shows up as a kid who doesn't rush and chooses with judgment. Supporting them well means valuing that read (without asking them to hurry for its own sake) and giving confidence to hold their timing when the play allows.`,
  },
  pt: {
    rapido: `Nos mini-jogos de reação e decisão, {nombre} resolveu num ritmo ágil: tende a ler rápido e a confiar no primeiro impulso. Na quadra isso costuma aparecer como uma criança que inicia as jogadas e decide sem hesitar sob pressão. Acompanhar bem é dar espaço para essa velocidade e, aos poucos, somar momentos para escolher quando vale a pena levar um segundo a mais.`,
    intermedio: `Nos mini-jogos de reação e decisão, {nombre} mostrou um ritmo equilibrado: tende a ajustar o seu tempo ao que cada momento pede, sem se apressar nem se atrasar. Na quadra isso costuma aparecer como uma criança flexível com os tempos. Acompanhar bem é ajudá-la a reconhecer quando o jogo pede velocidade e quando pede uma pausa.`,
    lento: `Nos mini-jogos de reação e decisão, {nombre} resolveu num ritmo comedido: tende a levar um momento para ler a cena antes de se mover. Na quadra isso costuma aparecer como uma criança que não se apressa e escolhe com critério. Acompanhar bem é valorizar essa leitura (sem pedir que se apresse à toa) e dar confiança para sustentar o seu tempo quando a jogada permite.`,
  },
};

/** Devuelve la plantilla de "Su motor" según la zona (null => intermedio como fallback). */
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
  palabrasPuente: string[]; // frases del adulto que conectan con este motor
  palabrasRuido: string[];  // frases que suelen apagar/friccionar este motor
  guia: { antes: string; durante: string; despues: string }; // acompañar antes/durante/después de la actividad
  reset: string;         // qué ayuda cuando se frustra o se desborda
  ecos: string;          // cómo asoma este motor fuera de la cancha
}

export const EJE_BASE_DRAFT_ES: Partial<Record<Axis, EjeBaseContent>> = {
  // EJE TRABAJADO Y LISTO PARA REVISIÓN DE VOZ (Impulsor / D), depurado de tempo.
  // Los otros 3 ejes siguen el mismo molde; se completan tras tu ok a esta voz.
  D: {
    eje: 'D',
    label: 'Impulsor',
    perfil: `El perfil de {nombre} se inclina hacia la acción y la iniciativa: tiende a ir al frente, a decidir y a poner el cuerpo en movimiento para que las cosas avancen.`,
    combustible: `A {nombre} suele encenderlo tener un objetivo claro y sentir que su empuje hace avanzar al equipo. Reconocer el impacto concreto de su iniciativa tiende a ser su mejor combustible.`,
    palabrasPuente: [
      `Arranca tú esta jugada.`,
      `¿Qué propones para salir de esta?`,
      `Hoy marcas tú el ritmo del equipo.`,
      `Muéstrame cómo lo resolverías.`,
    ],
    palabrasRuido: [
      `Espera, todavía no te toca.`,
      `Hazlo exactamente como te digo.`,
      `Quédate quieto y observa.`,
    ],
    guia: {
      antes: `Dale un objetivo concreto y un rol donde pueda tomar la iniciativa. Saber que va a poder arrancar algo suele enfocarlo.`,
      durante: `Cuando se acelere de más, en lugar de frenarlo, canaliza su empuje: reconoce las ganas y súmale una lectura rápida antes de ir.`,
      despues: `Reconoce lo que puso en movimiento, no solo el resultado. A un perfil de acción suele llegarle más un "hiciste que el equipo avanzara" que un elogio general.`,
    },
    reset: `Cuando se frustra, a {nombre} suele costarle quedarse quieto esperando. Un reset que tiende a funcionar es darle una acción pequeña y concreta para hacer ya (una tarea clara, un objetivo corto), para que recupere la sensación de estar avanzando. Frenarlo en seco de golpe suele subir la frustración.`,
    ecos: `Este empuje por avanzar no vive solo en el deporte: suele asomar cuando {nombre} organiza un juego, propone planes o quiere resolver algo ya. Verlo en esos momentos ayuda a entender que no es "no poder esperar": es su forma de estar en el mundo.`,
  },
  // I, S, C: TODO — re-keyar de conector_relacional / sosten_confiable / estratega_analitico,
  //          depurados de tempo, en la completación de 2B (mismo procedimiento).
};

/** Devuelve el contenido base del eje si está redactado y aprobado en ese idioma; si no, null
 *  (el render omite la sección: degradación por construcción, no inventa). en/pt: pendientes. */
export function getEjeBase(axis: Axis, lang: Lang): EjeBaseContent | null {
  if (lang !== 'es') return null; // en/pt: pendientes de redacción + revisión de voz
  return EJE_BASE_DRAFT_ES[axis] ?? null;
}
