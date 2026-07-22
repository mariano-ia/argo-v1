// src/lib/reportSectionTips.ts
// Micro-copy de los tooltips (i) de cada sección del informe v4. SOLO se usan en el render
// (ReportV4View): explican en breve de qué se trata el módulo, en equilibrio entre lo técnico y lo
// criollo, para que quien no domina el método no desconfíe al leer los datos. NO entran en el output
// del engine (buildReportV4), ni en la IA, ni en el email, ni en el snapshot: por eso viven fuera del
// archivo GENERADO (reportV4Copy.ts) y se editan a mano acá. Las claves son los ids de sección.
// Reglas de copy Argo: sin guiones largos, tuteo (no voseo), neutral de comprador ("el niño"/"lo").
import type { Lang } from './archetypeContentV4';

export const SECTION_TIPS: Record<Lang, Record<string, string>> = {
  es: {
    receta: "El modelo Argo combina cuatro maneras de jugar (la acción, el vínculo, el sostén y el plan). Aquí se ve cuál pesa más en sus decisiones y cómo se ordenan las demás.",
    contingencia: "Mira si elige distinto según el momento (el arranque, la presión, el aguante). Solo lo contamos cuando el patrón es firme; si no, no forzamos una lectura.",
    patron: "Cruza qué elige con cuánto tarda en decidir. Muestra si resuelve a un ritmo parejo o si se agiliza justo en lo que más lo entusiasma.",
    motor: "Es su tempo: cuán rápido o pausado se mueve al jugar y decidir. Habla del ritmo, no del perfil.",
    tormenta: "Cómo tiende a reaccionar cuando las cosas se complican, leído en las escenas de adversidad del juego.",
    grupo: "Cuánto pesa el grupo en su forma de jugar: si suma entusiasmando e involucrando, o sosteniendo el clima.",
    logro: "Qué suele hacer cuando algo le sale: ir por el próximo objetivo, celebrarlo con otros o repasar cómo lo logró.",
    combustible: "Lo que lo pone en marcha y le da energía en la actividad, según el color que más lo mueve.",
    palabras: "Qué palabras y qué tono le llegan mejor, y cuáles pueden hacerle ruido, según su perfil.",
    guia: "Ideas concretas para acompañarlo en cada momento de la actividad, ajustadas a cómo funciona.",
    reset: "Qué suele ayudarlo a recomponerse cuando se frustra o algo no sale como esperaba.",
    ecos: "Cómo asoma este mismo motor en su día a día, fuera de la cancha.",
  },
  en: {
    receta: "The Argo model blends four ways of playing (action, connection, support and planning). This shows which one weighs most in their decisions and how the rest line up.",
    contingencia: "Looks at whether they choose differently depending on the moment (the start, pressure, sustained effort). We only report it when the pattern is firm; otherwise we don't force a reading.",
    patron: "Crosses what they choose with how long they take to decide. Shows whether they resolve at a steady pace or speed up right where they're most excited.",
    motor: "It's their tempo: how fast or measured they move when playing and deciding. It speaks to rhythm, not to the profile.",
    tormenta: "How they tend to react when things get complicated, read from the game's adversity scenes.",
    grupo: "How much the group weighs in how they play: whether they add by energizing and involving others, or by holding the mood together.",
    logro: "What they tend to do when something goes well: chase the next goal, celebrate it with others, or review how they got there.",
    combustible: "What gets them going and gives them energy in the activity, based on the color that moves them most.",
    palabras: "Which words and tone reach them best, and which ones may jar, based on their profile.",
    guia: "Concrete ideas to support them at each moment of the activity, tuned to how they work.",
    reset: "What tends to help them regroup when they get frustrated or something doesn't go as expected.",
    ecos: "How this same engine shows up in their day to day, beyond the field.",
  },
  pt: {
    receta: "O modelo Argo combina quatro formas de jogar (a ação, o vínculo, o apoio e o plano). Aqui se vê qual pesa mais nas suas decisões e como as demais se ordenam.",
    contingencia: "Observa se escolhe diferente conforme o momento (o começo, a pressão, o esforço sustentado). Só contamos quando o padrão é firme; caso contrário, não forçamos uma leitura.",
    patron: "Cruza o que escolhe com quanto tempo leva para decidir. Mostra se resolve em um ritmo constante ou se acelera justamente no que mais o entusiasma.",
    motor: "É o seu tempo: quão rápido ou pausado se move ao jogar e decidir. Fala do ritmo, não do perfil.",
    tormenta: "Como tende a reagir quando as coisas se complicam, lido nas cenas de adversidade do jogo.",
    grupo: "O quanto o grupo pesa na sua forma de jogar: se soma entusiasmando e envolvendo, ou sustentando o clima.",
    logro: "O que costuma fazer quando algo dá certo: ir para o próximo objetivo, celebrar com outros ou revisar como conseguiu.",
    combustible: "O que o coloca em movimento e lhe dá energia na atividade, segundo a cor que mais o move.",
    palabras: "Quais palavras e qual tom chegam melhor, e quais podem fazer ruído, segundo o seu perfil.",
    guia: "Ideias concretas para acompanhá-lo em cada momento da atividade, ajustadas a como funciona.",
    reset: "O que costuma ajudá-lo a se recompor quando se frustra ou algo não sai como esperava.",
    ecos: "Como esse mesmo motor aparece no seu dia a dia, fora da quadra.",
  },
};

// Micro-copy del CHROME visual del informe v4 (rediseño 2026-07): la línea de "eyebrow" sobre el nombre,
// la pastilla "Perfil ___" con su (i), y las etiquetas de los espectros (motor / patrón). Igual que
// SECTION_TIPS: SOLO para el render, fuera del engine/IA/email/snapshot. Léxico alineado con los tips de
// arriba ("rápido o pausado", "ritmo parejo"), así no introduce conceptos nuevos. es/en/pt.
export interface ReportChrome {
  eyebrow: string;        // encima del nombre del arquetipo ("Su perfil hoy")
  meterPrefix: string;    // pastilla de confianza ("Perfil " + nivel actual)
  meterTip: string;       // (i) de la pastilla: qué significa "cuán marcado está el perfil"
  spectrum: { patron: [string, string]; motor: [string, string] };  // [izquierda, derecha]
}
export const REPORT_CHROME: Record<Lang, ReportChrome> = {
  es: {
    eyebrow: "Su perfil hoy",
    meterPrefix: "Perfil",
    meterTip: "Expresa cuán definido se ve el perfil hoy: si un eje sobresale con claridad o si conviven varios de forma pareja. No es una nota: un perfil parejo no es mejor ni peor, solo menos marcado.",
    spectrum: { patron: ["Ritmo parejo", "Ritmo diverso"], motor: ["Pausado", "Ágil"] },
  },
  en: {
    eyebrow: "Their profile today",
    meterPrefix: "Profile",
    meterTip: "It shows how defined the profile looks today: whether one axis stands out clearly or several coexist evenly. It isn't a grade: an even profile is neither better nor worse, just less pronounced.",
    spectrum: { patron: ["Steady pace", "Varied pace"], motor: ["Measured", "Quick"] },
  },
  pt: {
    eyebrow: "Seu perfil hoje",
    meterPrefix: "Perfil",
    meterTip: "Mostra quão definido o perfil parece hoje: se um eixo se destaca com clareza ou se vários convivem de forma equilibrada. Não é uma nota: um perfil equilibrado não é melhor nem pior, apenas menos marcado.",
    spectrum: { patron: ["Ritmo constante", "Ritmo diverso"], motor: ["Pausado", "Ágil"] },
  },
};
