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

/* ── The 15 situations ─────────────────────────────────────────────────────── */

export const SITUATIONS: Situation[] = [
    {
        id: 'no-quiere-arrancar',
        title: 'Le cuesta entrar en el entrenamiento',
        whatYouSee: 'El jugador llega al entrenamiento y no quiere participar. Está apático, se queja, se sienta al costado o dice "hoy no tengo ganas".',
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
        title: 'Se desborda emocionalmente en el entrenamiento',
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
        whatsHappening: 'El entrenamiento no está sintonizando con su ritmo. Puede ser que el ejercicio sea demasiado lento para su motor (se aburre) o demasiado caótico para su estilo (se desconecta). La distracción es una señal de que algo del formato no le está llegando.',
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
        whatYouSee: "Un compañero recibe felicitaciones, lo eligen o marca la diferencia en una jugada, y el niño se apaga. Pone mala cara, minimiza el logro del otro (\"igual tuvo suerte\"), se queja del reparto de protagonismo o baja la intensidad el resto del entrenamiento.",
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
        whatYouSee: "El jugador mira seguido hacia la tribuna durante el partido o el entrenamiento. Se tensiona cuando los padres están presentes y juega distinto: más nervioso, más rígido o pendiente de cómo lo ven desde afuera.",
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

/* ── The 57 cards ──────────────────────────────────────────────────────────── */

export const SITUATION_CARDS: SituationCard[] = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. No quiere arrancar
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-quiere-arrancar',
        eje: 'D',
        whatsHappeningForProfile: 'El Impulsor necesita sentir que lo que viene vale la pena. Si no ve un desafío claro, la transición le cuesta más. Su motor lo empuja a la acción, pero solo cuando el objetivo lo motiva.',
        howToAccompany: [
            'Proponle un mini-desafío personal para los primeros 5 minutos: "A ver si hoy arrancas más rápido que la última vez".',
            'Dale un rol activo desde el inicio: que arme los conos, que elija el primer ejercicio, que lidere el calentamiento.',
        ],
        ifNotResponding: 'Déjalo mirar los primeros minutos sin presionarlo. Cuando vea al grupo en acción, su instinto competitivo se activa solo.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector necesita conexión social para activarse. Si llegó solo, si su amigo no vino, o si el clima del grupo está raro, le cuesta engancharse. Su energía se enciende con las personas, no con la actividad en sí.',
        howToAccompany: [
            'Acércate y pregúntale algo personal: "¿Cómo estuvo el día?". Esa micro-conexión es su interruptor de encendido.',
            'Ponlo al lado de alguien con quien tenga afinidad para el primer ejercicio.',
        ],
        ifNotResponding: 'Súmalo a una actividad grupal divertida (no técnica). Un juego de calentamiento donde se ría suele ser suficiente para que entre.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén necesita que todo esté "en su lugar" para sentirse seguro. Si el entrenamiento cambió de horario, si hay gente nueva, o si algo en su rutina se alteró, la transición se hace más pesada. Su motor más lento hace que el cambio de chip le tome más tiempo.',
        howToAccompany: [
            'Mantenlo en la rutina: que haga el mismo calentamiento de siempre, en el mismo lugar, con los mismos compañeros.',
            'No le pidas que explique por qué no quiere. Simplemente dale un par de minutos y dile: "Arrancamos cuando estés listo".',
        ],
        ifNotResponding: 'Dale una tarea pequeña y predecible ("Hazme 10 toques de pelota aquí al lado") para que entre en el ritmo sin saltar al grupo directamente.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega necesita entender qué va a pasar antes de comprometerse. Si no sabe qué se va a entrenar, o si el plan cambió sin explicación, prefiere quedarse afuera procesando. Su motor de procesamiento necesita cerrar la lógica antes de arrancar.',
        howToAccompany: [
            'Cuéntale brevemente qué van a hacer hoy: "Primero calentamiento, después un ejercicio táctico, y terminamos con partido". La previsibilidad lo activa.',
            'Si cambió algo del plan habitual, explícale por qué: "Hoy vamos a hacer algo diferente porque necesitamos practicar X".',
        ],
        ifNotResponding: 'Déjalo que observe la primera actividad desde afuera. Cuando entienda la lógica del ejercicio, se va a sumar solo.',
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
        whatsHappeningForProfile: 'El Conector siente la derrota como un quiebre social: "le fallé al grupo", "no fui suficiente para el equipo". Su frustración viene más del impacto en los demás que del resultado en sí.',
        howToAccompany: [
            'Valida la emoción desde lo vincular: "Se nota que te importa mucho el equipo, eso habla bien de ti".',
            'Sepáralo del "yo le fallé al grupo" con datos: "Mira todo lo que el equipo logró hoy, y tú fuiste parte de eso".',
        ],
        ifNotResponding: 'Pídele a un compañero de confianza que le hable. El Conector se recupera más rápido con el apoyo de un par que con la palabra del adulto.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén no explota con la derrota, pero la guarda. Se queda callado, se retrae, y puede arrastrar la frustración por varios días. Su estabilidad natural lo hace parecer "bien" por fuera, pero por dentro le cuesta soltar.',
        howToAccompany: [
            'Valida sin forzar: "Si necesitas hablar, aquí estoy". No le pidas que procese en el momento.',
            'En los entrenamientos siguientes, observa si está más callado de lo habitual. Si lo ves diferente, un "¿cómo vienes?" sin presión suele abrir la puerta.',
        ],
        ifNotResponding: 'Mantenle la rutina y la normalidad. El Sostén se recupera cuando siente que todo sigue igual alrededor, a pesar del resultado.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega analiza la derrota en loop: repasa cada error, cada jugada, buscando el momento exacto donde todo salió mal. Su frustración es más cerebral que emocional, pero igual lo paraliza.',
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
        whatsHappeningForProfile: 'El Impulsor escuchó la instrucción, pero ya decidió cómo hacerla a su manera. No es desobediencia. es que su motor rápido lo lanza a la acción antes de que termines de hablar, y confía en su instinto.',
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
        ifNotResponding: 'Hacé una demostración rápida del ejercicio. El Sostén procesa mucho mejor viendo que escuchando.',
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
        whatsHappeningForProfile: 'El Impulsor muestra los nervios con hiperactividad: habla más de la cuenta, se mueve mucho, o al revés, se pone irritable y callado. La incertidumbre le molesta porque quiere controlar el resultado y no puede.',
        howToAccompany: [
            'Dale una tarea concreta que lo haga sentir en control: "Calienta con pelota, haz 20 tiros". La acción física canaliza la ansiedad.',
            'Háblale en clave de plan: "Hoy tu rol es X. Si pasa Y, haces Z". La claridad del plan lo calma.',
        ],
        ifNotResponding: 'Déjalo calentar solo con música o en un espacio aparte. El Impulsor procesa la presión moviéndose, no hablando.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector busca contención social: habla con todos, hace chistes, o se pega a su persona de confianza. Los nervios los procesa a través del vínculo. Si está callado, algo le pesa más de lo normal.',
        howToAccompany: [
            'Genera un momento grupal de conexión: una ronda de manos, un grito de equipo, un "¿cómo venimos?". Eso lo centra.',
            'Si está más callado de lo normal, acércate sin presionar: "¿Todo bien?" y un gesto de apoyo (palmada, choque de puños).',
        ],
        ifNotResponding: 'Pídele que anime al grupo. Darle un rol social ("Tú encargarte de que todos estén arriba") transforma su ansiedad en energía positiva.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén se cierra. Está más callado, más pegado a la rutina, hace exactamente lo mismo que siempre como para sentir que algo no cambió. La incertidumbre del partido le pega en su base de seguridad.',
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
        ifNotResponding: 'Déjalo mirar una ronda completa y después pregúntale directamente: "¿Listo?". El Impulsor responde bien a la invitación directa.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector observa desde afuera cuando no conoce a nadie o cuando siente que el clima social no es seguro. Necesita identificar a "su persona" dentro del grupo antes de entrar.',
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
        ifNotResponding: 'Déjalo mirar toda la sesión si es necesario. La próxima vez va a entrar más rápido. El Sostén construye seguridad acumulando experiencias positivas de observación.',
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
        whatsHappeningForProfile: 'El Impulsor se enoja más que llora. La frustración le sale como bronca: tira cosas, grita, o se va. Siente que perdió el control de la situación y eso lo desborda.',
        howToAccompany: [
            'No lo enfrentes en caliente. Déjalo que se enfríe unos segundos y después acércate con tono neutro: "Cuando estés listo, hablamos".',
            'Cuando se calme, dale una vía de acción: "Ahora volvamos y hagamos bien ese ejercicio". Necesita sentir que puede recuperar el control.',
        ],
        ifNotResponding: 'Sácalo de la actividad brevemente ("Toma agua, respira") y deja que vuelva solo. El Impulsor necesita sentir que la decisión de volver fue suya.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector se quiebra cuando siente que la corrección rompió el vínculo. "¿Me está retando porque no le caigo bien?" El desborde es emocional y social a la vez.',
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
        whatsHappeningForProfile: 'El Estratega se frustra cuando siente que algo no tiene lógica o que la corrección fue injusta. Su desborde puede parecer "de la nada" pero viene de un acumulado de cosas que no le cerraron.',
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
        whatsHappeningForProfile: 'El Impulsor choca cuando siente que otro le está sacando protagonismo o frenando su ritmo. La fricción viene de la competencia por el espacio de decisión.',
        howToAccompany: [
            'Separa el conflicto de la persona: "Los dos quieren ganar y eso está bien. Ahora veamos cómo lo hacen juntos".',
            'Asignale un aspecto del ejercicio donde sea el que decide. Si tiene su territorio, baja la necesidad de pelear por el del otro.',
        ],
        ifNotResponding: 'Cambialos de dupla temporalmente. A veces la mejor mediación es la distancia breve.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector vive el roce como un quiebre en la relación. Le duele más que "ya no nos llevemos bien" que el conflicto en sí. Puede reaccionar buscando aliados o poniéndose dramático.',
        howToAccompany: [
            'Habla con los dos juntos y enfócate en el vínculo: "Ustedes son compañeros, esto se resuelve hablando. ¿Qué pasó?".',
            'Después del ejercicio, dale un momento al Conector para cerrar: "¿Estamos bien con tu compañero?". Necesita saber que la relación sigue.',
        ],
        ifNotResponding: 'Dale un rol de puente: "Ayudame a que el grupo funcione bien". Convertir el conflicto en misión social lo saca de la herida personal.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén evita el conflicto. Si tuvo un roce, probablemente está incomodísimo y quiere que todo vuelva a la normalidad lo antes posible. No va a confrontar. se va a cerrar.',
        howToAccompany: [
            'No lo obligues a "hablar las cosas" frente al grupo. Acércate en privado: "Vi que hubo algo ahí, ¿estás bien?".',
            'Ayudalo a volver a su zona de confort: la misma actividad, los mismos compañeros de siempre, rutina normal.',
        ],
        ifNotResponding: 'Deja que el tiempo haga su trabajo. El Sostén no necesita "resolver" el conflicto verbalmente. necesita sentir que todo volvió a la normalidad.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega choca cuando siente que el otro hace las cosas "mal" o sin lógica. La fricción viene de la diferencia de criterio: él quiere hacerlo bien y el otro quiere hacerlo rápido (o viceversa).',
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
        whatsHappeningForProfile: 'El Impulsor se castiga desde la bronca: "¡Soy un desastre!". Siente que debería ser capaz de hacerlo bien siempre, y cada error es una traición a su autoimagen de líder.',
        howToAccompany: [
            'Interrumpe el circuito con acción: "Ok, erraste. Ahora haz 3 repeticiones y listo". La acción inmediata reemplaza la autocrítica.',
            'Usa su competitividad a favor: "Los mejores jugadores fallan, la diferencia es qué hacen después".',
        ],
        ifNotResponding: 'Sácalo del ejercicio un momento y dale una tarea física simple (correr, picar la pelota). El Impulsor regula la frustración moviéndose.',
    },
    {
        situationId: 'se-castiga',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector se castiga desde la vergüenza: "Todos me vieron fallar". Lo que le pesa no es el error técnico sino la exposición social del error.',
        howToAccompany: [
            'Normalizá el error frente al grupo: "Todos fallamos, así se aprende". Eso baja la vergüenza pública.',
            'Después, en privado: "A mí me importa que lo intentes, no que salga perfecto". La reconexión con el adulto lo calma.',
        ],
        ifNotResponding: 'Ponlo en una actividad donde el error sea parte del juego (un ejercicio donde todos fallan). Eso diluye la sensación de ser "el único".',
    },
    {
        situationId: 'se-castiga',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén se castiga en silencio. No grita ni se golpea, pero se queda callado, baja la cabeza, y pierde energía. Se siente culpable por no haber mantenido la consistencia que se espera de él.',
        howToAccompany: [
            'Acércate con calma: "Ese error no define cómo juegas. Mira todo lo que vienes haciendo bien". Necesita que alguien le devuelva la perspectiva.',
            'En el siguiente ejercicio, ponlo en algo que domine bien para que recupere la confianza antes de volver a lo que falló.',
        ],
        ifNotResponding: 'No le insistas en que "no es para tanto". Simplemente sigue con el entrenamiento con normalidad. El Sostén se recupera cuando siente que el entorno no cambió por su error.',
    },
    {
        situationId: 'se-castiga',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega se castiga desde el análisis: repasa el error una y otra vez buscando qué hizo mal. Se autoexige porque tiene estándares altos y siente que debería haber previsto el fallo.',
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
        whatsHappeningForProfile: 'El Impulsor se distrae cuando el ejercicio no tiene suficiente intensidad o desafío. Su motor rápido necesita acción constante y si el ritmo baja, busca estímulos por su cuenta.',
        howToAccompany: [
            'Súbele la intensidad: "Ahora lo mismo pero en la mitad del tiempo" o "El que llega primero elige el próximo ejercicio".',
            'Dale responsabilidad dentro del ejercicio: que cuente, que arbitre, que lidere una variante.',
        ],
        ifNotResponding: 'Proponle un desafío paralelo: "Mientras esperas tu turno, haz esto otro". El Impulsor no tolera el vacío de actividad.',
    },
    {
        situationId: 'se-distrae',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector se distrae porque lo que más le atrae es la interacción social. Si el ejercicio es individual o silencioso, su atención se va hacia el compañero de al lado.',
        howToAccompany: [
            'Convertí el ejercicio en algo social: en duplas, con comunicación entre ellos, o con roles que requieran hablar.',
            'Usa su sociabilidad como herramienta: "Explícale a tu compañero cómo se hace este ejercicio".',
        ],
        ifNotResponding: 'Ponlo en un rol de ayudante tuyo: "Vení, ayudame a organizar esto". La cercanía social con el adulto recaptura su atención.',
    },
    {
        situationId: 'se-distrae',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén se distrae cuando hay demasiado estímulo: mucho ruido, cambios constantes de ejercicio, o instrucciones nuevas sin pausa. Su sistema se desconecta para protegerse del caos.',
        howToAccompany: [
            'Baja el ritmo de cambios: deja que haga el mismo ejercicio un rato más largo antes de cambiar.',
            'Dale un espacio predecible dentro de la actividad: "Tú siempre en esta posición, tu trabajo es este".',
        ],
        ifNotResponding: 'Acércate y reconéctalo con calma: "¿Estás conmigo? Bien. Lo próximo que hacemos es esto". El contacto personal lo trae de vuelta.',
    },
    {
        situationId: 'se-distrae',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega se distrae cuando el ejercicio le parece repetitivo o sin propósito. Su mente busca algo para analizar, y si el ejercicio no se lo da, busca estímulos por otro lado.',
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
        whatsHappeningForProfile: 'El Impulsor quiere dejar cuando siente que no puede ganar, crecer o liderar. Si lleva mucho tiempo sin desafíos nuevos o sin sentir que progresa, el deporte pierde sentido para él.',
        howToAccompany: [
            'Pregúntale qué cambiaría para que tenga ganas de volver: "Si pudieras cambiar algo del entrenamiento, ¿qué sería?". Escuchá la respuesta.',
            'Proponle un objetivo concreto y medible: "¿Y si en las próximas 3 semanas trabajamos en esto específico?".',
        ],
        ifNotResponding: 'No lo presiones. Dile: "La puerta está abierta cuando quieras". El Impulsor a veces necesita extrañar el desafío para volver con ganas.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector quiere dejar cuando se rompieron los vínculos: si su amigo dejó, si el grupo cambió, o si siente que ya no pertenece. Para él, el deporte es el grupo, y si el grupo no lo sostiene, no tiene razón de ser.',
        howToAccompany: [
            'Explora el vínculo: "¿Hay algo del grupo que te hace ruido?". Muchas veces la razon no es el deporte sino una relación social que se rompió.',
            'Si es posible, reconéctalo con un compañero cercano o cámbialo a un grupo donde tenga más afinidad.',
        ],
        ifNotResponding: 'Habla con el adulto responsable. El abandono del Conector suele tener una raíz social que se puede resolver si se identifica a tiempo.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén quiere dejar cuando algo cambió demasiado: nuevo entrenador, nuevos compañeros, un cambio de horario o de sede. No es que no le guste el deporte. es que el contexto ya no se siente como "su lugar".',
        howToAccompany: [
            'Identifica qué cambió: "¿Hay algo que antes te gustaba y ahora no?". El Sostén puede señalar exactamente el punto de quiebre.',
            'Si puedes, restaura algo del contexto anterior: el mismo horario, el mismo grupo, las mismas rutinas.',
        ],
        ifNotResponding: 'Dale tiempo. No le pidas una decisión definitiva. "No hace falta que decidas ahora. Vení la semana que viene y vemos". El Sostén necesita procesar los cambios lentamente.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega quiere dejar cuando siente que no aprende nada nuevo o que el entrenamiento no tiene sentido. Si lleva semanas haciendo lo mismo sin entender para qué, su motivación se apaga.',
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
        whatsHappeningForProfile: 'El Impulsor ve al nuevo como una variable a evaluar: "¿Es bueno? ¿Me va a sacar el lugar?". Puede reaccionar compitiendo para marcar territorio o ignorándolo.',
        howToAccompany: [
            'Dale un rol de bienvenida con liderazgo: "Muéstrale cómo hacemos el calentamiento". Eso lo pone en posición de líder, no de competidor.',
            'Arma un ejercicio donde los dos se luzcan: "Uno ataca, otro defiende, después cambian".',
        ],
        ifNotResponding: 'Deja que la competencia natural haga su trabajo. El Impulsor va a aceptar al nuevo cuando vea que eleva el nivel del grupo.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector probablemente va a ser el primero en acercarse al nuevo. Si no lo hace, es porque algo del nuevo lo intimida o porque siente que su lugar social en el grupo está amenazado.',
        howToAccompany: [
            'Pídele que sea el "anfitrión": "Acompáñalo hoy, explícale cómo funciona todo aquí". Es su rol natural y lo empodera.',
            'Si el Conector se muestra reticente, hablá en privado: "¿Todo bien con la llegada de X?". Puede haber una inseguridad social que vale la pena explorar.',
        ],
        ifNotResponding: 'Arma una actividad donde tengan que cooperar obligatoriamente. La conexión del Conector se activa haciendo cosas juntos.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén es el que más siente la "ruptura" del equilibrio. Su grupo era predecible y seguro, y ahora hay alguien que cambia la dinámica. Puede mostrarse distante o incómodo.',
        howToAccompany: [
            'No cambies la rutina por la llegada del nuevo. Mantenle al Sostén todo lo que puedas igual: mismo lugar, mismo ejercicio, mismos compañeros.',
            'Presenta al nuevo como una "suma" y no como un "cambio": "Se suma alguien al grupo, todo lo demás sigue igual".',
        ],
        ifNotResponding: 'Dale tiempo. El Sostén va a aceptar al nuevo gradualmente, a medida que el nuevo se vuelva parte de la rutina. No fuerces la integración.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega observa al nuevo con curiosidad analítica: "¿Cómo juega? ¿Dónde se va a ubicar? ¿Cómo afecta al equipo?". No se acerca enseguida porque está procesando la información.',
        howToAccompany: [
            'Dale información sobre el nuevo: "Viene de tal club, juega en tal posición". Los datos lo tranquilizan y le permiten ubicar al nuevo en su mapa mental.',
            'Proponle que lo ayude tácticamente: "Explicále cómo hacemos esta jugada". Eso lo conecta desde su fortaleza.',
        ],
        ifNotResponding: 'Deja que la integración sea orgánica. El Estratega va a acercarse al nuevo cuando tenga suficiente información. No lo apures.',
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
            'Desde afuera, dale confianza en su capacidad: "Tú sabes hacer esto, confío en ti". El Impulsor reacciona al voto de confianza.',
        ],
        ifNotResponding: 'Cambiale el rol temporalmente a algo menos expuesto. Cuando haga una buena jugada desde ahí, devolvelo a su posición. Necesita una victoria chica para reactivarse.',
    },
    {
        situationId: 'se-congela',
        eje: 'I',
        whatsHappeningForProfile: 'El Conector se congela cuando siente que el error lo va a dejar "en evidencia" frente al grupo. Su bloqueo es social: tiene miedo de quedar mal ante los compañeros, no del error en sí.',
        howToAccompany: [
            'Quitale la presión del resultado: "No importa si sale o no, quiero que lo intentes". El permiso para fallar lo desbloquea.',
            'Involucra a los compañeros: "Equipo, todos adentro, todos juntos". Sentirse acompañado le devuelve la seguridad.',
        ],
        ifNotResponding: 'Ponlo en una jugada grupal donde el éxito sea del equipo, no individual. El Conector se reactiva cuando la responsabilidad es compartida.',
    },
    {
        situationId: 'se-congela',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén se congela porque la presión del partido rompe su base de seguridad. Lo que en el entrenamiento era predecible, en el partido es incierto. Su sistema se protege quedándose quieto.',
        howToAccompany: [
            'Baja la presión con información: "Hacé lo mismo que en el entrenamiento, nada diferente". Conectarlo con lo conocido lo desbloquea.',
            'Dale una instrucción repetitiva: "Cada vez que la pelota venga, pasala a X". La tarea simple y predecible lo activa.',
        ],
        ifNotResponding: 'Sácalo unos minutos si es posible. Dile: "Respira, mira cómo va el juego, y cuando estés listo vuelves". El Sostén se recupera con la pausa.',
    },
    {
        situationId: 'se-congela',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega se congela porque está sobreanalizando: "¿Paso o tiro? ¿Y si viene el rival? ¿Cuál es la mejor opción?". Su mente trabaja más rápido que su cuerpo, y el cuerpo se traba.',
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
        whatsHappeningForProfile: 'Es natural en el Sostén. Su forma de aportar es desde el soporte, no desde el protagonismo. Forzarlo a ser el centro va en contra de su naturaleza y lo hace sentir vulnerable.',
        howToAccompany: [
            'Proponle formas de liderazgo silencioso: "Asegúrate de que todos tengan lo que necesitan" o "Tú eres el que mantiene el ritmo".',
            'Si necesitas que se exponga, dale aviso previo: "La semana que viene te voy a pedir que muestres el ejercicio". La anticipación baja la ansiedad.',
        ],
        ifNotResponding: 'No insistas. Busca otra forma de que participe donde se sienta cómodo. El Sostén aporta más desde su zona de seguridad que desde la exposición forzada.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'C',
        whatsHappeningForProfile: 'El Estratega no quiere exponerse si no está seguro de que lo va a hacer bien. Su estándar es alto y la idea de fallar en público le genera mucha incomodidad.',
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
        whatsHappeningForProfile: 'Un Conector que se cierra es una señal fuerte. Su naturaleza es social, así que si está callado o aislado, algo le está doliendo en el plano vincular: una pelea con amigos, un cambio en la familia, o bullying.',
        howToAccompany: [
            'Acércate desde el vínculo: "Te conozco y sé que algo te pasa. No hace falta que me cuentes, pero quiero que sepas que estoy aquí".',
            'Dale espacio para reconectarse a su ritmo. No lo fuerces a "estar contento". eso invalida lo que siente.',
        ],
        ifNotResponding: 'Contacta al adulto responsable. El cambio sostenido en un Conector suele estar vinculado a una situación relacional que requiere atención fuera de la cancha.',
    },
    {
        situationId: 'cambio-repentino',
        eje: 'S',
        whatsHappeningForProfile: 'El Sostén que cambia repentinamente está mostrando que algo rompió su base de seguridad. Es el perfil que más "aguanta" antes de mostrar malestar, así que si ya lo ves, probablemente viene acumulando hace rato.',
        howToAccompany: [
            'Mantenle la rutina lo más estable posible. En medio de lo que sea que esté pasando afuera, el entrenamiento puede ser su refugio de normalidad.',
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
        whatsHappeningForProfile: 'Todo el grupo está procesando la derrota desde su propio perfil: los Impulsores están enojados, los Conectores sienten que fallaron como equipo, los Sostenes se cerraron, y los Estrategas están repasando cada error. El clima colectivo está bajo.',
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
        whatsHappeningForProfile: "El Impulsor vive el banco como una pérdida de control y de su lugar de protagonista. Estar quieto mientras otros juegan le pesa mucho, y esa tensión suele salir como fastidio o impaciencia.",
        howToAccompany: ["Dale un rol activo desde el banco: pídele que lea el partido y te avise qué pasa, por ejemplo dile: quiero tus ojos en la cancha, ¿qué ves que podemos mejorar?","Ponle un objetivo concreto para cuando entre, algo que dependa de él: dile cuando entres, esto es tuyo, te quiero marcando el ritmo."],
        ifNotResponding: "Si sigue tenso, no le exijas que lo acepte de golpe. Reconócele las ganas de jugar (se nota que quieres estar adentro y eso es bueno) y dale tiempo, su empuje se reacomoda cuando siente que cuentas con él.",
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "I",
        whatsHappeningForProfile: "El Conector teme que estar en el banco signifique que decepcionó o que ya no es parte del grupo. Más que el rol, le duele sentirse afuera del vínculo.",
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
        whatsHappeningForProfile: "El Estratega necesita entender por qué está en el banco. Si no tiene claro el criterio, le da vueltas y puede concluir solo que hizo algo mal o que no es lo bastante bueno.",
        howToAccompany: ["Explícale el motivo de forma concreta y sin rodeos: dile esta es una decisión de equipo y de planificación, no un juicio sobre ti, y te muestro qué estoy buscando hoy.","Dale algo claro en qué enfocarse mientras espera: pídele que observe una jugada o un rival puntual y que te traiga su lectura cuando entre."],
        ifNotResponding: "Si lo ves trabado dándole vueltas, bájale la exigencia interna. Recuérdale que el rol de hoy no mide su valor y que entender lleva tiempo, sin pedirle que lo resuelva ya.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor vive el logro del compañero como una competencia que está perdiendo. Su instinto es demostrar de inmediato que él también puede, y si no encuentra cómo, se frustra.",
        howToAccompany: ["Canaliza esa energía hacia un reto propio en vez de hacia el otro: tú tienes tu propio desafío hoy, vamos a ver hasta dónde llegas.","Reconócele algo concreto que él sí hace bien para que no sienta que pierde su lugar: en la marca nadie te gana, eso es tuyo."],
        ifNotResponding: "Dale un par de minutos para que baje la intensidad sin exigirle que aplauda al compañero. Cuando vuelva a sentirse capaz en lo suyo, la comparación pierde fuerza sola.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "I",
        whatsHappeningForProfile: "El Conector siente que el cariño y la atención del grupo se fueron hacia otro, y lo vive como que a él lo quieren menos. Le duele más el desplazamiento social que el resultado.",
        howToAccompany: ["Devuélvele su lugar en el grupo con algo genuino: tu energía es la que levanta al equipo, eso no lo reemplaza nadie.","Invítalo a sumarse a la alegría del otro para que sienta que sigue dentro: vamos a festejarlo entre todos, eres parte de esto."],
        ifNotResponding: "No lo obligues a celebrar si todavía le cuesta. Acércate un momento a solas y hazle sentir que su lugar contigo sigue intacto, sin pedirle nada a cambio.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "S",
        whatsHappeningForProfile: "El Sostén se guarda el malestar y se corre al segundo plano sin decir nada. Por fuera parece que no le afecta, pero el fastidio se va acumulando y puede aparecer más tarde de golpe.",
        howToAccompany: ["Dale permiso para nombrar lo que siente, sin apuro: está bien que hoy te haya costado, contarlo no tiene nada de malo.","Ofrécele un lugar seguro y predecible donde volver a sentirse cómodo: ponte conmigo en este ejercicio y vamos tranquilos."],
        ifNotResponding: "No lo presiones a hablar. Quédate cerca y mantén la rutina estable. Tu constancia le devuelve la seguridad mejor que cualquier charla forzada.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "C",
        whatsHappeningForProfile: "El Estratega se queda analizando por qué el otro lo hizo mejor y se compara punto por punto. Esa cuenta interna lo vuelve durísimo consigo mismo.",
        howToAccompany: ["Saca la mirada de la comparación y ponla en su propio proceso: no se trata de quién es mejor, sino de qué puedes aprender mirándolo.","Dale un dato concreto y observable para que ordene la cabeza: fíjate cómo se perfila él antes de recibir, prueba copiar solo eso hoy."],
        ifNotResponding: "Si sigue atrapado en el bucle, bájale la exigencia. Recuérdale que cada uno avanza a su tiempo y que entender lleva su proceso, no hay apuro.",
    },
    {
        situationId: "recibe-correccion",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor confunde la corrección con perder terreno. Necesita sentir que sigue siendo capaz y que tiene margen para mejorar por su cuenta, no que lo dejaron mal parado.",
        howToAccompany: ["Enmarca la corrección como un reto, no como una falla: tienes esto casi listo, te falta un ajuste para que sea imparable.","Dale el control del cambio: que sea él quien decida cómo corregirlo en la próxima jugada, en vez de imponérselo."],
        ifNotResponding: "Si se pone a la defensiva, baja la intensidad y déjalo probar a su modo unos minutos. Cuando vea que el ajuste le funciona, lo adopta solo y sin discutir.",
    },
    {
        situationId: "recibe-correccion",
        eje: "I",
        whatsHappeningForProfile: "El Conector siente la corrección como un golpe al vínculo, no a la técnica. Le importa más si te decepcionó o si quedó expuesto que el detalle que le marcaste.",
        howToAccompany: ["Corrígelo en privado y cuida el tono: empieza por el vínculo, lo tuyo con el equipo está perfecto, vamos a pulir solo este detalle.","Recuérdale que la corrección no cambia cómo lo ves: te marco esto porque confío en lo que puedes dar."],
        ifNotResponding: "Si igual se apaga, dale un gesto de cercanía y espera. Para él, sentirse aceptado pesa más que cualquier indicación, y desde ahí vuelve a escuchar.",
    },
    {
        situationId: "recibe-correccion",
        eje: "S",
        whatsHappeningForProfile: "El Sostén asiente y parece tomarlo bien, pero por dentro se guarda el malestar. Evita el roce en el momento y la incomodidad le aparece después, más callada.",
        howToAccompany: ["Dale tiempo y previsibilidad: avísale con calma y sin sorpresas, quiero mostrarte algo para la próxima, sin apuro.","Confirma que está bien y abre la puerta a que hable: esto pasa todo el tiempo, si algo no te cerró me lo dices cuando quieras."],
        ifNotResponding: "Si lo notas retraído, no insistas en el momento. Acércate después, en un clima tranquilo, y dale espacio para que suelte lo que se guardó.",
    },
    {
        situationId: "recibe-correccion",
        eje: "C",
        whatsHappeningForProfile: "El Estratega entiende la corrección, pero se queda atascado en el detalle y se vuelve muy exigente consigo mismo. Le cuesta soltar lo que pasó para seguir jugando.",
        howToAccompany: ["Explícale el porqué, que es lo que más lo ordena: corregimos esto porque te da más tiempo para decidir en la jugada.","Ayúdalo a pasar de página con un foco concreto: ya lo analizaste, ahora prueba solo este ajuste en la próxima y lo vemos."],
        ifNotResponding: "Si sigue dándole vueltas, dale un solo punto en el que pensar y deja el resto para después. Menos información lo libera para volver a jugar tranquilo.",
    },
    {
        situationId: "gestiona-exito",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor siente el éxito con mucha intensidad y necesita mostrarlo. Cuando ya se siente ganador, su motor de esfuerzo afloja porque cree que el desafío terminó.",
        howToAccompany: ["Ponle un nuevo objetivo apenas logra algo: ya conseguiste eso, ahora a ver si sostienes ese nivel hasta el final.","Reconócele el logro y enseguida invítalo a sumar al equipo: el que ya está jugando bien hoy puede levantar a un compañero."],
        ifNotResponding: "Déjalo disfrutar el momento sin corregirlo en caliente. Cuando baje la euforia, vuelve a buscarlo con un reto concreto y su motor se reactiva solo.",
    },
    {
        situationId: "gestiona-exito",
        eje: "I",
        whatsHappeningForProfile: "El Conector vive el éxito a través de los demás y se entusiasma cuando siente la celebración del grupo. Llevado por esa emoción, sin querer puede acaparar el momento y dejar al resto del equipo afuera.",
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
        whatsHappeningForProfile: "El Estratega analiza su buen rendimiento y puede convencerse de que ya entendió todo. Al sentir que no le queda nada por mejorar, baja la guardia sin darse cuenta.",
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
        whatsHappeningForProfile: "El Conector lidera con naturalidad desde el vínculo, pero le pesa cuando el rol implica poner un límite o decidir entre amigos. No quiere decepcionar a nadie.",
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
        whatsHappeningForProfile: "El Estratega duda porque todavía no tiene claro qué se espera de él, y prefiere esperar antes que ejercer el rol a medias. Le pesa la idea de equivocarse delante de todos.",
        howToAccompany: ["Explícale el rol con claridad y por partes: ser referente aquí significa estas tres cosas, nada más.","Dale tiempo para observar antes de actuar: mira unos días cómo funciona el grupo y después me dices cómo lo harías tú."],
        ifNotResponding: "Proponle primero un rol más concreto, algo que pueda entender y dominar. La confianza para liderar le llega cuando siente que comprende.",
    },
    {
        situationId: "expectativa-padres",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor convierte la expectativa en una presión por ganar sí o sí. Cuando siente que el resultado define si decepcionó o no a sus padres, se exige de más y reacciona con frustración intensa ante cualquier error.",
        howToAccompany: ["Devuélvele el foco a lo que él controla: hoy no me fijo en el marcador, me fijo en cómo compites cada pelota.","Reconócele el esfuerzo más que el resultado, en voz alta y delante del grupo: me gustó cómo no bajaste los brazos cuando se complicó."],
        ifNotResponding: "Si sigue jugando para la tribuna, baja tú la importancia del resultado en tus palabras. Cuando él vea que para ti su valor no depende de ganar, empieza a soltar la presión.",
    },
    {
        situationId: "expectativa-padres",
        eje: "I",
        whatsHappeningForProfile: "El Conector necesita sentir el orgullo de sus padres para jugar liviano. Una cara seria desde afuera lo desconecta enseguida, porque para él rendir bien y ser querido están unidos.",
        howToAccompany: ["Recuérdale que el cariño de sus padres no se gana ni se pierde en una cancha: tu familia te quiere juegues como juegues, eso no está en juego hoy.","Dale un motivo para disfrutar con sus compañeros y no solo para los de afuera: sal a pasarla bien con tu equipo, ese es tu lugar aquí."],
        ifNotResponding: "Si sigue pendiente de la tribuna, ayúdalo a reconectar con el grupo en vez de con afuera. Cuando se siente parte del equipo, la mirada de los padres deja de ser lo único que importa.",
    },
    {
        situationId: "expectativa-padres",
        eje: "S",
        whatsHappeningForProfile: "El Sostén se guarda la tensión por dentro y no la muestra. Sigue jugando callado, pero más rígido, y la carga se le acumula hasta aparecer de golpe en un mal momento.",
        howToAccompany: ["Acércate con calma y sin exponerlo para abrirle la puerta: si en algún momento te pesa lo de afuera, me lo puedes contar tranquilo.","Dale rutinas y referencias estables que no dependan de la tribuna: tú concéntrate en tu marca de siempre, eso ya lo sabes hacer."],
        ifNotResponding: "Si no logra soltar la carga, no lo fuerces a hablar. Mantén un clima predecible y seguro alrededor de él, y dale tiempo: confiar en ti es lo que después le permite abrirse.",
    },
    {
        situationId: "expectativa-padres",
        eje: "C",
        whatsHappeningForProfile: "El Estratega se mete en su cabeza tratando de descifrar qué esperan de él. Se autoexige el doble y termina jugando trabado por miedo a no estar a la altura de lo que cree que los adultos quieren ver.",
        howToAccompany: ["Sácale la presión de tener que adivinar expectativas y dale un objetivo claro y propio: tu único trabajo hoy es leer bien el juego, nada más.","Ayúdalo a separar su deseo del de los padres con una pregunta concreta: dejando afuera lo que esperan ellos, a ti qué te dan ganas de probar hoy."],
        ifNotResponding: "Si sigue trabado en su análisis, reduce las variables: una sola consigna simple por vez. Cuando deja de cargar con todo lo que cree que esperan, vuelve a jugar suelto.",
    },
    {
        situationId: "sube-categoria",
        eje: "D",
        whatsHappeningForProfile: "El Impulsor venía siendo una referencia y ahora es el nuevo entre los más grandes. Perder ese lugar de protagonismo le toca la confianza, y puede taparlo con enojo o compitiendo de más para recuperar terreno.",
        howToAccompany: ["Dale un objetivo concreto para su adaptación: en estas semanas tu desafío es ganarte un lugar en este grupo, lo vamos a ver partido a partido.","Reconócele cada paso de progreso en lo nuevo: hoy aguantaste el ritmo de los más grandes, eso hace dos semanas no pasaba."],
        ifNotResponding: "Si sigue tenso, bájale la exigencia de rendir ya y déjalo enfocarse en una sola cosa por entrenamiento. Recuperar el control de a poco le devuelve la seguridad.",
    },
    {
        situationId: "sube-categoria",
        eje: "I",
        whatsHappeningForProfile: "El Conector dejó atrás a su grupo de siempre y todavía no encontró su lugar entre los nuevos. Aunque esté rodeado de compañeros, se siente afuera, y eso le baja las ganas más que cualquier tema de juego.",
        howToAccompany: ["Conéctalo con un compañero de la nueva categoría que lo reciba bien: te presento a Tomás, va a ser tu compañero esta semana.","Dale un rol que lo integre desde lo social, como armar un ejercicio en duplas o liderar la entrada en calor junto a otro."],
        ifNotResponding: "Si sigue replegado, no lo expongas frente al grupo. Acércate en privado y muéstrale que lo quieres ahí, sentirse esperado le devuelve las ganas.",
    },
    {
        situationId: "sube-categoria",
        eje: "S",
        whatsHappeningForProfile: "El Sostén se desestabiliza con el cambio de rutina, de horarios y de caras conocidas. Se repliega al segundo plano y sostiene la incomodidad en silencio, hasta que un día le pesa todo junto.",
        howToAccompany: ["Dale previsibilidad sobre lo nuevo: explícale cómo va a ser el entrenamiento y qué se espera de él, paso a paso.","Ofrécele un punto de referencia estable, como un lugar fijo en la cancha o un compañero con quien siempre empieza: arranca siempre al lado de él hasta que te sientas cómodo."],
        ifNotResponding: "Si lo ves cerrado, dale más tiempo sin apurarlo y pregúntale en privado cómo se está sintiendo. A él el cambio le lleva más, y eso está bien.",
    },
    {
        situationId: "sube-categoria",
        eje: "C",
        whatsHappeningForProfile: "El Estratega está leyendo todo el escenario nuevo: el ritmo, los códigos del grupo, dónde encaja él. Mientras procesa puede parecer apagado o dudar antes de jugar, porque todavía no entiende del todo cómo funciona esta categoría.",
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

import { SITUATIONS_EN, SITUATION_CARDS_EN } from './situationalGuide.en';
import { SITUATIONS_PT, SITUATION_CARDS_PT } from './situationalGuide.pt';

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
