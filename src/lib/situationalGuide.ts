/**
 * Situational Guide. 22 situations × 4 DISC profiles (the group situation has no per-profile cards).
 * Zero AI tokens. All content pre-written and curated.
 *
 * Reviewed by psychologist. Principles:
 * - Validate the emotion first, then offer tools
 * - Never pressure the child to stay/perform
 * - Connect with Motor when relevant
 * - Language: plain, coach-to-coach, no jargon
 */

export interface Situation {
    id: string;
    title: string;
    whatYouSee: string;
    whatsHappening: string;
    profilePerspectives?: string; // Fluid paragraph with {{Impulsor}}, {{Conector}}, {{Sosten}}, {{Estratega}} markers
    category: string;
    icon: string;
}

export interface SituationCard {
    situationId: string;
    eje: 'D' | 'I' | 'S' | 'C' | 'group'; // 'group' for situation 15
    whatYouSeeForProfile?: string;       // Eje-specific "what you see". falls back to generic if empty
    whatsHappeningForProfile: string;
    howToAccompany: string[];
    ifNotResponding: string;
}

/* ── The 22 situations ─────────────────────────────────────────────────────── */

export const SITUATIONS: Situation[] = [
    {
        id: 'no-quiere-arrancar',
        title: 'Le cuesta entrar en la actividad',
        whatYouSee: 'El jugador llega a la actividad y no quiere participar. Está apático, se queja, se sienta al costado o dice "hoy no tengo ganas".',
        whatsHappening: 'No es falta de compromiso. El niño todavía está en el "modo" de lo que estaba haciendo antes (el colegio, la casa, una pelea con un amigo). Necesita un momento para hacer el cambio de chip hacia el deporte.',
        profilePerspectives: 'Si el jugador tiene perfil {{Impulsor}}, puede que no vea un desafío que lo motive a arrancar. necesita sentir que lo que viene vale la pena. Si es {{Conector}}, probablemente le falte la conexión social: si su amigo no vino o el clima del grupo está raro, le cuesta engancharse. Un perfil {{Sosten}} puede necesitar más tiempo para hacer la transición, sobre todo si algo de la rutina cambió. Y si es {{Estratega}}, tal vez esté procesando algo que pasó antes y necesita cerrar esa idea antes de poder enfocarse en otra cosa.',
        category: 'Motivación',
        icon: '',
    },
    {
        id: 'se-frustra-cuando-pierde',
        title: 'Se frustra mucho cuando pierde',
        whatYouSee: 'El jugador reacciona con enojo, se pone mal, a veces tira cosas o se niega a seguir después de perder un punto, un partido o un ejercicio.',
        whatsHappening: 'Siente que perder borra todo el esfuerzo que hizo. En ese momento no puede separar "me fue mal en esta jugada" de "soy malo". La emoción tapa el aprendizaje. Lo primero es validar lo que siente antes de intentar explicar la jugada.',
        profilePerspectives: 'Un {{Impulsor}} puede reaccionar con bronca visible porque perder le pega directo en su necesidad de ganar y controlar. El {{Conector}} tiende a frustrarse más si siente que decepcionó al grupo o a alguien que lo estaba mirando. El {{Sosten}} puede guardarse la frustración y mostrarla después, de forma más silenciosa pero sostenida. Y el {{Estratega}} probablemente se enoje consigo mismo porque ya había anticipado qué hacer y siente que falló en la ejecución.',
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'no-hace-lo-que-pido',
        title: 'Procesa las consignas a su propio ritmo',
        whatYouSee: 'Das una instrucción y el jugador hace otra cosa, se demora mucho en arrancar, o parece que no escuchó.',
        whatsHappening: 'No te está ignorando. Cada niño procesa las instrucciones a su propio ritmo. Algunos actúan antes de terminar de escuchar, otros necesitan más tiempo para entender la lógica de lo que les pediste. Es una diferencia de velocidad de procesamiento, no de actitud.',
        profilePerspectives: 'El {{Impulsor}} puede que ya haya salido a ejecutar antes de que termines de hablar. su motor lo empuja a la acción antes que a la escucha. El {{Conector}} tal vez estaba hablando con un compañero y se perdió la instrucción. Un {{Sosten}} puede que haya escuchado perfecto pero necesite un momento más para sentirse seguro antes de arrancar. Y el {{Estratega}} probablemente esté analizando si la instrucción tiene sentido antes de moverse. no es resistencia, es su forma de procesar.',
        category: 'Comunicación',
        icon: '',
    },
    {
        id: 'raro-antes-del-partido',
        title: 'Vive con tensión la previa del partido',
        whatYouSee: 'El jugador está más callado o más inquieto de lo normal antes de competir. Puede estar nervioso, ir al baño muchas veces, o al revés, estar hiperactivo y no parar de moverse.',
        whatsHappening: 'Siente que las expectativas son altas (las propias o las de afuera) y su cuerpo reacciona ante la incertidumbre de lo que va a pasar. Cada perfil lo muestra distinto: unos se cierran, otros se aceleran.',
        profilePerspectives: 'El {{Impulsor}} puede ponerse hiperactivo, hablar mucho y moverse sin parar. es su forma de canalizar la adrenalina. El {{Conector}} tiende a buscar a alguien cerca y hablar de cualquier cosa para sentirse acompañado. Un {{Sosten}} puede quedarse muy callado y necesitar que le confirmes que todo va a estar bien. Y el {{Estratega}} probablemente esté repasando mentalmente cada jugada posible. su silencio no es nervios, es preparación.',
        category: 'Presión',
        icon: '',
    },
    {
        id: 'mira-desde-afuera',
        title: 'Se queda mirando desde afuera',
        whatYouSee: 'El jugador no se suma al grupo. Se queda en el borde de la cancha observando, especialmente cuando es un ejercicio nuevo o un grupo que no conoce bien.',
        whatsHappening: 'Está haciendo un "escaneo" del terreno. Necesita entender cómo funciona la dinámica antes de meterse. No es timidez ni cobardía. es su forma de prepararse para participar con seguridad.',
        profilePerspectives: 'Si es {{Impulsor}}, probablemente no esté mirando desde afuera por miedo sino porque todavía no encontró el momento para entrar con protagonismo. El {{Conector}} puede estar esperando que alguien lo invite o lo incluya. necesita la señal social. Un {{Sosten}} está evaluando si el entorno es predecible y seguro antes de exponerse. Y el {{Estratega}} está literalmente estudiando la dinámica: quién hace qué, cómo funciona el ejercicio, cuáles son las reglas implícitas.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'llora-o-se-enoja',
        title: 'Se desborda emocionalmente en la actividad',
        whatYouSee: 'El jugador se quiebra emocionalmente durante una actividad. Puede ser llanto, enojo, o ambos. A veces es después de una corrección, a veces parece "de la nada".',
        whatsHappening: 'Se le juntó todo: el cansancio, el ruido, las correcciones, la exigencia del ejercicio. Su sistema se saturó y la emoción se desbordó. No es un capricho. es que en ese momento la demanda superó lo que podía procesar.',
        profilePerspectives: 'El {{Impulsor}} tiende a desbordarse con enojo. grita, patea algo, se queja en voz alta. Es su forma de soltar la presión rápido. El {{Conector}} puede llorar si siente que lo corrigieron frente al grupo o si alguien lo excluyó. Un {{Sosten}} probablemente venga acumulando hace rato y el quiebre sea la gota que rebalsó el vaso. su desborde suele sorprender porque antes no mostraba señales. El {{Estratega}} puede enojarse consigo mismo en silencio y necesitar un momento a solas para reordenarse.',
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'roce-con-companero',
        title: 'Tiene un roce con un compañero',
        whatYouSee: 'Dos jugadores chocan durante un ejercicio. Puede ser una discusión, una queja, o simplemente que no logran trabajar juntos.',
        whatsHappening: 'Cada niño tiene un estilo natural de encarar las cosas. Cuando dos estilos muy distintos se encuentran sin mediación, se genera fricción. No es que uno tenga razón y el otro no. son ritmos y enfoques diferentes.',
        profilePerspectives: 'Si hay un {{Impulsor}} en el roce, es probable que quiera imponer su idea o su ritmo. no por malo, sino porque su naturaleza es liderar. El {{Conector}} puede tomárselo personal y sentirse rechazado por el compañero. Un {{Sosten}} probablemente intente evitar el conflicto hasta que ya no pueda más, y ahí reaccione de golpe. Y el {{Estratega}} puede frustrarse si siente que el otro no está siguiendo la lógica correcta del ejercicio.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'se-castiga',
        title: 'Se castiga a sí mismo cuando falla',
        whatYouSee: 'Después de un error, el jugador se golpea la cabeza, se insulta, dice "soy un desastre" o se enoja consigo mismo de forma exagerada.',
        whatsHappening: 'Mide su valor personal en función de la perfección del movimiento. Cada error lo siente como una prueba de que "no sirve". La autoexigencia se le fue de las manos y entró en un circuito de castigo que no lo deja seguir jugando bien.',
        profilePerspectives: 'El {{Impulsor}} se castiga porque necesita sentirse capaz y el error amenaza esa imagen. su reacción suele ser rápida, intensa y visible. El {{Conector}} puede castigarse pensando en lo que los demás piensan de él después del error. Un {{Sosten}} tiende a castigarse en silencio, rumiando internamente. Y el {{Estratega}} puede ser el más duro consigo mismo porque ya había calculado qué hacer y siente que "debería haberlo hecho bien".',
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'se-distrae',
        title: 'Le cuesta sostener la atención',
        whatYouSee: 'El jugador mira para otro lado, habla con el de al lado, juega con algo que no tiene nada que ver, o simplemente no está "presente" en el ejercicio.',
        whatsHappening: 'La actividad no está sintonizando con su ritmo. Puede ser que el ejercicio sea demasiado lento para su motor (se aburre) o demasiado caótico para su estilo (se desconecta). La distracción es una señal de que algo del formato no le está llegando.',
        profilePerspectives: 'El {{Impulsor}} se distrae cuando el ejercicio es demasiado lento o repetitivo. necesita más intensidad o competencia para mantenerse enganchado. El {{Conector}} puede distraerse socializando porque para él hablar con el compañero ES estar presente. su atención funciona diferente. Un {{Sosten}} se desconecta cuando hay demasiado caos, ruido o cambios. necesita previsibilidad para enfocarse. Y el {{Estratega}} puede parecer distraído cuando en realidad está pensando en otra cosa: una jugada anterior, un patrón que detectó, algo que le llamó la atención.',
        category: 'Concentración',
        icon: '',
    },
    {
        id: 'quiere-dejar',
        title: 'Dice que quiere dejar el deporte',
        whatYouSee: 'El jugador dice que no quiere venir más, que no le gusta, o simplemente deja de aparecer.',
        whatsHappening: 'El esfuerzo emocional que le cuesta adaptarse al entorno deportivo se volvió más grande que lo que disfruta. No es que no le guste el deporte. es que algo del contexto lo está agotando más de lo que lo llena. El objetivo no es convencerlo de quedarse a toda costa, sino ajustar el entorno para ver si el disfrute puede volver.',
        profilePerspectives: 'Un {{Impulsor}} puede querer dejar si siente que no tiene espacio para liderar o que el nivel de desafío no lo motiva. El {{Conector}} tiende a irse cuando siente que no pertenece al grupo o que la dinámica social lo deja afuera. Un {{Sosten}} puede querer dejar si los cambios constantes o la presión lo agotan. necesita estabilidad para disfrutar. Y el {{Estratega}} puede desconectarse si siente que nadie valora su forma de ver el juego o si la actividad le parece demasiado caótica.',
        category: 'Motivación',
        icon: '',
    },
    {
        id: 'jugador-nuevo',
        title: 'Llega un jugador nuevo al grupo',
        whatYouSee: 'Se incorpora un jugador que no conoce a nadie. El grupo reacciona: algunos lo reciben bien, otros lo ignoran, otros se sienten incómodos con el cambio.',
        whatsHappening: 'La llegada de alguien nuevo altera el equilibrio que el grupo ya tenía. Los jugadores que valoran la estabilidad sienten que se rompió algo. Los que son más sociales probablemente lo reciban rápido. Cada perfil vive el cambio distinto.',
        profilePerspectives: 'El {{Impulsor}} probablemente lo reciba bien si ve que el nuevo puede ser un aliado o un rival interesante. lo mide rápido. El {{Conector}} puede ser el primero en acercarse y hacerlo sentir bienvenido. es su naturaleza integradora. Un {{Sosten}} puede sentirse incómodo con el cambio en la dinámica del grupo y necesitar tiempo para adaptarse. Y el {{Estratega}} va a observar al nuevo desde lejos antes de interactuar. no es rechazo, es su forma de entender quién es.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'se-congela',
        title: 'Se congela en el partido',
        whatYouSee: 'Un jugador que en el entrenamiento rinde bien, en el partido parece otro: no corre, no pide la pelota, no reacciona. Como si se hubiera "apagado".',
        whatsHappening: 'La presión del partido activó un mecanismo de protección. Frente a la mirada del público o la importancia del momento, su cuerpo elige "no hacer nada" para evitar equivocarse. No es que no quiera. es que se bloqueó.',
        profilePerspectives: 'El {{Impulsor}} se congela cuando siente que hay demasiado en juego y no puede permitirse fallar. la presión le frena el motor en vez de acelerarlo. El {{Conector}} puede bloquearse si siente que la mirada del público o de sus padres lo está evaluando. Un {{Sosten}} tiende a congelarse cuando la situación se siente impredecible o caótica. necesita un ancla de seguridad. Y el {{Estratega}} puede paralizarse por exceso de análisis: ve demasiadas opciones y no logra elegir una a tiempo.',
        category: 'Presión',
        icon: '',
    },
    {
        id: 'no-quiere-ser-centro',
        title: 'No quiere ser el centro de atención',
        whatYouSee: 'Cuando toca liderar una actividad, hablar frente al grupo, o hacer una demostración solo, el jugador se niega, se esconde o se pone muy incómodo.',
        whatsHappening: 'Su forma natural de participar es desde un lugar más reservado. Obligarlo a ser el centro de atención es como pedirle a un zurdo que escriba con la derecha: puede hacerlo, pero lo pasa mal. Hay formas de liderazgo que no requieren estar en el centro.',
        profilePerspectives: 'Un {{Impulsor}} en realidad suele querer estar al centro, así que si se resiste puede ser por otra cosa: inseguridad puntual o cansancio. El {{Conector}} puede querer participar pero le da vergüenza hacerlo solo. funciona mejor en compañía. Un {{Sosten}} genuinamente prefiere el segundo plano y se siente expuesto cuando lo ponen al frente. puede liderar desde el apoyo, no desde el escenario. Y el {{Estratega}} puede sentir que hablar frente a todos lo obliga a improvisar, algo que le genera incomodidad. dale un momento para prepararse y responde diferente.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'cambio-repentino',
        title: 'Cambió de un día para el otro',
        whatYouSee: 'Un jugador que siempre fue de una manera de repente está distinto: callado, irritable, o desconectado. Y no vuelve a su estado normal.',
        whatsHappening: 'Algo fuera de la cancha lo está afectando: puede ser la escuela, la casa, una situación familiar, una dificultad con amigos. El cambio de comportamiento sostenido es una señal de que algo externo está drenando su energía emocional.',
        profilePerspectives: 'Un {{Impulsor}} que de repente está apagado es una señal clara de que algo pasa. su naturaleza es estar activo, y la ausencia de esa energía es significativa. El {{Conector}} puede volverse callado o aislarse del grupo cuando algo externo lo afecta. Un {{Sosten}} puede mostrar irritabilidad o resistencia donde antes había calma. el cambio suele ser sutil pero persistente. Y un {{Estratega}} que se desconecta puede estar procesando algo internamente que lo absorbe por completo.',
        category: 'Observación',
        icon: '',
    },
    {
        id: 'derrota-grupal',
        title: 'Al equipo le cuesta recuperarse de una derrota',
        whatYouSee: 'Después de una derrota, el grupo entero está desanimado. Nadie habla, o todos se culpan entre sí. El clima se pone pesado.',
        whatsHappening: 'El equipo como grupo dejó de ver el proceso y se quedó pegado en el resultado. La derrota se siente colectiva y eso pesa más que cuando pierde un solo jugador. El grupo necesita volver a conectar con lo que los une más allá del marcador.',
        category: 'Grupal',
        icon: '',
    },
    {
        id: "acepta-ser-suplente",
        title: "Le cuesta aceptar ser suplente",
        whatYouSee: "El jugador queda en el banco y se le nota. Baja la mirada, se cierra, responde corto o desde el costado muestra fastidio o desgano mientras espera su momento.",
        whatsHappening: "A esta edad, el niño todavía no separa del todo entre ser titular y valer como persona. No estar en cancha no lo vive como una etapa o una decisión técnica, lo vive como un mensaje sobre cuánto importa para ti y para el grupo. No se está quejando del rol, está cuidando su lugar. Necesita que alguien le confirme que sigue siendo parte y que esto no define quién es.",
        profilePerspectives: "Cada niño guarda este momento a su manera. El {{Impulsor}} lo siente como una pérdida de control y de protagonismo, le cuesta quedarse quieto viendo a otros jugar y puede mostrar impaciencia o intensidad desde el banco. El {{Conector}} teme haber decepcionado, mira al grupo y se pregunta si todavía lo quieren ahí, y necesita sentirse incluido aunque no entre. El {{Sosten}} guarda el malestar en silencio, parece que lo acepta sin problema, pero por dentro lo acumula y puede aparecer más tarde como desánimo. El {{Estratega}} le da vueltas, busca la razón exacta de por qué él y no otro, y si no entiende el criterio puede quedarse trabado pensando que algo hizo mal.",
        category: "Rol",
        icon: '',
    },
    {
        id: "companero-se-destaca",
        title: "Le cuesta cuando un compañero se destaca",
        whatYouSee: "Un compañero recibe felicitaciones, lo eligen o marca la diferencia en una jugada, y el niño se apaga. Pone mala cara, minimiza el logro del otro (\"igual tuvo suerte\"), se queja del reparto de protagonismo o baja la intensidad el resto de la actividad.",
        whatsHappening: "No es egoísmo ni mala intención. A esta edad el niño todavía mide su valor comparándose con los demás, así que cuando otro brilla siente que su propio lugar se achica. Lo que aparece (celos, fastidio, desmotivación) es en realidad miedo a no ser suficiente. Necesita ayuda para entender que el otro puede destacarse sin que eso le reste a él.",
        profilePerspectives: "Cada perfil vive esta comparación a su manera. El {{Impulsor}} la siente como una competencia directa por el primer puesto: si el otro brilla, él lo lee como una derrota y reacciona rápido, queriendo demostrar de inmediato que él también puede. El {{Conector}} sufre sobre todo el desplazamiento social: le duele que la atención y el cariño del grupo se vayan hacia otro, y puede tomarlo como que ya no lo quieren igual. El {{Sosten}} suele guardarse el malestar en silencio, baja un cambio y se corre al segundo plano, hasta que el fastidio acumulado aparece más tarde de golpe. Y el {{Estratega}} entra en bucle analizando por qué el otro lo hizo mejor, comparándose punto por punto y siendo durísimo consigo mismo en esa cuenta interna.",
        category: "Social",
        icon: '',
    },
    {
        id: "recibe-correccion",
        title: "Le cuesta recibir una corrección",
        whatYouSee: "Cada vez que le marcas algo para mejorar, el jugador se cierra, se justifica, pone cara de fastidio o se desinfla. La corrección técnica le cambia el ánimo más de lo que esperarías.",
        whatsHappening: "No está desafiando tu autoridad ni le falta humildad. A esta edad muchos niños todavía no separan lo que hacen de lo que son, así que escuchan \"esto se puede mejorar\" y por dentro sienten \"no soy suficiente\". La reacción que ves (justificarse, ofenderse, apagarse) es una manera de protegerse de ese golpe a su valor. Cuando entiende que la corrección habla del gesto y no de su persona, la puerta se abre.",
        profilePerspectives: "Cada niño protege su valor a su manera. El {{Impulsor}} suele leer la corrección como una pérdida de control o de estatus, así que se justifica rápido o discute para no quedar por debajo. El {{Conector}} la vive en clave de vínculo: siente que te decepcionó o que quedó expuesto frente al grupo, y eso le pega más que la técnica en sí. El {{Sosten}} la encaja en silencio, asiente para evitar el roce, pero por dentro se guarda el malestar y puede desinflarse más tarde. El {{Estratega}} se pone duro consigo mismo, le da vueltas al detalle y se traba analizando todo lo que hizo, y le cuesta soltar el error para seguir.",
        category: "Comunicación",
        icon: '',
    },
    {
        id: "gestiona-exito",
        title: "Se le sube cuando le va bien",
        whatYouSee: "Cuando le va bien (mete un gol, gana o lo elogian) le cambia la actitud. Se relaja, baja el esfuerzo, se desentiende del equipo o empieza a subestimar al rival.",
        whatsHappening: "No es soberbia ni falta de respeto. El niño todavía no tiene las herramientas internas para sostener una emoción tan grande sin desbordarse, y el éxito lo llena de una intensidad que no sabe bien dónde poner. A esta edad, la euforia es tan difícil de regular como la frustración, y casi siempre se expresa hacia afuera. Aprender a gestionar lo bueno es parte del mismo proceso que aprender a sostener lo difícil.",
        profilePerspectives: "Cada perfil vive la euforia a su manera. El {{Impulsor}} se enciende rápido y necesita que su logro se note, así que el éxito puede llevarlo a aflojar porque ya siente que ganó y que el desafío terminó. El {{Conector}} disfruta el reconocimiento del grupo y, llevado por la emoción, puede acaparar el momento buscando que todos celebren con él y perder de vista al resto del equipo. El {{Sosten}} suele vivir el éxito más callado, pero por dentro lo guarda y a veces se relaja de más al sentir que la presión bajó. El {{Estratega}} analiza su buen rendimiento y puede convencerse de que ya entendió todo, bajando la guardia porque siente que no le queda nada por mejorar.",
        category: "Emocional",
        icon: '',
    },
    {
        id: "rol-referente",
        title: "Le cuesta asumir un rol de referente",
        whatYouSee: "El grupo o tú lo señalan como referente o capitán, y el jugador se incomoda. Evita el rol, lo minimiza, se pone tenso cuando tiene que dar el ejemplo, o lo ejerce de una forma que no le sale natural.",
        whatsHappening: "No es que no pueda liderar. Es que el lugar que le proponen le queda grande o le queda ajeno, y siente el peso de la responsabilidad antes de tener claro cómo ocuparlo. Liderar no es una sola forma, y este niño todavía está descubriendo la suya. La incomodidad es una señal de respeto por el rol, no de falta de capacidad.",
        profilePerspectives: "Cada jugador vive el rol de referente desde su naturaleza. El {{Impulsor}} suele aceptarlo rápido porque le gusta estar al frente, aunque puede confundir liderar con mandar, y le cuesta cuando el grupo no lo sigue al ritmo que él marca. El {{Conector}} lidera desde el vínculo y quiere que todos estén bien, así que el peso le llega cuando siente que tiene que elegir o ponerles un límite a sus compañeros. El {{Sosten}} suele preferir el segundo plano y teme quedar demasiado expuesto, aunque ya sostiene al grupo de formas silenciosas que casi nadie nombra. El {{Estratega}} duda porque siente que todavía no entiende del todo qué se espera de él, y prefiere esperar antes que ejercer el rol a medias o equivocarse delante de todos.",
        category: "Rol",
        icon: '',
    },
    {
        id: "expectativa-padres",
        title: "Carga con la expectativa de los padres",
        whatYouSee: "El jugador mira seguido hacia la tribuna durante la actividad (partido o entrenamiento). Se tensiona cuando los padres están presentes y juega distinto: más nervioso, más rígido o pendiente de cómo lo ven desde afuera.",
        whatsHappening: "El niño todavía está aprendiendo a jugar para sí mismo y no para otros. Siente que su rendimiento decide algo importante para los adultos que más quiere, y esa carga le pesa más que cualquier rival. No es que le importe demasiado lo que piensan: todavía no aprendió a separar su propio deseo de jugar del deseo que sus padres ponen sobre él.",
        profilePerspectives: "Cada niño carga esta expectativa a su manera. El {{Impulsor}} la transforma en una presión por ganar a toda costa: si falla, siente que decepcionó y reacciona con bronca o exigiéndose de más para demostrar que puede. El {{Conector}} lo vive como un tema de vínculo: necesita que sus padres estén orgullosos y se desinfla apenas percibe una cara seria en la tribuna, porque para él jugar bien y ser querido se mezclan. El {{Sosten}} se guarda la tensión por dentro, no la muestra, sigue jugando callado pero más rígido, hasta que la carga acumulada le aparece de golpe en un mal día. El {{Estratega}} se mete en su cabeza: analiza qué esperan de él, se autoexige el doble y termina jugando trabado por miedo a no estar a la altura de lo que cree que los adultos quieren ver.",
        category: "Presión",
        icon: '',
    },
    {
        id: "sube-categoria",
        title: "Le cuesta adaptarse al subir de categoría",
        whatYouSee: "El jugador subió a una categoría superior y se lo nota distinto. Participa menos, busca menos la pelota, se queda callado o se cuelga de los compañeros que ya conocía. A veces se compara en voz alta con los más grandes.",
        whatsHappening: "No perdió su nivel. En su categoría anterior era una referencia y ahora es el más nuevo entre jugadores más grandes, rápidos y físicos. Esa sensación de empezar de cero le toca la confianza y necesita tiempo para reubicarse y volver a sentirse parte. La transición es de identidad, no solo de juego.",
        profilePerspectives: "Cada niño vive este salto desde su forma de funcionar. El {{Impulsor}} siente que ya no es el que marca el ritmo y, al perder ese lugar de referencia, puede tapar la inseguridad detrás de enojo o de competir de más para recuperar protagonismo. El {{Conector}} vive sobre todo el costado social: dejó atrás a su grupo y todavía no encontró su lugar entre los nuevos, así que se siente solo aunque esté rodeado de gente. El {{Sosten}} se desestabiliza con el cambio de rutina y de caras conocidas, se repliega al segundo plano y sostiene la incomodidad en silencio hasta que un día le pesa de golpe. El {{Estratega}} se mete para adentro a leer todo lo nuevo (el ritmo, los códigos, dónde encaja) y, mientras procesa, puede parecer apagado o dudar antes de jugar porque todavía no entiende del todo el escenario.",
        category: "Rol",
        icon: '',
    },
];

/* ── The 85 cards (21 individual × 4 DISC + 1 group) ───────────────────────── */

export const SITUATION_CARDS: SituationCard[] = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. No quiere arrancar
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-quiere-arrancar',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor suele necesitar sentir que lo que viene vale la pena. Si no ve un desafío claro, la transición tiende a costarle más. Su motor lo empuja a la acción, pero solo cuando el objetivo lo motiva.',
        howToAccompany: [
            'Proponle un mini-desafío personal para los primeros 5 minutos: "A ver si hoy arrancas más rápido que la última vez".',
            'Dale un rol activo desde el inicio: que arme los conos, que elija el primer ejercicio, que lidere el calentamiento.',
        ],
        ifNotResponding: 'Déjalo mirar los primeros minutos sin presionarlo. Cuando vea al grupo en acción, su instinto competitivo suele activarse solo.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector suele necesitar conexión social para activarse. Si llegó solo, si su amigo no vino, o si el clima del grupo está raro, tiende a costarle engancharse. Su energía se enciende con las personas, no con la actividad en sí.',
        howToAccompany: [
            'Acércate y pregúntale algo personal: "¿Cómo estuvo el día?". Esa micro-conexión es su interruptor de encendido.',
            'Ponlo al lado de alguien con quien tenga afinidad para el primer ejercicio.',
        ],
        ifNotResponding: 'Súmalo a una actividad grupal divertida (no técnica). Un juego de calentamiento donde se ría suele ser suficiente para que entre.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén suele necesitar que todo esté "en su lugar" para sentirse seguro. Si la actividad cambió de horario, si hay gente nueva, o si algo en su rutina se alteró, la transición tiende a hacerse más pesada. Su motor más lento hace que el cambio de chip le tome más tiempo.',
        howToAccompany: [
            'Mantenlo en la rutina: que haga el mismo calentamiento de siempre, en el mismo lugar, con los mismos compañeros.',
            'No le pidas que explique por qué no quiere. Simplemente dale un par de minutos y dile: "Arrancamos cuando estés listo".',
        ],
        ifNotResponding: 'Dale una tarea pequeña y predecible ("Hazme 10 toques de pelota aquí al lado") para que entre en el ritmo sin saltar al grupo directamente.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega suele necesitar entender qué va a pasar antes de comprometerse. Si no sabe qué van a hacer en la actividad, o si el plan cambió sin explicación, tiende a quedarse afuera procesando. Su motor de procesamiento necesita cerrar la lógica antes de arrancar.',
        howToAccompany: [
            'Cuéntale brevemente qué van a hacer hoy: "Primero calentamiento, después un ejercicio táctico, y terminamos con partido". La previsibilidad lo activa.',
            'Si cambió algo del plan habitual, explícale por qué: "Hoy vamos a hacer algo diferente porque necesitamos practicar X".',
        ],
        ifNotResponding: 'Déjalo que observe la primera actividad desde afuera. Cuando entienda la lógica del ejercicio, es probable que se sume solo.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. Se frustra mucho cuando pierde
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'D',
        whatsHappeningForProfile: 'Para el Impulsor, perder es personal. Siente que el resultado define su valor. Su energía de liderazgo se vuelve contra sí mismo o contra los demás cuando el marcador no lo acompaña.',
        howToAccompany: [
            'Primero valida: "Entiendo que estás enojado, es normal cuando das todo". No minimices lo que siente.',
            'Después redirige la energía competitiva: "¿Qué harías diferente si pudieras repetir esa jugada?". Eso lo saca del resultado y lo lleva al proceso.',
        ],
        ifNotResponding: 'Dale un momento a solas. El Impulsor necesita procesar la frustración en privado antes de poder escuchar cualquier consejo.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector tiende a vivir la derrota como un quiebre social: "le fallé al grupo", "no fui suficiente para el equipo". Su frustración suele venir más del impacto en los demás que del resultado en sí.',
        howToAccompany: [
            'Valida la emoción desde lo vincular: "Se nota que te importa mucho el equipo, eso habla bien de ti".',
            'Sepáralo del "yo le fallé al grupo" con datos: "Mira todo lo que el equipo logró hoy, y tú fuiste parte de eso".',
        ],
        ifNotResponding: 'Pídele a un compañero de confianza que le hable. El Conector se recupera más rápido con el apoyo de un par que con la palabra del adulto.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén no suele explotar con la derrota; más bien tiende a guardarla. Se queda callado, se retrae, y puede arrastrar la frustración por varios días. Su estabilidad natural lo hace parecer "bien" por fuera, pero por dentro le cuesta soltar.',
        howToAccompany: [
            'Valida sin forzar: "Si necesitas hablar, aquí estoy". No le pidas que procese en el momento.',
            'En los días siguientes, observa si está más callado de lo habitual. Si lo ves diferente, un "¿cómo vienes?" sin presión suele abrir la puerta.',
        ],
        ifNotResponding: 'Mantenle la rutina y la normalidad. El Sostén se recupera cuando siente que todo sigue igual alrededor, a pesar del resultado.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega suele analizar la derrota en loop: repasa cada error, cada jugada, buscando el momento exacto donde todo salió mal. Su frustración tiende a ser más cerebral que emocional, pero igual lo paraliza.',
        howToAccompany: [
            'Valida su análisis: "Está bien que pienses en lo que pasó, eso te va a hacer mejorar". Después ponle límite al loop: "Elijamos una sola cosa para trabajar la próxima".',
            'Ofrécele datos concretos: "Mira, en 10 jugadas acertaste 7. El balance es positivo". Los números lo sacan del circuito emocional.',
        ],
        ifNotResponding: 'Proponle que escriba o dibuje lo que sintió. El Estratega procesa mejor cuando puede ordenar sus pensamientos fuera de su cabeza.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. No hace lo que le pido
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor probablemente escuchó la instrucción, pero ya decidió cómo hacerla a su manera. No es desobediencia. es que su motor rápido suele lanzarlo a la acción antes de que termines de hablar, y confía en su instinto.',
        howToAccompany: [
            'Dile la instrucción corta y directa, en una frase. "Pase al pivote, tiro al arco." Menos palabras, más acción.',
            'Si hizo algo diferente pero funcionó, reconocelo: "Buena decisión. Ahora probemos también de esta otra forma".',
        ],
        ifNotResponding: 'Dale el "por qué" competitivo: "Si practicas esto, vas a tener una herramienta más para ganar". El Impulsor hace lo que entiende que lo hace mejor.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector probablemente estaba hablando con alguien cuando diste la instrucción, o se enganchó con la dinámica social y perdió el foco. No es falta de respeto. es que su atención va primero a las personas y después a la tarea.',
        howToAccompany: [
            'Asegúrate de tener su atención antes de dar la instrucción: contacto visual, nombre, y después la consigna.',
            'Dale la instrucción en clave social: "Tú y tu compañero van a hacer esto juntos" funciona mejor que una orden individual.',
        ],
        ifNotResponding: 'Pídele que le explique la consigna a otro compañero. Al traducirla, la procesa y la ejecuta.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén escuchó todo, pero si la instrucción fue compleja o nueva, su motor de procesamiento necesita más tiempo para cerrar la lógica antes de arrancar. No es lentitud. es que quiere hacerlo bien.',
        howToAccompany: [
            'Dile la instrucción paso a paso: "Primero hacemos esto... bien, ahora esto otro". No todo junto.',
            'Dale unos segundos después de la consigna antes de esperar que arranque. Ese silencio es su tiempo de procesamiento.',
        ],
        ifNotResponding: 'Haz una demostración rápida del ejercicio. El Sostén procesa mucho mejor viendo que escuchando.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega está procesando la instrucción a fondo. Si le dijiste algo que no tiene lógica para él, o que contradice lo que hicieron antes, se frena. Su motor necesita cerrar la lógica de la primera instrucción antes de poder arrancar la segunda.',
        howToAccompany: [
            'Explica el "para qué" del ejercicio: "Hacemos esto porque trabaja la reacción lateral". Con el propósito claro, ejecuta.',
            'Si pregunta "por qué", no lo tomes como cuestionamiento. Es su forma de comprometerse: entender primero, actuar después.',
        ],
        ifNotResponding: 'Dile: "Pruebalo una vez y después me dices qué te parece". Al Estratega lo desbloquea la experiencia directa más que la explicación verbal.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. Está raro antes de un partido
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'raro-antes-del-partido',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor suele mostrar los nervios con hiperactividad: habla más de la cuenta, se mueve mucho, o al revés, se pone irritable y callado. La incertidumbre le molesta porque quiere controlar el resultado y no puede.',
        howToAccompany: [
            'Dale una tarea concreta que lo haga sentir en control: "Calienta con pelota, haz 20 tiros". La acción física canaliza la ansiedad.',
            'Háblale en clave de plan: "Hoy tu rol es X. Si pasa Y, haces Z". La claridad del plan lo calma.',
        ],
        ifNotResponding: 'Déjalo calentar solo con música o en un espacio aparte. El Impulsor procesa la presión moviéndose, no hablando.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector suele buscar contención social: habla con todos, hace chistes, o se pega a su persona de confianza. Los nervios tiende a procesarlos a través del vínculo. Si está callado, algo le pesa más de lo normal.',
        howToAccompany: [
            'Genera un momento grupal de conexión: una ronda de manos, un grito de equipo, un "¿cómo venimos?". Eso lo centra.',
            'Si está más callado de lo normal, acércate sin presionar: "¿Todo bien?" y un gesto de apoyo (palmada, choque de puños).',
        ],
        ifNotResponding: 'Pídele que anime al grupo. Darle un rol social ("Tú encargarte de que todos estén arriba") transforma su ansiedad en energía positiva.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén suele cerrarse. Está más callado, más pegado a la rutina, hace exactamente lo mismo que siempre como para sentir que algo no cambió. La incertidumbre del partido le pega en su base de seguridad.',
        howToAccompany: [
            'Mantenle la rutina pre-partido lo más igual posible: mismo calentamiento, mismo lugar, mismos compañeros cerca.',
            'Dile algo que le dé seguridad: "Hoy jugamos como en el entrenamiento, nada raro, lo mismo que ya sabemos hacer".',
        ],
        ifNotResponding: 'No lo fuerces a "estar animado". El Sostén compite bien desde la calma. Déjalo que entre a la cancha a su ritmo.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega está pensando en todos los escenarios posibles: "¿Y si me toca marcar al más grande?", "¿Qué pasa si erramos en la salida?". Su mente analítica se convierte en una máquina de preocupaciones cuando no tiene datos suficientes.',
        howToAccompany: [
            'Dale información concreta: el rival, el plan de juego, su rol específico. Los datos reemplazan la incertidumbre.',
            'Pregúntale: "¿Tienes alguna duda sobre lo que vamos a hacer?". Que pueda vaciar las preguntas lo alivia.',
        ],
        ifNotResponding: 'Dile: "Pensaste mucho y eso está bien. Ahora confia en lo que ya preparaste y juega". El permiso para soltar el análisis lo libera.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. Se queda mirando desde afuera
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'mira-desde-afuera',
        eje: 'D',
        whatsHappeningForProfile: 'Raro en un Impulsor, pero cuando pasa, es porque no se siente seguro de poder dominar la situación. Si el ejercicio o el grupo son nuevos, prefiere esperar hasta tener claro cómo puede destacarse.',
        howToAccompany: [
            'Dale un rol desde el borde: "Mira y decime qué harías diferente". Eso lo mantiene activo mientras observa.',
            'Proponle un desafío de entrada: "¿Te animas a probarlo? Si no te convence, vuelves". La puerta de salida lo anima a entrar.',
        ],
        ifNotResponding: 'Déjalo mirar una ronda completa y después pregúntale directamente: "¿Listo?". El Impulsor suele responder bien a la invitación directa.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector suele observar desde afuera cuando no conoce a nadie o cuando siente que el clima social no es seguro. Tiende a necesitar identificar a "su persona" dentro del grupo antes de entrar.',
        howToAccompany: [
            'Preséntale a alguien: "Él es Mateo, está en tu misma posición. Entrenen juntos". Un aliado es su puerta de entrada.',
            'Inclúyelo en una actividad en dupla o grupo chico antes de mandarlo al grupo grande.',
        ],
        ifNotResponding: 'Dale un rol social desde afuera: "Ayudame a contar los puntos" o "Avisame cuando terminen". Eso lo conecta con el grupo sin forzar la exposición.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'S',
        whatsHappeningForProfile: 'Es el comportamiento más natural del Sostén ante lo nuevo. Está haciendo su lectura de seguridad: quién está, cómo se mueven, cuáles son las reglas. No está perdiendo el tiempo. se está preparando.',
        howToAccompany: [
            'No lo apures. Dale el tiempo de observación que necesita. Un "Cuando estés listo, súmate" sin presión es lo que más funciona.',
            'Si puedes, ponlo a hacer la misma actividad pero al costado, en paralelo, sin exposición grupal.',
        ],
        ifNotResponding: 'Déjalo mirar toda la sesión si es necesario. La próxima vez suele entrar más rápido. El Sostén construye seguridad acumulando experiencias positivas de observación.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega está analizando las reglas del juego desde afuera. Quiere entender la lógica del ejercicio antes de ejecutarlo. No entra hasta que tiene claro el "cómo".',
        howToAccompany: [
            'Explícale el ejercicio brevemente mientras observa: "Mira, la idea es que hagas esto cuando pasa aquello". Con la lógica clara, entra.',
            'Pregúntale: "¿Quieres que te lo explique?". eso le da permiso para hacer las preguntas que tiene en la cabeza.',
        ],
        ifNotResponding: 'Dile: "Hazlo una vez de prueba, no cuenta". El Estratega se anima cuando sabe que el primer intento es sin evaluación.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. Llora o se enoja en pleno entrenamiento
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'llora-o-se-enoja',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor suele enojarse más que llorar. La frustración tiende a salirle como bronca: tira cosas, grita, o se va. Siente que perdió el control de la situación y eso lo desborda.',
        howToAccompany: [
            'No lo enfrentes en caliente. Déjalo que se enfríe unos segundos y después acércate con tono neutro: "Cuando estés listo, hablamos".',
            'Cuando se calme, dale una vía de acción: "Ahora volvamos y hagamos bien ese ejercicio". Necesita sentir que puede recuperar el control.',
        ],
        ifNotResponding: 'Sácalo de la actividad brevemente ("Toma agua, respira") y deja que vuelva solo. El Impulsor necesita sentir que la decisión de volver fue suya.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector tiende a quebrarse cuando siente que la corrección rompió el vínculo. "¿Me está retando porque no le caigo bien?" El desborde suele ser emocional y social a la vez.',
        howToAccompany: [
            'Primero repara el vínculo: "No estoy enojado, quiero ayudarte a mejorar". Eso baja la amenaza emocional.',
            'Después de calmarse, conecta desde el afecto: una palmada, un "¿estamos bien?". para él es fundamental saber que la relación no se rompió.',
        ],
        ifNotResponding: 'Pídele a un compañero de confianza que lo acompañe un momento. El Conector se regula mejor con un par que con una figura de autoridad.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén no suele desbordarse, así que si llora, es que realmente se saturó. Probablemente acumuló cansancio, frustración o incomodidad durante un buen rato antes de explotar.',
        howToAccompany: [
            'Dale pausa sin obligarlo a explicar: "Siéntate aquí un momento, no pasa nada". La ausencia de presión es lo que más lo ayuda.',
            'No le preguntes "¿qué te pasa?" en el momento. Espera a que se calme y después, con tranquilidad: "¿Cómo te sientes ahora?".',
        ],
        ifNotResponding: 'Mantenlo cerca pero sin actividad. Que se quede sentado a tu lado viendo al grupo. La cercanía sin demanda es su forma de recuperarse.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega suele frustrarse cuando siente que algo no tiene lógica o que la corrección fue injusta. Su desborde puede parecer "de la nada" pero viene de un acumulado de cosas que no le cerraron.',
        howToAccompany: [
            'Cuando se calme, dale una explicación clara de lo que pasó: "Te corregí porque quiero que hagas esto mejor, y la forma de hacerlo es esta". La lógica lo ordena.',
            'Pregúntale qué lo frustró específicamente. Muchas veces el detonante no es lo obvio.',
        ],
        ifNotResponding: 'Déjalo solo con sus pensamientos unos minutos. El Estratega necesita ordenar internamente lo que pasó antes de poder hablar.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. Tiene un roce con un compañero
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'roce-con-companero',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor suele chocar cuando siente que otro le está sacando protagonismo o frenando su ritmo. La fricción tiende a venir de la competencia por el espacio de decisión.',
        howToAccompany: [
            'Separa el conflicto de la persona: "Los dos quieren ganar y eso está bien. Ahora veamos cómo lo hacen juntos".',
            'Asignale un aspecto del ejercicio donde sea el que decide. Si tiene su territorio, baja la necesidad de pelear por el del otro.',
        ],
        ifNotResponding: 'Cambialos de dupla temporalmente. A veces la mejor mediación es la distancia breve.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector tiende a vivir el roce como un quiebre en la relación. Suele dolerle más que "ya no nos llevemos bien" que el conflicto en sí. Puede reaccionar buscando aliados o poniéndose dramático.',
        howToAccompany: [
            'Habla con los dos juntos y enfócate en el vínculo: "Ustedes son compañeros, esto se resuelve hablando. ¿Qué pasó?".',
            'Después del ejercicio, dale un momento al Conector para cerrar: "¿Estamos bien con tu compañero?". Necesita saber que la relación sigue.',
        ],
        ifNotResponding: 'Dale un rol de puente: "Ayudame a que el grupo funcione bien". Convertir el conflicto en misión social lo saca de la herida personal.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén suele evitar el conflicto. Si tuvo un roce, probablemente está incomodísimo y quiere que todo vuelva a la normalidad lo antes posible. Probablemente no confronte; suele cerrarse.',
        howToAccompany: [
            'No lo obligues a "hablar las cosas" frente al grupo. Acércate en privado: "Vi que hubo algo ahí, ¿estás bien?".',
            'Ayudalo a volver a su zona de confort: la misma actividad, los mismos compañeros de siempre, rutina normal.',
        ],
        ifNotResponding: 'Deja que el tiempo haga su trabajo. El Sostén no suele necesitar "resolver" el conflicto verbalmente; más bien necesita sentir que todo volvió a la normalidad.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega suele chocar cuando siente que el otro hace las cosas "mal" o sin lógica. La fricción tiende a venir de la diferencia de criterio: él quiere hacerlo bien y el otro quiere hacerlo rápido (o viceversa).',
        howToAccompany: [
            'Valida su perspectiva: "Tu forma de verlo tiene sentido". Después amplía: "Y la de tu compañero también, porque viene de otro lugar".',
            'Proponle un acuerdo de método: "Primero probemos a tu manera, después a la de él, y vemos cuál funcionó mejor".',
        ],
        ifNotResponding: 'Dale una tarea individual breve. El Estratega procesa mejor los conflictos interpersonales cuando tiene un momento a solas para ordenar sus ideas.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 8. Se castiga a sí mismo cuando falla
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-castiga',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor suele castigarse desde la bronca: "¡Soy un desastre!". Siente que debería poder hacerlo bien casi siempre, y un error puede sentirse como una traición a su autoimagen de líder.',
        howToAccompany: [
            'Interrumpe el circuito con acción: "Ok, erraste. Ahora haz 3 repeticiones y listo". La acción inmediata reemplaza la autocrítica.',
            'Usa su competitividad a favor: "Los mejores jugadores fallan, la diferencia es qué hacen después".',
        ],
        ifNotResponding: 'Sácalo del ejercicio un momento y dale una tarea física simple (correr, picar la pelota). El Impulsor regula la frustración moviéndose.',
    },
    {
        situationId: 'se-castiga',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector suele castigarse desde la vergüenza: "Todos me vieron fallar". Lo que tiende a pesarle no es el error técnico sino la exposición social del error.',
        howToAccompany: [
            'Normalizá el error frente al grupo: "Todos fallamos, así se aprende". Eso baja la vergüenza pública.',
            'Después, en privado: "A mí me importa que lo intentes, no que salga perfecto". La reconexión con el adulto lo calma.',
        ],
        ifNotResponding: 'Ponlo en una actividad donde el error sea parte del juego (un ejercicio donde todos fallan). Eso diluye la sensación de ser "el único".',
    },
    {
        situationId: 'se-castiga',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén suele castigarse en silencio. No grita ni se golpea, pero se queda callado, baja la cabeza, y pierde energía. Tiende a sentirse culpable por no haber mantenido la consistencia que se espera de él.',
        howToAccompany: [
            'Acércate con calma: "Ese error no define cómo juegas. Mira todo lo que vienes haciendo bien". Necesita que alguien le devuelva la perspectiva.',
            'En el siguiente ejercicio, ponlo en algo que domine bien para que recupere la confianza antes de volver a lo que falló.',
        ],
        ifNotResponding: 'No le insistas en que "no es para tanto". Simplemente sigue con la actividad con normalidad. El Sostén se recupera cuando siente que el entorno no cambió por su error.',
    },
    {
        situationId: 'se-castiga',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega suele castigarse desde el análisis: repasa el error una y otra vez buscando qué hizo mal. Tiende a autoexigirse porque tiene estándares altos y siente que debería haber previsto el fallo.',
        howToAccompany: [
            'Dale datos que contrarresten el error: "Fallaste esta, pero las 5 anteriores las hiciste perfecto". Los números lo sacan del loop negativo.',
            'Proponle que el error sea un dato, no un juicio: "¿Qué información te da este error? ¿Qué ajustarías?".',
        ],
        ifNotResponding: 'Dile: "Suficiente análisis por hoy. Mañana lo miramos con la cabeza fría". A veces el Estratega necesita permiso para dejar de pensar.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 9. Se distrae todo el tiempo
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-distrae',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor suele distraerse cuando el ejercicio no tiene suficiente intensidad o desafío. Su motor rápido necesita acción constante y si el ritmo baja, tiende a buscar estímulos por su cuenta.',
        howToAccompany: [
            'Súbele la intensidad: "Ahora lo mismo pero en la mitad del tiempo" o "El que llega primero elige el próximo ejercicio".',
            'Dale responsabilidad dentro del ejercicio: que cuente, que arbitre, que lidere una variante.',
        ],
        ifNotResponding: 'Proponle un desafío paralelo: "Mientras esperas tu turno, haz esto otro". El Impulsor no tolera el vacío de actividad.',
    },
    {
        situationId: 'se-distrae',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector suele distraerse porque lo que más le atrae es la interacción social. Si el ejercicio es individual o silencioso, su atención tiende a irse hacia el compañero de al lado.',
        howToAccompany: [
            'Convertí el ejercicio en algo social: en duplas, con comunicación entre ellos, o con roles que requieran hablar.',
            'Usa su sociabilidad como herramienta: "Explícale a tu compañero cómo se hace este ejercicio".',
        ],
        ifNotResponding: 'Ponlo en un rol de ayudante tuyo: "Ven, ayúdame a organizar esto". La cercanía social con el adulto recaptura su atención.',
    },
    {
        situationId: 'se-distrae',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén suele distraerse cuando hay demasiado estímulo: mucho ruido, cambios constantes de ejercicio, o instrucciones nuevas sin pausa. Su sistema tiende a desconectarse para protegerse del caos.',
        howToAccompany: [
            'Baja el ritmo de cambios: deja que haga el mismo ejercicio un rato más largo antes de cambiar.',
            'Dale un espacio predecible dentro de la actividad: "Tú siempre en esta posición, tu trabajo es este".',
        ],
        ifNotResponding: 'Acércate y reconéctalo con calma: "¿Estás conmigo? Bien. Lo próximo que hacemos es esto". El contacto personal lo trae de vuelta.',
    },
    {
        situationId: 'se-distrae',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega suele distraerse cuando el ejercicio le parece repetitivo o sin propósito. Su mente busca algo para analizar, y si el ejercicio no se lo da, tiende a buscar estímulos por otro lado.',
        howToAccompany: [
            'Dale una capa extra al ejercicio: "Mientras haces esto, cuenta cuántas veces se repite el patrón" o "Fijate qué compañero se mueve mejor y por qué".',
            'Explícale qué estás buscando con el ejercicio: "Esto parece simple pero estamos trabajando X". El propósito lo reconecta.',
        ],
        ifNotResponding: 'Proponle que invente una variante del ejercicio. El Estratega se concentra cuando puede diseñar.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 10. Dice que quiere dejar el deporte
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'quiere-dejar',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor suele querer dejar cuando siente que no puede ganar, crecer o liderar. Si lleva mucho tiempo sin desafíos nuevos o sin sentir que progresa, el deporte tiende a perder sentido para él.',
        howToAccompany: [
            'Pregúntale qué cambiaría para que tenga ganas de volver: "Si pudieras cambiar algo del deporte, ¿qué sería?". Escucha la respuesta.',
            'Proponle un objetivo concreto y medible: "¿Y si en las próximas 3 semanas trabajamos en esto específico?".',
        ],
        ifNotResponding: 'No lo presiones. Dile: "La puerta está abierta cuando quieras". El Impulsor a veces necesita extrañar el desafío para volver con ganas.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector suele querer dejar cuando se rompieron los vínculos: si su amigo dejó, si el grupo cambió, o si siente que ya no pertenece. Para él, el deporte tiende a ser el grupo, y si el grupo no lo sostiene, puede sentir que no tiene razón de ser.',
        howToAccompany: [
            'Explora el vínculo: "¿Hay algo del grupo que te hace ruido?". Muchas veces la razon no es el deporte sino una relación social que se rompió.',
            'Si es posible, reconéctalo con un compañero cercano o cámbialo a un grupo donde tenga más afinidad.',
        ],
        ifNotResponding: 'Habla con el adulto responsable. El abandono del Conector suele tener una raíz social que se puede resolver si se identifica a tiempo.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén suele querer dejar cuando algo cambió demasiado: nuevo entrenador, nuevos compañeros, un cambio de horario o de sede. No es que no le guste el deporte. es que el contexto ya no se siente como "su lugar".',
        howToAccompany: [
            'Identifica qué cambió: "¿Hay algo que antes te gustaba y ahora no?". El Sostén puede señalar exactamente el punto de quiebre.',
            'Si puedes, restaura algo del contexto anterior: el mismo horario, el mismo grupo, las mismas rutinas.',
        ],
        ifNotResponding: 'Dale tiempo. No le pidas una decisión definitiva. "No hace falta que decidas ahora. Ven la semana que viene y vemos". El Sostén necesita procesar los cambios lentamente.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega suele querer dejar cuando siente que no aprende nada nuevo o que la actividad no tiene sentido. Si lleva semanas haciendo lo mismo sin entender para qué, su motivación tiende a apagarse.',
        howToAccompany: [
            'Muéstrale el progreso que hizo: "Mira dónde estabas hace 3 meses y dónde estás ahora". Los datos de evolución lo reconectan con el proceso.',
            'Pregúntale qué le gustaría aprender: "¿Hay algo que te gustaría practicar?". Darle voz en el plan lo re-engancha.',
        ],
        ifNotResponding: 'Proponle un desafío intelectual dentro del deporte: analizar un video, planificar una jugada, observar un partido profesional. A veces el Estratega necesita conectar con el deporte desde la cabeza, no solo desde el cuerpo.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 11. Llega un jugador nuevo al grupo
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'jugador-nuevo',
        eje: 'D',
        whatsHappeningForProfile: 'Un Impulsor puede ver al nuevo como una variable a evaluar: "¿Es bueno? ¿Me va a sacar el lugar?". Puede reaccionar compitiendo para marcar territorio o ignorándolo.',
        howToAccompany: [
            'Dale un rol de bienvenida con liderazgo: "Muéstrale cómo hacemos el calentamiento". Eso lo pone en posición de líder, no de competidor.',
            'Arma un ejercicio donde los dos se luzcan: "Uno ataca, otro defiende, después cambian".',
        ],
        ifNotResponding: 'Deja que la competencia natural haga su trabajo. El Impulsor tiende a aceptar al nuevo cuando ve que eleva el nivel del grupo.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector probablemente va a ser el primero en acercarse al nuevo. Si no lo hace, es porque algo del nuevo lo intimida o porque siente que su lugar social en el grupo está amenazado.',
        howToAccompany: [
            'Pídele que sea el "anfitrión": "Acompáñalo hoy, explícale cómo funciona todo aquí". Es su rol natural y lo empodera.',
            'Si el Conector se muestra reticente, habla en privado: "¿Todo bien con la llegada de X?". Puede haber una inseguridad social que vale la pena explorar.',
        ],
        ifNotResponding: 'Arma una actividad donde tengan que cooperar obligatoriamente. La conexión del Conector se activa haciendo cosas juntos.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén suele ser el que más siente la "ruptura" del equilibrio. Su grupo era predecible y seguro, y ahora hay alguien que cambia la dinámica. Puede mostrarse distante o incómodo.',
        howToAccompany: [
            'No cambies la rutina por la llegada del nuevo. Mantenle al Sostén todo lo que puedas igual: mismo lugar, mismo ejercicio, mismos compañeros.',
            'Presenta al nuevo como una "suma" y no como un "cambio": "Se suma alguien al grupo, todo lo demás sigue igual".',
        ],
        ifNotResponding: 'Dale tiempo. El Sostén tiende a aceptar al nuevo gradualmente, a medida que el nuevo se vuelva parte de la rutina. No fuerces la integración.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega suele observar al nuevo con curiosidad analítica: "¿Cómo juega? ¿Dónde se va a ubicar? ¿Cómo afecta al equipo?". Tiende a no acercarse enseguida porque está procesando la información.',
        howToAccompany: [
            'Dale información sobre el nuevo: "Viene de tal club, juega en tal posición". Los datos lo tranquilizan y le permiten ubicar al nuevo en su mapa mental.',
            'Proponle que lo ayude tácticamente: "Explicále cómo hacemos esta jugada". Eso lo conecta desde su fortaleza.',
        ],
        ifNotResponding: 'Deja que la integración sea orgánica. El Estratega suele acercarse al nuevo cuando tiene suficiente información. No lo apures.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 12. Se congela en el partido
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-congela',
        eje: 'D',
        whatsHappeningForProfile: 'Raro en un Impulsor, pero cuando se congela es porque la presión lo abrumó más de lo que puede manejar. Siente que si se equivoca frente a todos, pierde su estatus.',
        howToAccompany: [
            'Dile una instrucción concreta y simple: "La próxima pelota, tirá al arco". Una sola acción clara lo desbloquea.',
            'Desde afuera, dale confianza en su capacidad: "Tú sabes hacer esto, confío en ti". El Impulsor suele responder al voto de confianza.',
        ],
        ifNotResponding: 'Cambiale el rol temporalmente a algo menos expuesto. Cuando haga una buena jugada desde ahí, devolvelo a su posición. Necesita una victoria chica para reactivarse.',
    },
    {
        situationId: 'se-congela',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector suele congelarse cuando siente que el error lo va a dejar "en evidencia" frente al grupo. Su bloqueo tiende a ser social: tiene miedo de quedar mal ante los compañeros, no del error en sí.',
        howToAccompany: [
            'Quitale la presión del resultado: "No importa si sale o no, quiero que lo intentes". El permiso para fallar lo desbloquea.',
            'Involucra a los compañeros: "Equipo, todos adentro, todos juntos". Sentirse acompañado le devuelve la seguridad.',
        ],
        ifNotResponding: 'Ponlo en una jugada grupal donde el éxito sea del equipo, no individual. El Conector se reactiva cuando la responsabilidad es compartida.',
    },
    {
        situationId: 'se-congela',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén suele congelarse porque la presión del partido rompe su base de seguridad. Lo que en el entrenamiento era predecible, en el partido es incierto. Su sistema tiende a protegerse quedándose quieto.',
        howToAccompany: [
            'Baja la presión con información: "Haz lo mismo que en el entrenamiento, nada diferente". Conectarlo con lo conocido lo desbloquea.',
            'Dale una instrucción repetitiva: "Cada vez que la pelota venga, pasala a X". La tarea simple y predecible lo activa.',
        ],
        ifNotResponding: 'Sácalo unos minutos si es posible. Dile: "Respira, mira cómo va el juego, y cuando estés listo vuelves". El Sostén se recupera con la pausa.',
    },
    {
        situationId: 'se-congela',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega suele congelarse porque está sobreanalizando: "¿Paso o tiro? ¿Y si viene el rival? ¿Cuál es la mejor opción?". Su mente trabaja más rápido que su cuerpo, y el cuerpo se traba.',
        howToAccompany: [
            'Simplifica su toma de decisión: "Si estás libre, tira. Si no, pasa". Reducir las opciones lo desbloquea.',
            'Antes del próximo partido, ensaya las decisiones: "Cuando pase esto, haces aquello". La automatización previa libera la mente durante el juego.',
        ],
        ifNotResponding: 'Dile: "No pienses, juega". A veces el Estratega necesita permiso explícito para apagar el análisis y confiar en el instinto.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 13. No quiere ser el centro de atención
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'D',
        whatsHappeningForProfile: 'Muy raro en un Impulsor. Si pasa, probablemente se siente inseguro sobre esa actividad específica. No quiere exponerse donde no se siente fuerte.',
        howToAccompany: [
            'Ofrécele liderar algo donde se sienta seguro: "¿Quieres mostrar el ejercicio que mejor te sale?". El Impulsor se expone cuando sabe que va a brillar.',
            'Hazlo de a poco: "Hoy lo haces con un compañero, la próxima lo haces solo".',
        ],
        ifNotResponding: 'No lo fuerces. Dile: "Cuando estés listo, la oportunidad está". El Impulsor vuelve solo cuando se siente preparado.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector puede disfrutar la atención social pero no la atención evaluativa. Si siente que lo están "examinando" en vez de "acompañando", se retrae.',
        howToAccompany: [
            'Convertí la exposición en algo social: "Hazlo con tu compañero" o "Explicaselo al grupo mientras lo haces".',
            'Quitale la carga evaluativa: "No es para ver quién lo hace mejor, es para que todos aprendamos".',
        ],
        ifNotResponding: 'Déjalo participar desde un rol social: que elija quién pasa, que comente la jugada, que anime. Es su forma de estar presente sin estar expuesto.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'S',
        whatsHappeningForProfile: 'Suele ser natural en el Sostén. Su forma de aportar tiende a ser desde el soporte, no desde el protagonismo. Forzarlo a ser el centro va en contra de su naturaleza y suele hacerlo sentir vulnerable.',
        howToAccompany: [
            'Proponle formas de liderazgo silencioso: "Asegúrate de que todos tengan lo que necesitan" o "Tú eres el que mantiene el ritmo".',
            'Si necesitas que se exponga, dale aviso previo: "La semana que viene te voy a pedir que muestres el ejercicio". La anticipación baja la ansiedad.',
        ],
        ifNotResponding: 'No insistas. Busca otra forma de que participe donde se sienta cómodo. El Sostén aporta más desde su zona de seguridad que desde la exposición forzada.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega tiende a no querer exponerse si no está seguro de que lo va a hacer bien. Su estándar suele ser alto y la idea de fallar en público le genera mucha incomodidad.',
        howToAccompany: [
            'Dale tiempo de preparación: "La semana que viene te pido que expliques esta jugada al grupo. Prepárate". Con tiempo, el Estratega se siente seguro.',
            'Ofrécele un formato que use su fortaleza: que analice una jugada en vez de demostrarla físicamente, que dibuje en una pizarra, que explique la lógica.',
        ],
        ifNotResponding: 'Proponle que lo haga por escrito o dibujado. El Estratega se expresa mejor cuando puede organizar sus ideas antes de compartirlas.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 14. Cambió de un día para el otro
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'cambio-repentino',
        eje: 'D',
        whatsHappeningForProfile: 'Un Impulsor que se apaga probablemente perdió algo que lo hacía sentir poderoso: un rol, una relación, una seguridad fuera de la cancha. Su energía vital se está yendo en otra pelea.',
        howToAccompany: [
            'No le preguntes "¿qué te pasa?" de entrada. Primero observa unos días. Si persiste, acércate con algo concreto: "Te noto diferente, ¿puedo ayudar en algo?".',
            'Si no quiere hablar, dale un desafío físico que lo active: "Hoy necesito que lideres el calentamiento". A veces la acción le devuelve la energía que las palabras no pueden.',
        ],
        ifNotResponding: 'Habla con el adulto responsable (padre, madre). El cambio persistente en un Impulsor suele ser señal de algo importante fuera de la cancha.',
    },
    {
        situationId: 'cambio-repentino',
        eje: 'I',
        whatsHappeningForProfile: 'Un Conector que se cierra suele ser una señal fuerte. Su naturaleza tiende a ser social, así que si está callado o aislado, algo puede estarle doliendo en el plano vincular: una pelea con amigos, un cambio en la familia, o bullying.',
        howToAccompany: [
            'Acércate desde el vínculo: "Te conozco y sé que algo te pasa. No hace falta que me cuentes, pero quiero que sepas que estoy aquí".',
            'Dale espacio para reconectarse a su ritmo. No lo fuerces a "estar contento". eso invalida lo que siente.',
        ],
        ifNotResponding: 'Contacta al adulto responsable. El cambio sostenido en un Conector suele estar vinculado a una situación relacional que requiere atención fuera de la cancha.',
    },
    {
        situationId: 'cambio-repentino',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén que cambia repentinamente suele estar mostrando que algo rompió su base de seguridad. Tiende a ser el perfil que más "aguanta" antes de mostrar malestar, así que si ya lo ves, probablemente viene acumulando hace rato.',
        howToAccompany: [
            'Mantenle la rutina lo más estable posible. En medio de lo que sea que esté pasando afuera, el deporte puede ser su refugio de normalidad.',
            'Acércate sin drama: "¿Cómo estás hoy?" de forma natural, como parte de la rutina. Si quiere hablar, va a hablar.',
        ],
        ifNotResponding: 'Contacta al adulto responsable con delicadeza: "Noté que viene diferente estas últimas semanas, ¿está todo bien en casa?". El Sostén rara vez pide ayuda. hay que ir a buscarla.',
    },
    {
        situationId: 'cambio-repentino',
        eje: 'C',
        whatsHappeningForProfile: 'Un Estratega que cambia de comportamiento puede estar procesando algo internamente que no logra resolver. Su mente analítica puede estar en loop con una situacion que no tiene solución lógica (un problema familiar, una injusticia percibida).',
        howToAccompany: [
            'Ofrécele un espacio para ordenar lo que piensa: "¿Quieres contarme qué está pasando por tu cabeza? A veces ayuda decirlo en voz alta".',
            'Si no quiere hablar, respétalo. Proponle algo que lo ayude a procesarlo a su manera: "Si quieres, escribe lo que sientes y me lo muestras cuando estés listo".',
        ],
        ifNotResponding: 'Contacta al adulto responsable. Los cambios sostenidos en el Estratega, especialmente si se vuelve irritable o distante, suelen indicar una situacion que necesita contencion profesional.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 15. El equipo perdió y nadie quiere saber nada (GRUPAL)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'derrota-grupal',
        eje: 'group',
        whatsHappeningForProfile: 'Todo el grupo está procesando la derrota desde su propio perfil: los Impulsores probablemente estén enojados, los Conectores suelen sentir que fallaron como equipo, los Sostenes tienden a cerrarse, y los Estrategas estarán repasando cada error. El clima colectivo está bajo.',
        howToAccompany: [
            'No intentes hablar del partido inmediatamente después de perder. Dale al grupo unos minutos de silencio o de descompresión libre antes de reunirlos.',
            'Cuando los reúnas, empieza por lo que sí funcionó: "Hoy hicimos bien esto, esto y esto. Lo que no salió, lo trabajamos la semana que viene". Resultado al final, proceso al principio.',
            'Proponle al grupo un ritual de cierre: una ronda donde cada uno diga una cosa buena que vio en un compañero. Eso reconecta al equipo desde el vínculo, no desde el marcador.',
        ],
        ifNotResponding: 'No fuerces la positividad. A veces el grupo necesita estar triste un rato. Dile: "Hoy duele, y está bien que duela. Mañana arrancamos de nuevo". El permiso para sentir la derrota es el primer paso para superarla.',
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor suele vivir el banco como una pérdida de control y de su lugar de protagonista. Estar quieto mientras otros juegan tiende a pesarle mucho, y esa tensión suele salir como fastidio o impaciencia.",
        howToAccompany: ["Dale un rol activo desde el banco: pídele que lea el partido y te avise qué pasa, por ejemplo dile: quiero tus ojos en la cancha, ¿qué ves que podemos mejorar?","Ponle un objetivo concreto para cuando entre, algo que dependa de él: dile cuando entres, esto es tuyo, te quiero marcando el ritmo."],
        ifNotResponding: "Si sigue tenso, no le exijas que lo acepte de golpe. Reconócele las ganas de jugar (se nota que quieres estar adentro y eso es bueno) y dale tiempo, su empuje se reacomoda cuando siente que cuentas con él.",
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "I",
        whatsHappeningForProfile: "El Conector suele temer que estar en el banco signifique que decepcionó o que ya no es parte del grupo. Más que el rol, tiende a dolerle sentirse afuera del vínculo.",
        howToAccompany: ["Confírmale su lugar en el equipo de entrada: acércate y dile hoy arrancas afuera, pero eres parte clave de esto, te necesito conectando al grupo desde el banco.","Dale una tarea que lo mantenga unido a sus compañeros: que aliente, que reciba al que sale, que ayude a sostener el clima del equipo."],
        ifNotResponding: "Si lo notas apagado, prioriza el vínculo antes que el rol. Un gesto cercano, sentarte un momento a su lado, le devuelve la sensación de pertenecer, que es lo que más necesita.",
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "S",
        whatsHappeningForProfile: "El Sostén suele aceptar el banco sin protestar, pero eso no quiere decir que no le duela. Guarda el malestar en silencio y puede acumularlo hasta que aparece más adelante como desánimo.",
        howToAccompany: ["Anticípale el rol con calma y claridad para que no lo tome por sorpresa: dile hoy entras en el segundo tiempo, quiero que estés listo y tranquilo para ese momento.","Hazle un espacio breve para que cuente cómo lo vive: acércate sin presión y dile sé que esperar no es fácil, ¿cómo te sientes con esto?"],
        ifNotResponding: "Si responde con un todo bien y se cierra, respétale el silencio sin darlo por resuelto. Vuelve a buscarlo en otro momento tranquilo, suele abrirse cuando siente que hay confianza y nada de apuro.",
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "C",
        whatsHappeningForProfile: "El Estratega suele necesitar entender por qué está en el banco. Si no tiene claro el criterio, tiende a darle vueltas y puede concluir solo que hizo algo mal o que no es lo bastante bueno.",
        howToAccompany: ["Explícale el motivo de forma concreta y sin rodeos: dile esta es una decisión de equipo y de planificación, no un juicio sobre ti, y te muestro qué estoy buscando hoy.","Dale algo claro en qué enfocarse mientras espera: pídele que observe una jugada o un rival puntual y que te traiga su lectura cuando entre."],
        ifNotResponding: "Si lo ves trabado dándole vueltas, bájale la exigencia interna. Recuérdale que el rol de hoy no mide su valor y que entender lleva tiempo, sin pedirle que lo resuelva ya.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor suele vivir el logro del compañero como una competencia que está perdiendo. Su instinto tiende a ser demostrar de inmediato que él también puede, y si no encuentra cómo, se frustra.",
        howToAccompany: ["Canaliza esa energía hacia un reto propio en vez de hacia el otro: tú tienes tu propio desafío hoy, vamos a ver hasta dónde llegas.","Reconócele algo concreto que él sí hace bien para que no sienta que pierde su lugar: en la marca nadie te gana, eso es tuyo."],
        ifNotResponding: "Dale un par de minutos para que baje la intensidad sin exigirle que aplauda al compañero. Cuando vuelva a sentirse capaz en lo suyo, la comparación pierde fuerza sola.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "I",
        whatsHappeningForProfile: "El Conector suele sentir que el cariño y la atención del grupo se fueron hacia otro, y tiende a vivirlo como que a él lo quieren menos. Suele dolerle más el desplazamiento social que el resultado.",
        howToAccompany: ["Devuélvele su lugar en el grupo con algo genuino: tu energía es la que levanta al equipo, eso no lo reemplaza nadie.","Invítalo a sumarse a la alegría del otro para que sienta que sigue dentro: vamos a festejarlo entre todos, eres parte de esto."],
        ifNotResponding: "No lo obligues a celebrar si todavía le cuesta. Acércate un momento a solas y hazle sentir que su lugar contigo sigue intacto, sin pedirle nada a cambio.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "S",
        whatsHappeningForProfile: "El Sostén suele guardarse el malestar y correrse al segundo plano sin decir nada. Por fuera parece que no le afecta, pero el fastidio se va acumulando y puede aparecer más tarde de golpe.",
        howToAccompany: ["Dale permiso para nombrar lo que siente, sin apuro: está bien que hoy te haya costado, contarlo no tiene nada de malo.","Ofrécele un lugar seguro y predecible donde volver a sentirse cómodo: ponte conmigo en este ejercicio y vamos tranquilos."],
        ifNotResponding: "No lo presiones a hablar. Quédate cerca y mantén la rutina estable. Tu constancia le devuelve la seguridad mejor que cualquier charla forzada.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "C",
        whatsHappeningForProfile: "El Estratega suele quedarse analizando por qué el otro lo hizo mejor y se compara punto por punto. Esa cuenta interna tiende a volverlo durísimo consigo mismo.",
        howToAccompany: ["Saca la mirada de la comparación y ponla en su propio proceso: no se trata de quién es mejor, sino de qué puedes aprender mirándolo.","Dale un dato concreto y observable para que ordene la cabeza: fíjate cómo se perfila él antes de recibir, prueba copiar solo eso hoy."],
        ifNotResponding: "Si sigue atrapado en el bucle, bájale la exigencia. Recuérdale que cada uno avanza a su tiempo y que entender lleva su proceso, no hay apuro.",
    },
    {
        situationId: "recibe-correccion",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor suele confundir la corrección con perder terreno. Tiende a necesitar sentir que sigue siendo capaz y que tiene margen para mejorar por su cuenta, no que lo dejaron mal parado.",
        howToAccompany: ["Enmarca la corrección como un reto, no como una falla: tienes esto casi listo, te falta un ajuste para que sea imparable.","Dale el control del cambio: que sea él quien decida cómo corregirlo en la próxima jugada, en vez de imponérselo."],
        ifNotResponding: "Si se pone a la defensiva, baja la intensidad y déjalo probar a su modo unos minutos. Cuando vea que el ajuste le funciona, lo adopta solo y sin discutir.",
    },
    {
        situationId: "recibe-correccion",
        eje: "I",
        whatsHappeningForProfile: "El Conector suele sentir la corrección como un golpe al vínculo, no a la técnica. Tiende a importarle más si te decepcionó o si quedó expuesto que el detalle que le marcaste.",
        howToAccompany: ["Corrígelo en privado y cuida el tono: empieza por el vínculo, lo tuyo con el equipo está perfecto, vamos a pulir solo este detalle.","Recuérdale que la corrección no cambia cómo lo ves: te marco esto porque confío en lo que puedes dar."],
        ifNotResponding: "Si igual se apaga, dale un gesto de cercanía y espera. Para él, sentirse aceptado pesa más que cualquier indicación, y desde ahí vuelve a escuchar.",
    },
    {
        situationId: "recibe-correccion",
        eje: "S",
        whatsHappeningForProfile: "El Sostén suele asentir y parecer que lo toma bien, pero por dentro se guarda el malestar. Tiende a evitar el roce en el momento y la incomodidad le aparece después, más callada.",
        howToAccompany: ["Dale tiempo y previsibilidad: avísale con calma y sin sorpresas, quiero mostrarte algo para la próxima, sin apuro.","Confirma que está bien y abre la puerta a que hable: esto pasa todo el tiempo, si algo no te cerró me lo dices cuando quieras."],
        ifNotResponding: "Si lo notas retraído, no insistas en el momento. Acércate después, en un clima tranquilo, y dale espacio para que suelte lo que se guardó.",
    },
    {
        situationId: "recibe-correccion",
        eje: "C",
        whatsHappeningForProfile: "El Estratega suele entender la corrección, pero tiende a quedarse atascado en el detalle y a volverse muy exigente consigo mismo. Le cuesta soltar lo que pasó para seguir jugando.",
        howToAccompany: ["Explícale el porqué, que es lo que más lo ordena: corregimos esto porque te da más tiempo para decidir en la jugada.","Ayúdalo a pasar de página con un foco concreto: ya lo analizaste, ahora prueba solo este ajuste en la próxima y lo vemos."],
        ifNotResponding: "Si sigue dándole vueltas, dale un solo punto en el que pensar y deja el resto para después. Menos información lo libera para volver a jugar tranquilo.",
    },
    {
        situationId: "gestiona-exito",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor suele sentir el éxito con mucha intensidad y necesita mostrarlo. Cuando ya se siente ganador, su motor de esfuerzo tiende a aflojar porque cree que el desafío terminó.",
        howToAccompany: ["Ponle un nuevo objetivo apenas logra algo: ya conseguiste eso, ahora a ver si sostienes ese nivel hasta el final.","Reconócele el logro y enseguida invítalo a sumar al equipo: el que ya está jugando bien hoy puede levantar a un compañero."],
        ifNotResponding: "Déjalo disfrutar el momento sin corregirlo en caliente. Cuando baje la euforia, vuelve a buscarlo con un reto concreto y su motor se reactiva solo.",
    },
    {
        situationId: "gestiona-exito",
        eje: "I",
        whatsHappeningForProfile: "El Conector suele vivir el éxito a través de los demás y se entusiasma cuando siente la celebración del grupo. Llevado por esa emoción, sin querer puede acaparar el momento y dejar al resto del equipo afuera.",
        howToAccompany: ["Redirige su entusiasmo hacia el equipo: buenísimo tu gol, ahora celébralo con los que te dieron el pase.","Dale un rol de contagiar la buena energía cuidando a todos: tú que estás encendido, ayuda a levantar a los que están más callados."],
        ifNotResponding: "No lo apagues delante del grupo. Más tarde, a solas, recuérdale lo lindo que es cuando el equipo entero festeja junto, y que él tiene el don de lograrlo.",
    },
    {
        situationId: "gestiona-exito",
        eje: "S",
        whatsHappeningForProfile: "El Sostén suele vivir el éxito por dentro, sin mostrarlo demasiado. Pero al sentir que la presión bajó, puede relajarse de más y soltar la constancia que lo venía sosteniendo.",
        howToAccompany: ["Reconócele su buen momento con calma y dale continuidad: estás muy bien, mantengamos esa misma forma de jugar el resto del partido.","Ánclalo a su rutina de esfuerzo: tu fuerza es la constancia, sigamos con lo que veníamos haciendo paso a paso."],
        ifNotResponding: "No lo presiones para que demuestre más. Acompáñalo en silencio, cerca, y recuérdale con un gesto que confías en que va a sostener su nivel sin sobreexigirse.",
    },
    {
        situationId: "gestiona-exito",
        eje: "C",
        whatsHappeningForProfile: "El Estratega suele analizar su buen rendimiento y puede convencerse de que ya entendió todo. Al sentir que no le queda nada por mejorar, tiende a bajar la guardia sin darse cuenta.",
        howToAccompany: ["Valídale el análisis y abre una pregunta nueva: jugaste muy bien, ¿qué crees que podrías afinar todavía?","Muéstrale que lo bueno también se estudia: anota qué hiciste hoy que funcionó, así lo puedes repetir cuando el rival sea más difícil."],
        ifNotResponding: "Dale espacio para procesar su buen momento a su ritmo. Cuando esté listo, proponle mirar juntos el próximo desafío sin quitarle mérito a lo que ya logró.",
    },
    {
        situationId: "rol-referente",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor suele tomar el rol con ganas, pero puede vivirlo como mandar más que como guiar. Si el grupo no responde a su intensidad, lo siente como algo personal.",
        howToAccompany: ["Dale una misión de líder que dependa de los demás: hoy tu trabajo es que tus compañeros lleguen al final del ejercicio, no llegar tú primero.","Reconócele cuando ayuda, no solo cuando gana: vi cómo esperaste a tu compañero, eso también es ser referente."],
        ifNotResponding: "Bájale la exposición un tiempo y dale liderazgos cortos y concretos. Cuando sienta que puede hacerlo bien, va a querer más.",
    },
    {
        situationId: "rol-referente",
        eje: "I",
        whatsHappeningForProfile: "El Conector suele liderar con naturalidad desde el vínculo, pero tiende a pesarle cuando el rol implica poner un límite o decidir entre amigos. No quiere decepcionar a nadie.",
        howToAccompany: ["Define el rol desde su fortaleza: tu tarea de referente es que nadie quede afuera, y eso ya lo haces muy bien.","Acompáñalo en las decisiones difíciles para que no las cargue solo: si hay que elegir, lo pensamos juntos."],
        ifNotResponding: "Déjale por ahora la parte que disfruta y aligérale la que lo incomoda. Con el tiempo, el rol más completo le va a pesar menos.",
    },
    {
        situationId: "rol-referente",
        eje: "S",
        whatsHappeningForProfile: "El Sostén suele preferir el segundo plano y le incomoda quedar expuesto. Igual sostiene al grupo en silencio, aunque no lo busque.",
        howToAccompany: ["Nómbrale el liderazgo que ya ejerce, sin pedirle nada nuevo: cuando estás tú, el grupo está más tranquilo, eso es liderar.","Proponle un rol de referente discreto, sin ponerlo al frente: ayúdame a que los más nuevos se sientan cómodos."],
        ifNotResponding: "No lo empujes al centro. Déjalo liderar a su manera, desde el costado, y respeta su ritmo para tomar más espacio.",
    },
    {
        situationId: "rol-referente",
        eje: "C",
        whatsHappeningForProfile: "El Estratega suele dudar porque todavía no tiene claro qué se espera de él, y tiende a preferir esperar antes que ejercer el rol a medias. Le pesa la idea de equivocarse delante de todos.",
        howToAccompany: ["Explícale el rol con claridad y por partes: ser referente aquí significa estas tres cosas, nada más.","Dale tiempo para observar antes de actuar: mira unos días cómo funciona el grupo y después me dices cómo lo harías tú."],
        ifNotResponding: "Proponle primero un rol más concreto, algo que pueda entender y dominar. La confianza para liderar le llega cuando siente que comprende.",
    },
    {
        situationId: "expectativa-padres",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor suele convertir la expectativa en una presión por ganar sí o sí. Cuando siente que el resultado define si decepcionó o no a sus padres, puede exigirse de más y reaccionar con frustración ante un error.",
        howToAccompany: ["Devuélvele el foco a lo que él controla: hoy no me fijo en el marcador, me fijo en cómo compites cada pelota.","Reconócele el esfuerzo más que el resultado, en voz alta y delante del grupo: me gustó cómo no bajaste los brazos cuando se complicó."],
        ifNotResponding: "Si sigue jugando para la tribuna, baja tú la importancia del resultado en tus palabras. Cuando él vea que para ti su valor no depende de ganar, empieza a soltar la presión.",
    },
    {
        situationId: "expectativa-padres",
        eje: "I",
        whatsHappeningForProfile: "El Conector suele necesitar sentir el orgullo de sus padres para jugar liviano. Una cara seria desde afuera tiende a desconectarlo enseguida, porque para él rendir bien y ser querido están unidos.",
        howToAccompany: ["Recuérdale que el cariño de sus padres no se gana ni se pierde en una cancha: tu familia te quiere juegues como juegues, eso no está en juego hoy.","Dale un motivo para disfrutar con sus compañeros y no solo para los de afuera: sal a pasarla bien con tu equipo, ese es tu lugar aquí."],
        ifNotResponding: "Si sigue pendiente de la tribuna, ayúdalo a reconectar con el grupo en vez de con afuera. Cuando se siente parte del equipo, la mirada de los padres deja de ser lo único que importa.",
    },
    {
        situationId: "expectativa-padres",
        eje: "S",
        whatsHappeningForProfile: "El Sostén suele guardarse la tensión por dentro y no mostrarla. Sigue jugando callado, pero más rígido, y la carga se le acumula hasta aparecer de golpe en un mal momento.",
        howToAccompany: ["Acércate con calma y sin exponerlo para abrirle la puerta: si en algún momento te pesa lo de afuera, me lo puedes contar tranquilo.","Dale rutinas y referencias estables que no dependan de la tribuna: tú concéntrate en tu marca de siempre, eso ya lo sabes hacer."],
        ifNotResponding: "Si no logra soltar la carga, no lo fuerces a hablar. Mantén un clima predecible y seguro alrededor de él, y dale tiempo: confiar en ti es lo que después le permite abrirse.",
    },
    {
        situationId: "expectativa-padres",
        eje: "C",
        whatsHappeningForProfile: "El Estratega suele meterse en su cabeza tratando de descifrar qué esperan de él. Tiende a autoexigirse el doble y a terminar jugando trabado por miedo a no estar a la altura de lo que cree que los adultos quieren ver.",
        howToAccompany: ["Sácale la presión de tener que adivinar expectativas y dale un objetivo claro y propio: tu único trabajo hoy es leer bien el juego, nada más.","Ayúdalo a separar su deseo del de los padres con una pregunta concreta: dejando afuera lo que esperan ellos, a ti qué te dan ganas de probar hoy."],
        ifNotResponding: "Si sigue trabado en su análisis, reduce las variables: una sola consigna simple por vez. Cuando deja de cargar con todo lo que cree que esperan, vuelve a jugar suelto.",
    },
    {
        situationId: "sube-categoria",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor venía siendo una referencia y ahora es el nuevo entre los más grandes. Perder ese lugar de protagonismo suele tocarle la confianza, y puede taparlo con enojo o compitiendo de más para recuperar terreno.",
        howToAccompany: ["Dale un objetivo concreto para su adaptación: en estas semanas tu desafío es ganarte un lugar en este grupo, lo vamos a ver partido a partido.","Reconócele cada paso de progreso en lo nuevo: hoy aguantaste el ritmo de los más grandes, eso hace dos semanas no pasaba."],
        ifNotResponding: "Si sigue tenso, bájale la exigencia de rendir ya y déjalo enfocarse en una sola cosa por actividad. Recuperar el control de a poco le devuelve la seguridad.",
    },
    {
        situationId: "sube-categoria",
        eje: "I",
        whatsHappeningForProfile: "El Conector dejó atrás a su grupo de siempre y todavía no encontró su lugar entre los nuevos. Aunque esté rodeado de compañeros, suele sentirse afuera, y eso tiende a bajarle las ganas más que cualquier tema de juego.",
        howToAccompany: ["Conéctalo con un compañero de la nueva categoría que lo reciba bien: te presento a Tomás, va a ser tu compañero esta semana.","Dale un rol que lo integre desde lo social, como armar un ejercicio en duplas o liderar la entrada en calor junto a otro."],
        ifNotResponding: "Si sigue replegado, no lo expongas frente al grupo. Acércate en privado y muéstrale que lo quieres ahí, sentirse esperado le devuelve las ganas.",
    },
    {
        situationId: "sube-categoria",
        eje: "S",
        whatsHappeningForProfile: "El Sostén suele desestabilizarse con el cambio de rutina, de horarios y de caras conocidas. Tiende a replegarse al segundo plano y a sostener la incomodidad en silencio, hasta que un día le pesa todo junto.",
        howToAccompany: ["Dale previsibilidad sobre lo nuevo: explícale cómo va a ser la actividad y qué se espera de él, paso a paso.","Ofrécele un punto de referencia estable, como un lugar fijo en la cancha o un compañero con quien siempre empieza: arranca siempre al lado de él hasta que te sientas cómodo."],
        ifNotResponding: "Si lo ves cerrado, dale más tiempo sin apurarlo y pregúntale en privado cómo se está sintiendo. A él el cambio le lleva más, y eso está bien.",
    },
    {
        situationId: "sube-categoria",
        eje: "C",
        whatsHappeningForProfile: "El Estratega suele estar leyendo todo el escenario nuevo: el ritmo, los códigos del grupo, dónde encaja él. Mientras procesa puede parecer apagado o dudar antes de jugar, porque todavía no entiende del todo cómo funciona esta categoría.",
        howToAccompany: ["Dale información clara que lo ayude a ubicarse: en esta categoría se juega más rápido, así que gana un segundo pensando antes de recibir.","Valida su forma de observar antes de meterse: tómate los primeros minutos para leer el partido, después entras con todo."],
        ifNotResponding: "Si sigue dudando, no lo presiones a soltarse antes de tiempo. Cuando termine de entender el escenario nuevo, va a empezar a jugar con confianza solo.",
    },
];

/* ── Helpers ────────────────────────────────────────────────────────────────── */

export function getCardsForSituation(situationId: string): SituationCard[] {
    return SITUATION_CARDS.filter(c => c.situationId === situationId);
}

export function getCardForSituationAndEje(situationId: string, eje: string): SituationCard | undefined {
    return SITUATION_CARDS.find(c => c.situationId === situationId && c.eje === eje);
}

/* ── Localized getters ──────────────────────────────────────────────────────── */

import { SITUATIONS_EN, SITUATION_CARDS_EN, CARD_ENRICHMENTS_EN, VETA_NUANCES_EN } from './situationalGuide.en';
import { SITUATIONS_PT, SITUATION_CARDS_PT, CARD_ENRICHMENTS_PT, VETA_NUANCES_PT } from './situationalGuide.pt';

export function getSituations(lang: string): Situation[] {
    if (lang === 'en') return SITUATIONS_EN;
    if (lang === 'pt') return SITUATIONS_PT;
    return SITUATIONS;
}

export function getSituationCards(lang: string): SituationCard[] {
    if (lang === 'en') return SITUATION_CARDS_EN;
    if (lang === 'pt') return SITUATION_CARDS_PT;
    return SITUATION_CARDS;
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    Motivación:    { bg: '#fef3c7', text: '#92400e' },
    Emocional:     { bg: '#fce7f3', text: '#9d174d' },
    Comunicación:  { bg: '#dbeafe', text: '#1e40af' },
    Presión:       { bg: '#fee2e2', text: '#991b1b' },
    Social:        { bg: '#d1fae5', text: '#065f46' },
    Concentración: { bg: '#e0e7ff', text: '#3730a3' },
    Observación:   { bg: '#fef9c3', text: '#854d0e' },
    Grupal:        { bg: '#f3e8ff', text: '#6b21a8' },
};

/* ── Enriched content (2026-07-18) ──────────────────────────────────────────
 * Additive layer over SITUATION_CARDS: gives every profile card two extra,
 * meatier fields (a concrete phrase to say + the common mistake to avoid), and
 * a per-veta nuance so two children who share a primary axis but differ in
 * their secondary (veta) get distinct guidance. The base cards are untouched.
 *   - CardEnrichment: one per (situation, eje). 85 entries (84 DISC + 1 group).
 *   - VetaNuance: one per (situation, primary, non-opposite veta). 168 entries.
 * Diagonal opposites (D<->S, I<->C) never form a blend, so they have no nuance
 * and the card falls back to the pure-primary reading (see getVetaNuance).
 * ─────────────────────────────────────────────────────────────────────────── */

export interface CardEnrichment {
    situationId: string;
    eje: 'D' | 'I' | 'S' | 'C' | 'group';
    whatToSay: string;    // a concrete phrase the coach can say, in quotes
    whatToAvoid: string;  // the common well-intentioned mistake for this profile
}

export interface VetaNuance {
    situationId: string;
    primary: 'D' | 'I' | 'S' | 'C';
    veta: 'D' | 'I' | 'S' | 'C';  // never the diagonal opposite of primary
    text: string;
}

export const CARD_ENRICHMENTS: CardEnrichment[] = [
    { situationId: "no-quiere-arrancar", eje: "D", whatToSay: "\"Guardé algo para arrancar que necesita a alguien con tu energía. ¿Me ayudas a mostrarle al grupo cómo se hace?\"", whatToAvoid: "Evita empujarlo a entrar con una orden directa; sin un para qué que lo enganche, el niño tiende a plantarse todavía más." },
    { situationId: "no-quiere-arrancar", eje: "I", whatToSay: "\"Ven, ubícate cerca del grupo. No hace falta que juegues todavía, solo quédate con nosotros y vemos cómo te sientes.\"", whatToAvoid: "Evita apartarlo del grupo para que se calme; a este niño suele reengancharlo estar cerca de los demás, no aislado." },
    { situationId: "no-quiere-arrancar", eje: "S", whatToSay: "\"Tranquilo, no hay apuro. Empieza con lo de siempre y cuando estés listo te sumas al resto, ¿te parece?\"", whatToAvoid: "Evita apurar el cambio o modificarle la rutina de golpe; este niño suele necesitar unos minutos para acomodarse a su ritmo." },
    { situationId: "no-quiere-arrancar", eje: "C", whatToSay: "\"Se ve que traes algo de antes en la cabeza. Tómate un minuto, y cuando lo cierres arrancamos. ¿Necesitas algo?\"", whatToAvoid: "Evita pedirle que se olvide y se enfoque ya; este niño suele necesitar entender y cerrar lo que trae antes de enchufarse." },
    { situationId: "se-frustra-cuando-pierde", eje: "D", whatToSay: "\"Ese enojo muestra cuánto te importa. Ahora respira, que perder un punto no borra todo lo que hiciste hoy.\"", whatToAvoid: "Evita minimizar la derrota o explicarle la jugada mientras todavía tiene la bronca encendida, porque primero necesita descargarla." },
    { situationId: "se-frustra-cuando-pierde", eje: "I", whatToSay: "\"El equipo sigue contigo, nadie te está juzgando. Perder juntos también nos une. ¿Vamos de nuevo cuando estés listo?\"", whatToAvoid: "Evita corregirlo o exponerlo delante del grupo, porque lo que más le pesa es sentir que quedó mal ante los demás." },
    { situationId: "se-frustra-cuando-pierde", eje: "S", whatToSay: "\"Tómate el tiempo que necesites. No tienes que estar bien de golpe. Cuando quieras, seguimos tranquilos, sin apuro.\"", whatToAvoid: "Evita darlo por resuelto porque se quedó callado, ya que su frustración puede seguir por dentro y necesita que vuelvas a preguntarle con calma." },
    { situationId: "se-frustra-cuando-pierde", eje: "C", whatToSay: "\"Sabías qué hacer, y eso ya es enorme. La ejecución se afina con el tiempo, no en un solo punto.\"", whatToAvoid: "Evita repasar el error técnico en caliente, porque su autoexigencia ya lo está castigando y el análisis en ese momento pesa más." },
    { situationId: "no-hace-lo-que-pido", eje: "D", whatToSay: "\"Me encanta que quieras arrancar. Dame dos segundos para terminar la idea y sales con todo.\"", whatToAvoid: "Evita frenarlo en seco o leer su arranque como desobediencia; suele estar ejecutando, no ignorándote." },
    { situationId: "no-hace-lo-que-pido", eje: "I", whatToSay: "\"Necesito tus ojos un segundo. Cuando termino, me repites lo que entendiste y arrancamos juntos.\"", whatToAvoid: "Evita señalarlo delante del grupo por distraerse; suele haberse enganchado con un compañero, no desconectado de ti." },
    { situationId: "no-hace-lo-que-pido", eje: "S", whatToSay: "\"Lo escuchaste bien. Tómate un momento y arranca cuando te sientas seguro, no hay apuro.\"", whatToAvoid: "Evita apurarlo o subir la voz creyendo que no entendió; suele haber entendido y solo estar buscando seguridad." },
    { situationId: "no-hace-lo-que-pido", eje: "C", whatToSay: "\"Si algo no te cierra, pregúntame. Entender el para qué te va a ayudar a arrancar más tranquilo.\"", whatToAvoid: "Evita leer su pausa como que te desafía; suele estar entendiendo la lógica antes de moverse, no resistiéndose." },
    { situationId: "raro-antes-del-partido", eje: "D", whatToSay: "\"Esa energía que tienes ahora te sirve. Guárdala para el primer minuto y sal a jugar con todo.\"", whatToAvoid: "Evita pedirle que se quede quieto o que se calme, porque el niño necesita mover esa energía para soltar la tensión." },
    { situationId: "raro-antes-del-partido", eje: "I", whatToSay: "\"Ven, quédate cerca del equipo un rato. No estás solo en esto, salimos todos juntos a la cancha.\"", whatToAvoid: "Evita mandarlo a concentrarse solo y en silencio, porque al niño lo calma sentirse acompañado, no quedarse aislado." },
    { situationId: "raro-antes-del-partido", eje: "S", whatToSay: "\"Tranquilo, lo hemos preparado juntos y sabes lo que toca. Pase lo que pase, aquí vas a estar bien.\"", whatToAvoid: "Evita llenarlo de indicaciones nuevas a último momento, porque al niño la incertidumbre lo tensa más de lo que lo prepara." },
    { situationId: "raro-antes-del-partido", eje: "C", whatToSay: "\"Confía en lo que ya analizaste. Tienes el plan claro, ahora déjalo salir sin darle tantas vueltas.\"", whatToAvoid: "Evita interrumpir su silencio para animarlo, porque muchas veces el niño no está nervioso, está repasando y preparándose a su manera." },
    { situationId: "mira-desde-afuera", eje: "D", whatToSay: "\"Te guardé el próximo turno. Cuando entres arrancas tú marcando el ritmo. ¿Listo para abrir la jugada?\"", whatToAvoid: "Evita empujarlo al grupo antes de tiempo o leer su pausa como desinterés; suele estar buscando por dónde entrar con protagonismo." },
    { situationId: "mira-desde-afuera", eje: "I", whatToSay: "\"Ven, aquí hay lugar para ti. Los compañeros ya quieren que te sumes, ¿entras conmigo?\"", whatToAvoid: "Evita esperar a que se sume solo; suele necesitar una señal de que el grupo lo quiere adentro para animarse." },
    { situationId: "mira-desde-afuera", eje: "S", whatToSay: "\"Mira tranquilo cuánto quieras. Cuando entres va a ser igual que siempre, y yo voy a estar cerca.\"", whatToAvoid: "Evita apurarlo o exponerlo de golpe; suele necesitar sentir que el entorno es previsible antes de meterse." },
    { situationId: "mira-desde-afuera", eje: "C", whatToSay: "\"Te explico cómo funciona el ejercicio y qué se busca. Cuando lo tengas claro, entras. Sin apuro.\"", whatToAvoid: "Evita cortarle la observación o pedirle que deje de pensar; suele estar entendiendo las reglas para entrar seguro." },
    { situationId: "llora-o-se-enoja", eje: "D", whatToSay: "\"Está bien, sácalo. Respira conmigo un segundo y cuando bajes la revolución seguimos. No pasa nada, esto le pasa a todos.\"", whatToAvoid: "Evita confrontarlo o exigirle que se calme ya, porque el Impulsor necesita soltar la carga antes de poder escucharte." },
    { situationId: "llora-o-se-enoja", eje: "I", whatToSay: "\"Ey, ven un segundo conmigo. Nadie te está juzgando, te corregí porque confío en ti. Estamos bien, ¿sí?\"", whatToAvoid: "Evita resolverlo delante de todos o restarle importancia al malestar, porque para el Conector la mirada del grupo pesa mucho." },
    { situationId: "llora-o-se-enoja", eje: "S", whatToSay: "\"Veo que se te juntó todo. Está bien parar un momento, no tienes que aguantar solo. Tómate el tiempo que necesites.\"", whatToAvoid: "Evita sorprenderte y pedirle explicaciones en el momento, porque el Sostén venía aguantando hace rato y todavía no puede ponerlo en palabras." },
    { situationId: "llora-o-se-enoja", eje: "C", whatToSay: "\"Tómate un momento a solas, no hay apuro. No tienes que hacerlo perfecto, date el permiso de que a veces cuesta.\"", whatToAvoid: "Evita llenarlo de palabras o pedirle que hable ya, porque el Estratega suele necesitar un momento a solas para reordenarse antes de conectar." },
    { situationId: "roce-con-companero", eje: "D", whatToSay: "\"Tu idea es buena. Ahora escuchemos la de tu compañero un segundo y armamos algo entre los dos.\"", whatToAvoid: "Evita darle la razón enseguida solo para cortar el roce rápido, porque el niño aprende que imponerse siempre funciona." },
    { situationId: "roce-con-companero", eje: "I", whatToSay: "\"No te está rechazando a ti, chocaron las formas. Sigues siendo parte del grupo, ¿lo hablamos juntos?\"", whatToAvoid: "Evita minimizar lo que siente diciéndole que no es para tanto, porque el niño lo vive como un rechazo personal." },
    { situationId: "roce-con-companero", eje: "S", whatToSay: "\"Vi que aguantaste un buen rato. Cuéntame qué te molestó, que aquí lo resolvemos con calma.\"", whatToAvoid: "Evita pedirle que lo deje pasar una vez más, porque el niño acumula en silencio hasta que estalla de golpe." },
    { situationId: "roce-con-companero", eje: "C", whatToSay: "\"Tu forma tiene lógica. La de tu compañero también sirve de otra manera. ¿Probamos las dos y vemos?\"", whatToAvoid: "Evita apurarte a decidir quién hizo bien el ejercicio, porque el niño necesita entender el porqué, no ganar la discusión." },
    { situationId: "se-castiga", eje: "D", whatToSay: "\"Ese error no te hace menos capaz. Lo que veo es a alguien que quiere más. Vamos con la próxima jugada.\"", whatToAvoid: "Evita retarlo a que 'demuestre que puede', porque le confirma que su valor depende de acertar cada vez." },
    { situationId: "se-castiga", eje: "I", whatToSay: "\"Nadie del equipo te está juzgando por eso. Te queremos aquí, dentro y fuera de la cancha. Seguimos juntos.\"", whatToAvoid: "Evita corregirlo delante de todos, porque le suma la mirada ajena al peso que ya está sintiendo." },
    { situationId: "se-castiga", eje: "S", whatToSay: "\"Sé que por dentro te estás dando duro. No hace falta. Respira, esto pasa, y seguimos a tu ritmo.\"", whatToAvoid: "Evita dar por hecho que está bien solo porque no dice nada en voz alta." },
    { situationId: "se-castiga", eje: "C", whatToSay: "\"Tu plan estaba bien pensado. Un error no lo borra. Los mejores usan lo que falla para ajustar la próxima.\"", whatToAvoid: "Evita analizar el error en detalle en ese momento, porque le das más material para exigirse." },
    { situationId: "se-distrae", eje: "D", whatToSay: "\"Te tengo un reto: a ver si dominas esta antes que nadie. Cuando termines, me buscas y subimos el nivel.\"", whatToAvoid: "Evita regañarlo por no prestar atención cuando en realidad el ejercicio se le quedó corto; suele reconectarse si le subes la intensidad o le pones un desafío." },
    { situationId: "se-distrae", eje: "I", whatToSay: "\"Me encanta que hables con tu compañero. Ahora úsalo en la jugada: cuéntale en voz alta qué van a hacer en esta.\"", whatToAvoid: "Evita callarlo o aislarlo del grupo como castigo; para él hablar con el compañero es su forma de estar presente, mejor dale un rol que use esa energía." },
    { situationId: "se-distrae", eje: "S", whatToSay: "\"Vamos una a la vez. Esta es la única que importa ahora. Cuando la tengas clara, pasamos a la siguiente, tranquilo.\"", whatToAvoid: "Evita apurarlo o sumar consignas nuevas cuando ya se saturó de ruido; suele volver a enfocarse si bajas el ritmo y le das una sola cosa clara." },
    { situationId: "se-distrae", eje: "C", whatToSay: "\"Se te ve pensando en algo. Cuéntame qué viste en la jugada anterior, y después lo llevamos a esta.\"", whatToAvoid: "Evita asumir que no está atento y llamarle la atención en público; muchas veces está procesando algo del juego, mejor pregúntale qué está pensando." },
    { situationId: "quiere-dejar", eje: "D", whatToSay: "\"Entiendo que estás cansado de esto. Cuéntame qué te gustaría cambiar para sentir que aquí tienes un rol tuyo.\"", whatToAvoid: "Evita retarlo a que demuestre que puede quedarse, porque convierte su cansancio en una competencia que suele alejarlo más." },
    { situationId: "quiere-dejar", eje: "I", whatToSay: "\"Se nota que algo no te está gustando y quiero entenderlo. ¿Cómo te sientes con el grupo cuando vienes?\"", whatToAvoid: "Evita insistir con lo bueno que es el deporte sin escuchar si se siente parte del grupo, que suele ser lo que más le pesa." },
    { situationId: "quiere-dejar", eje: "S", whatToSay: "\"Está bien tomarte un tiempo para pensarlo, sin apuro. ¿Qué parte te está costando más ahora?\"", whatToAvoid: "Evita pedirle una decisión rápida o que lo hable frente a todos, porque suele necesitar calma y tiempo para reencontrar el disfrute." },
    { situationId: "quiere-dejar", eje: "C", whatToSay: "\"Quiero entender bien qué dejó de tener sentido para ti. Cuéntame cómo ves las cosas y lo pensamos juntos.\"", whatToAvoid: "Evita responderle solo con ánimo sin darle una razón clara, porque suele necesitar entender el porqué antes de volver a comprometerse." },
    { situationId: "jugador-nuevo", eje: "D", whatToSay: "\"Tú conoces bien cómo funciona el grupo. Muéstrale la cancha al nuevo, que se sienta parte del equipo.\"", whatToAvoid: "Evita presentarle al nuevo como un rival para motivarlo, porque convierte la llegada de un compañero en una competencia en vez de una integración." },
    { situationId: "jugador-nuevo", eje: "I", whatToSay: "\"Se te da natural hacer sentir bien a la gente. ¿Le muestras al nuevo quiénes somos? Nos vendría bien tu energía.\"", whatToAvoid: "Evita descargar en él toda la tarea de integrar al nuevo, porque su calidez no debería volverse una obligación que nadie le agradece." },
    { situationId: "jugador-nuevo", eje: "S", whatToSay: "\"Sé que un cambio así mueve cosas. El equipo sigue siendo el mismo, solo sumamos a alguien. Tómate tu tiempo.\"", whatToAvoid: "Evita empujarlo a recibir al nuevo de inmediato, porque necesita tiempo para reacomodarse antes de sentirse cómodo con el cambio." },
    { situationId: "jugador-nuevo", eje: "C", whatToSay: "\"Veo que estás midiendo cómo encaja. Está bien conocerlo a tu ritmo. Cuando te sientas listo, ve y habla con él.\"", whatToAvoid: "Evita leer su distancia como rechazo y presionarlo a acercarse, porque observar primero es su manera de entender quién es el nuevo." },
    { situationId: "se-congela", eje: "D", whatToSay: "\"Olvida el resultado por un minuto. Tu primera jugada es solo correr a recibir. Yo confío en ti.\"", whatToAvoid: "Evita exigirle que 'despierte' o que lidere el partido, porque le suma peso justo cuando su motor ya está frenado por la presión." },
    { situationId: "se-congela", eje: "I", whatToSay: "\"Nadie te está midiendo aquí. Estamos contigo pase lo que pase. Pide la pelota y juega con los tuyos.\"", whatToAvoid: "Evita señalarlo delante de todos o pedirle que 'se haga ver', porque sentirse observado es justo lo que lo bloquea." },
    { situationId: "se-congela", eje: "S", whatToSay: "\"Quédate cerca de mí en la banda un momento. Tu tarea es simple: marca a ese jugador. Nada más.\"", whatToAvoid: "Evita cambiarle la posición o darle varias instrucciones a la vez, porque en el caos es cuando más se apaga." },
    { situationId: "se-congela", eje: "C", whatToSay: "\"No pienses en todo. Solo una regla: si te llega la pelota, pásala al que esté libre. Eso es todo.\"", whatToAvoid: "Evita explicarle muchas variantes tácticas ahora, porque más información le da más para analizar y lo termina paralizando." },
    { situationId: "no-quiere-ser-centro", eje: "D", whatToSay: "\"Te suele gustar llevar la voz, hoy te noto distinto. ¿Qué pasa? No hace falta que salgas si no quieres.\"", whatToAvoid: "Evita empujarlo más fuerte al frente pensando que solo está desafiándote, cuando quizás hoy algo puntual lo tiene inseguro." },
    { situationId: "no-quiere-ser-centro", eje: "I", whatToSay: "\"¿Quieres arrancar con un compañero al lado? No tienes que hacerlo solo, elige a alguien y lo muestran juntos.\"", whatToAvoid: "Evita mandarlo solo al frente asumiendo que por ser sociable disfruta el escenario, cuando lo que necesita es compañía." },
    { situationId: "no-quiere-ser-centro", eje: "S", whatToSay: "\"Está bien que prefieras el segundo plano. ¿Me ayudas a organizar al grupo desde aquí? Eso también es liderar.\"", whatToAvoid: "Evita ponerlo al frente para que se le pase la incomodidad, porque expuesto de golpe suele sentirse más inseguro." },
    { situationId: "no-quiere-ser-centro", eje: "C", whatToSay: "\"Te doy unos minutos para que prepares cómo lo quieres mostrar. Cuando estés listo, avísame y lo hacemos.\"", whatToAvoid: "Evita pedirle que salga a improvisar sin aviso, porque sin un momento para pensarlo suele bloquearse más." },
    { situationId: "cambio-repentino", eje: "D", whatToSay: "\"Te noto con menos chispa que otras veces. No tienes que estar al cien hoy. Cuando quieras contarme, aquí estoy.\"", whatToAvoid: "Evita intentar sacudirlo con un reto o una competencia para que reaccione; hoy su energía baja pide espacio, no un desafío." },
    { situationId: "cambio-repentino", eje: "I", whatToSay: "\"Te veo un poco lejos del grupo estos días. Me importa cómo estás, no solo cómo juegas. ¿Quieres que caminemos un rato?\"", whatToAvoid: "Evita señalar frente al grupo que está distinto; para él la exposición pesa y puede alejarlo todavía más." },
    { situationId: "cambio-repentino", eje: "S", whatToSay: "\"Noté que algo te tiene incómodo últimamente. No pasa nada, aquí las cosas siguen igual de tranquilas. Tómate el tiempo que necesites.\"", whatToAvoid: "Evita reclamarle por la irritabilidad o exigirle una explicación; para él la calma del entorno es justo lo que lo ayuda a volver." },
    { situationId: "cambio-repentino", eje: "C", whatToSay: "\"Te noto en tu mundo estos días, y está bien. No hace falta explicar nada. Cuando ordenes lo que piensas, te escucho.\"", whatToAvoid: "Evita presionarlo para que ponga en palabras lo que le pasa antes de tiempo; suele necesitar procesarlo por dentro primero." },
    { situationId: "derrota-grupal", eje: "group", whatToSay: "\"Hoy duele, y está bien que duela. Lo que nos hace equipo no lo decide un marcador. Mañana lo miramos juntos.\"", whatToAvoid: "Evita saltar al análisis táctico de lo que salió mal antes de dar espacio a que el grupo procese la emoción de la derrota." },
    { situationId: "acepta-ser-suplente", eje: "D", whatToSay: "\"Sé que te quema estar afuera. Mira el partido como si fueras yo: cuando entres, quiero que resuelvas eso.\"", whatToAvoid: "Evita pedirle que se quede quieto y tranquilo sin darle un rol; sin algo concreto que hacer, su energía se le vuelve fastidio." },
    { situationId: "acepta-ser-suplente", eje: "I", whatToSay: "\"Sigues siendo del equipo estés o no en cancha. Desde ahí tu voz suma: te necesito alentando a los que entran.\"", whatToAvoid: "Evita explicarle solo el motivo técnico y dejarlo aislado en la punta del banco, sin confirmarle que sigue siendo parte del grupo." },
    { situationId: "acepta-ser-suplente", eje: "S", whatToSay: "\"Sé que lo tomas sin quejarte, y eso no significa que no duela. Si quieres hablarlo, aquí estoy.\"", whatToAvoid: "Evita dar por hecho que lo aceptó porque no dice nada; su silencio puede estar guardando un malestar que aparece más tarde." },
    { situationId: "acepta-ser-suplente", eje: "C", whatToSay: "\"No es por algo que hiciste mal. Hoy elegí este equipo por cómo se para el rival, y tu turno llega.\"", whatToAvoid: "Evita dejarlo sin una razón clara del criterio; si no la tiene, tiende a llenar ese vacío pensando que falló en algo." },
    { situationId: "companero-se-destaca", eje: "D", whatToSay: "\"Sé que te arde ver a otro brillar. Ese fuego es tuyo, úsalo en la próxima jugada, no contra él.\"", whatToAvoid: "Evita retarlo por reaccionar tan competitivo o pedirle que aplauda al otro de inmediato, porque todavía necesita un canal para esa energía antes de poder calmarla." },
    { situationId: "companero-se-destaca", eje: "I", whatToSay: "\"El grupo festeja a tu compañero y tú sigues siendo parte del grupo. Tu lugar aquí no se achica porque otro brille.\"", whatToAvoid: "Evita minimizar su malestar con un 'no pasa nada', porque lo que siente es miedo a perder el cariño del grupo, no un capricho." },
    { situationId: "companero-se-destaca", eje: "S", whatToSay: "\"Vi que te fuiste al segundo plano. No tienes que festejar si no te sale, pero cuéntame qué te pasó.\"", whatToAvoid: "Evita dar por hecho que está bien solo porque se quedó callado, ya que suele guardar el fastidio hasta que aparece de golpe más tarde." },
    { situationId: "companero-se-destaca", eje: "C", whatToSay: "\"Que él lo haya hecho bien no significa que tú lo hiciste mal. Son dos jugadas distintas, no una cuenta entre ustedes.\"", whatToAvoid: "Evita darle una explicación técnica de por qué el otro acertó, porque eso alimenta el bucle de comparación punto por punto en el que ya está." },
    { situationId: "recibe-correccion", eje: "D", whatToSay: "\"Nadie discute lo que vales. Te marco este gesto porque sé que puedes ajustarlo y seguir al frente.\"", whatToAvoid: "Evita corregirlo delante de todos o insistir hasta ganar la discusión, porque siente que pierde estatus y tiende a cerrarse más." },
    { situationId: "recibe-correccion", eje: "I", whatToSay: "\"Seguimos igual de bien, esto no cambia nada entre nosotros. Solo te muestro un detalle para que juegues más suelto.\"", whatToAvoid: "Evita darle la corrección en frío o frente al grupo, porque suele leerla como un rechazo tuyo y eso le pesa más que el error." },
    { situationId: "recibe-correccion", eje: "S", whatToSay: "\"Tómate tu tiempo, no hay apuro ni problema. Este ajuste es chico y lo vamos a ir probando juntos, tranquilo.\"", whatToAvoid: "Evita tomar su silencio como que ya está resuelto y sumarle más correcciones, porque tiende a guardarse el malestar y desinflarse más tarde." },
    { situationId: "recibe-correccion", eje: "C", whatToSay: "\"Entendiste perfecto el porqué. Ahora suéltalo y pruébalo en la próxima jugada, no necesitas tenerlo perfecto de entrada.\"", whatToAvoid: "Evita darle demasiados detalles o repetir la explicación, porque suele trabarse analizando cada uno y le cuesta soltar el error para seguir jugando." },
    { situationId: "gestiona-exito", eje: "D", whatToSay: "\"Buenísimo ese gol, se notan las ganas que le pusiste. Ahora viene lo difícil: sostener la misma intensidad hasta el final.\"", whatToAvoid: "Evita minimizar su logro para que no se confíe, porque necesita sentir que lo que hizo valió antes de escuchar qué sigue." },
    { situationId: "gestiona-exito", eje: "I", whatToSay: "\"Qué lindo verte tan contento y contagiando al equipo. Ese festejo también es de tus compañeros, celebrémoslo juntos y sigamos jugando.\"", whatToAvoid: "Evita señalarlo delante del grupo por acaparar el festejo, porque avergonzarlo frente a otros le duele más que el propio descuido." },
    { situationId: "gestiona-exito", eje: "S", whatToSay: "\"Me gustó cómo jugaste, se ve que estabas cómodo. Mantengamos esa calma pero sin soltar, que el partido sigue igual de importante.\"", whatToAvoid: "Evita exponerlo con un festejo ruidoso que no busca, porque lo incómodo lo hace retraerse en vez de sostener su buen momento." },
    { situationId: "gestiona-exito", eje: "C", whatToSay: "\"Te salió muy bien y se nota que lo pensaste. ¿Qué crees que puedes ajustar para que la próxima salga aún mejor?\"", whatToAvoid: "Evita darle por cerrado el aprendizaje con un elogio tipo lo dominaste, porque confirma su idea de que ya no le queda nada por explorar." },
    { situationId: "rol-referente", eje: "D", whatToSay: "\"Liderar no es que todos te sigan el ritmo. A veces es esperar al que va atrás. Eso también es ser referente.\"", whatToAvoid: "Evita darle la cinta y soltarlo sin mostrarle que escuchar al grupo también es liderar, no solo marcar el ritmo." },
    { situationId: "rol-referente", eje: "I", whatToSay: "\"Ser referente no es dejar de ser su amigo. A veces es cuidarlos poniendo un límite, y eso también los une.\"", whatToAvoid: "Evita pedirle que ponga límites de golpe, porque teme que el grupo deje de quererlo por eso." },
    { situationId: "rol-referente", eje: "S", whatToSay: "\"Ya sostienes al grupo aunque nadie lo diga. Ser referente puede ser eso mismo, sin tener que ponerte adelante.\"", whatToAvoid: "Evita nombrarlo capitán delante de todos de golpe, porque la exposición repentina suele tensarlo más que darle confianza." },
    { situationId: "rol-referente", eje: "C", whatToSay: "\"No necesitas tenerlo todo claro para empezar. Dime qué dudas tienes del rol y lo pensamos juntos.\"", whatToAvoid: "Evita decirle solo que lidere a su manera, porque sin saber qué se espera prefiere no ejercer el rol." },
    { situationId: "expectativa-padres", eje: "D", whatToSay: "\"Hoy juegas para ti, no para nadie de la tribuna. Equivocarte es parte del juego. A mí me gusta cómo lo intentas.\"", whatToAvoid: "Evita empujarlo a ganar para demostrarle algo a la tribuna, porque le confirma que su valor depende del resultado frente a sus padres." },
    { situationId: "expectativa-padres", eje: "I", whatToSay: "\"Tus papás te quieren juegues como juegues, eso no se gana ni se pierde en la cancha. Hoy disfruta con tus compañeros.\"", whatToAvoid: "Evita señalarle que sus padres lo están mirando o pedirle que no mire a la tribuna, porque le confirma que ahí hay algo que vigilar." },
    { situationId: "expectativa-padres", eje: "S", whatToSay: "\"Sé que jugar con ellos mirando a veces pesa. Si te aprieta en algún momento, me lo dices y lo bajamos juntos.\"", whatToAvoid: "Evita dar por hecho que está tranquilo porque sigue jugando callado, porque esa calma puede estar tapando una tensión que se le acumula por dentro." },
    { situationId: "expectativa-padres", eje: "C", whatToSay: "\"No tienes que adivinar qué esperan de ti. Ocúpate solo de la próxima jugada, que es lo único que depende de ti.\"", whatToAvoid: "Evita darle más indicaciones o análisis para que lo haga bien, porque le suma exigencia mental cuando lo que necesita es soltar y jugar suelto." },
    { situationId: "sube-categoria", eje: "D", whatToSay: "\"Sé que aquí arrancas de nuevo y eso incomoda. No tienes que demostrar nada hoy. Pide la pelota tranquilo, cuenta conmigo.\"", whatToAvoid: "Evita picarlo con retos o comparaciones para que reaccione, porque suele empujarlo a competir de más y tapar la inseguridad con enojo." },
    { situationId: "sube-categoria", eje: "I", whatToSay: "\"Al principio uno se siente medio solo entre caras nuevas. Dame unos días y te voy presentando. Estos compañeros te van a querer.\"", whatToAvoid: "Evita dejarlo suelto para que se integre solo, porque cuando el niño se siente ajeno al grupo tiende a apagarse aunque esté rodeado de gente." },
    { situationId: "sube-categoria", eje: "S", whatToSay: "\"Es mucho cambio de golpe (caras nuevas, otro ritmo). Vamos de a poco, sin apuro. Tu lugar aquí lo vamos a ir armando juntos.\"", whatToAvoid: "Evita leer su silencio como que está bien, porque el niño suele sostener la incomodidad callado hasta que un día le pesa de golpe." },
    { situationId: "sube-categoria", eje: "C", whatToSay: "\"Todavía estás leyendo cómo se juega aquí, es lógico. Tómate el tiempo de entenderlo. Cuando lo tengas claro, vas a soltarte solo.\"", whatToAvoid: "Evita apurarlo a jugar antes de que entienda el escenario nuevo, porque el niño suele necesitar procesar los códigos antes de sentirse seguro para arriesgar." },
];
export const VETA_NUANCES: VetaNuance[] = [
    { situationId: "no-quiere-arrancar", primary: "D", veta: "I", text: "El desafío lo enciende, pero su costado Conector hace que lo mueva más un reto compartido que uno en solitario. Propónle liderar una entrada en grupo o retar a un compañero, no una prueba individual." },
    { situationId: "no-quiere-arrancar", primary: "D", veta: "C", text: "También arranca con un desafío, pero su costado Estratega quiere saber para qué sirve lo que viene. Dale el reto con un objetivo claro (\"esto lo trabajamos para el partido\"), no solo la adrenalina de competir." },
    { situationId: "no-quiere-arrancar", primary: "I", veta: "D", text: "Necesita el vínculo para engancharse, pero su costado Impulsor pide movimiento apenas se siente parte. Una vez cerca del grupo, dale algo activo para hacer ya, no lo dejes solo mirando desde el costado." },
    { situationId: "no-quiere-arrancar", primary: "I", veta: "S", text: "Igual busca lo social, pero su costado Sosten hace la transición más lenta y le pesa más si el clima del grupo está raro. Acércalo a los demás sin exigirle jugar y dale unos minutos de calma antes de sumarlo." },
    { situationId: "no-quiere-arrancar", primary: "S", veta: "I", text: "Necesita su tiempo, pero su costado Conector hace que un compañero de confianza le ablande la entrada. Emparéjalo con un amigo para ese primer momento en vez de dejarlo hacer la transición solo." },
    { situationId: "no-quiere-arrancar", primary: "S", veta: "C", text: "También necesita acomodarse, pero su costado Estratega se calma cuando sabe qué viene. Anticípale el plan del día (\"primero esto, después esto\") para que la previsibilidad le facilite el cambio de chip." },
    { situationId: "no-quiere-arrancar", primary: "C", veta: "D", text: "Igual necesita cerrar lo que trae en la cabeza, pero su costado Impulsor se impacienta rápido. Una vez que soltó la idea, dale una entrada activa y con un reto para que ese impulso lo enchufe, sin estirar más el análisis." },
    { situationId: "no-quiere-arrancar", primary: "C", veta: "S", text: "También quiere cerrar lo que está procesando, pero su costado Sosten pide hacerlo en calma y sin apuro. Dale un espacio tranquilo y unos minutos de más, sin presionarlo a resolverlo de inmediato." },
    { situationId: "se-frustra-cuando-pierde", primary: "D", veta: "I", text: "Su costado Conector hace que la bronca del Impulsor tenga público: le pesa doble perder y que lo vean perder. Dale unos segundos fuera de la mirada del grupo antes de reincorporarlo, así descarga sin sentir que quedó expuesto." },
    { situationId: "se-frustra-cuando-pierde", primary: "D", veta: "C", text: "Su costado Estratega convierte parte de la bronca del Impulsor en reproche hacia sí mismo: no solo quería ganar, ya está repasando dónde falló. Después de validar el enojo, dale un solo detalle concreto para ajustar, así su cabeza analítica tiene dónde apoyarse en vez de dar vueltas." },
    { situationId: "se-frustra-cuando-pierde", primary: "I", veta: "D", text: "Su costado Impulsor hace que la frustración social del Conector salga más fuerte y visible: no solo teme haber decepcionado, también le arde perder. Primero bájale el peso del grupo (nadie lo culpa) y solo entonces canaliza esas ganas hacia la próxima jugada." },
    { situationId: "se-frustra-cuando-pierde", primary: "I", veta: "S", text: "Su costado Sosten hace que el Conector, en vez de mostrar la frustración, se la guarde para no incomodar al grupo, y puede aislarse en silencio. Acércate en privado y sin apuro, dándole a entender que sigue siendo parte, sin obligarlo a hablar delante de todos." },
    { situationId: "se-frustra-cuando-pierde", primary: "S", veta: "I", text: "Su costado Conector le agrega al silencio del Sosten una capa social: parte de lo que le pesa es cómo quedó frente al equipo, aunque no lo diga. Un gesto cálido y cercano, como acercarte a su lado sin exigirle nada, lo reconecta mejor que dejarlo del todo solo." },
    { situationId: "se-frustra-cuando-pierde", primary: "S", veta: "C", text: "Su costado Estratega hace que, mientras el Sosten calla por fuera, por dentro repase una y otra vez qué salió mal. Cuando ya esté más tranquilo, ofrécele una lectura corta y lógica que separe esa jugada de lo que él vale, para cortar el bucle silencioso." },
    { situationId: "se-frustra-cuando-pierde", primary: "C", veta: "D", text: "Su costado Impulsor hace que el reproche interno del Estratega no se quede adentro: puede estallar hacia afuera, con un golpe o un gesto de bronca. Deja pasar ese pico sin sermonear y, cuando baje, vuelve al tono lógico y concreto que a él lo ordena." },
    { situationId: "se-frustra-cuando-pierde", primary: "C", veta: "S", text: "Su costado Sosten hace que la autoexigencia del Estratega se guarde y se sostenga en el tiempo: por fuera parece calmado, pero sigue masticando el error solo. Vuelve a buscarlo un rato después con un aprendizaje pequeño y concreto, para darle una salida a esa rumia callada." },
    { situationId: "no-hace-lo-que-pido", primary: "D", veta: "I", text: "Su arranque impulsivo viene con ganas de arrastrar al grupo: sale primero y a veces otros lo siguen sin haber escuchado. Dale el rol de repetir la consigna en voz alta, así canaliza esa energía y ordena al equipo." },
    { situationId: "no-hace-lo-que-pido", primary: "D", veta: "C", text: "Su costado Estratega le mete un freno breve al impulso: arranca rápido, pero puede reformular tu consigna si le encuentra una lógica mejor. Antes de corregirlo, pregúntale qué vio; muchas veces detectó algo real." },
    { situationId: "no-hace-lo-que-pido", primary: "I", veta: "D", text: "Su costado Impulsor hace que, apenas vuelve a engancharse, salga disparado aunque no haya escuchado del todo. Recupera su atención y pídele que repita la consigna antes de largar." },
    { situationId: "no-hace-lo-que-pido", primary: "I", veta: "S", text: "Su costado Sosten hace que, después de engancharse con un compañero, necesite un momento de calma para volver a la consigna sin sentirse expuesto. Reconéctalo en voz baja y confírmale que está todo bien, sin señalarlo." },
    { situationId: "no-hace-lo-que-pido", primary: "S", veta: "I", text: "Su costado Conector hace que la seguridad para arrancar le llegue del vínculo: si un compañero sale con él, se anima antes. Empareja su salida con alguien de confianza." },
    { situationId: "no-hace-lo-que-pido", primary: "S", veta: "C", text: "Su costado Estratega suma a la pausa una necesidad de entender el para qué antes de sentirse seguro. Explícale breve la lógica de la consigna: le acorta el tiempo de arranque mucho más que apurarlo." },
    { situationId: "no-hace-lo-que-pido", primary: "C", veta: "D", text: "Su costado Impulsor hace que, apenas la consigna le cierra, salga con decisión y hasta te la cuestione rápido si no le cuadra. Respóndele el porqué sin rodeos y lo tendrás en movimiento enseguida." },
    { situationId: "no-hace-lo-que-pido", primary: "C", veta: "S", text: "Su costado Sosten le suma prudencia a la duda lógica: entiende, pero se guarda la pregunta y demora sin decir nada. Acércate y ábrele espacio para preguntar en privado, sin apuro." },
    { situationId: "raro-antes-del-partido", primary: "D", veta: "I", text: "Su costado Conector hace que canalice los nervios contagiando energía al grupo, no solo moviéndose él. Dale un rol de arengar al equipo antes de salir y esa tensión se vuelve motor para todos." },
    { situationId: "raro-antes-del-partido", primary: "D", veta: "C", text: "Su costado Estratega mete análisis en medio de la aceleración, y puede impacientarse repasando jugadas mientras se mueve. Dale una sola acción concreta para el arranque, así enfoca esos nervios en algo puntual." },
    { situationId: "raro-antes-del-partido", primary: "I", veta: "D", text: "Su costado Impulsor hace que busque al grupo con más intensidad y hasta lo arrastre en su propio nervio. Canaliza eso dándole liderar la entrada en calor, para que la energía tenga adónde ir." },
    { situationId: "raro-antes-del-partido", primary: "I", veta: "S", text: "Su costado Sosten hace que busque compañía pero de forma más callada, le alcanza con una presencia estable al lado. No lo lleves al centro del grupo, quédate tú un momento cerca de él." },
    { situationId: "raro-antes-del-partido", primary: "S", veta: "I", text: "Su costado Conector hace que se calme más con la gente que quiere cerca que con las palabras solas. Ponlo junto a un compañero de confianza mientras espera y baja la tensión sin sentirse expuesto." },
    { situationId: "raro-antes-del-partido", primary: "S", veta: "C", text: "Su costado Estratega hace que se calme cuando entiende exactamente qué va a pasar, no solo con un 'todo va a estar bien'. Repásale el plan concreto, paso a paso y sin sorpresas de último momento." },
    { situationId: "raro-antes-del-partido", primary: "C", veta: "D", text: "Su costado Impulsor le suma urgencia por salir ya a la cancha en medio del repaso mental. Confírmale que el plan está listo y que ahora toca ejecutarlo, para que suelte el análisis y arranque." },
    { situationId: "raro-antes-del-partido", primary: "C", veta: "S", text: "Su costado Sosten hace que, además de repasar, necesite saber que nada del plan va a cambiar de golpe. Confírmale que la rutina se mantiene y respeta su silencio mientras se prepara." },
    { situationId: "mira-desde-afuera", primary: "D", veta: "I", text: "Su costado Conector hace que no solo busque el momento para entrar con protagonismo, sino que le importe caer bien al grupo mientras lidera. Ofrécele un rol que lo ponga adelante pero junto a un compañero, no en solitario." },
    { situationId: "mira-desde-afuera", primary: "D", veta: "C", text: "Su costado Estratega hace que, además de buscar protagonismo, quiera entender la jugada antes de meterse para no fallar. Dale la regla y el objetivo en dos frases y lo verás entrar decidido." },
    { situationId: "mira-desde-afuera", primary: "I", veta: "D", text: "Su costado Impulsor hace que espere menos la invitación de lo habitual: si hay acción o un lugar protagónico, se anima antes. Invítalo con un rol activo y no esperes tanto para llamarlo." },
    { situationId: "mira-desde-afuera", primary: "I", veta: "S", text: "Su costado Sosten suma cautela a la espera Conectora: no solo necesita ser invitado, también sentir que el entorno es seguro. Emparéjalo con alguien que ya conozca para que entre tranquilo." },
    { situationId: "mira-desde-afuera", primary: "S", veta: "I", text: "Su costado Conector hace que la seguridad le llegue sobre todo por el vínculo: un compañero amable que lo invite le confirma que el lugar es seguro. Pide a un compañero cálido que lo sume, más que explicarle el ejercicio." },
    { situationId: "mira-desde-afuera", primary: "S", veta: "C", text: "Su costado Estratega hace que la calma le llegue por entender: no le alcanza con que le digas que es seguro, necesita saber cómo funciona. Explícale el ejercicio paso a paso y ganará la previsibilidad que busca." },
    { situationId: "mira-desde-afuera", primary: "C", veta: "D", text: "Su costado Impulsor acorta su análisis: en cuanto entiende la lógica, quiere entrar y tomar protagonismo. Explícale rápido y dale enseguida una acción con peso para que no se enfríe esperando." },
    { situationId: "mira-desde-afuera", primary: "C", veta: "S", text: "Su costado Sosten alarga la observación: además de entender la dinámica, quiere confirmar que el entorno es estable antes de exponerse. Respétale ese tiempo extra y déjalo entrar en segundo plano, sin ponerlo al centro." },
    { situationId: "llora-o-se-enoja", primary: "D", veta: "I", text: "Su enojo sale rápido como en todo Impulsor, pero su costado Conector hace que después le pese haber estallado frente al grupo. Dale el desahogo y, apenas baje, reintégralo con naturalidad para que no quede expuesto." },
    { situationId: "llora-o-se-enoja", primary: "D", veta: "C", text: "Estalla hacia afuera como Impulsor, pero su costado Estratega redirige rápido el enojo hacia sí mismo y hacia el porqué de lo que no salió. Cuando baje, ofrécele un dato concreto de qué ajustar, eso lo ordena más que solo calmarlo." },
    { situationId: "llora-o-se-enoja", primary: "I", veta: "D", text: "Se quiebra por lo social como Conector, pero su costado Impulsor puede convertir el llanto en un estallido o una protesta en voz alta. No lo leas como desafío, es el mismo dolor con más voltaje. Valida el vínculo primero y baja el tono." },
    { situationId: "llora-o-se-enoja", primary: "I", veta: "S", text: "Le duele lo social como a todo Conector, pero su costado Sostén hace que se lo trague y se repliegue en silencio en vez de mostrarlo. Acércate en privado y sin apuro, porque difícilmente venga él a buscarte." },
    { situationId: "llora-o-se-enoja", primary: "S", veta: "I", text: "Su quiebre viene de acumular callado como Sostén, pero su costado Conector suma un ingrediente social: parte de lo que se juntó puede ser sentirse poco tenido en cuenta. Al acompañarlo, revisa también cómo se sintió con el grupo, no solo la exigencia del ejercicio." },
    { situationId: "llora-o-se-enoja", primary: "S", veta: "C", text: "Acumula en silencio como Sostén, pero su costado Estratega agrega autoexigencia: además del cansancio, puede venir masticando que no le salía como él quería. Ayúdalo a poner en palabras qué se le fue juntando y sácale la presión de que tenía que salirle perfecto." },
    { situationId: "llora-o-se-enoja", primary: "C", veta: "D", text: "Se enoja consigo mismo como Estratega, pero su costado Impulsor puede hacer que esa bronca salga de golpe hacia afuera antes de encerrarse. Dale una vía rápida para soltarla y después respétale el momento a solas, sin perseguirlo." },
    { situationId: "llora-o-se-enoja", primary: "C", veta: "S", text: "Necesita el momento a solas del Estratega, pero su costado Sostén hace que además se repliegue sin dar señales y que quizás venga acumulando de antes. Dale su espacio y vuelve a acercarte con calma un rato después, porque no va a avisarte cuando esté listo." },
    { situationId: "roce-con-companero", primary: "D", veta: "I", text: "Su costado Conector hace que, además de querer imponer su idea, le importe cómo queda con el compañero, así que el roce le duele en el vínculo y no solo en el control. Dale un rol para liderar y, en la misma charla, ayúdalo a cerrar bien con el otro." },
    { situationId: "roce-con-companero", primary: "D", veta: "C", text: "Su costado Estratega hace que no solo quiera imponer su ritmo, sino demostrar que su forma es la correcta, y ahí se clava en tener razón. Pídele que te explique su lógica primero: cuando se siente entendido, suele aflojar la insistencia." },
    { situationId: "roce-con-companero", primary: "I", veta: "D", text: "Su costado Impulsor hace que, cuando se siente rechazado, no se repliegue sino que responda fuerte o alce la voz, y su dolor se ve por fuera como enojo. Valida primero lo que sintió y recién ahí lo ayudas a bajar la intensidad." },
    { situationId: "roce-con-companero", primary: "I", veta: "S", text: "Su costado Sosten hace que, al sentirse rechazado, se guarde el dolor y se aleje en silencio en vez de buscarte, así que puede pasar desapercibido. Acércate tú a preguntarle, no esperes a que él traiga el tema." },
    { situationId: "roce-con-companero", primary: "S", veta: "I", text: "Su costado Conector hace que evite el conflicto no solo por calma, sino por miedo a perder el vínculo con ese compañero, y eso le pesa doble. Ayúdalo a reparar la relación, no solo a bajar la tensión del momento." },
    { situationId: "roce-con-companero", primary: "S", veta: "C", text: "Su costado Estratega hace que, mientras evita el conflicto, vaya guardando en silencio cada cosa que le molestó, y cuando reacciona sale con una lista entera. Dale un momento a solas antes de hablar para que ordene lo que quiere decir." },
    { situationId: "roce-con-companero", primary: "C", veta: "D", text: "Su costado Impulsor hace que, cuando siente que el otro no sigue la lógica, no se frustre callado sino que lo corrija de frente y con firmeza, y puede sonar mandón. Reconoce que su análisis es válido y guíalo a proponerlo sin imponerlo." },
    { situationId: "roce-con-companero", primary: "C", veta: "S", text: "Su costado Sosten hace que, ante lo que él ve como falta de lógica, no discuta sino que se cierre y se desconecte del ejercicio en silencio, y su frustración se vuelve retirada. Pregúntale qué no le cerró para que vuelva a engancharse." },
    { situationId: "se-castiga", primary: "D", veta: "I", text: "Su costado Conector le suma la mirada del equipo a la reacción rápida del Impulsor: no solo se enoja, también le pesa quedar mal frente a los demás. Recógelo un segundo aparte y dile que el grupo lo sigue queriendo." },
    { situationId: "se-castiga", primary: "D", veta: "C", text: "Su costado Estratega convierte el enojo visible en un reproche mental por no haber acertado lo que 'ya sabía'. Dale una acción concreta e inmediata para la próxima jugada y corta el análisis en caliente." },
    { situationId: "se-castiga", primary: "I", veta: "D", text: "Su costado Impulsor hace que el castigo social se vuelva más ruidoso e intenso, casi una explosión visible. Primero baja la temperatura con calma firme y solo entonces reconéctalo con el equipo." },
    { situationId: "se-castiga", primary: "I", veta: "S", text: "Su costado Sosten hace que se trague el 'qué pensarán' y lo rumie callado en vez de mostrarlo. No esperes a que lo diga: ponte a su lado y ábrele la puerta en voz baja." },
    { situationId: "se-castiga", primary: "S", veta: "I", text: "Su costado Conector le agrega a la rumia silenciosa la preocupación por decepcionar a los demás. Sin exponerlo, hazle saber en corto que su lugar en el equipo no depende de esa jugada." },
    { situationId: "se-castiga", primary: "S", veta: "C", text: "Su costado Estratega alimenta la rumia callada con un análisis detallado del error, y el circuito de castigo se cierra más fuerte. Ayúdalo a quedarse con un solo aprendizaje concreto y a soltar el resto." },
    { situationId: "se-castiga", primary: "C", veta: "D", text: "Su costado Impulsor saca afuera la dureza mental del Estratega y la vuelve un estallido visible contra sí mismo. Contén primero la intensidad y solo después rescata que su plan estaba bien pensado." },
    { situationId: "se-castiga", primary: "C", veta: "S", text: "Su costado Sosten guarda puertas adentro la autoexigencia del Estratega, que sigue girando en silencio. Como no va a mostrarlo, nómbralo con suavidad y dile que un error no borra lo bien que pensó la jugada." },
    { situationId: "se-distrae", primary: "D", veta: "I", text: "Su aburrimiento no se queda quieto: el costado Conector lo lleva a arrastrar a los compañeros a la distracción, no se dispersa solo. Dale un reto en dupla para que canalice la energía sin desenganchar al grupo." },
    { situationId: "se-distrae", primary: "D", veta: "C", text: "El costado Estratega hace que se desconecte no solo por lento, sino porque ya le encontró la lógica y le parece obvio. En vez de más repeticiones, dale una variante más compleja o pídele que él proponga cómo subir la dificultad." },
    { situationId: "se-distrae", primary: "I", veta: "D", text: "Su distracción social gana volumen: el costado Impulsor lo hace más protagonista y puede terminar dirigiendo la charla de todo el grupo. Dale el rol de liderar la consigna en voz alta, así el vínculo y el protagonismo juegan a favor." },
    { situationId: "se-distrae", primary: "I", veta: "S", text: "El costado Sosten suaviza la dispersión: no busca a todo el grupo, sino conversar bajito con su compañero de confianza, y se incomoda si lo cambias de lugar. Mantenlo cerca de ese compañero y dales una tarea para hacer entre los dos." },
    { situationId: "se-distrae", primary: "S", veta: "I", text: "Cuando el caos lo desconecta, el costado Conector le da una salida: vuelve a engancharse si tiene un compañero al lado que le sirva de referencia. Emparéjalo con alguien tranquilo antes que insistirle a él solo." },
    { situationId: "se-distrae", primary: "S", veta: "C", text: "El costado Estratega le pide estructura además de calma: se reconecta cuando entiende el orden y el para qué del ejercicio, no solo cuando baja el ruido. Dale la secuencia clara y el motivo, y recupera el foco." },
    { situationId: "se-distrae", primary: "C", veta: "D", text: "Su cabeza está en otra jugada, pero el costado Impulsor le suma impaciencia: no solo analiza, quiere ir a probar ya lo que pensó. Dale un momento corto para ejecutar su idea en la cancha antes de volver a la consigna." },
    { situationId: "se-distrae", primary: "C", veta: "S", text: "El costado Sosten lo vuelve más reservado: procesa hacia adentro y difícilmente cuente qué está pensando si lo expones frente a todos. Acércate a preguntarle en voz baja y a solas, y ahí sí abre lo que observó." },
    { situationId: "quiere-dejar", primary: "D", veta: "I", text: "Su costado Conector hace que, aunque quiera dejar por falta de protagonismo, también le pese haber perdido vínculos en el grupo. Pregúntale por sus compañeros, no solo por el rol que ocupa." },
    { situationId: "quiere-dejar", primary: "D", veta: "C", text: "Su costado Estratega hace que su decisión de irse venga con argumentos pensados, no solo con impulso. Pídele que te explique su razonamiento y respóndele con lógica, no con presión." },
    { situationId: "quiere-dejar", primary: "I", veta: "D", text: "Su costado Impulsor hace que, cuando siente que no pertenece, lo exprese con enojo o un portazo antes que con una retirada silenciosa. Recibe ese enojo sin reprenderlo y retoma el tema del grupo cuando se calme." },
    { situationId: "quiere-dejar", primary: "I", veta: "S", text: "Su costado Sosten hace que lo que más lo cansa no sea solo sentirse afuera, sino los cambios constantes en el grupo. Dale referencias estables (un compañero fijo, una rutina conocida) antes de pedirle que decida." },
    { situationId: "quiere-dejar", primary: "S", veta: "I", text: "Su costado Conector hace que un vínculo cercano pueda sostenerlo aunque la presión lo agote. Apóyate en ese compañero de confianza o en tu relación con él para que no se sienta solo en la decisión." },
    { situationId: "quiere-dejar", primary: "S", veta: "C", text: "Su costado Estratega hace que tolere mejor los cambios si entiende para qué son. Explícale con anticipación qué va a pasar y por qué, y su necesidad de calma se resiente menos." },
    { situationId: "quiere-dejar", primary: "C", veta: "D", text: "Su costado Impulsor hace que, si concluye que la actividad no tiene sentido, decida irse rápido y con firmeza. Abre el diálogo pronto, antes de que esa conclusión se le vuelva definitiva." },
    { situationId: "quiere-dejar", primary: "C", veta: "S", text: "Su costado Sosten hace que, además de sentirse poco valorado, lo agote el desorden del entorno. Ofrécele previsibilidad (saber qué esperar en cada práctica) junto con la razón lógica que necesita." },
    { situationId: "jugador-nuevo", primary: "D", veta: "I", text: "Su costado Conector suaviza la medición rápida del Impulsor: en vez de solo evaluar si el nuevo suma o compite, tiende a arrastrarlo hacia la acción del grupo. Dale el rol de presentárselo a los demás y canaliza ese empuje en integración." },
    { situationId: "jugador-nuevo", primary: "D", veta: "C", text: "Su costado Estratega vuelve más analítica esa medición: no solo mide rápido si el nuevo compite o suma, sino que observa cómo juega antes de moverse. Dale un momento para leerlo y después pregúntale qué vio en él." },
    { situationId: "jugador-nuevo", primary: "I", veta: "D", text: "Su costado Impulsor le pone empuje a esa bienvenida natural: no solo se acerca, sino que toma la iniciativa y lidera el recibimiento. Aprovéchalo, pero cuida que su intensidad no abrume al nuevo en el primer día." },
    { situationId: "jugador-nuevo", primary: "I", veta: "S", text: "Su costado Sostén hace esa bienvenida más suave y paciente: se acerca, pero cuida el clima y no fuerza al nuevo. Es ideal para un recibimiento tranquilo, sin exponerlo; pídele que lo acompañe en lo cotidiano." },
    { situationId: "jugador-nuevo", primary: "S", veta: "I", text: "Su costado Conector puede acortar la incomodidad del Sostén ante el cambio: cuando siente que el equipo sigue firme, su lado social lo ayuda a acercarse. Dale primero la seguridad de que nada esencial cambió y después invítalo a sumarse al recibimiento." },
    { situationId: "jugador-nuevo", primary: "S", veta: "C", text: "Su costado Estratega hace que necesite entender el cambio para acomodarse: no solo le incomoda, también quiere saber por qué llegó el nuevo y qué se reacomoda. Explícale el porqué y cómo queda el equipo, y le bajas la inquietud." },
    { situationId: "jugador-nuevo", primary: "C", veta: "D", text: "Su costado Impulsor acorta la observación del Estratega: mira desde lejos, pero cuando ya lo leyó se mueve con decisión y hasta lo mide en la cancha. Respeta esa fase de lectura y luego dale vía libre para acercarse a su manera." },
    { situationId: "jugador-nuevo", primary: "C", veta: "S", text: "Su costado Sostén alarga esa distancia observadora: al análisis se le suma la incomodidad por el cambio, así que puede tardar más en acercarse. No lo apures ni lo expongas; dale información y tiempo, y llegará a su ritmo." },
    { situationId: "se-congela", primary: "D", veta: "I", text: "El Impulsor que se congela por miedo a fallar suma, por su costado Conector, el temor a quedar expuesto ante el grupo: no solo le pesa el resultado, también la mirada de sus compañeros. Dale una jugada junto a un compañero de confianza para que la presión social afloje." },
    { situationId: "se-congela", primary: "D", veta: "C", text: "En el Impulsor, el costado Estratega convierte el 'no puedo fallar' en un exceso de cálculo: mide cada opción y su motor rápido se traba. Dale una sola acción concreta y sin alternativas para que vuelva a moverse." },
    { situationId: "se-congela", primary: "I", veta: "D", text: "El Conector se bloquea al sentirse evaluado, pero su costado Impulsor le da un resorte: una acción con protagonismo puede desbloquearlo. Búscale temprano un pase donde sea protagonista, así rompe la parálisis haciendo en vez de mirándose." },
    { situationId: "se-congela", primary: "I", veta: "S", text: "El Conector con costado Sostén no se bloquea con estridencia: se repliega en silencio y busca pasar desapercibido para no exponerse. Bájale la exposición y ponle al lado un compañero ancla, en vez de empujarlo al centro del juego." },
    { situationId: "se-congela", primary: "S", veta: "I", text: "En el Sostén, el costado Conector marca dónde está su ancla: la seguridad le llega del vínculo, no solo de la rutina. Usa a un compañero querido o tu propia cercanía como punto fijo para devolverle la calma." },
    { situationId: "se-congela", primary: "S", veta: "C", text: "El Sostén con costado Estratega recupera la calma cuando entiende la estructura: saber qué se espera de él ordena el caos. Dale una regla simple y clara ('tu zona es esta') para que el ancla sea mental, no solo emocional." },
    { situationId: "se-congela", primary: "C", veta: "D", text: "El Estratega se paraliza analizando, pero su costado Impulsor empuja a actuar: por dentro pelean 'pensar más' y 'ya jugar'. Dale permiso explícito de resolver con la primera lectura, sin buscar la opción perfecta." },
    { situationId: "se-congela", primary: "C", veta: "S", text: "El Estratega con costado Sostén no solo mide opciones: también necesita terreno firme, y lo impredecible del partido lo traba doble. Combínale una sola regla clara con un rol estable y previsible para que el análisis no se dispare." },
    { situationId: "no-quiere-ser-centro", primary: "D", veta: "I", text: "Su costado Conector hace que, si el Impulsor se resiste, muchas veces sea por cómo lo mira el grupo y no por la tarea. Ofrécele liderar junto a un compañero: recupera el protagonismo sin sentirse solo en la mira." },
    { situationId: "no-quiere-ser-centro", primary: "D", veta: "C", text: "Su costado Estratega explica que el Impulsor a veces frena no por miedo sino porque no quiere mostrarse improvisado. Dale un minuto para armar cómo lo va a hacer y suele salir al frente con más ganas." },
    { situationId: "no-quiere-ser-centro", primary: "I", veta: "D", text: "Su costado Impulsor hace que, aunque al Conector le dé vergüenza empezar solo, una vez que arranca suele tomar las riendas. Ayúdalo a romper el hielo con un compañero y pronto lidera él mismo." },
    { situationId: "no-quiere-ser-centro", primary: "I", veta: "S", text: "Su costado Sosten suma peso a la vergüenza del Conector: la exposición le cuesta más y no se recupera tan rápido. Déjalo elegir a un compañero de confianza y no lo apures con los tiempos." },
    { situationId: "no-quiere-ser-centro", primary: "S", veta: "I", text: "Su costado Conector matiza al Sosten: lo que lo congela es estar solo al frente, no la gente. Dale un rol dentro de un grupo pequeño y participa mucho más suelto." },
    { situationId: "no-quiere-ser-centro", primary: "S", veta: "C", text: "Su costado Estratega se suma a la reserva del Sosten: además del segundo plano, necesita entender y preparar antes. Ofrécele un rol de apoyo y anticípale con tiempo qué se espera de él." },
    { situationId: "no-quiere-ser-centro", primary: "C", veta: "D", text: "Su costado Impulsor hace que, una vez que el Estratega tuvo su momento de preparar, quiera salir a hacerlo bien y con presencia. Dale ese rato para armarlo y después déjale el frente entero." },
    { situationId: "no-quiere-ser-centro", primary: "C", veta: "S", text: "Su costado Sosten hace que, aun preparado, el Estratega prefiera no quedar tan expuesto. Además del tiempo para pensarlo, ofrécele mostrarlo ante un grupo pequeño antes que ante todos." },
    { situationId: "cambio-repentino", primary: "D", veta: "I", text: "Su costado Conector hace que el bajón no sea solo de energía sino también de vínculo: el Impulsor que lideraba ahora también se aleja de sus compañeros. Apóyate en un compañero de confianza o dale un rol compartido y liviano para reconectar sin exigirle protagonismo." },
    { situationId: "cambio-repentino", primary: "D", veta: "C", text: "Su costado Estratega suma un componente de rumiar: el Impulsor apagado no solo perdió empuje, además puede estar dándole vueltas por dentro a lo que le pasa. Ofrécele una estructura simple y clara para hoy, sin pedirle que explique el porqué en voz alta." },
    { situationId: "cambio-repentino", primary: "I", veta: "D", text: "Su costado Impulsor puede transformar el dolor en chispazos de irritación en vez de puro silencio: el Conector afectado a veces reacciona en lugar de aislarse. No leas ese arranque como desafío; ofrécele una salida activa y un momento a solas contigo." },
    { situationId: "cambio-repentino", primary: "I", veta: "S", text: "Su costado Sostén hace que se repliegue más callado todavía y que intente disimular para no preocupar a nadie: el Conector se guarda el malestar. Háblale a solas, sin apuro, y dale permiso explícito para no estar bien hoy." },
    { situationId: "cambio-repentino", primary: "S", veta: "I", text: "Su costado Conector orienta el malestar hacia lo relacional: la irritabilidad sutil del Sostén puede venir de algo con sus vínculos, dentro o fuera de la cancha. Recuérdale con gestos simples que su lugar en el grupo sigue firme, sin ponerlo en el centro." },
    { situationId: "cambio-repentino", primary: "S", veta: "C", text: "Su costado Estratega agrega que, además de la incomodidad, puede estar masticando en silencio una preocupación que no cierra. Sostén la rutina previsible que lo calma y, si pregunta, dale respuestas claras y concretas en vez de un \"ya va a pasar\"." },
    { situationId: "cambio-repentino", primary: "C", veta: "D", text: "Su costado Impulsor puede hacer que el ensimismamiento se note como cortante o impaciente, no solo como silencio: el Estratega absorbido a veces salta. No te lo tomes como algo personal y ofrécele una vía activa para descargar antes de hablar." },
    { situationId: "cambio-repentino", primary: "C", veta: "S", text: "Su costado Sostén hace que la desconexión sea aún más silenciosa y prolongada, fácil de pasar por alto porque no molesta a nadie: el Estratega se guarda todo. Nótalo temprano con un gesto discreto y deja la puerta abierta sin apurar sus tiempos." },
    { situationId: "acepta-ser-suplente", primary: "D", veta: "I", text: "Al Impulsor le pesa perder protagonismo, y su costado Conector le suma la preocupación por cómo lo ven sus compañeros desde el banco. Dale un rol visible con el grupo (alentar, leer el partido en voz alta) para que canalice las dos cosas." },
    { situationId: "acepta-ser-suplente", primary: "D", veta: "C", text: "Al Impulsor le cuesta quedarse quieto, y su costado Estratega necesita además entender el criterio táctico de por qué hoy no entra. Explícale la lógica en breve y dale algo concreto que observar del rival para su ingreso." },
    { situationId: "acepta-ser-suplente", primary: "I", veta: "D", text: "Al Conector le preocupa haber decepcionado al grupo, y su costado Impulsor hace que ese malestar salga más a flor de piel, con gestos o impaciencia. Confírmale que sigue siendo parte y dale una tarea activa para descargar esa energía." },
    { situationId: "acepta-ser-suplente", primary: "I", veta: "S", text: "Al Conector le duele sentirse afuera del grupo, y su costado Sosten hace que, en vez de buscarte, lo guarde y se repliegue en silencio. Acércate tú primero, en corto y sin escena, para confirmarle que sigue incluido." },
    { situationId: "acepta-ser-suplente", primary: "S", veta: "I", text: "El Sosten guarda el malestar callado, y su costado Conector hace que buena parte de lo que le pesa sea sentirse fuera del vínculo del grupo. Mantenlo incluido en lo social del banco aunque no juegue, sin exponerlo." },
    { situationId: "acepta-ser-suplente", primary: "S", veta: "C", text: "El Sosten acepta en silencio, y su costado Estratega hace que por dentro le dé vueltas al porqué sin preguntarte. Ofrécele tú el criterio con calma, antes de que llene ese silencio concluyendo que algo hizo mal." },
    { situationId: "acepta-ser-suplente", primary: "C", veta: "D", text: "Al Estratega le urge entender el criterio, y su costado Impulsor le suma impaciencia: quiere la razón ya y volver a la acción. Dale la explicación breve y directa, y un objetivo concreto para cuando entre." },
    { situationId: "acepta-ser-suplente", primary: "C", veta: "S", text: "Al Estratega le da vueltas el porqué, y su costado Sosten hace que se lo guarde y lo rumie en silencio en vez de plantearte la duda. Búscalo tú con calma y dale el criterio claro para que no se quede trabado solo." },
    { situationId: "companero-se-destaca", primary: "D", veta: "I", text: "Su costado Conector hace que la derrota no sea solo por el primer puesto: también le pesa que el grupo festeje a otro. Reconócele el empuje y súmalo enseguida a una jugada de equipo, para que sienta que sigue dentro." },
    { situationId: "companero-se-destaca", primary: "D", veta: "C", text: "Su costado Estratega suma al golpe rápido una cuenta interna de por qué el otro lo superó, y ahí se pone durísimo consigo mismo. Dale un solo detalle concreto para mejorar la próxima, así canaliza ese análisis sin ensañarse." },
    { situationId: "companero-se-destaca", primary: "I", veta: "D", text: "Su costado Impulsor hace que el dolor por el desplazamiento no se guarde: sale a buscar protagonismo para recuperar la mirada del grupo. Dale rápido un rol visible en la jugada siguiente, para que reconquiste su lugar jugando y no reclamando." },
    { situationId: "companero-se-destaca", primary: "I", veta: "S", text: "Su costado Sosten hace que no proteste el desplazamiento, sino que se apague callado y se corra a un lado. Búscalo tú, porque no va a pedir la atención que le falta, y nómbrale que sigue siendo parte." },
    { situationId: "companero-se-destaca", primary: "S", veta: "I", text: "Su costado Conector hace que su silencio esconda sobre todo miedo a quedar afuera del grupo, no solo incomodidad. Acércate con calidez y devuélvele un gesto de pertenencia antes de hablar del malestar." },
    { situationId: "companero-se-destaca", primary: "S", veta: "C", text: "Su costado Estratega suma al silencio una cuenta interna comparándose con el otro, así que se aísla y rumia a la vez. No lo dejes solo con esa cuenta: ponle palabras simples a algo que él mismo hizo bien hoy." },
    { situationId: "companero-se-destaca", primary: "C", veta: "D", text: "Su costado Impulsor no lo deja quedarse solo en la cuenta interna: empuja a demostrar ya que él también puede. Convierte ese impulso en un objetivo concreto para la próxima jugada, así corta el análisis con acción." },
    { situationId: "companero-se-destaca", primary: "C", veta: "S", text: "Su costado Sosten hace que la comparación punto por punto ocurra en silencio y de segundo plano, difícil de ver desde afuera. Acércate con calma y pregúntale qué se está diciendo por dentro, para sacar esa cuenta a la luz." },
    { situationId: "recibe-correccion", primary: "D", veta: "I", text: "Su costado Conector suma una capa social: además de defender su lugar, le pesa haber quedado expuesto ante sus compañeros. No le devuelvas solo el control, cierra con un gesto de que entre ustedes sigue todo bien." },
    { situationId: "recibe-correccion", primary: "D", veta: "C", text: "Su costado Estratega convierte la reacción en un debate: no solo se justifica, discute el fundamento técnico para no quedar por debajo. Dale un porqué corto y lógico antes del ajuste, así canaliza esa cabeza en vez de pelear cada punto." },
    { situationId: "recibe-correccion", primary: "I", veta: "D", text: "Su costado Impulsor hace que la herida del vínculo salga hacia afuera: en vez de apagarse, puede saltar o contestar de golpe. No lo frenes con dureza, primero reconócele que siguen bien y solo entonces entra el ajuste." },
    { situationId: "recibe-correccion", primary: "I", veta: "S", text: "Su costado Sosten hace que, en vez de mostrar que le dolió, asienta y se guarde el malestar para no incomodarte. No te quedes con ese sí rápido, búscalo después a solas y confirma que de verdad quedó tranquilo." },
    { situationId: "recibe-correccion", primary: "S", veta: "I", text: "Su costado Conector agrega una preocupación por el vínculo: encaja la corrección callado, pero por dentro chequea si te enojaste con él. Suma una palabra cálida ('seguimos igual') además de la calma, para que no cargue eso en silencio." },
    { situationId: "recibe-correccion", primary: "S", veta: "C", text: "Su costado Estratega hace que ese silencio esconda una cabeza dándole vueltas al detalle y exigiéndose de más. Dale un porqué claro y un solo paso concreto, así no se queda rumiando a solas lo que hizo mal." },
    { situationId: "recibe-correccion", primary: "C", veta: "D", text: "Su costado Impulsor le suma impaciencia a la autoexigencia: no solo se traba analizando, se frustra y quiere corregirlo ya. Dale un ajuste accionable para probar en la próxima jugada, así descarga esa urgencia en vez de discutir." },
    { situationId: "recibe-correccion", primary: "C", veta: "S", text: "Su costado Sosten hace que la vuelta de cabeza sea callada y hacia adentro: no discute, se guarda la autoexigencia y puede desinflarse. Acércate sin apuro, valida que entendió y ayúdalo a soltar ese error antes de seguir." },
    { situationId: "gestiona-exito", primary: "D", veta: "I", text: "Su costado Conector hace que el aflojar del Impulsor no sea solo suyo: busca que el grupo festeje con él y puede arrastrar a otros a desconectarse. Dale un rol visible y pídele que use ese envión para levantar a un compañero." },
    { situationId: "gestiona-exito", primary: "D", veta: "C", text: "Su costado Estratega le da un argumento para justificar el aflojar (ya lo tengo resuelto), y eso lo vuelve más difícil de convencer que el Impulsor puro. En vez de discutirle, ponle un detalle nuevo del partido para que su cabeza vuelva a engancharse." },
    { situationId: "gestiona-exito", primary: "I", veta: "D", text: "Su costado Impulsor sube el volumen del festejo del Conector: no solo quiere compartir la alegría, quiere ser el centro de ella y puede pasar por encima del resto. Reencauza esa energía pidiéndole que arranque el próximo esfuerzo del equipo." },
    { situationId: "gestiona-exito", primary: "I", veta: "S", text: "Su costado Sosten le baja los decibeles al Conector: disfruta el reconocimiento pero sin acaparar tanto, y tiende más a relajarse cómodo dentro del grupo que a robarse el show. Un reconocimiento breve y tranquilo le alcanza para reenfocarse." },
    { situationId: "gestiona-exito", primary: "S", veta: "I", text: "Su costado Conector saca al Sosten de su silencio cuando el grupo celebra: se contagia del clima y puede soltarse más de lo que suele. Aprovecha ese mismo clima grupal para reenganchar al equipo entero, así no queda expuesto él solo." },
    { situationId: "gestiona-exito", primary: "S", veta: "C", text: "Su costado Estratega hace que el Sosten no solo se relaje por calma, sino que por dentro concluya que ya no hace falta esfuerzo. Hazle una pregunta concreta y en voz baja sobre lo que viene, para mantener su cabeza activa sin sacarlo de su comodidad." },
    { situationId: "gestiona-exito", primary: "C", veta: "D", text: "Su costado Impulsor le suma prisa al Estratega: no solo cree que ya entendió todo, siente que ya está resuelto y quiere avanzar rápido a lo próximo. Ponle un desafío de acción concreto y cronometrado, así su necesidad de ir para adelante juega a favor." },
    { situationId: "gestiona-exito", primary: "C", veta: "S", text: "Su costado Sosten refuerza el descanso del Estratega: a la idea de ya lo entendí se le suma la calma de sentir que la presión pasó, y suelta por partida doble. Proponle un objetivo pequeño y sostenido para el próximo tramo, algo estable que lo mantenga presente sin exigirlo." },
    { situationId: "rol-referente", primary: "D", veta: "I", text: "Suele aceptar el rol rápido, fiel a su costado Impulsor, pero su veta Conector hace que le pese cuando siente que alguien queda afuera o dolido por el ritmo que él marca. Ayúdalo a leer quién se quedó atrás en lo emocional, no solo en la velocidad." },
    { situationId: "rol-referente", primary: "D", veta: "C", text: "Toma la delantera como Impulsor, pero su costado Estratega lo frena hasta entender bien qué implica el rol antes de ejercerlo. Dale el porqué y los límites del lugar, así lidera con criterio y no solo empujando." },
    { situationId: "rol-referente", primary: "I", veta: "D", text: "Lidera desde el vínculo como Conector, pero su costado Impulsor le da empuje para ponerse al frente cuando algo lo moviliza. El choque aparece entre querer avanzar y no perder la cercanía; recuérdale que puede marcar el rumbo sin dejar de ser parte del grupo." },
    { situationId: "rol-referente", primary: "I", veta: "S", text: "Quiere a todos bien como Conector, y su costado Sosten suma un rechazo al conflicto que hace que ponerle un límite a un compañero le pese el doble. Empieza por gestos de cuidado silenciosos antes que por la autoridad visible." },
    { situationId: "rol-referente", primary: "S", veta: "I", text: "Prefiere el segundo plano como Sosten, pero su costado Conector le da una calidez que el grupo ya sigue sin que él lo note. Preséntale el rol como cuidar a un compañero puntual, no como pararse al frente." },
    { situationId: "rol-referente", primary: "S", veta: "C", text: "Al segundo plano del Sosten, su costado Estratega le suma la necesidad de entender con precisión qué se espera antes de moverse. Dale una responsabilidad concreta y acotada (una sola tarea clara), así el rol deja de sentirse difuso." },
    { situationId: "rol-referente", primary: "C", veta: "D", text: "Duda como Estratega hasta entender el rol, pero su costado Impulsor lo empuja a ejercerlo con fuerza una vez que lo tiene claro. Resuélvele primero las dudas concretas; con el porqué resuelto, dale espacio para tomar la iniciativa." },
    { situationId: "rol-referente", primary: "C", veta: "S", text: "A la duda del Estratega, su costado Sosten le suma el temor a quedar expuesto, así que tiene doble motivo para esperar antes de asumirlo. Ofrécele un rol de poca exposición y con tiempo de preparación, para que no sienta que se juega todo en público." },
    { situationId: "expectativa-padres", primary: "D", veta: "I", text: "Su costado Conector hace que la bronca por fallar tenga también un tinte de haber defraudado a quienes lo miran, no solo de perder. Tras un error, dile rápido que sigue siendo parte del equipo antes de reencauzar sus ganas de competir." },
    { situationId: "expectativa-padres", primary: "D", veta: "C", text: "Su costado Estratega convierte la bronca impulsiva en autoexigencia analítica: no solo quiere ganar, se reprocha por qué no estuvo a la altura de lo que cree que los adultos esperan. Dale una sola acción concreta para la próxima jugada y corta ese darle vueltas." },
    { situationId: "expectativa-padres", primary: "I", veta: "D", text: "Su costado Impulsor hace que, en vez de solo desinflarse ante una cara seria, empuje de más o reaccione con fastidio para recuperar la aprobación jugando mejor. Reconduce esa energía a algo que sí controla y recuérdale que el cariño no se juega en la cancha." },
    { situationId: "expectativa-padres", primary: "I", veta: "S", text: "Su costado Sosten hace que no muestre tanto la desilusión: se la guarda y sigue jugando más apagado en vez de buscar reacción. No esperes que lo diga, acércate en una pausa y ofrécele un gesto tranquilo de que todo está bien." },
    { situationId: "expectativa-padres", primary: "S", veta: "I", text: "Su costado Conector le da a la tensión que se guarda un centro afectivo: aguanta callado, pero por dentro le pesa la mirada de quienes quiere. Dale de forma tranquila la certeza de que su vínculo con ellos no depende de cómo juegue hoy." },
    { situationId: "expectativa-padres", primary: "S", veta: "C", text: "Su costado Estratega hace que, mientras aguanta callado, por dentro esté analizando qué esperan de él y exigiéndose en silencio. Ayúdalo a poner en palabras una sola de esas ideas para que la tensión no siga girando por dentro." },
    { situationId: "expectativa-padres", primary: "C", veta: "D", text: "Su costado Impulsor le agrega urgencia a la autoexigencia: puede pasar de quedarse trabado a forzar jugadas apuradas para demostrar rápido que está a la altura. Dale una acción simple y directa para soltar el análisis sin que se precipite." },
    { situationId: "expectativa-padres", primary: "C", veta: "S", text: "Su costado Sosten hace que la autoexigencia lo lleve a jugar a lo seguro y quedarse trabado por evitar el error, más que a forzar. Bájale la apuesta: dale permiso explícito para equivocarse en una jugada y sácale el peso de tener que acertar cada vez." },
    { situationId: "sube-categoria", primary: "D", veta: "I", text: "Su costado Conector hace que el Impulsor no solo extrañe el protagonismo, también el vínculo con su viejo grupo, así que puede buscar recuperar lugar cayendo bien o llamando la atención. Dale un rol visible donde ayude a otro, así canaliza esa necesidad sin competir de más." },
    { situationId: "sube-categoria", primary: "D", veta: "C", text: "Su costado Estratega frena un poco el impulso: el Impulsor se guarda hasta entender el nuevo nivel y puede parecer más callado que de costumbre, no apagado sino midiendo. Explícale el porqué de las jugadas y los códigos nuevos, así recupera la confianza para volver a mandar." },
    { situationId: "sube-categoria", primary: "I", veta: "D", text: "Su costado Impulsor le da empuje para meterse rápido en el grupo nuevo, pero si no logra pertenecer al toque puede frustrarse o forzar la integración. Reconoce su iniciativa y dale tiempo, recordándole que el vínculo se construye de a poco." },
    { situationId: "sube-categoria", primary: "I", veta: "S", text: "Su costado Sosten hace que el Conector, además de sentirse solo, se repliegue en vez de buscar acercarse, así que la soledad se nota menos por fuera pero pesa más por dentro. No esperes que dé el primer paso: acércale tú a un compañero puente." },
    { situationId: "sube-categoria", primary: "S", veta: "I", text: "Su costado Conector le da al Sosten una vía de salida: se sostiene mejor si tiene aunque sea un vínculo cercano en el grupo nuevo. Emparéjalo con un compañero cálido desde el primer día, así el cambio de caras pesa menos." },
    { situationId: "sube-categoria", primary: "S", veta: "C", text: "Su costado Estratega suma al repliegue del Sosten una lectura callada de todo lo nuevo, así que su silencio no es solo incomodidad, también es observación. Dale información clara de la rutina y lo que se espera, y su calma se vuelve terreno seguro más rápido." },
    { situationId: "sube-categoria", primary: "C", veta: "D", text: "Su costado Impulsor le tira a jugar antes de terminar de leer el escenario, así que el Estratega puede oscilar entre meterse de golpe y frenarse dudando. Valida su lectura pero dale permiso a equivocarse mientras aprende, así el impulso no se le traba en autoexigencia." },
    { situationId: "sube-categoria", primary: "C", veta: "S", text: "Su costado Sosten hace que el Estratega procese hacia adentro y encima en silencio, así que puede parecer doblemente apagado mientras entiende el nuevo nivel. Pregúntale con calma qué está viendo, sin apurar la respuesta, para que el análisis no se le vuelva encierro." },
];

/** Diagonal DISC opposites never form a blend (D<->S, I<->C). */
export function isOppositeVeta(primary: string, veta: string): boolean {
    return (primary === 'D' && veta === 'S') || (primary === 'S' && veta === 'D')
        || (primary === 'I' && veta === 'C') || (primary === 'C' && veta === 'I');
}

export function getCardEnrichment(situationId: string, eje: string, lang: string): CardEnrichment | undefined {
    const arr = lang === 'en' ? CARD_ENRICHMENTS_EN : lang === 'pt' ? CARD_ENRICHMENTS_PT : CARD_ENRICHMENTS;
    return arr.find(c => c.situationId === situationId && c.eje === eje);
}

/** The veta nuance for a child, or undefined when the veta is absent, equal to
 *  the primary, or a diagonal opposite (in which case the card stays pure-primary). */
export function getVetaNuance(situationId: string, primary: string | null | undefined, veta: string | null | undefined, lang: string): VetaNuance | undefined {
    if (!primary || !veta || primary === veta || isOppositeVeta(primary, veta)) return undefined;
    const arr = lang === 'en' ? VETA_NUANCES_EN : lang === 'pt' ? VETA_NUANCES_PT : VETA_NUANCES;
    return arr.find(v => v.situationId === situationId && v.primary === primary && v.veta === veta);
}
