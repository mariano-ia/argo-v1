// src/lib/reportV4Copy.ts
// Copy i18n del informe v4 (es/en/pt). LÓGICA compartida en reportV4.ts (computa slots desde la ficha);
// COPY (léxico + templates de cada sección) vive acá, por idioma. es = fuente de verdad (snapshot-guarded,
// reportV4.snapshot.test.ts); en/pt de las traducciones verificadas (docs/_i18n/report-v4-translations.json,
// 3 workflows adversariales). Los templates usan placeholders ${slot} LITERALES que fill() sustituye;
// las **negritas** se preservan. NO editar a mano en/pt: regenerar desde el JSON (scripts/gen_copy.py).
import type { Lang } from './archetypeContentV4';
import type { Axis } from './evidenceFicha';

export interface EjeWord { corta: string; larga: string; }
export interface RecetaVerbos { aparece: string; aparecen: string; suma: string; suman: string; pesa: string; pesan: string; ytambien: string; y: string; }
export interface GrupoWords { costado_indiv: string; costado_equipo: string; rol_indiv: string; rol_equipo: string; esc_indiv: string; esc_equipo: string; conquien_indiv: string; conquien_equipo: string; }
export interface GrupoPartes { i_fuerte: string; i_algo: string; s_fuerte: string; s_algo: string; }
export interface Ui { meter_header: string; conectan: string; ruido: string; antes: string; durante: string; despues: string; adulto: string; edad: string; }
export interface Bodies {
  receta_base: string; receta_presentes: string; receta_suaves: string; receta_verbos: RecetaVerbos; receta_ejemplo: string;
  conting_desvio: string; conting_desvio_ej: string; conting_norma: string; conting_norma_ej: string;
  patron_null: string; patron_null_ej: string; patron_rapido: string; patron_lento: string; patron_acople: string; patron_acople_ej: string;
  tormenta_insuf: string; tormenta_firme: string; tormenta_dos: string; tormenta_disperso: string;
  grupo_intro_indiv: string; grupo_low: string; grupo_low_ej: string; grupo_words: GrupoWords; grupo_partes: GrupoPartes;
  grupo_present: string; grupo_present_ej: string; grupo_join: string; grupo_fallback: string;
  logro: string; logro_ej_clause: string; logro_ejemplo: string;
  mal: string;
}
export interface CopyPack {
  meter_labels: string[];
  veta_word: Record<Axis, string>;
  eje_word: Record<Axis, EjeWord>;
  eje_lead: Record<Axis, string>;
  receta_ejemplo: Record<Axis, string>;
  storm_ejemplo: Record<Axis, string>;
  success_anchor: Record<Axis, string>;
  meta_choice: Record<Axis, string>;
  mal_anchor: Record<Axis, string>;
  mal_acompanar: Record<Axis, string>;
  mal_ejemplo: Record<Axis, string>;
  context_word: Record<string, string>;
  section_titles: Record<string, string>;
  cuantas: Record<string, string>;
  group_titles: Record<string, string>;
  lead: { veta_clause: string; rotundo: string; claro: string; matices: string; parejo: string; };
  footer: string;
  bodies: Bodies;
  ui: Ui;
}

export const COPY: Record<Lang, CopyPack> = {
  "es": {
    "meter_labels": ["Parejo", "Con matices", "Claro", "De lleno"],
    "veta_word": {
      "D": "impulsor",
      "I": "conector",
      "S": "sostenedor",
      "C": "estratega"
    },
    "eje_word": {
      "D": {
        "corta": "la acción",
        "larga": "avanzar y decidir"
      },
      "I": {
        "corta": "el vínculo con los demás",
        "larga": "conectar y entusiasmar al grupo"
      },
      "S": {
        "corta": "el sostén del grupo",
        "larga": "cuidar al grupo y sostener la calma"
      },
      "C": {
        "corta": "el detalle y el plan",
        "larga": "mirar el plan antes de actuar"
      }
    },
    "eje_lead": {
      "D": "avanzar, decidir y hacer que las cosas se muevan",
      "I": "conectar, entusiasmar y sumar a los demás",
      "S": "cuidar el clima del grupo y sostener a quienes lo rodean",
      "C": "observar, entender y armar un plan antes de actuar"
    },
    "receta_ejemplo": {
      "D": "preguntarse primero \"qué hago\" antes que \"con quién lo hago\"",
      "I": "fijarse primero en \"con quién lo hago\" y en cómo está el grupo",
      "S": "asegurarse de que todos estén bien antes de arrancar",
      "C": "querer entender \"cómo conviene hacerlo\" antes de lanzarse"
    },
    "storm_ejemplo": {
      "D": "Ante un imprevisto, es probable que se mueva rápido para resolverlo cuanto antes.",
      "I": "Ante un imprevisto, es probable que busque apoyarse en los demás para salir adelante.",
      "S": "Ante un imprevisto, es probable que priorice mantener la calma del grupo.",
      "C": "Ante un imprevisto, es probable que primero busque entender qué pasa y recién después se mueva."
    },
    "success_anchor": {
      "D": "suele encenderse enseguida hacia **el próximo objetivo**: disfruta avanzando más que deteniéndose a saborear lo conseguido",
      "I": "suele querer **compartir y celebrar el logro con los demás**: lo vive más pleno cuando lo festeja en grupo",
      "S": "suele alegrarse sobre todo de que **al equipo le vaya bien**, más que del mérito propio",
      "C": "suele querer **repasar cómo lo logró** para entenderlo y hacerlo todavía mejor"
    },
    "meta_choice": {
      "D": "mirar ya hacia el próximo reto",
      "I": "compartir la alegría con los compañeros",
      "S": "asegurarse de que todo el equipo estuviera bien",
      "C": "repasar cómo había llegado hasta ahí"
    },
    "mal_anchor": {
      "D": "suele querer **volver a intentarlo enseguida**, con todo su empuje: pone la mirada en el próximo intento antes que en lo que acaba de pasar",
      "I": "suele vivirlo por el lado del vínculo: **tiende a buscar una mirada de apoyo** y a contar lo que pasó, y se recompone mejor cuando siente el apoyo cerca",
      "S": "suele preocuparse sobre todo por **cómo repercute en el equipo**: tiende a quedarse un rato en silencio y a cargar con más de lo que le toca, porque le importa el conjunto",
      "C": "suele querer **entender qué pasó**: tiende a repasar la jugada y a darle vueltas para encontrarle la lógica antes de seguir"
    },
    "mal_acompanar": {
      "D": "**darle enseguida un próximo paso concreto** y, de a poco, invitarle a mirar un segundo qué ajustar, sin apagar ese impulso",
      "I": "**empezar por el vínculo antes que por el consejo**: un gesto cálido primero, recordarle que el grupo sigue ahí y que esto no cambia en nada el cariño de los demás",
      "S": "**reasegurarle que el equipo está bien** y ayudarle a soltar ese peso de más que se pone encima, con calma y recordándole que esto es de todos",
      "C": "**ayudarle a cerrar el repaso** cuando ya dio con lo importante: recordarle con cariño que no todo necesita una explicación perfecta, y que volver a moverse también aclara"
    },
    "mal_ejemplo": {
      "D": "Cuando a ${n} algo no le sale y ya quiere ir por más, le suma escuchar un \"me encanta que quieras seguir, probemos algo distinto la próxima\".",
      "I": "A ${n} le cambia el momento un \"esto no cambia nada entre nosotros, seguimos igual\", dicho antes que cualquier consejo técnico.",
      "S": "Si ${n} se queda en silencio y como cargando con todo, ayuda un \"el equipo está bien, esto lo resolvemos entre todos\", más que pedirle que hable enseguida.",
      "C": "Después de darle muchas vueltas, a ${n} le ordena la cabeza un \"quedémonos con una sola cosa para la próxima\", mejor que seguir repasando cada detalle."
    },
    "context_word": {
      "inicio": "al arrancar algo nuevo",
      "adversidad": "cuando la cosa se complica",
      "esfuerzo": "cuando hay que sostener el esfuerzo",
      "disfrute": "",
      "decision": "",
      "espera": "",
      "equipo": "",
      "meta": ""
    },
    "section_titles": {
      "receta": "Su mezcla",
      "contingencia": "Cómo cambia según la situación",
      "patron": "Su patrón de decisión",
      "motor": "Su motor",
      "tormenta": "Ante la tormenta",
      "grupo": "Cuánto lo mueve el grupo",
      "logro": "Cuando le sale bien",
      "mal": "Cuando le sale mal",
      "combustible": "Qué lo motiva",
      "palabras": "Palabras que conectan (y las que hacen ruido)",
      "guia": "Antes, durante y después",
      "reset": "Un reset que funciona",
      "ecos": "Más allá del deporte"
    },
    "cuantas": {
      "casi_todas": "en casi todas sus decisiones",
      "mayoria": "en la mayoría de sus decisiones",
      "muchas": "en muchas de sus decisiones",
      "varias": "en varias de sus decisiones",
      "algunas": "en algunas de sus decisiones"
    },
    "group_titles": {
      "quien": "Quién es ${n} hoy",
      "cancha": "Cómo se le ve en la actividad",
      "acompanar": "Cómo acompañar a ${n}",
      "masalla": "Más allá del deporte"
    },
    "lead": {
      "veta_clause": " Y detrás de ese empuje asoma una **veta ${vetaLabel}**: en varias escenas también eligió ${largaSec}.",
      "rotundo": "El juego de ${n} se apoya **de lleno en ${corta}**: la eligió ${cuantas}, una señal muy marcada.${veta} Hoy, su manera de estar en la actividad pasa claramente por ahí: ${tail}.",
      "claro": "El juego de ${n} se apoya **con claridad en ${corta}**: fue lo que eligió ${cuantas}.${veta} Hoy, su manera de estar en la actividad pasa por ahí: ${tail}.",
      "matices": "El juego de ${n} se inclina hacia **${corta}**, con una presencia clara de su segundo color.${veta} Hoy tiende a moverse por ahí, sin que sea su única nota: ${tail}.",
      "parejo": "${n} juega hoy con **dos motores bien parejos**: ${dosCortas}. No es indefinición, al contrario: dispone de dos registros y tiende a elegir según lo que pide cada momento."
    },
    "footer": "Cómo leer este informe. Describe **cómo tiende a elegir ${n} hoy**, no lo que es ni lo que va a llegar a ser: es una foto de sus preferencias en este momento, no una etiqueta. Los perfiles cambian con la edad y la experiencia, **por eso recomendamos volver a perfilar a los niños cada 6 meses**. El deporte solo cambia el marco para reconocer el perfil; lo que se mide es lo mismo en cualquier actividad.",
    "bodies": {
      "receta_base": "En Argo, cada perfil mezcla a su manera los cuatro colores del modelo, y en el de ${n} se destaca un ingrediente: **${corta}**, que eligió ${cuantas}.",
      "receta_presentes": " Muy cerca ${verbo2} ${lista}, que le ${suman} matices a su forma de jugar.",
      "receta_suaves": " ${listaCap}, en cambio, hoy ${verbo} menos en cómo decide: son colores que también tiene disponibles y que irán tomando su lugar con el tiempo.",
      "receta_verbos": {
        "aparece": "aparece",
        "aparecen": "aparecen",
        "suma": "suma",
        "suman": "suman",
        "pesa": "pesa",
        "pesan": "pesan",
        "ytambien": "y también",
        "y": "y"
      },
      "receta_ejemplo": "Ante una misma situación, ${n} tiende a ${rec}.",
      "conting_desvio": "Una de las cosas más lindas de su perfil es que **juega distinto según el momento y lee lo que pide cada situación**. La mayor parte del tiempo, ${n} tiende a ${conductaPrim}. Y ${ctxDesvio}, cambia de registro: ahí se inclina por **${conductaDesvio}**. Ese contraste es genuinamente suyo, y habla de alguien que ajusta su manera según lo que tiene delante.",
      "conting_desvio_ej": "En un momento tranquilo se lanza sin dudar; en uno más complicado es capaz de frenar un segundo para pensar la mejor salida.",
      "conting_norma": "Algo lindo del perfil de ${n} es su **consistencia**: sostuvo su manera de ${conductaPrim}, incluso ${ctxs}. Cuando algo le funciona, tiende a confiar en ese recurso.",
      "conting_norma_ej": "Aunque cambie la situación, es probable que ${n} mantenga su forma de resolver antes que cambiarla de golpe.",
      "patron_null": "A lo largo del juego, ${n} **decidió a un ritmo bastante parejo**: sostuvo su compromiso de principio a fin, sin arrancar dudando ni aflojar sobre el final. Es una linda señal de consistencia en cómo se involucra con cada elección.",
      "patron_null_ej": "Cuando algo le importa, ${n} tiende a mantener la misma dedicación del primer al último momento.",
      "patron_rapido": "resolvió más rápido justo en las elecciones que van con su motor principal",
      "patron_lento": "se dio un poco más de tiempo justo en las elecciones que van con su motor principal",
      "patron_acople": "A lo largo del juego, ${n} **decidió en ritmos diversos**: ${q}, y ajustó el tiempo en las demás. Ese acople entre lo que elige y cuánto tarda es una huella muy personal, y cuenta algo lindo: **cuando algo le entusiasma de verdad, responde con soltura**.",
      "patron_acople_ej": "Frente a una decisión que le entusiasma, casi no la piensa; frente a una fuera de su terreno, se da su tiempo.",
      "tormenta_insuf": "En las escenas de tormenta del juego no reunimos suficientes elecciones de ${n} para leer una tendencia clara. Es simplemente una parte del juego con menos datos, nada más.",
      "tormenta_firme": "Cuando las cosas se complican, ${n} mostró una **tendencia clara**: en las escenas de tormenta se inclinó una y otra vez por **${top}**. En un momento adverso, es probable que ese sea su primer recurso, y es muy valioso saberlo de antemano.",
      "tormenta_dos": "Cuando las cosas se complican, ${n} no responde con una sola fórmula: **bajo presión suele tener más de un recurso**. Asoma una inclinación hacia **${top}**, sin que sea su única salida, y esa flexibilidad es una señal valiosa: puede adaptarse a lo que cada momento pide.",
      "tormenta_disperso": "Cuando las cosas se complican, ${n} **leyó cada escena por separado**: en la tormenta no repitió una sola respuesta, sino que ajustó a lo que cada momento parecía pedir. Hoy tiende a responder a lo adverso con flexibilidad, más que con una reacción fija, y eso también es un recurso.",
      "grupo_intro_indiv": "En un deporte individual, el \"equipo\" es sobre todo **el grupo con el que comparte la actividad**. ",
      "grupo_low": "${intro}Entre los motores de ${n}, ${costado} hoy **aparece más en segundo plano**, y es simplemente parte de su receta de este momento: no dice nada de su vida social ni de sus amistades. Su manera de sumar al grupo pasa hoy **más por el hacer que por lo emocional**, y cuando su aporte se nota, el vínculo suele venir después. Una linda forma de acercar a ${n} es **darle un rol donde su empuje ${rol}**.",
      "grupo_low_ej": "Invitar a ${n} a ${ejEscena} acerca a ${n} al grupo desde su fortaleza, sin empujar a un lugar que hoy no es el suyo.",
      "grupo_words": {
        "costado_indiv": "ese costado social",
        "costado_equipo": "el vínculo con el equipo",
        "rol_indiv": "se note dentro del grupo",
        "rol_equipo": "tenga impacto en el equipo",
        "esc_indiv": "marcar el ritmo de un momento compartido de la actividad",
        "esc_equipo": "liderar el arranque de una jugada compartida",
        "conquien_indiv": "su grupo",
        "conquien_equipo": "el equipo"
      },
      "grupo_partes": {
        "i_fuerte": "un **empuje fuerte por involucrar y entusiasmar** a los demás",
        "i_algo": "algo de gusto por involucrar a los demás",
        "s_fuerte": "una **clara necesidad de que el grupo esté en armonía**",
        "s_algo": "algo de cuidado por que el grupo esté bien"
      },
      "grupo_present": "En la relación de ${n} con ${conQuien} aparece ${partes}. Son motores sociales distintos (involucrar no es lo mismo que sostener), y saber cuál pesa más ayuda a acompañar a ${n} desde donde de verdad se siente a gusto.",
      "grupo_present_ej": "Darle lugar a ese costado social, en la medida en que le nace, suele hacer que ${n} se sienta parte.",
      "logro": "Cuando a ${n} le sale algo, ${anchor}.${ej} Lo vive así, y está muy bien. Acompañar a ${n} es ayudarle a también **registrar y celebrar lo logrado** antes de volver a arrancar.",
      "logro_ej_clause": " En el juego se vio con claridad, porque al llegar a la meta eligió **${metaChoice}**.",
      "logro_ejemplo": "Después de un buen resultado, un simple \"mira todo lo que conseguiste\" ayuda a ${n} a que el disfrute también tenga su lugar.",
      "mal": "Cuando algo no le sale como esperaba, ${n} ${anchor}. Es su forma de procesarlo, y tiene su valor. Acompañar a ${n} es ${acompanar}.",
      "grupo_join": "; y, por otro lado, ",
      "grupo_fallback": "el grupo aparece de a ratos"
    },
    "ui": {
      "meter_header": "Qué tan marcado está su perfil hoy",
      "conectan": "Conectan",
      "ruido": "Hacen ruido",
      "antes": "Antes",
      "durante": "Durante",
      "despues": "Después",
      "adulto": "Adulto responsable",
      "edad": "años"
    }
  },
  "en": {
    "meter_labels": ["Even", "With nuance", "Clear", "All in"],
    "veta_word": {
      "D": "Driver",
      "I": "Connector",
      "S": "Sustainer",
      "C": "Strategist"
    },
    "eje_word": {
      "D": {
        "corta": "action",
        "larga": "moving forward and deciding"
      },
      "I": {
        "corta": "connecting with others",
        "larga": "connecting and energizing the group"
      },
      "S": {
        "corta": "supporting the group",
        "larga": "looking after the group and keeping things calm"
      },
      "C": {
        "corta": "the detail and the plan",
        "larga": "looking at the plan before acting"
      }
    },
    "eje_lead": {
      "D": "moving forward, deciding and getting things moving",
      "I": "connecting, energizing and bringing others on board",
      "S": "looking after the group's mood and supporting those around them",
      "C": "observing, understanding and building a plan before acting"
    },
    "receta_ejemplo": {
      "D": "asking first \"what do I do\" before \"who do I do it with\"",
      "I": "looking first at \"who do I do it with\" and how the group is doing",
      "S": "making sure everyone is okay before starting",
      "C": "wanting to understand \"the best way to do it\" before jumping in"
    },
    "storm_ejemplo": {
      "D": "Faced with the unexpected, they will likely move fast to solve it as soon as possible.",
      "I": "Faced with the unexpected, they will likely look to lean on others to get through it.",
      "S": "Faced with the unexpected, they will likely prioritize keeping the group calm.",
      "C": "Faced with the unexpected, they will likely first try to understand what's going on and only then act."
    },
    "success_anchor": {
      "D": "tends to light up right away toward **the next goal**: enjoys moving forward more than stopping to savor what was achieved",
      "I": "tends to want to **share and celebrate the achievement with others**: experiences it more fully when celebrating as a group",
      "S": "tends to be glad above all that **the team is doing well**, more than about personal credit",
      "C": "tends to want to **review how they did it** to understand it and do it even better"
    },
    "meta_choice": {
      "D": "looking ahead to the next challenge",
      "I": "sharing the joy with teammates",
      "S": "making sure the whole team was okay",
      "C": "reviewing how they had gotten there"
    },
    "mal_anchor": {
      "D": "tends to want to **try again right away**, with all their drive: sets their sights on the next attempt more than on what just happened",
      "I": "tends to experience it through connection: **is likely to seek a look of support** and to talk through what happened, and bounces back more easily when they feel support close by",
      "S": "tends to worry above all about **how it affects the team**: is likely to go quiet for a while and to carry more than their share, because the group matters to them",
      "C": "tends to want to **understand what happened**: is likely to replay the moment and turn it over in their mind to make sense of it before moving on"
    },
    "mal_acompanar": {
      "D": "**giving them a concrete next step right away** and, little by little, inviting them to take a second to look at what to adjust, without dampening that drive",
      "I": "**starting with connection before advice**: a warm gesture first, reminding them that the group is still there and that this changes nothing about how much others care for them",
      "S": "**reassuring them that the team is okay** and helping them let go of that extra weight they put on themselves, calmly and reminding them that this belongs to everyone",
      "C": "**helping them close the review** once they've found what matters: gently reminding them that not everything needs a perfect explanation, and that getting moving again also brings clarity"
    },
    "mal_ejemplo": {
      "D": "When something doesn't go ${n}'s way and they already want to go for more, it helps to hear a \"I love that you want to keep going, let's try something different next time.\"",
      "I": "For ${n}, a \"this doesn't change anything between us, we're the same as always,\" said before any technical tip, turns the whole moment around.",
      "S": "If ${n} goes quiet and seems to be carrying it all, a \"the team is okay, we'll sort this out together\" helps more than asking them to talk right away.",
      "C": "After turning it over a lot, a \"let's keep just one thing for next time\" helps settle ${n}'s mind, better than going back over every detail."
    },
    "context_word": {
      "inicio": "when starting something new",
      "adversidad": "when things get tough",
      "esfuerzo": "when the effort has to be sustained"
    },
    "section_titles": {
      "receta": "Their mix",
      "contingencia": "How it shifts with the situation",
      "patron": "Their decision pattern",
      "motor": "Their engine",
      "tormenta": "Facing the storm",
      "grupo": "How much the group moves them",
      "logro": "When things go well",
      "combustible": "What motivates them",
      "palabras": "Words that connect (and the ones that jar)",
      "guia": "Before, during and after",
      "reset": "A reset that works",
      "ecos": "Beyond the sport",
      "mal": "When things go wrong"
    },
    "cuantas": {
      "casi_todas": "in almost all of their decisions",
      "mayoria": "in most of their decisions",
      "muchas": "in many of their decisions",
      "varias": "in several of their decisions",
      "algunas": "in some of their decisions"
    },
    "group_titles": {
      "quien": "Who ${n} is today",
      "cancha": "How they show up in the activity",
      "acompanar": "How to support ${n}",
      "masalla": "Beyond the sport"
    },
    "lead": {
      "veta_clause": " And behind that drive a **${vetaLabel} streak** shows through: in several scenes they also chose ${largaSec}.",
      "rotundo": "${n}'s game leans **all in on ${corta}**: they chose it ${cuantas}, a very strong signal.${veta} Today, the way they show up in the activity clearly runs through there: ${tail}.",
      "claro": "${n}'s game leans **clearly on ${corta}**: it's what they chose ${cuantas}.${veta} Today, the way they show up in the activity runs through there: ${tail}.",
      "matices": "${n}'s game leans toward **${corta}**, with a clear presence of their second color.${veta} Today they tend to move through there, though it's not their only note: ${tail}.",
      "parejo": "${n} plays today with **two well-balanced engines**: ${dosCortas}. It's not indecision, quite the opposite: they have two registers and tend to choose according to what each moment calls for."
    },
    "footer": "How to read this report. It describes **how ${n} tends to choose today**, not what they are or what they might become: it's a snapshot of their preferences right now, not a label. Profiles change with age and experience, **which is why we recommend re-profiling children every 6 months**. The sport only changes the frame for recognizing the profile; what is measured is the same in any activity.",
    "bodies": {
      "receta_base": "In Argo, every profile blends the model's four colors in its own way, and in ${n}'s, one ingredient stands out: **${corta}**, which they chose ${cuantas}.",
      "receta_presentes": " Close behind ${verbo2} ${lista}, which ${suman} nuance to how they play.",
      "receta_suaves": " ${listaCap}, on the other hand, ${verbo} less today in how they decide: these are colors they also have available and that will find their place over time.",
      "receta_verbos": {
        "aparece": "appears",
        "aparecen": "appear",
        "suma": "adds",
        "suman": "add",
        "pesa": "weighs",
        "pesan": "weigh",
        "ytambien": "and also",
        "y": "and"
      },
      "receta_ejemplo": "Faced with the same situation, ${n} tends to ${rec}.",
      "conting_desvio": "One of the loveliest things about their profile is that **they play differently depending on the moment and read what each situation calls for**. Most of the time, ${n} tends to ${conductaPrim}. And ${ctxDesvio}, they shift gears: there they lean toward **${conductaDesvio}**. That contrast is genuinely their own, and speaks of someone who adjusts their approach to what's in front of them.",
      "conting_desvio_ej": "In a calm moment they dive in without hesitating; in a trickier one they can pause for a second to think through the best way out.",
      "conting_norma": "Something lovely about ${n}'s profile is their **consistency**: they kept their way of ${conductaPrim}, even ${ctxs}. When something works for them, they tend to trust that resource.",
      "conting_norma_ej": "Even if the situation changes, ${n} will likely keep their way of solving things rather than switching it all at once.",
      "patron_null": "Throughout the game, ${n} **decided at a fairly steady pace**: they kept their commitment from start to finish, without starting out unsure or easing off toward the end. It's a lovely sign of consistency in how they get involved with each choice.",
      "patron_null_ej": "When something matters to them, ${n} tends to keep the same dedication from the first moment to the last.",
      "patron_rapido": "resolved faster right in the choices that go with their main driver",
      "patron_lento": "gave themselves a little more time right in the choices that go with their main driver",
      "patron_acople": "Throughout the game, ${n} **decided at varied paces**: ${q}, and adjusted their timing on the rest. That coupling between what they choose and how long they take is a very personal signature, and it tells us something lovely: **when something truly excites them, they respond with ease**.",
      "patron_acople_ej": "Faced with a decision that excites them, they barely think it over; faced with one outside their comfort zone, they take their time.",
      "tormenta_insuf": "In the game's storm scenes we didn't gather enough of ${n}'s choices to read a clear tendency. It's simply a part of the game with less data, nothing more.",
      "tormenta_firme": "When things get complicated, ${n} showed a **clear tendency**: in the storm scenes they leaned again and again toward **${top}**. In a tough moment, that's likely their first go-to, and it's very valuable to know that ahead of time.",
      "tormenta_dos": "When things get complicated, ${n} doesn't fall back on a single formula: **under pressure they tend to have more than one resource**. A lean toward **${top}** shows up, without it being their only way out, and that flexibility is a valuable sign: they can adapt to what each moment calls for.",
      "tormenta_disperso": "When things get complicated, ${n} **read each scene on its own**: in the storm they didn't repeat a single response, but adjusted to what each moment seemed to call for. Today they tend to respond to adversity with flexibility rather than a fixed reaction, and that's a resource too.",
      "grupo_intro_indiv": "In an individual sport, the \"team\" is above all **the group they share the activity with**. ",
      "grupo_low": "${intro}Among ${n}'s drivers, ${costado} today **shows up more in the background**, and it's simply part of their recipe at this moment: it says nothing about their social life or their friendships. Their way of adding to the group today runs **more through doing than through the emotional side**, and when their contribution shows, the bond usually comes afterward. A lovely way to bring ${n} closer is to **give them a role where their drive ${rol}**.",
      "grupo_low_ej": "Inviting ${n} to ${ejEscena} brings ${n} closer to the group from their strength, without pushing them into a place that isn't theirs today.",
      "grupo_words": {
        "costado_indiv": "that social side",
        "costado_equipo": "the bond with the team",
        "rol_indiv": "shows within the group",
        "rol_equipo": "has an impact on the team",
        "esc_indiv": "set the pace of a shared moment in the activity",
        "esc_equipo": "lead the start of a shared play",
        "conquien_indiv": "their group",
        "conquien_equipo": "the team"
      },
      "grupo_partes": {
        "i_fuerte": "a **strong drive to involve and excite** others",
        "i_algo": "some taste for involving others",
        "s_fuerte": "a **clear need for the group to be in harmony**",
        "s_algo": "some care for the group being okay"
      },
      "grupo_present": "In ${n}'s relationship with ${conQuien}, ${partes} shows up. These are different social drivers (involving isn't the same as holding together), and knowing which one weighs more helps in supporting ${n} from where they truly feel at ease.",
      "grupo_present_ej": "Making room for that social side, to the extent it comes naturally, usually helps ${n} feel part of things.",
      "logro": "When ${n} pulls something off, ${anchor}.${ej} That's how they experience it, and that's perfectly fine. Supporting ${n} means helping them also **notice and celebrate what they've achieved** before setting off again.",
      "logro_ej_clause": " It showed clearly in the game, because on reaching the finish they chose **${metaChoice}**.",
      "logro_ejemplo": "After a good result, a simple \"look at everything you accomplished\" helps ${n} give enjoyment its place too.",
      "mal": "When something doesn't go the way they hoped, ${n} ${anchor}. It's their way of processing it, and it has its worth. Supporting ${n} means ${acompanar}.",
      "grupo_join": "; and on the other hand, ",
      "grupo_fallback": "the group shows up now and then"
    },
    "ui": {
      "meter_header": "How defined their profile is today",
      "conectan": "Connect",
      "ruido": "Jar",
      "antes": "Before",
      "durante": "During",
      "despues": "After",
      "adulto": "Responsible adult",
      "edad": "years"
    }
  },
  "pt": {
    "meter_labels": ["Equilibrado", "Com nuances", "Claro", "Por completo"],
    "veta_word": {
      "D": "Impulsionador",
      "I": "Conector",
      "S": "Sustentador",
      "C": "Estrategista"
    },
    "eje_word": {
      "D": {
        "corta": "a ação",
        "larga": "avançar e decidir"
      },
      "I": {
        "corta": "o vínculo com os outros",
        "larga": "conectar e entusiasmar o grupo"
      },
      "S": {
        "corta": "o apoio do grupo",
        "larga": "cuidar do grupo e manter a calma"
      },
      "C": {
        "corta": "o detalhe e o plano",
        "larga": "olhar o plano antes de agir"
      }
    },
    "eje_lead": {
      "D": "avançar, decidir e fazer as coisas acontecerem",
      "I": "conectar, entusiasmar e somar os outros",
      "S": "cuidar do clima do grupo e amparar quem está ao redor",
      "C": "observar, entender e montar um plano antes de agir"
    },
    "receta_ejemplo": {
      "D": "perguntar-se primeiro \"o que faço\" antes de \"com quem faço\"",
      "I": "reparar primeiro em \"com quem faço\" e em como está o grupo",
      "S": "garantir que todos estejam bem antes de começar",
      "C": "querer entender \"qual é a melhor forma de fazer\" antes de se lançar"
    },
    "storm_ejemplo": {
      "D": "Diante de um imprevisto, é provável que aja rápido para resolvê-lo o quanto antes.",
      "I": "Diante de um imprevisto, é provável que busque se apoiar nos outros para seguir em frente.",
      "S": "Diante de um imprevisto, é provável que priorize manter a calma do grupo.",
      "C": "Diante de um imprevisto, é provável que primeiro busque entender o que está acontecendo e só depois aja."
    },
    "success_anchor": {
      "D": "costuma se acender logo rumo ao **próximo objetivo**: curte mais avançar do que parar para saborear o que conquistou",
      "I": "costuma querer **compartilhar e celebrar a conquista com os outros**: vive isso de forma mais plena quando comemora em grupo",
      "S": "costuma se alegrar sobretudo por **a equipe ir bem**, mais do que pelo mérito próprio",
      "C": "costuma querer **revisar como conseguiu** para entender e fazer ainda melhor"
    },
    "meta_choice": {
      "D": "já olhar para o próximo desafio",
      "I": "compartilhar a alegria com os colegas",
      "S": "garantir que toda a equipe estivesse bem",
      "C": "revisar como tinha chegado até ali"
    },
    "mal_anchor": {
      "D": "costuma querer **tentar de novo na hora**, com todo o seu ímpeto: coloca o olhar na próxima tentativa mais do que no que acabou de acontecer",
      "I": "costuma viver isso pelo lado do vínculo: **tende a buscar um olhar de apoio** e a contar o que aconteceu, e se recompõe melhor quando sente o apoio por perto",
      "S": "costuma se preocupar sobretudo com **como isso repercute na equipe**: tende a ficar um tempo em silêncio e a carregar mais do que lhe cabe, porque se importa com o conjunto",
      "C": "costuma querer **entender o que aconteceu**: tende a revisar a jogada e a dar voltas para achar a lógica antes de seguir"
    },
    "mal_acompanar": {
      "D": "**dar logo um próximo passo concreto** e, aos poucos, convidar a olhar por um segundo o que ajustar, sem apagar esse impulso",
      "I": "**começar pelo vínculo antes do conselho**: um gesto carinhoso primeiro, lembrar que o grupo segue ali e que isso não muda em nada o carinho dos outros",
      "S": "**reforçar que a equipe está bem** e ajudar a soltar esse peso a mais que coloca sobre si, com calma e lembrando que isso é de todos",
      "C": "**ajudar a fechar a revisão** quando já chegou ao que importa: lembrar com carinho que nem tudo precisa de uma explicação perfeita, e que voltar a se mover também clareia"
    },
    "mal_ejemplo": {
      "D": "Quando algo não sai para ${n} e já quer ir por mais, ajuda ouvir um \"adoro que você queira seguir, vamos tentar algo diferente da próxima vez\".",
      "I": "Para ${n}, um \"isso não muda nada entre a gente, está tudo igual\", dito antes de qualquer conselho técnico, transforma o momento.",
      "S": "Se ${n} fica em silêncio e como que carregando tudo, ajuda um \"a equipe está bem, isso a gente resolve juntos\", mais do que pedir para falar na hora.",
      "C": "Depois de dar muitas voltas, um \"vamos ficar com uma só coisa para a próxima\" organiza a cabeça de ${n}, melhor do que seguir revisando cada detalhe."
    },
    "context_word": {
      "inicio": "ao começar algo novo",
      "adversidad": "quando a coisa complica",
      "esfuerzo": "quando é preciso sustentar o esforço"
    },
    "section_titles": {
      "receta": "Sua mistura",
      "contingencia": "Como muda conforme a situação",
      "patron": "Seu padrão de decisão",
      "motor": "Seu motor",
      "tormenta": "Diante da tempestade",
      "grupo": "O quanto o grupo importa",
      "logro": "Quando dá certo",
      "combustible": "O que o motiva",
      "palabras": "Palavras que conectam (e as que fazem ruído)",
      "guia": "Antes, durante e depois",
      "reset": "Um reset que funciona",
      "ecos": "Além do esporte",
      "mal": "Quando dá errado"
    },
    "cuantas": {
      "casi_todas": "em quase todas as suas decisões",
      "mayoria": "na maioria de suas decisões",
      "muchas": "em muitas de suas decisões",
      "varias": "em várias de suas decisões",
      "algunas": "em algumas de suas decisões"
    },
    "group_titles": {
      "quien": "Quem é ${n} hoje",
      "cancha": "Como aparece na atividade",
      "acompanar": "Como acompanhar ${n}",
      "masalla": "Além do esporte"
    },
    "lead": {
      "veta_clause": " E por trás desse impulso aparece uma **veia ${vetaLabel}**: em várias cenas também escolheu ${largaSec}.",
      "rotundo": "O jogo de ${n} se apoia **totalmente n${corta}**: escolheu isso ${cuantas}, um sinal muito marcado.${veta} Hoje, seu jeito de estar na atividade passa claramente por aí: ${tail}.",
      "claro": "O jogo de ${n} se apoia **com clareza n${corta}**: foi o que escolheu ${cuantas}.${veta} Hoje, seu jeito de estar na atividade passa por aí: ${tail}.",
      "matices": "O jogo de ${n} se inclina para **${corta}**, com uma presença clara de sua segunda cor.${veta} Hoje tende a se mover por aí, sem que seja sua única nota: ${tail}.",
      "parejo": "${n} joga hoje com **dois motores bem equilibrados**: ${dosCortas}. Não é indefinição, pelo contrário: dispõe de dois registros e tende a escolher conforme o que cada momento pede."
    },
    "footer": "Como ler este relatório. Descreve **como ${n} tende a escolher hoje**, não o que é nem o que poderá chegar a fazer: é uma foto de suas preferências neste momento, não um rótulo. Os perfis mudam com a idade e a experiência, **por isso recomendamos perfilar as crianças novamente a cada 6 meses**. O esporte só muda o cenário para reconhecer o perfil; o que se mede é o mesmo em qualquer atividade.",
    "bodies": {
      "receta_base": "No Argo, cada perfil combina à sua maneira as quatro cores do modelo, e no de ${n} se destaca um ingrediente: **${corta}**, que escolheu ${cuantas}.",
      "receta_presentes": " Bem perto ${verbo2} ${lista}, que ${suman} nuances à sua forma de jogar.",
      "receta_suaves": " ${listaCap}, por outro lado, hoje ${verbo} menos em como decide: são cores que também tem disponíveis e que vão ganhando seu lugar com o tempo.",
      "receta_verbos": {
        "aparece": "aparece",
        "aparecen": "aparecem",
        "suma": "soma",
        "suman": "somam",
        "pesa": "pesa",
        "pesan": "pesam",
        "ytambien": "e também",
        "y": "e"
      },
      "receta_ejemplo": "Diante de uma mesma situação, ${n} tende a ${rec}.",
      "conting_desvio": "Uma das coisas mais bonitas de seu perfil é que **joga diferente conforme o momento e lê o que cada situação pede**. Na maior parte do tempo, ${n} tende a ${conductaPrim}. E ${ctxDesvio}, muda de registro: aí se inclina por **${conductaDesvio}**. Esse contraste é genuinamente seu, e fala de alguém que ajusta sua maneira conforme o que tem pela frente.",
      "conting_desvio_ej": "Em um momento tranquilo se lança sem hesitar; em um mais complicado é capaz de parar um segundo para pensar na melhor saída.",
      "conting_norma": "Algo bonito no perfil de ${n} é sua **consistência**: manteve seu jeito de ${conductaPrim}, mesmo ${ctxs}. Quando algo dá certo, tende a confiar nesse recurso.",
      "conting_norma_ej": "Mesmo que a situação mude, é provável que ${n} mantenha sua forma de resolver em vez de mudá-la de repente.",
      "patron_null": "Ao longo do jogo, ${n} **decidiu em um ritmo bastante constante**: manteve seu compromisso do início ao fim, sem começar hesitando nem afrouxar no final. É um bonito sinal de consistência em como se envolve com cada escolha.",
      "patron_null_ej": "Quando algo importa para ${n}, tende a manter a mesma dedicação do primeiro ao último momento.",
      "patron_rapido": "resolveu mais rápido justamente nas escolhas que combinam com seu motor principal",
      "patron_lento": "levou um pouco mais de tempo justamente nas escolhas que combinam com seu motor principal",
      "patron_acople": "Ao longo do jogo, ${n} **decidiu em ritmos diversos**: ${q}, e ajustou o tempo nas demais. Esse encaixe entre o que escolhe e quanto demora é uma marca muito pessoal, e conta algo bonito: **quando algo empolga de verdade, responde com desenvoltura**.",
      "patron_acople_ej": "Diante de uma decisão que empolga, quase não pensa; diante de uma fora de seu terreno, leva seu tempo.",
      "tormenta_insuf": "Nas cenas de tempestade do jogo não reunimos escolhas suficientes de ${n} para ler uma tendência clara. É simplesmente uma parte do jogo com menos dados, nada mais.",
      "tormenta_firme": "Quando as coisas se complicam, ${n} mostrou uma **tendência clara**: nas cenas de tempestade se inclinou uma e outra vez por **${top}**. Em um momento adverso, é provável que esse seja seu primeiro recurso, e é muito valioso saber disso de antemão.",
      "tormenta_dos": "Quando as coisas se complicam, ${n} não responde com uma fórmula só: **sob pressão costuma ter mais de um recurso**. Aparece uma inclinação por **${top}**, sem que seja sua única saída, e essa flexibilidade é um sinal valioso: consegue se adaptar ao que cada momento pede.",
      "tormenta_disperso": "Quando as coisas se complicam, ${n} **leu cada cena separadamente**: na tempestade não repetiu uma única resposta, e sim ajustou ao que cada momento parecia pedir. Hoje tende a responder ao adverso com flexibilidade, mais do que com uma reação fixa, e isso também é um recurso.",
      "grupo_intro_indiv": "Em um esporte individual, o \"time\" é sobretudo **o grupo com o qual compartilha a atividade**. ",
      "grupo_low": "${intro}Entre os motores de ${n}, ${costado} hoje **aparece mais em segundo plano**, e é simplesmente parte de sua receita deste momento: não diz nada sobre sua vida social nem sobre suas amizades. Sua maneira de somar ao grupo passa hoje **mais pelo fazer do que pelo emocional**, e quando sua contribuição se nota, o vínculo costuma vir depois. Uma bonita forma de aproximar ${n} é **dar um papel onde seu impulso ${rol}**.",
      "grupo_low_ej": "Convidar ${n} a ${ejEscena} aproxima ${n} do grupo a partir de sua força, sem empurrar para um lugar que hoje não é o seu.",
      "grupo_words": {
        "costado_indiv": "esse lado social",
        "costado_equipo": "o vínculo com o time",
        "rol_indiv": "se note dentro do grupo",
        "rol_equipo": "tenha impacto no time",
        "esc_indiv": "marcar o ritmo de um momento compartilhado da atividade",
        "esc_equipo": "liderar o início de uma jogada compartilhada",
        "conquien_indiv": "seu grupo",
        "conquien_equipo": "o time"
      },
      "grupo_partes": {
        "i_fuerte": "um **impulso forte de envolver e empolgar** os demais",
        "i_algo": "certo gosto por envolver os demais",
        "s_fuerte": "uma **clara necessidade de que o grupo esteja em harmonia**",
        "s_algo": "certo cuidado para que o grupo esteja bem"
      },
      "grupo_present": "Na relação de ${n} com ${conQuien} aparece ${partes}. São motores sociais diferentes (envolver não é o mesmo que sustentar), e saber qual pesa mais ajuda a acompanhar ${n} a partir de onde realmente se sente à vontade.",
      "grupo_present_ej": "Dar espaço a esse lado social, na medida em que surge, costuma fazer com que ${n} se sinta parte.",
      "logro": "Quando ${n} consegue algo, ${anchor}.${ej} Vive assim, e tudo bem. Acompanhar ${n} é ajudar também a **registrar e celebrar o que conquistou** antes de recomeçar.",
      "logro_ej_clause": " No jogo se viu com clareza, porque ao chegar à meta escolheu **${metaChoice}**.",
      "logro_ejemplo": "Depois de um bom resultado, um simples \"olha tudo o que você conseguiu\" ajuda ${n} a que o desfrute também tenha seu lugar.",
      "mal": "Quando algo não sai como esperava, ${n} ${anchor}. É o seu jeito de processar isso, e tem o seu valor. Acompanhar ${n} é ${acompanar}.",
      "grupo_join": "; e, por outro lado, ",
      "grupo_fallback": "o grupo aparece de vez em quando"
    },
    "ui": {
      "meter_header": "O quão marcado está seu perfil hoje",
      "conectan": "Conectam",
      "ruido": "Fazem ruído",
      "antes": "Antes",
      "durante": "Durante",
      "despues": "Depois",
      "adulto": "Adulto responsável",
      "edad": "anos"
    }
  }
};

/** Sustituye placeholders ${slot} (literales) por slots[slot]. Deja intactas las **negritas**. */
export function fill(tpl: string, slots: Record<string, string | number>): string {
  return tpl.replace(/\$\{(\w+)\}/g, (_m, k) => String(slots[k] ?? ''));
}

/** Une una lista evitando el choque de "y"/"and"/"e" cuando un ítem ya contiene el conector (por idioma). */
export function listaClara(items: string[], y: string, ytambien: string): string {
  if (items.length <= 1) return items[0] ?? '';
  const re = new RegExp(` ${y} `);
  const sep = items.some((it) => re.test(it)) ? ` ${ytambien} ` : ` ${y} `;
  return `${items.slice(0, -1).join(', ')}${sep}${items[items.length - 1]}`;
}
