/**
 * In-app Help Center content for the tenant dashboard.
 *
 * This is OPERATIONAL help ("how do I do X in this dashboard"), NOT a marketing
 * FAQ. Articles are task-oriented, role-aware (admin vs coach) and plan-aware
 * (trial notes). Mirrors the situationalGuide.ts trilingual pattern:
 *   - helpContent.ts     → Spanish master + types + getters
 *   - helpContent.en.ts  → HELP_ARTICLES_EN
 *   - helpContent.pt.ts  → HELP_ARTICLES_PT
 *
 * Article ids are STABLE identifiers (kebab-case, same across all languages).
 * They double as deep-link anchors, e.g. /dashboard/help#cupo-lleno.
 */

import { HELP_ARTICLES_EN } from './helpContent.en';
import { HELP_ARTICLES_PT } from './helpContent.pt';

export type HelpAudience = 'all' | 'admin' | 'coach';

export interface HelpLink {
    /** Visible label, e.g. "Ir a Jugadores" */
    label: string;
    /** Internal route, e.g. "/dashboard/players" */
    to: string;
}

export interface HelpArticle {
    /** Stable kebab-case id. Same across languages. Used as deep-link anchor. */
    id: string;
    /** Category key (see HELP_CATEGORY_ORDER). */
    category: string;
    /** The question, phrased the way a user would ask it. */
    title: string;
    /** 1-3 sentence answer. Use \n\n for paragraph breaks. */
    body: string;
    /** Optional numbered steps. */
    steps?: string[];
    /** Optional highlighted tip / caveat. */
    tip?: string;
    /** Who sees this article. Defaults to 'all'. */
    audience?: HelpAudience;
    /** Optional note shown only to trial users (e.g. "unlocks on a paid plan"). */
    trialNote?: string;
    /** Optional deep links into the app. */
    links?: HelpLink[];
}

/** Display order of categories in the Help page. */
export const HELP_CATEGORY_ORDER = [
    'getting-started',
    'planteles',
    'players',
    'grupos',
    'coach',
    'guide',
    'account',
] as const;

export const HELP_CATEGORY_LABELS: Record<string, Record<string, string>> = {
    es: {
        'getting-started': 'Primeros pasos',
        'planteles': 'Planteles y entrenadores',
        'players': 'Jugadores y perfiles',
        'grupos': 'Química de grupos',
        'coach': 'Argo Coach',
        'guide': 'Predictor Conductual',
        'account': 'Tu equipo y tu cuenta',
    },
    en: {
        'getting-started': 'Getting started',
        'planteles': 'Teams and coaches',
        'players': 'Players and profiles',
        'grupos': 'Group chemistry',
        'coach': 'Argo Coach',
        'guide': 'Behavioral Predictor',
        'account': 'Your team and account',
    },
    pt: {
        'getting-started': 'Primeiros passos',
        'planteles': 'Plantéis e treinadores',
        'players': 'Jogadores e perfis',
        'grupos': 'Química de grupos',
        'coach': 'Argo Coach',
        'guide': 'Preditor Comportamental',
        'account': 'Sua equipe e conta',
    },
};

export function getHelpCategoryLabel(cat: string, lang: string): string {
    return HELP_CATEGORY_LABELS[lang]?.[cat] ?? HELP_CATEGORY_LABELS.es[cat] ?? cat;
}

/* ── Spanish master ──────────────────────────────────────────────────────────── */

export const HELP_ARTICLES: HelpArticle[] = [
    /* ═══ Primeros pasos ═══ */
    {
        id: 'como-funciona',
        category: 'getting-started',
        title: '¿Cómo funciona Argo en pocas palabras?',
        body: 'Argo convierte una aventura de unos 10 minutos en un perfil conductual del niño, pensado para el adulto que lo acompaña.\n\nEl recorrido es simple: creas un plantel, compartes su link, el niño juega la odisea y, al terminar, su perfil aparece en tu panel y le llega un reporte por email al adulto responsable.',
    },
    {
        id: 'configura-institucion',
        category: 'getting-started',
        title: '¿Cómo configuro los datos de mi institución?',
        body: 'Desde Ajustes defines el nombre, el deporte, el logo y el país de tu institución. Estos datos personalizan el reporte y la experiencia del niño.',
        steps: [
            'Entra a Ajustes desde el menú lateral.',
            'Completa el nombre, el deporte principal, el país y la ciudad.',
            'Si quieres, sube el logo de tu institución.',
            'Guarda con el botón al pie de la tarjeta. Todos los cambios se guardan juntos.',
        ],
        audience: 'admin',
        links: [{ label: 'Ir a Ajustes', to: '/dashboard/settings' }],
    },
    {
        id: 'deporte-bloqueado',
        category: 'getting-started',
        title: '¿Por qué no puedo cambiar el deporte?',
        body: 'El deporte queda fijo en cuanto el primer niño completa su aventura. Es a propósito: las preguntas de la odisea y los perfiles ya generados están ligados a ese deporte, y cambiarlo después dejaría esos reportes sin sentido.\n\nSi necesitas otro deporte, escríbenos y lo vemos contigo.',
        audience: 'admin',
    },
    {
        id: 'primer-plantel',
        category: 'getting-started',
        title: '¿Cómo creo mi primer plantel?',
        body: 'El plantel es la unidad que organiza a tus jugadores y es la dueña del link de juego. Necesitas al menos uno para empezar.',
        steps: [
            'Entra a Planteles desde el menú.',
            'Toca Crear y ponle un nombre (por ejemplo, Sub 12 Fútbol).',
            'Listo: el plantel queda creado y su link se genera solo.',
            'Asigna un entrenador tocando su chip en el plantel (o el chip "Yo" para asignarte) y confirma, o comparte tú mismo el link.',
        ],
        audience: 'admin',
        links: [{ label: 'Ir a Planteles', to: '/dashboard/planteles' }],
    },
    {
        id: 'compartir-link',
        category: 'getting-started',
        title: '¿Cómo comparto el link de juego?',
        body: 'Cada plantel tiene su propio link. Lo encuentras en Inicio, junto al nombre del plantel. Cópialo y compártelo con las familias por el medio que prefieras (mensaje, email, grupo).\n\nCuando un niño termina la aventura, su perfil se asocia solo a tu panel. No tienes que cargar nada a mano.',
        tip: 'Cada link pertenece al plantel, no a una persona. Varios entrenadores pueden compartir el mismo link.',
        links: [{ label: 'Ir a Inicio', to: '/dashboard' }],
    },
    {
        id: 'que-vive-deportista',
        category: 'getting-started',
        title: '¿Qué vive el niño cuando entra al link?',
        body: 'El niño juega una aventura de unos 10 minutos con tema náutico. Responde preguntas y mini juegos sin saber que está dejando ver su forma de decidir y de relacionarse.\n\nNo hay respuestas buenas ni malas, y nunca se siente como un examen. Al final, el reporte le llega al adulto responsable, no al niño.',
    },

    {
        id: 'usar-selector',
        category: 'getting-started',
        title: '¿Cómo cambio de institución o de plantel? (el selector)',
        body: 'Si perteneces a más de una institución, o diriges algún plantel, arriba a la izquierda del menú vas a ver un selector (tu institución con una flecha ⇅).\n\nDesde ahí eliges el contexto en el que estás parado: la institución completa (Administración) o un plantel puntual. Lo que elijas reconfigura todo: los jugadores, las estadísticas, el Predictor, la química y hasta el Argo Coach se enfocan en ese contexto.',
        tip: 'Si solo tienes una institución y ningún plantel asignado, el selector no aparece (no hay nada entre qué cambiar).',
    },
    {
        id: 'varias-instituciones',
        category: 'getting-started',
        title: '¿Puedo pertenecer a varias instituciones?',
        body: 'Sí. Una misma cuenta puede formar parte de varias instituciones (por ejemplo, si entrenas en dos clubes). Cuando un administrador te agrega con tu email, esa institución aparece en tu selector, arriba a la izquierda.\n\nNo necesitas otra cuenta ni otro email: entras con la tuya y cambias de una a otra desde el selector.',
    },

    /* ═══ Planteles y entrenadores ═══ */
    {
        id: 'que-es-plantel',
        category: 'planteles',
        title: '¿Qué es un plantel y por qué tiene su propio link?',
        body: 'Un plantel es la unidad estructural de tu institución (por ejemplo, una categoría o un equipo). Es la dueña del link de juego: cada niño que entra por ese link queda atribuido a ese plantel.\n\nPor eso el link vive en el plantel y no en una persona. Aunque cambien los entrenadores, el plantel y sus jugadores siguen en su lugar.',
        audience: 'admin',
    },
    {
        id: 'crear-renombrar-plantel',
        category: 'planteles',
        title: '¿Cómo creo, renombro o elimino un plantel?',
        body: 'Puedes tener tantos planteles como necesites (por ejemplo, uno por categoría).',
        steps: [
            'Entra a Planteles.',
            'Para crear, toca Crear y escribe el nombre.',
            'Para renombrar, selecciona el plantel y toca el lápiz junto a su nombre.',
            'Para eliminar, usa el menú del plantel y confirma.',
        ],
        audience: 'admin',
        links: [{ label: 'Ir a Planteles', to: '/dashboard/planteles' }],
    },
    {
        id: 'invitar-entrenadores',
        category: 'planteles',
        title: '¿Cómo invito entrenadores y los asigno a un plantel?',
        body: 'Son dos pasos separados. Primero creas al entrenador desde Usuarios (con su email y nivel). Después lo asignas a un plantel desde la sección Planteles, tocando su chip. Cada uno verá solo a los jugadores de sus planteles.',
        steps: [
            'Entra a Usuarios.',
            'Toca Invitar, escribe el email del entrenador y elige el nivel Entrenador.',
            'Envía la invitación. El entrenador recibe un email para crear su contraseña.',
            'Ve a Planteles, abre el plantel y toca el chip del entrenador para asignarlo. Confirma el cambio.',
        ],
        audience: 'admin',
        links: [{ label: 'Ir a Usuarios', to: '/dashboard/users' }, { label: 'Ir a Planteles', to: '/dashboard/planteles' }],
    },
    {
        id: 'admin-vs-entrenador',
        category: 'planteles',
        title: '¿Qué diferencia hay entre un administrador y un entrenador?',
        body: 'El administrador ve toda la institución: crea planteles, invita entrenadores y ve a todos los jugadores.\n\nEl entrenador ve solo a los jugadores de los planteles que le asignaron. Puede compartir su link, ver sus perfiles, crear grupos de química y usar Argo Coach con sus jugadores.',
    },
    {
        id: 'coach-no-ve-planteles',
        category: 'planteles',
        title: 'Soy entrenador y no veo la sección Planteles. ¿Está bien?',
        body: 'Sí, es normal. La gestión de planteles (crearlos y asignar entrenadores) la hace el administrador de la institución.\n\nTú trabajas con los jugadores de los planteles que te asignaron: los ves en Jugadores y su link aparece en Inicio. Si te falta acceso a un plantel, pídeselo al administrador.',
        audience: 'coach',
    },

    {
        id: 'admin-tambien-entrena',
        category: 'planteles',
        title: 'Soy administrador y también dirijo un plantel. ¿Cómo lo hago?',
        body: 'Puedes ser administrador de la institución y, además, entrenador de uno o más planteles. No pierdes nada: sumas el plantel a tu cuenta.',
        steps: [
            'Entra a Planteles y selecciona el plantel que diriges.',
            'En la sección Entrenadores, toca el chip "Yo" para asignarte (tócalo de nuevo para quitarte) y confirma.',
            'Listo: ese plantel aparece en tu selector. Eligiéndolo entras a su vista de entrenador (su link, sus jugadores, su chat).',
            'Para volver a la vista completa, elige "Administración" en el selector.',
        ],
        audience: 'admin',
        links: [{ label: 'Ir a Planteles', to: '/dashboard/planteles' }],
    },
    {
        id: 'cambiar-nivel-miembro',
        category: 'planteles',
        title: '¿Cómo cambio el nivel de un miembro (Administrador o Entrenador)?',
        body: 'Desde Usuarios, cada miembro tiene un selector de nivel. Administrador ve y gestiona toda la institución; Entrenador ve solo sus planteles.',
        steps: [
            'Entra a Usuarios.',
            'En la fila del miembro, cambia el selector entre Administrador y Entrenador.',
            'El cambio es inmediato.',
        ],
        tip: 'Al propietario de la cuenta no se le puede cambiar el nivel (su fila dice "Propietario"). Así la institución siempre conserva un dueño.',
        audience: 'admin',
        links: [{ label: 'Ir a Usuarios', to: '/dashboard/users' }],
    },

    /* ═══ Jugadores y perfiles ═══ */
    {
        id: 'donde-aparecen-jugadores',
        category: 'players',
        title: '¿Dónde veo a los niños que ya jugaron?',
        body: 'En la sección Jugadores. Cada niño que completa la aventura aparece ahí con su perfil, su edad, su deporte y la fecha.\n\nToca una fila para desplegar su perfil completo. Si un niño empezó pero no terminó, figura como pendiente hasta que lo complete.',
        links: [{ label: 'Ir a Jugadores', to: '/dashboard/players' }],
    },
    {
        id: 'entender-arquetipos',
        category: 'players',
        title: '¿Qué significan los 12 perfiles?',
        body: 'Cada perfil combina un eje (cómo decide y se relaciona: Impulsor, Conector, Sostenedor o Estratega) con un motor (su ritmo: Dinámico, Rítmico o Sereno). De ahí salen los 12 perfiles, como Impulsor Dinámico o Estratega Sereno.\n\nNingún perfil es mejor que otro. Dinámico no es mejor que Sereno: solo describen formas distintas de moverse en el mundo. El perfil es una foto del presente, no una etiqueta para siempre.',
    },
    {
        id: 'brujula-palabras',
        category: 'players',
        title: '¿Qué son la brújula secundaria y las palabras puente?',
        body: 'La brújula secundaria es el segundo eje más fuerte del niño: matiza su perfil principal.\n\nLas palabras puente son frases que conectan con él y lo motivan. Las palabras a evitar son las que le generan ruido o resistencia. Te dan una forma concreta de hablarle a cada niño.',
        trialNote: 'Estas secciones se desbloquean al pasar a un plan pago.',
    },
    {
        id: 'descargar-reenviar-reporte',
        category: 'players',
        title: '¿Cómo descargo el reporte o lo reenvío por email?',
        body: 'Despliega el perfil del niño en Jugadores. Al pie encontrarás las opciones para descargar el reporte en PDF o reenviarlo por email al adulto responsable. El reporte se genera en el idioma en el que jugó el niño.',
        steps: [
            'Entra a Jugadores y toca la fila del niño.',
            'Al pie del perfil, usa Descargar PDF o Reenviar reporte.',
            'Para reenviar, confirma el email del adulto.',
        ],
        links: [{ label: 'Ir a Jugadores', to: '/dashboard/players' }],
    },
    {
        id: 'reperfilar',
        category: 'players',
        title: '¿Cómo y cuándo vuelvo a perfilar a un niño?',
        body: 'Los niños crecen y cambian, por eso el perfil se puede actualizar cada 6 meses. Cuando pasa ese tiempo, el jugador muestra un aviso de que conviene re-perfilarlo.\n\nA los 6 meses aparece un botón de re-perfilar en la ficha del jugador. El botón copia un link propio del niño: se lo compartes al adulto responsable y el niño vuelve a jugar. El nuevo perfil se suma a su historial (no borra el anterior) y no ocupa un nuevo cupo.',
        links: [{ label: 'Ir a Jugadores', to: '/dashboard/players' }],
    },
    {
        id: 'jugador-pendiente',
        category: 'players',
        title: 'Un niño figura como pendiente. ¿Qué pasó?',
        body: 'Pendiente significa que empezó la aventura pero no llegó al final. Su lugar queda reservado, pero todavía no hay perfil para ver.\n\nPara completarlo, comparte de nuevo el link con la familia: el niño puede retomar y terminar.',
    },
    {
        id: 'archivar-reactivar',
        category: 'players',
        title: '¿Cómo archivo o reactivo a un jugador?',
        body: 'Archivar a un jugador lo saca de la lista activa y libera un lugar en tu equipo, sin perder su perfil. Puedes reactivarlo cuando quieras, si tienes lugar disponible.',
        steps: [
            'Entra a Jugadores y despliega la fila del niño.',
            'Usa Archivar para sacarlo de la lista activa.',
            'Para recuperarlo, abre la sección de archivados al pie y toca Reactivar.',
        ],
        links: [{ label: 'Ir a Jugadores', to: '/dashboard/players' }],
    },
    {
        id: 'perfil-no-coincide',
        category: 'players',
        title: 'El perfil no coincide con lo que veo en los entrenamientos.',
        body: 'El perfil es una foto de cómo se mostró el niño durante la aventura, en un momento puntual. Es una herramienta de lectura, no una verdad absoluta.\n\nLo más valioso es cruzar ese dato con tu observación de cada día. Si pasaron varios meses, vale la pena volver a perfilarlo: los niños cambian.',
    },

    /* ═══ Química de grupos ═══ */
    {
        id: 'que-es-grupo',
        category: 'grupos',
        title: '¿Qué es la química de grupos y en qué se diferencia de un plantel?',
        body: 'Un plantel es estructural: organiza a tus jugadores y es dueño del link. Un grupo de química es una herramienta de análisis: armas un subconjunto de tus jugadores para ver cómo funcionan juntos.\n\nCada grupo pertenece a un plantel (Sub-12 y Sub-14 son categorías distintas, no se comparan). Para ver o crear grupos, primero elige un plantel en el selector. El grupo no tiene link ni recibe jugadores nuevos: lo creas tú para responder preguntas como, por ejemplo, cómo se complementa tu línea defensiva.',
    },
    {
        id: 'crear-grupo',
        category: 'grupos',
        title: '¿Cómo creo un grupo y agrego jugadores?',
        body: 'Puedes crear tantos grupos como quieras para analizar distintas combinaciones de tus jugadores.',
        steps: [
            'Entra a Química de grupos.',
            'Toca Crear y ponle un nombre al grupo.',
            'Selecciónalo y agrega a los jugadores que quieras analizar.',
            'El análisis se actualiza solo a medida que sumas jugadores.',
        ],
        links: [{ label: 'Ir a Química de grupos', to: '/dashboard/grupos' }],
    },
    {
        id: 'leer-analisis-grupo',
        category: 'grupos',
        title: '¿Cómo leo el análisis de un grupo?',
        body: 'El análisis te muestra el tipo de grupo (por ejemplo, competitivo, social, cohesivo, metódico o balanceado), su nivel de diversidad y las afinidades y posibles fricciones entre perfiles.\n\nNo se trata de buscar el grupo perfecto, sino de entender su dinámica para acompañarlo mejor.',
        trialNote: 'El detalle de afinidades y herramientas se desbloquea al pasar a un plan pago.',
    },

    /* ═══ Argo Coach ═══ */
    {
        id: 'que-es-coach',
        category: 'coach',
        title: '¿Qué es Argo Coach y qué le puedo preguntar?',
        body: 'Argo Coach es un asistente que responde sobre tus jugadores y sobre cómo acompañarlos. Conoce los perfiles de tu equipo, así que puedes preguntarle cosas concretas.\n\nPor ejemplo: cómo motivar a un niño que llega desganado, cómo equilibrar un grupo con perfiles muy distintos, o qué cuidar con un jugador puntual antes de un partido.',
        links: [{ label: 'Ir a Argo Coach', to: '/dashboard/chat' }],
    },
    {
        id: 'coach-datos-limites',
        category: 'coach',
        title: '¿Qué datos ve Argo Coach y qué límites tiene?',
        body: 'Argo Coach ve los perfiles de los jugadores a los que tienes acceso, para darte respuestas personalizadas.\n\nEs una ayuda, no un diagnóstico. Puede equivocarse y no reemplaza tu mirada ni la de un profesional. Úsalo como un punto de partida para pensar, no como la última palabra.',
    },

    /* ═══ Predictor Conductual ═══ */
    {
        id: 'usar-predictor',
        category: 'guide',
        title: '¿Cómo uso el Predictor Conductual antes de un entrenamiento?',
        body: 'El Predictor reúne situaciones habituales del entrenamiento (un niño que no quiere arrancar, uno que se frustra, etc.). Eliges la que te interesa y te muestra qué puede estar pasando y cómo acompañar según el perfil.',
        steps: [
            'Entra a Predictor Conductual.',
            'Busca o filtra por categoría la situación que te interesa.',
            'Léela para entender qué puede estar pasando.',
            'Si quieres, selecciona un jugador para ver la guía adaptada a su perfil.',
        ],
        links: [{ label: 'Ir a Predictor Conductual', to: '/dashboard/guide' }],
    },
    {
        id: 'personalizar-predictor',
        category: 'guide',
        title: '¿Cómo personalizo la guía para un jugador?',
        body: 'Dentro de una situación, puedes elegir a uno de tus jugadores. La guía se adapta a su perfil y te da pasos concretos para acompañarlo en ese caso.',
        trialNote: 'La personalización por jugador se desbloquea al pasar a un plan pago.',
    },

    /* ═══ Tu equipo y tu cuenta ═══ */
    {
        id: 'equipo-x-y',
        category: 'account',
        title: '¿Qué significa Equipo X/Y?',
        body: 'Es la cantidad de jugadores activos (X) sobre el máximo de tu plan (Y). Cada niño perfilado o pendiente ocupa un lugar.\n\nSi llegas al máximo, puedes archivar jugadores para liberar lugar. Archivar no borra el perfil: lo guarda y puedes reactivarlo después.',
        audience: 'admin',
        links: [{ label: 'Ir a Jugadores', to: '/dashboard/players' }],
    },
    {
        id: 'cupo-lleno',
        category: 'account',
        title: 'Mi link dice que el cupo está lleno. ¿Qué hago?',
        body: 'Significa que tu equipo llegó al máximo de jugadores de tu plan. Mientras esté lleno, no se pueden sumar jugadores nuevos por el link.',
        steps: [
            'Entra a Jugadores.',
            'Archiva a los jugadores que ya no estés siguiendo para liberar lugar.',
            'O pasa a un plan con más capacidad cuando lo necesites.',
        ],
        links: [{ label: 'Ir a Jugadores', to: '/dashboard/players' }],
    },
    {
        id: 'prueba-vs-pago',
        category: 'account',
        title: '¿Qué incluye la prueba y qué se desbloquea con un plan pago?',
        body: 'La prueba te da el panel completo, varios jugadores y una cantidad limitada de consultas a Argo Coach, por tiempo limitado.\n\nCon un plan pago se desbloquean las palabras puente y a evitar, la guía rápida, la personalización del Predictor por jugador, el detalle de los grupos y el re-perfilado, además de más capacidad de equipo.',
        audience: 'admin',
        links: [{ label: 'Ver planes', to: '/dashboard/pricing' }],
    },
    {
        id: 'cancelar-eliminar',
        category: 'account',
        title: '¿Cómo cancelo la suscripción o elimino mi cuenta?',
        body: 'Ambas opciones están en Ajustes y solo las puede hacer el titular de la cuenta.\n\nAl cancelar, el panel pasa a modo lectura pero tus datos se conservan. Al eliminar la cuenta, se cancela la suscripción y se borra el acceso. Son acciones sensibles, así que conviene estar seguro antes de confirmar.',
        audience: 'admin',
        links: [{ label: 'Ir a Ajustes', to: '/dashboard/settings' }],
    },
    {
        id: 'cambiar-idioma',
        category: 'account',
        title: '¿Cómo cambio el idioma del panel?',
        body: 'Puedes elegir entre español, inglés y portugués. El cambio afecta a todo tu panel.',
        steps: [
            'Entra a Ajustes.',
            'Elige el idioma (Español, English o Português).',
            'Guarda. El panel se actualiza al instante.',
        ],
        links: [{ label: 'Ir a Ajustes', to: '/dashboard/settings' }],
    },
];

/* ── Localized getter ────────────────────────────────────────────────────────── */

export function getHelpArticles(lang: string): HelpArticle[] {
    if (lang === 'en') return HELP_ARTICLES_EN;
    if (lang === 'pt') return HELP_ARTICLES_PT;
    return HELP_ARTICLES;
}
