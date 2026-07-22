import json

t = json.load(open('/Users/marianonoceti/Desktop/Antigravity/Argo Project/docs/_i18n/report-v4-translations.json'))

# ── ES: transcripto VERBATIM del engine actual (reportV4.ts), interpolaciones -> ${slot} ──
ES = {
  "meter_labels": ["Parejo", "Con matices", "Claro", "De lleno"],
  "veta_word": {"D": "impulsor", "I": "conector", "S": "sostenedor", "C": "estratega"},
  "eje_word": {
    "D": {"corta": "la acción", "larga": "avanzar y decidir"},
    "I": {"corta": "el vínculo con los demás", "larga": "conectar y entusiasmar al grupo"},
    "S": {"corta": "el sostén del grupo", "larga": "cuidar al grupo y sostener la calma"},
    "C": {"corta": "el detalle y el plan", "larga": "mirar el plan antes de actuar"},
  },
  "eje_lead": {
    "D": "avanzar, decidir y hacer que las cosas se muevan",
    "I": "conectar, entusiasmar y sumar a los demás",
    "S": "cuidar el clima del grupo y sostener a quienes lo rodean",
    "C": "observar, entender y armar un plan antes de actuar",
  },
  "receta_ejemplo": {
    "D": 'preguntarse primero "qué hago" antes que "con quién lo hago"',
    "I": 'fijarse primero en "con quién lo hago" y en cómo está el grupo',
    "S": "asegurarse de que todos estén bien antes de arrancar",
    "C": 'querer entender "cómo conviene hacerlo" antes de lanzarse',
  },
  "storm_ejemplo": {
    "D": "Ante un imprevisto, es probable que se mueva rápido para resolverlo cuanto antes.",
    "I": "Ante un imprevisto, es probable que busque apoyarse en los demás para salir adelante.",
    "S": "Ante un imprevisto, es probable que priorice mantener la calma del grupo.",
    "C": "Ante un imprevisto, es probable que primero busque entender qué pasa y recién después se mueva.",
  },
  "success_anchor": {
    "D": "suele encenderse enseguida hacia **el próximo objetivo**: disfruta avanzando más que deteniéndose a saborear lo conseguido",
    "I": "suele querer **compartir y celebrar el logro con los demás**: lo vive más pleno cuando lo festeja en grupo",
    "S": "suele alegrarse sobre todo de que **al equipo le vaya bien**, más que del mérito propio",
    "C": "suele querer **repasar cómo lo logró** para entenderlo y hacerlo todavía mejor",
  },
  "meta_choice": {
    "D": "mirar ya hacia el próximo reto",
    "I": "compartir la alegría con los compañeros",
    "S": "asegurarse de que todo el equipo estuviera bien",
    "C": "repasar cómo había llegado hasta ahí",
  },
  # "Cuando le sale mal" (espejo de "Cuando le sale bien"). Panel de expertos DISC, revisado contra el guard.
  "mal_anchor": {
    "D": "suele querer **volver a intentarlo enseguida**, con todo su empuje: pone la mirada en el próximo intento antes que en lo que acaba de pasar",
    "I": "suele vivirlo por el lado del vínculo: **tiende a buscar una mirada de apoyo** y a contar lo que pasó, y se recompone mejor cuando siente el apoyo cerca",
    "S": "suele preocuparse sobre todo por **cómo repercute en el equipo**: tiende a quedarse un rato en silencio y a cargar con más de lo que le toca, porque le importa el conjunto",
    "C": "suele querer **entender qué pasó**: tiende a repasar la jugada y a darle vueltas para encontrarle la lógica antes de seguir",
  },
  "mal_acompanar": {
    "D": "**darle enseguida un próximo paso concreto** y, de a poco, invitarle a mirar un segundo qué ajustar, sin apagar ese impulso",
    "I": "**empezar por el vínculo antes que por el consejo**: un gesto cálido primero, recordarle que el grupo sigue ahí y que esto no cambia en nada el cariño de los demás",
    "S": "**reasegurarle que el equipo está bien** y ayudarle a soltar ese peso de más que se pone encima, con calma y recordándole que esto es de todos",
    "C": "**ayudarle a cerrar el repaso** cuando ya dio con lo importante: recordarle con cariño que no todo necesita una explicación perfecta, y que volver a moverse también aclara",
  },
  "mal_ejemplo": {
    "D": 'Cuando a ${n} algo no le sale y ya quiere ir por más, le suma escuchar un "me encanta que quieras seguir, probemos algo distinto la próxima".',
    "I": 'A ${n} le cambia el momento un "esto no cambia nada entre nosotros, seguimos igual", dicho antes que cualquier consejo técnico.',
    "S": 'Si ${n} se queda en silencio y como cargando con todo, ayuda un "el equipo está bien, esto lo resolvemos entre todos", más que pedirle que hable enseguida.',
    "C": 'Después de darle muchas vueltas, a ${n} le ordena la cabeza un "quedémonos con una sola cosa para la próxima", mejor que seguir repasando cada detalle.',
  },
  "context_word": {
    "inicio": "al arrancar algo nuevo", "adversidad": "cuando la cosa se complica",
    "esfuerzo": "cuando hay que sostener el esfuerzo",
    "disfrute": "", "decision": "", "espera": "", "equipo": "", "meta": "",
  },
  "section_titles": {
    "receta": "Su mezcla", "contingencia": "Cómo cambia según la situación",
    "patron": "Su patrón de decisión", "motor": "Su motor", "tormenta": "Ante la tormenta",
    "grupo": "Cuánto lo mueve el grupo", "logro": "Cuando le sale bien", "mal": "Cuando le sale mal",
    "combustible": "Qué lo enciende", "palabras": "Palabras que conectan (y las que hacen ruido)",
    "guia": "Antes, durante y después", "reset": "Un reset que funciona", "ecos": "Más allá del deporte",
  },
  # group_titles/footer: usados por el RENDER (ReportV4View), no snapshot-guarded. Reconciliar con la vista (paso 7).
  "group_titles": {
    "quien": "Quién es ${n} hoy", "cancha": "Cómo se le ve en la actividad",
    "acompanar": "Cómo acompañar a ${n}", "masalla": "Más allá del deporte",
  },
  "lead": {
    "veta_clause": " Y detrás de ese empuje asoma una **veta ${vetaLabel}**: en varias escenas también eligió ${largaSec}.",
    "rotundo": "El juego de ${n} se apoya **de lleno en ${corta}**: la eligió en ${top} de sus 12 decisiones, una señal muy marcada.${veta} Hoy, su manera de estar en la actividad pasa claramente por ahí: ${tail}.",
    "claro": "El juego de ${n} se apoya **con claridad en ${corta}**: fue lo que eligió en ${top} de sus 12 decisiones.${veta} Hoy, su manera de estar en la actividad pasa por ahí: ${tail}.",
    "matices": "El juego de ${n} se inclina hacia **${corta}**, con una presencia clara de su segundo color.${veta} Hoy tiende a moverse por ahí, sin que sea su única nota: ${tail}.",
    "parejo": "${n} juega hoy con **dos motores bien parejos**: ${dosCortas}. No es indefinición, al contrario: dispone de dos registros y tiende a elegir según lo que pide cada momento.",
  },
  "footer": "Cómo leer este informe. Describe **cómo tiende a elegir ${n} hoy**, no lo que es ni lo que va a llegar a ser: es una foto de sus preferencias en este momento, no una etiqueta. Los perfiles cambian con la edad y la experiencia, **por eso recomendamos volver a perfilar a los niños cada 6 meses**. El deporte solo cambia el marco para reconocer el perfil; lo que se mide es lo mismo en cualquier actividad.",
  "bodies": {
    "receta_base": "En Argo, cada perfil mezcla a su manera los cuatro colores del modelo, y en el de ${n} se destaca un ingrediente: **${corta}**, que eligió en ${count} de sus 12 decisiones.",
    "receta_presentes": " Muy cerca ${verbo2} ${lista}, que le ${suman} matices a su forma de jugar.",
    "receta_suaves": " ${listaCap}, en cambio, hoy ${verbo} menos en cómo decide: son colores que también tiene disponibles y que irán tomando su lugar con el tiempo.",
    "receta_verbos": {"aparece": "aparece", "aparecen": "aparecen", "suma": "suma", "suman": "suman", "pesa": "pesa", "pesan": "pesan", "ytambien": "y también", "y": "y"},
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
    "grupo_intro_indiv": 'En un deporte individual, el "equipo" es sobre todo **el grupo con el que comparte la actividad**. ',
    "grupo_low": "${intro}Entre los motores de ${n}, ${costado} hoy **aparece más en segundo plano**, y es simplemente parte de su receta de este momento: no dice nada de su vida social ni de sus amistades. Su manera de sumar al grupo pasa hoy **más por el hacer que por lo emocional**, y cuando su aporte se nota, el vínculo suele venir después. Una linda forma de acercar a ${n} es **darle un rol donde su empuje ${rol}**.",
    "grupo_low_ej": "Invitar a ${n} a ${ejEscena} acerca a ${n} al grupo desde su fortaleza, sin empujar a un lugar que hoy no es el suyo.",
    "grupo_words": {
      "costado_indiv": "ese costado social", "costado_equipo": "el vínculo con el equipo",
      "rol_indiv": "se note dentro del grupo", "rol_equipo": "tenga impacto en el equipo",
      "esc_indiv": "marcar el ritmo de un momento compartido de la actividad", "esc_equipo": "liderar el arranque de una jugada compartida",
      "conquien_indiv": "su grupo", "conquien_equipo": "el equipo",
    },
    "grupo_partes": {
      "i_fuerte": "un **empuje fuerte por involucrar y entusiasmar** a los demás", "i_algo": "algo de gusto por involucrar a los demás",
      "s_fuerte": "una **clara necesidad de que el grupo esté en armonía**", "s_algo": "algo de cuidado por que el grupo esté bien",
    },
    "grupo_present": "En la relación de ${n} con ${conQuien} aparece ${partes}. Son motores sociales distintos (involucrar no es lo mismo que sostener), y saber cuál pesa más ayuda a acompañar a ${n} desde donde de verdad se siente a gusto.",
    "grupo_present_ej": "Darle lugar a ese costado social, en la medida en que le nace, suele hacer que ${n} se sienta parte.",
    "logro": "Cuando a ${n} le sale algo, ${anchor}.${ej} Lo vive así, y está muy bien. Acompañar a ${n} es ayudarle a también **registrar y celebrar lo logrado** antes de volver a arrancar.",
    "logro_ej_clause": " En el juego se vio con claridad, porque al llegar a la meta eligió **${metaChoice}**.",
    "logro_ejemplo": 'Después de un buen resultado, un simple "mira todo lo que conseguiste" ayuda a ${n} a que el disfrute también tenga su lugar.',
    "mal": "Cuando algo no le sale como esperaba, ${n} ${anchor}. Es su forma de procesarlo, y tiene su valor. Acompañar a ${n} es ${acompanar}.",
    "grupo_join": "; y, por otro lado, ",
    "grupo_fallback": "el grupo aparece de a ratos",
  },
  # UI micro-copy del render (ReportV4View): etiquetas fijas, no dependen de la ficha.
  "ui": {
    "meter_header": "Qué tan marcado está su perfil hoy",
    "conectan": "Conectan", "ruido": "Hacen ruido",
    "antes": "Antes", "durante": "Durante", "despues": "Después",
    "adulto": "Adulto responsable", "edad": "años",
  },
}

# ── EN/PT: del JSON verificado. copy = léxico+titles+lead+footer; bodies = section_bodies (motor va aparte). ──
VETA_WORD = {
  "en": {"D": "Driver", "I": "Connector", "S": "Sustainer", "C": "Strategist"},
  "pt": {"D": "Impulsionador", "I": "Conector", "S": "Sustentador", "C": "Estrategista"},
}
GRUPO_JOIN = {"en": "; and on the other hand, ", "pt": "; e, por outro lado, "}
GRUPO_FALLBACK = {"en": "the group shows up now and then", "pt": "o grupo aparece de vez em quando"}
UI = {
  "en": {"meter_header": "How defined their profile is today", "conectan": "Connect", "ruido": "Jar",
         "antes": "Before", "durante": "During", "despues": "After", "adulto": "Responsible adult", "edad": "years"},
  "pt": {"meter_header": "O quão marcado está seu perfil hoje", "conectan": "Conectam", "ruido": "Fazem ruído",
         "antes": "Antes", "durante": "Durante", "despues": "Depois", "adulto": "Adulto responsável", "edad": "anos"},
}

def build_lang(lang):
    if lang == "es":
        return ES
    c = t["copy"][lang]
    b = dict(t["bodies"][lang]["section_bodies"])
    b.pop("palabras_nota_suffix", None)  # no usado (palabrasNota viene completo del contenido de eje)
    b["grupo_join"] = GRUPO_JOIN[lang]
    b["grupo_fallback"] = GRUPO_FALLBACK[lang]
    return {
        "meter_labels": c["meter_labels"],
        "veta_word": VETA_WORD[lang],
        "eje_word": c["eje_word"],
        "eje_lead": c["eje_lead"],
        "receta_ejemplo": c["receta_ejemplo"],
        "storm_ejemplo": c["storm_ejemplo"],
        "success_anchor": c["success_anchor"],
        "meta_choice": c["meta_choice"],
        "mal_anchor": c["mal_anchor"],
        "mal_acompanar": c["mal_acompanar"],
        "mal_ejemplo": c["mal_ejemplo"],
        "context_word": c["context_word"],
        "section_titles": c["section_titles"],
        "group_titles": c["group_titles"],
        "lead": c["lead"],
        "footer": c["footer"],
        "bodies": b,
        "ui": UI[lang],
    }

COPY = {L: build_lang(L) for L in ("es", "en", "pt")}

# ── Emisión TS: json.dumps por hoja (double-quoted, escapado; ${slot} queda literal) ──
def emit(v, ind):
    sp = "  " * ind
    if isinstance(v, dict):
        rows = [f'{sp}  {json.dumps(k, ensure_ascii=False)}: {emit(val, ind + 1)}' for k, val in v.items()]
        return "{\n" + ",\n".join(rows) + f"\n{sp}}}"
    if isinstance(v, list):
        return "[" + ", ".join(json.dumps(x, ensure_ascii=False) for x in v) + "]"
    return json.dumps(v, ensure_ascii=False)

header = '''// src/lib/reportV4Copy.ts
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
  group_titles: Record<string, string>;
  lead: { veta_clause: string; rotundo: string; claro: string; matices: string; parejo: string; };
  footer: string;
  bodies: Bodies;
  ui: Ui;
}

export const COPY: Record<Lang, CopyPack> = '''

body = emit(COPY, 0) + ";\n"

footer_ts = '''
/** Sustituye placeholders ${slot} (literales) por slots[slot]. Deja intactas las **negritas**. */
export function fill(tpl: string, slots: Record<string, string | number>): string {
  return tpl.replace(/\\$\\{(\\w+)\\}/g, (_m, k) => String(slots[k] ?? ''));
}

/** Une una lista evitando el choque de "y"/"and"/"e" cuando un ítem ya contiene el conector (por idioma). */
export function listaClara(items: string[], y: string, ytambien: string): string {
  if (items.length <= 1) return items[0] ?? '';
  const re = new RegExp(` ${y} `);
  const sep = items.some((it) => re.test(it)) ? ` ${ytambien} ` : ` ${y} `;
  return `${items.slice(0, -1).join(', ')}${sep}${items[items.length - 1]}`;
}
'''

out = header + body + footer_ts
open('/Users/marianonoceti/Desktop/Antigravity/Argo Project/src/lib/reportV4Copy.ts', 'w').write(out)
print("reportV4Copy.ts:", len(out), "chars")
