// Argo Method — Archetype editorial content
// Reviewed: probabilistic language, accompaniment framing, strength-based descriptors

export type EjeType = 'D' | 'I' | 'S' | 'C';
export type MotorType = 'Rápido' | 'Medio' | 'Lento';

export interface GuiaRow {
  situacion: string;
  activador: string;
  desmotivacion: string;
}

export interface Checklist {
  antes: string;
  durante: string;
  despues: string;
}

export interface ArchetypeData {
  id: string;
  eje: string;
  motor: string;
  label: string;
  perfil: string;
  bienvenida: string;
  wow: string;
  motorDesc: string;
  combustible: string;
  grupoEspacio: string;
  corazon: string;
  palabrasPuente: string[];
  palabrasRuido: string[];
  guia: GuiaRow[];
  reseteo: string;
  ecos: string;
  checklist: Checklist;
}

export const ARCHETYPE_DATA: Record<string, ArchetypeData> = {
  impulsor_dinamico: {
    id: `impulsor_dinamico`,
    eje: `D`,
    motor: `Rápido`,
    label: `Impulsor Dinámico`,
    perfil: `Acción Directa y Resolución Inmediata`,
    bienvenida: `Este mapa es una invitación a asomarnos a la manera en que {nombre} tiende a vivir y sentir el deporte hoy. Igual que un mapa de navegación no califica el terreno como "bueno" o "malo", sino que nos sugiere qué equipo llevar para recorrerlo con disfrute, este informe ofrece pistas para que la experiencia deportiva sea un espacio de alegría y no de presión. Nota fundamental: Este informe no evalúa el talento ni predice el futuro deportivo. Sus hallazgos son probabilísticos y dinámicos: describen tendencias actuales que muy probablemente evolucionarán junto con la maduración natural de {nombre}. No son rasgos fijos, sino una fotografía de su sintonía presente.`,
    wow: `En el mito de la nave Argo, cada tripulante tenía una naturaleza única. {nombre} tiende a ocupar naturalmente el lugar de quien activa el movimiento. Es probable que no sea alguien que espere a que las cosas sucedan; su manera de estar en el mundo parece diseñada para ser la chispa que inicia la acción. Es probable que notes que {nombre} tiende a ser ese tripulante que, en los momentos de mayor duda o cuando el juego se detiene, toma la iniciativa para reiniciar el avance. Su contribución no es solo física, es una energía de resolución que tiende a empujar a toda la tripulación hacia adelante. No busca dirigir por el simple hecho de dirigir, sino porque su naturaleza parece sentir que el movimiento es el estado donde el equipo se siente más seguro. Su gran fortaleza tiende a ser la valentía de decidir en el instante.`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente ágil. En la vida cotidiana, esto sugiere que la distancia entre su percepción y su acción tiende a ser muy corta. Aprender, para {nombre}, probablemente sea experimentar. Es posible que no necesite que le expliquen la teoría del pase en una pizarra durante diez minutos; su manera de procesar la información parece funcionar mejor cuando su cuerpo está en movimiento. Si notas inquietud durante las charlas técnicas, es probable que no sea falta de interés ni de respeto, sino su ritmo interno diciendo: "Ya capté la idea, ahora déjame probar el cómo". Invitación de sintonía: Cuando quieras compartir una indicación, prueba hacerlo mientras {nombre} tiene el balón o está en movimiento. La información tiende a "viajar" mejor en su sistema cuando su cuerpo está activo.`,
    combustible: `¿Qué hace que {nombre} quiera volver el próximo domingo? Su combustible principal tiende a ser el sentido de progreso y el impacto. Es probable que necesite sentir que sus acciones producen un cambio visible en el juego. Se siente vibrante cuando puede decir: "Yo logré que esto pasara". Feedback de sintonía: {nombre} tiende a ser muy sensible al reconocimiento de su iniciativa. Es probable que valore más que le digas "Me encantó cómo te animaste a intentar ese pase" que un simple "Muy bien jugado". El elogio que nutre su confianza es el que valida su valentía, no solo el resultado.`,
    grupoEspacio: `En el equipo: {nombre} tiende a vincularse a través de la acción compartida. Su forma de ser "amigo" de sus compañeros probablemente sea pasándoles el balón o defendiendo una posición exigente. Su lealtad suele demostrarse en el esfuerzo físico conjunto más que en las palabras. En el espacio: Tiende a preferir los escenarios de alta intensidad y espacios dinámicos. Le gusta el "ida y vuelta". Los ejercicios estáticos o las filas largas para esperar un turno suelen ser su mayor fuente de fricción emocional; es ahí donde su sintonía tiende a decaer y puede aparecer la distracción.`,
    corazon: `Para sintonizar con {nombre}, es valioso aprender a traducir lo que vemos: Lo que puede parecer: Impaciencia o ganas de "querer hacer todo solo". Lo que probablemente es (La Intención): Un deseo profundo de disolver la incertidumbre. Cuando el juego se vuelve caótico, {nombre} tiende a sentir que debe actuar rápido para que el equipo no pierda el rumbo. Su impulso suele ser un acto de cuidado hacia la misión del equipo. El termómetro emocional: Su frustración tiende a expresarse "hacia afuera". Si notas gestos bruscos o un aumento de velocidad de forma errática, es probable que sea una señal de que su sistema se ha sobrecalentado. No es "mal carácter"; es saturación de intensidad.`,
    palabrasPuente: ["Impacto", "Iniciativa", "Tú decides", "Adelante", "Resolución"],
    palabrasRuido: ["Espera sin hacer nada", "Quédate quieto", "Eso no te toca", "Deja que otro lo haga", "No opines"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Ofrecer una responsabilidad clara y con impacto (ej: \"Tu rol es activar la presión en la salida\").", desmotivacion: "Consignas vagas o pasivas que no le den un propósito visible dentro del juego." },
      { situacion: "Acompañar su confianza", activador: "Validar una decisión específica que haya tomado, aunque el resultado no haya sido perfecto.", desmotivacion: "Señalamientos basados en la emoción del momento o comparaciones con otros." },
      { situacion: "Facilitar un cambio de rol", activador: "Explicar el sentido estratégico del cambio (ej: \"Te necesito aquí para cubrir este espacio clave\").", desmotivacion: "Realizar cambios sin una breve explicación que le dé sentido a su nueva posición." }
    ],
    reseteo: `Cuando {nombre} comete una equivocación, su tendencia puede ser canalizar la frustración a través de la intensidad física. Acompañamiento sugerido: Probablemente no sea el mejor momento para detener el flujo y explicarle el aspecto técnico. Su ritmo ágil tiende a necesitar "limpiar" la sensación con una nueva acción exitosa. Ofrecerle un objetivo pequeño y alcanzable de inmediato (ej: "¡Buen intento! Ahora, busca este pase") puede permitirle volver emocionalmente al juego sin quedar anclado en la culpa.`,
    ecos: `Aunque este informe nace del deporte, estas tendencias de ritmo probablemente sean parte de su forma de procesar el mundo: En casa: Es probable que prefiera instrucciones de a una por vez. Si recibe tres indicaciones juntas, su ritmo ágil tenderá a activarse con la primera y a soltar las otras dos. En la escuela: Su estilo de aprendizaje tiende a ser el "hacer". Los proyectos prácticos o los experimentos donde pueda ver resultados inmediatos suelen ser su zona de mayor entusiasmo y disfrute.`,
    checklist: {
      antes: `Acordar juntos un único objetivo basado en su intención (ej: "Hoy el objetivo es que disfrutes buscando espacios").`,
      durante: `Practicar el Silencio Aliado. Confiar en su capacidad para resolver. Tu presencia tranquila tiende a ser su mejor apoyo.`,
      despues: `Respetar los 20 minutos de enfriamiento. Dejar que su ritmo baje de intensidad antes de conversar sobre el juego. Comenzar siempre preguntando: "¿Qué fue lo que más te divirtió hoy?".`,
    },
  },
  impulsor_decidido: {
    id: `impulsor_decidido`,
    eje: `D`,
    motor: `Medio`,
    label: `Impulsor Decidido`,
    perfil: `Iniciativa Estratégica y Ejecución con Propósito`,
    bienvenida: `Este mapa es una invitación a entender cómo {nombre} se conecta con el deporte en esta etapa de su vida. No es una definición de su personalidad para siempre, sino una "fotografía del presente" que nos ayuda a afinar nuestra comunicación. Nota de seguridad: Este informe no evalúa el talento. Su único fin es que {nombre} se sienta comprendido y disfrute más de cada partido, reduciendo la fricción emocional entre sus necesidades y nuestras expectativas.`,
    wow: `En la tripulación de la Nave Argo, {nombre} tiende a ser quien asegura que el avance sea firme y con dirección. No parece ser el tripulante que salta al agua sin mirar, sino aquel que, una vez que entiende hacia dónde van, pone toda su determinación para que la nave llegue a destino. Es probable que notes que {nombre} muestra una confianza muy alta cuando el plan está claro. Su valor para el grupo tiende a residir en su consistencia: una vez que decide que es el momento de actuar, suele hacerlo con una fuerza y un enfoque admirables. No busca la acción por el ruido, sino por el logro. Su presencia en el equipo tiende a aportar seguridad en la ejecución; es quien probablemente transforma la intención en resultados tangibles.`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente equilibrado. Esto sugiere que su sistema prefiere un ritmo de "procesar para ejecutar". A diferencia de los perfiles que actúan por puro instinto, {nombre} tiende a tener un breve tiempo de análisis interno. Suele observar la jugada, evaluar sus opciones y luego actuar con decisión. Mirada cercana: Si a veces parece que tarda un instante más en arrancar, es probable que no sea falta de ganas, sino su manera de asegurarse de que la acción sea la adecuada. Invitación de sintonía: En lugar de pedir que "sea más rápido" de forma genérica, darle claridad sobre el objetivo puede hacer que su velocidad natural aumente al sentirse seguro.`,
    combustible: `¿Qué motiva a {nombre}? Su combustible tiende a ser la eficacia. Es probable que le guste sentir que es competente y que sus acciones tienen sentido dentro del juego. Feedback de sintonía: Tiende a valorar mucho que reconozcas la calidad de su decisión. En lugar de decirle "¡Qué golazo!", prueba con: "Me gustó mucho cómo esperaste el momento justo para patear". Esto valida su proceso mental y refuerza su confianza.`,
    grupoEspacio: `En el equipo: {nombre} tiende a vincularse a través de la colaboración orientada a tareas. Es probable que se sienta cómodo con compañeros que respetan su espacio y que cumplen con su parte del plan. No es necesariamente el que más habla en el vestuario, pero tiende a ser quien lidera con el ejemplo cuando el balón empieza a rodar. En el espacio: Suele preferir los contextos donde hay cierto orden táctico. Se siente cómodo en su zona asignada y fluye mejor cuando el campo no es un caos total. El desorden excesivo o la falta de reglas claras en un ejercicio pueden frustrarlo y apagar su iniciativa.`,
    corazon: `Para sintonizar con {nombre}, es valioso mirar más allá de la conducta: Lo que puede parecer: A veces puede dar la impresión de ser testarudo o demasiado serio. Lo que probablemente es (La Intención): Un deseo de hacerlo bien. {nombre} tiende a tener un alto nivel de autoexigencia. Si se muestra firme, es probable que esté intentando mantener el rumbo de la situación para asegurar el resultado para su equipo. El termómetro emocional: Su frustración suele ser silenciosa al principio, pero puede notarse en una "tensión física" aumentada. Si empieza a jugar con demasiada fuerza, es probable que sea una señal de que necesita que le devuelvas la calma con una indicación clara y lógica.`,
    palabrasPuente: ["Estrategia", "Objetivo", "Tú sabes cómo", "Paso a paso", "Efectivo"],
    palabrasRuido: ["Como sea", "Improvisa sin pensar", "No planifiques", "No pienses", "Lánzate sin más"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Ofrecer un objetivo técnico que invite a usar su potencia y decisión.", desmotivacion: "Cambiar las reglas del juego a mitad del entrenamiento sin aviso." },
      { situacion: "Acompañar su confianza", activador: "Recordarle un momento donde su decisión fue clave para el equipo.", desmotivacion: "Indicaciones contradictorias o emocionales gritadas desde la banda." },
      { situacion: "Facilitar un cambio", activador: "Explicar el \"para qué\" del cambio y cómo eso fortalece al equipo.", desmotivacion: "Moverlo de posición \"para probar\", sin darle una función clara." }
    ],
    reseteo: `Cuando comete una equivocación, {nombre} tiende a analizarla mentalmente. Si no lo acompañamos a salir de ese circuito, puede quedarse atrapado en el "por qué no salió". Acompañamiento sugerido: Usar la lógica. En lugar de un "No pasa nada", probar con: "El movimiento fue correcto, solo faltó un poco más de fuerza. En la próxima, ajusta eso". Al ofrecerle un dato técnico, su mente tiende a salir de la emoción de la frustración y volver a la ejecución.`,
    ecos: `En casa: {nombre} tiende a agradecer saber el "plan del día". Es probable que valore tener autonomía para resolver sus cosas (deberes, ordenar su cuarto) a su ritmo, siempre que las expectativas estén claras. En la escuela: Suele necesitar entender el sentido de lo que estudia. Una vez que percibe la utilidad de una materia, su impulso natural tiende a generar ganas de destacar en ella.`,
    checklist: {
      antes: `Repasar juntos cuál es su "misión especial" para hoy (ej: "Hoy tu misión es asegurar que los pases salgan limpios").`,
      durante: `Evitar la sobre-dirección. Confiar en su proceso. Si necesita un ajuste, ofrecérselo en el descanso con calma.`,
      despues: `Dejar pasar un tiempo. Preguntar: "¿Qué decisión que tomaste hoy en el campo te hizo sentir más orgulloso?". Esto refuerza su identidad como resolutor.`,
    },
  },
  impulsor_persistente: {
    id: `impulsor_persistente`,
    eje: `D`,
    motor: `Lento`,
    label: `Impulsor Persistente`,
    perfil: `Determinación Constante y Resiliencia en el Esfuerzo`,
    bienvenida: `Este mapa es una invitación a entender cómo {nombre} procesa y habita el deporte hoy. En la Nave Argo sabemos que cada deportista tiene su propio compás. Este informe no busca "acelerar" a {nombre}, sino identificar las condiciones bajo las cuales su persistencia natural se convierte en su mayor fuente de disfrute. Nota de seguridad: Los datos aquí presentados son una "fotografía del presente". El desarrollo infantil es fluido; estas tendencias describen su zona de comodidad actual para que podamos acompañar sin presionar.`,
    wow: `En la mítica Nave Argo, {nombre} tiende a ser ese tripulante que mantiene el ritmo del remo cuando los demás empiezan a flaquear por el cansancio. Su naturaleza no parece ser la de la chispa explosiva, sino la de la llama que no se apaga. Es probable que notes que {nombre} tiende a "ir de menos a más". Su valor para el equipo suele ser la estabilidad bajo presión. Mientras otros pueden volverse erráticos cuando el partido se pone difícil, {nombre} tiende a mantener su intención de logro firme. Es el "ancla de determinación" de la tripulación: alguien en quien el equipo puede confiar cuando el desafío requiere aguante y no solo velocidad. Su gran fortaleza tiende a ser la capacidad de no rendirse.`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente profundo. En un mundo que premia la inmediatez, es valioso que como adultos reencuadremos este concepto: su ritmo no sugiere "falta de capacidad", sino profundidad de procesamiento. Mirada cercana: Su sistema nervioso parece necesitar un tiempo de "calentamiento" más prolongado. Necesita sentir la textura del juego para que su ritmo se estabilice. Una vez que entra en sintonía, suele ser muy difícil sacarlo de su foco. Invitación de sintonía: No esperar una reacción explosiva en el primer minuto del entrenamiento. Darle permiso para entrar en calor a su ritmo; es probable que su mejor versión aparezca a mitad de la actividad.`,
    combustible: `El combustible de {nombre} tiende a ser la superación de la resistencia. Es probable que se sienta motivado cuando el desafío es exigente y requiere esfuerzo sostenido. Le gusta la sensación de ir construyendo poco a poco hasta ver cómo logra el objetivo. Feedback de sintonía: Tiende a valorar inmensamente que reconozcas su aguante. En lugar de premiar solo el éxito rápido, probar con: "Me impresionó cómo seguiste intentándolo con la misma fuerza hasta el final". Esto valida su identidad como persistente.`,
    grupoEspacio: `En el equipo: Tiende a vincularse a través de la lealtad y el esfuerzo compartido. Es probable que sea el compañero que no abandona su posición. Su forma de cuidar al grupo suele ser no fallar en su tarea, siendo un soporte sólido para los perfiles más volátiles. En el espacio: Tiende a sentirse cómodo en contextos donde puede gestionar su propia energía. Suele preferir los espacios donde el esfuerzo es predecible o donde puede imponer su propio ritmo. Los cambios bruscos de dirección o de consignas cada dos minutos pueden agotar su paciencia emocional.`,
    corazon: `Para entender a {nombre}, es valioso mirar la intención detrás de su pausa: Lo que puede parecer: A veces puede dar la impresión de que tarda en reaccionar o que sus movimientos iniciales son pausados. Lo que probablemente es (La Intención): Una búsqueda de seguridad en el esfuerzo. {nombre} tiende a no querer desperdiciar energía; parece estar calibrando su cuerpo para asegurarse de que puede cumplir con la misión hasta el final. Su pausa suele ser preparación, no desinterés. El termómetro emocional: Su frustración puede manifestarse como una "obstinación silenciosa". Si se siente presionado para actuar más rápido de lo que su ritmo permite, puede llegar a detenerse por completo.`,
    palabrasPuente: ["Resistencia", "Paso a paso", "Constancia", "Firme", "Sigue así"],
    palabrasRuido: ["Apúrate sin pensar", "¡Reacciona ya!", "No te quedes pensando", "Dale más velocidad", "Todos ya lo hicieron"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Proponerle metas de \"largo aliento\" o de resistencia.", desmotivacion: "Presionarlo para que dé una respuesta explosiva inmediata." },
      { situacion: "Acompañar su confianza", activador: "Validar su constancia: \"Me gusta que mantienes el esfuerzo sin parar\".", desmotivacion: "Comparar su velocidad de reacción con la de compañeros de ritmo diferente." },
      { situacion: "Facilitar un cambio", activador: "Darle tiempo de pre-aviso para que su ritmo se ajuste a la nueva propuesta.", desmotivacion: "Cambios de planes de último segundo que exijan una reacción física brusca." }
    ],
    reseteo: `Cuando {nombre} comete una equivocación, su tendencia puede ser procesarla de forma profunda y sostenida. La equivocación puede quedársele "pegada" durante varios minutos. Acompañamiento sugerido: No buscar que se olvide con un chiste o una distracción. Ayudarle a convertir la experiencia en combustible para su persistencia. Decirle: "Ese paso no salió, pero tu fuerza es la que nos va a dar la siguiente oportunidad. Sigue empujando". Esto puede permitirle integrar lo ocurrido como parte de su proceso de esfuerzo.`,
    ecos: `En casa: Es probable que le cueste arrancar las tareas (el "encendido" de su ritmo), pero una vez que se sienta a estudiar, puede estar mucho tiempo concentrado. La clave tiende a ser no apurar en el inicio, sino valorar lo que logra por persistencia. En la escuela: Suele ser el perfil ideal para proyectos de largo plazo. Puede que no sea el que más participa en clase de forma espontánea, pero es probable que sea el que entregue el trabajo más completo y madurado.`,
    checklist: {
      antes: `Asegurar un calentamiento físico y mental prolongado. Llegar con tiempo es valioso para que su ritmo empiece a activarse antes de que pite el árbitro.`,
      durante: `Sustituir las exigencias de velocidad por gestos de aprobación que digan "Veo tu esfuerzo, mantén ese ritmo".`,
      despues: `La conversación posterior no debería centrarse en la velocidad, sino en la tenacidad. Preguntar: "¿En qué momento sentiste que no te rendiste a pesar de estar cansado?".`,
    },
  },
  conector_vibrante: {
    id: `conector_vibrante`,
    eje: `I`,
    motor: `Rápido`,
    label: `Conector Vibrante`,
    perfil: `Entusiasmo Contagioso y Cohesión a través de la Energía`,
    bienvenida: `Este mapa es una invitación a mirar el deporte a través de los ojos de {nombre}. No es una sentencia sobre quién es, sino una "fotografía del presente" que nos muestra en qué condiciones tiende a fluir con más alegría. Nota de seguridad: En Método Argo no evaluamos el talento ni diagnosticamos la personalidad. El desarrollo infantil es dinámico; este informe simplemente nos ayuda a que el entorno deportivo sea un lugar donde {nombre} se sienta seguro, visto y motivado para seguir jugando.`,
    wow: `En el mito de la Nave Argo, {nombre} tiende a ocupar el lugar de Orfeo: aquel que con su música y su voz marcaba el ritmo para que todos los demás remaran al unísono. Su naturaleza no parece ser solo la de jugar, sino la de hacer que el equipo se sienta vivo. Es muy probable que notes que {nombre} tiende a ser quien celebra el gol de un compañero con más fuerza que el propio, o quien busca chocar los cinco después de una jugada intensa. Su contribución a la tripulación suele ser la cohesión emocional. Tiende a tener el don de elevar el ánimo del grupo cuando la energía decae. No juega solo con el balón; juega con el ánimo de quienes lo rodean. Su gran fortaleza tiende a ser transformar el esfuerzo en una fiesta compartida.`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente ágil. Esto sugiere que su reacción ante los estímulos sociales tiende a ser instantánea. Mirada cercana: La comunicación para {nombre} probablemente no sea solo palabras; es movimiento, gestos y contacto. Parece procesar lo que sucede en el campo de forma emocional y veloz. Si notas mucha gesticulación o comunicación constante, es probable que no sea falta de concentración: es su forma de mantenerse conectado al presente. Su manera de estar parece necesitar esa "retroalimentación" constante del entorno para saber que todo va bien. Invitación de sintonía: Un simple pulgar arriba o una sonrisa desde la banda viajan a la velocidad de la luz hacia su sistema. Esos pequeños gestos tienden a ser los que mantienen su ritmo encendido.`,
    combustible: `El combustible de {nombre} tiende a ser la aprobación social y la diversión grupal. Es probable que se sienta vibrante cuando siente que es parte esencial de la "tribu" y cuando el ambiente es positivo. Feedback de sintonía: Tiende a nutrirse del entusiasmo. En lugar de un feedback puramente técnico, probar con: "¡Cómo se nota cuando estás animando, contagias a todos!". Esto valida su rol como conector y le da la seguridad para seguir intentándolo.`,
    grupoEspacio: `En el equipo: Tiende a ser el "pegamento" emocional. Se vincula a través de la risa, el juego y la comunicación constante. Le afecta mucho el clima del grupo: si hay tensión o peleas, su sintonía puede caer rápidamente porque su sistema tiende a priorizar el bienestar colectivo. En el espacio: Suele disfrutar de los contextos abiertos y ruidosos. No le teme al caos del juego; al contrario, le divierte la interacción constante. Tiende a sentirse cómodo en el centro de la acción, donde puede ver y ser visto por sus compañeros.`,
    corazon: `Para sintonizar con {nombre}, es valioso traducir su expresividad: Lo que puede parecer: A veces puede dar la impresión de que "se distrae" hablando o que es demasiado inquieto. Lo que probablemente es (La Intención): Una necesidad de asegurar la conexión. {nombre} tiende a hablar o bromear porque quiere aliviar la presión del equipo o asegurarse de que todos se lo están pasando bien. Su "distracción" suele ser, a menudo, un intento de mantener el grupo unido. El termómetro emocional: Si se siente invisible o si el ambiente se vuelve demasiado serio y estricto, su energía "vibrante" puede apagarse, volviéndose inusualmente callado o perdiendo el interés en la actividad.`,
    palabrasPuente: ["Juntos", "Equipo", "Vibe", "Disfruta", "¡Qué energía!", "¡Dale!"],
    palabrasRuido: ["No hables con nadie", "Haz esto solo", "Aíslate", "Deja de festejar", "No te relaciones"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Invitarlo a liderar el grito de equipo o el saludo inicial.", desmotivacion: "Mantenerlo en tareas individuales aisladas por mucho tiempo." },
      { situacion: "Acompañar su confianza", activador: "Un gesto de complicidad (guiño, sonrisa) después de un traspié.", desmotivacion: "Distanciamiento emocional o frialdad por parte del adulto." },
      { situacion: "Facilitar un cambio", activador: "Presentarlo como una oportunidad de acompañar a otros compañeros.", desmotivacion: "Cambios de rol que lo alejen del centro de la interacción social." }
    ],
    reseteo: `Cuando {nombre} comete una equivocación, tiende a preocuparse por cómo lo han visto los demás. Puede temer "haber fallado al grupo". Acompañamiento sugerido: Usar el vínculo. Un pequeño gesto físico (mano en el hombro) o una frase que lo reconecte con sus compañeros: "¡Vuelve con ellos, te necesitan!". Esto puede quitarle el peso de la equivocación individual y devolverlo a su zona de comodidad: la misión colectiva.`,
    ecos: `En casa: Suele necesitar contarte todo su día nada más entrar por la puerta. Probablemente procesa su vida hablando. Escuchar con atención plena durante 10 minutos suele ser la mejor "recarga" de batería emocional. En la escuela: Tiende a aprender mejor en trabajos grupales. Si tiene que estudiar a solas, puede ayudar "explicar" la lección en voz alta a sus muñecos o a ti; es probable que necesite que el conocimiento pase por el canal de la comunicación.`,
    checklist: {
      antes: `El objetivo puede girar en torno a la conexión (ej: "Hoy vamos a enfocarnos en lo bien que animas a tus amigos").`,
      durante: `Dejar que sea expresivo. No intentar apagar su "música". Si notas que vibra, es probable que esté disfrutando.`,
      despues: `El análisis del partido puede pasar por lo social: "¿Con quién te divertiste más hoy?", "¿A quién acompañaste cuando lo necesitaba?".`,
    },
  },
  conector_relacional: {
    id: `conector_relacional`,
    eje: `I`,
    motor: `Medio`,
    label: `Conector Relacional`,
    perfil: `Vínculo Equilibrado y Cohesión a Ritmo Firme`,
    bienvenida: `Este mapa es una ventana para entender cómo {nombre} habita el mundo del deporte hoy. En la Nave Argo, cada ritmo es vital. Este informe no es una etiqueta definitiva, sino una "fotografía del presente" diseñada para que los adultos podamos sintonizar con su naturaleza, protegiendo siempre su disfrute y su autoestima. Nota de seguridad: No evaluamos capacidad técnica ni salud mental. Este documento es una herramienta para reducir la fricción y aumentar el bienestar de {nombre} en su equipo.`,
    wow: `Si la Nave Argo fuera un organismo vivo, {nombre} tiende a ser el tejido que mantiene unidos los músculos. No parece ser el tripulante que busca destacar por encima de los demás, sino aquel que se asegura de que nadie se quede atrás. Es probable que notes que {nombre} tiene una habilidad natural para "leer" el estado de ánimo de sus compañeros. Tiende a ser el puente entre los perfiles más intensos y los más reservados. Su presencia suele aportar una calma amable al grupo; es probable que sea el compañero que busca el pase no solo por táctica, sino por inclusión. Su gran fortaleza tiende a ser la empatía operativa: la capacidad de hacer que el equipo funcione como una unidad gracias a su buena relación con todos.`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente equilibrado. Esto sugiere que su sistema no reacciona por puro impulso social, sino que tiende a necesitar un instante para procesar el clima antes de intervenir. Mirada cercana: El deporte probablemente sea un evento social con reglas. No se lanza al caos sin más; tiende a observar quién está dónde y cómo se sienten sus compañeros. Si ves que tarda un momento en integrarse en un ejercicio nuevo, es probable que no sea timidez, sino validación. Parece estar escaneando el entorno para asegurarse de que el vínculo con los demás es seguro antes de poner su ritmo en marcha. Invitación de sintonía: Darle mensajes de seguridad social. Un "estamos todos listos, vamos a divertirnos" puede darle la señal de que el contexto es amigable y puede empezar a actuar.`,
    combustible: `El combustible de {nombre} tiende a ser la armonía grupal. Es probable que se sienta vibrante cuando percibe que el equipo es un lugar seguro y que su aporte es valorado por sus pares y por el adulto. Feedback de sintonía: Tiende a valorar mucho el reconocimiento de su actitud colaborativa. En lugar de destacar solo su técnica, probar con: "Me fijé en cómo acompañaste a tu compañero a colocarse, eso hace que el equipo sea mejor". Esto refuerza su identidad de conector y lo hace sentir esencial.`,
    grupoEspacio: `En el equipo: Tiende a vincularse a través de la lealtad y el trato cercano. Es probable que sea el amigo fiel que prefiere las relaciones estables. Le afecta mucho el conflicto; una discusión entre compañeros puede hacer que baje su rendimiento porque su mente tiende a quedarse intentando "reparar" el vínculo afectado. En el espacio: Suele sentirse cómodo en espacios organizados donde los roles están claros. No necesita ser siempre el centro de atención, pero sí tiende a necesitar sentir que tiene un lugar físico y emocional definido en el campo.`,
    corazon: `Es valioso traducir su moderación para no malinterpretarla: Lo que puede parecer: A veces puede dar la impresión de ser "demasiado tranquilo" o que le falta intensidad competitiva. Lo que probablemente es (La Intención): Una búsqueda de preservación del grupo. {nombre} tiende a priorizar que el juego sea fluido y agradable para todos por encima de la victoria individual. Su "falta de garra" suele ser en realidad una elección de juego limpio y sintonía. El termómetro emocional: Su frustración tiende a ser silenciosa y social. Si se siente desplazado o si el adulto es demasiado duro con un compañero, {nombre} puede desconectarse emocionalmente como forma de protegerse del estrés ambiental.`,
    palabrasPuente: ["Colaborar", "Nosotros", "Acompañar", "Sintonía", "Fluidez", "Confianza"],
    palabrasRuido: ["Gana tú solo", "No les prestes atención", "Olvídate del grupo", "Sé más intenso", "Lo que pase con otros no importa"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Invitarlo a integrar a alguien o a ser el \"capitán de apoyo\".", desmotivacion: "Ponerlo en situaciones de competencia directa e intensa contra sus amigos más cercanos." },
      { situacion: "Acompañar su confianza", activador: "Un mensaje de calma: \"Todo está bien, seguimos jugando juntos\".", desmotivacion: "Señalar sus equivocaciones frente al grupo (la exposición social puede generarle mucha incomodidad)." },
      { situacion: "Facilitar un cambio", activador: "Explicar cómo su nueva posición ayuda a que el equipo esté mejor equilibrado.", desmotivacion: "Cambios de equipo o de grupo sin un proceso de transición." }
    ],
    reseteo: `Cuando {nombre} comete una equivocación, su primer pensamiento tiende a ser: "¿Se habrán molestado conmigo?". Acompañamiento sugerido: Usar la afirmación social. Probablemente no necesite un análisis técnico profundo en ese instante, sino saber que el vínculo sigue intacto. Un "¡No pasa nada, seguimos contando contigo!" tiende a ser el mejor botón de reinicio para su sistema.`,
    ecos: `En casa: Tiende a valorar mucho los rituales familiares (cenar juntos, un abrazo antes de dormir). Su bienestar probablemente dependa de la calidad de la conexión con sus referentes afectivos. En la escuela: Suele mediar en los conflictos del recreo. Tiende a aprender muy bien a través de la tutoría entre pares (acompañando a otros o recibiendo acompañamiento de un amigo).`,
    checklist: {
      antes: `El objetivo puede girar en torno a la participación. "Hoy vamos a disfrutar de jugar con tus amigos".`,
      durante: `Evitar las señalizaciones negativas. Si necesitas ajustar algo, hacerlo con un tono de voz suave y en privado.`,
      despues: `Valorar el aspecto humano. Preguntar: "¿Cómo te sentiste hoy con el equipo?", "¿A quién sentiste que acompañaste más?".`,
    },
  },
  conector_reflexivo: {
    id: `conector_reflexivo`,
    eje: `I`,
    motor: `Lento`,
    label: `Conector Reflexivo`,
    perfil: `Cohesión Profunda y Observación del Clima Grupal`,
    bienvenida: `Este mapa es una invitación a entender cómo {nombre} percibe y siente el deporte en este momento. En la Nave Argo, la fuerza no solo está en el remo, sino en la capacidad de leer el viento y el mar. Este informe es una "fotografía del presente" diseñada para que los adultos podamos sintonizar con su ritmo natural, protegiendo su bienestar y asegurando que el deporte siga siendo su lugar seguro. Nota de seguridad: No realizamos diagnósticos ni evaluamos el rendimiento. Nuestro objetivo es identificar el contexto donde {nombre} fluye con menor fricción emocional para favorecer su continuidad deportiva.`,
    wow: `En la tripulación de la Nave Argo, {nombre} tiende a ocupar el lugar de quien detecta las corrientes invisibles. Es probable que sea el tripulante que no necesita gritar para ser escuchado, porque su valor reside en su capacidad para entender lo que el equipo necesita antes de que los demás se den cuenta. Es probable que notes que {nombre} tiende a observar mucho antes de participar plenamente. Su contribución a la tripulación suele ser la cohesión desde la calma. No parece buscar ser el centro de atención, sino el "pegamento silencioso" que hace que todos se sientan parte de algo más grande. Su gran fortaleza tiende a ser la sabiduría social: la capacidad de percibir quién está triste, quién está solo o cuándo el equipo ha perdido la sintonía, aportando una presencia equilibrada que suaviza las tensiones.`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente profundo. En un contexto deportivo que suele exigir velocidad inmediata, es importante entender que su ritmo no sugiere falta de energía, sino riqueza de procesamiento. Mirada cercana: Entrar en el juego puede ser como entrar en una conversación profunda: probablemente necesite escuchar primero para saber qué decir después. Su manera de estar parece escanear el clima emocional y las posiciones antes de activar sus músculos. Si parece pausado al arrancar, es probable que esté integrando toda la información del entorno. Invitación de sintonía: Darle tiempo de "aterrizaje". No lanzarlo a la acción sin previo aviso. Permitirle observar los primeros minutos del entrenamiento puede ayudar a que su ritmo se sincronice con el del grupo.`,
    combustible: `El combustible de {nombre} tiende a ser la aceptación y la pertenencia genuina. Es probable que no le motive ganar por ganar, sino la sensación de que es parte de un grupo donde se le aprecia por quien es. Feedback de sintonía: Tiende a valorar mucho el feedback privado y afectuoso. Un "vi cómo te alegraste por el pase de tu compañero, me gusta que estés atento a ellos" puede tener mucho más impacto que un aplauso público que ponga a {nombre} en el centro de todas las miradas.`,
    grupoEspacio: `En el equipo: Tiende a vincularse a través de la empatía y el tiempo compartido. Suele preferir las conversaciones uno a uno o los grupos pequeños donde el ruido emocional es bajo. Le afectan profundamente las injusticias o los gritos, incluso si no están dirigidos a su persona, porque su sistema tiende a ser un receptor del clima grupal. En el espacio: Suele sentirse cómodo en zonas donde puede tener una visión global. A menudo puede preferir posiciones que le permitan ver todo el campo, ya que eso parece darle la seguridad de entender la "historia" de lo que está pasando en el juego.`,
    corazon: `Es valioso traducir su pausa para no juzgarla como desinterés: Lo que puede parecer: A veces puede dar la impresión de estar distraído, tímido o que "le falta intensidad". Lo que probablemente es (La Intención): Una búsqueda de seguridad emocional. {nombre} tiende a no querer cometer una equivocación que rompa la armonía del equipo. Su pausa suele ser un acto de respeto por el juego y por los demás. El termómetro emocional: Su frustración puede manifestarse como un "repliegue". Si el ambiente se vuelve hostil o demasiado competitivo, tiende a encerrarse en sí mismo y dejar de participar activamente para proteger su equilibrio interno.`,
    palabrasPuente: ["Observa", "Siente", "Juntos", "A tu ritmo", "Tranquilo", "Pertenencia"],
    palabrasRuido: ["¡Reacciona sin pensar!", "¿Por qué no participas?", "Todos ya lo hicieron", "Sé más intenso", "No te quedes mirando"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Invitarlo a un rol de observación o de acompañamiento a un compañero nuevo.", desmotivacion: "Ponerlo en el centro de una competencia individual y eliminatoria." },
      { situacion: "Acompañar su confianza", activador: "Un mensaje de voz baja: \"Tómate tu tiempo, yo estoy aquí contigo\".", desmotivacion: "Exponer sus silencios o su ritmo pausado como algo que necesita cambiarse." },
      { situacion: "Facilitar un cambio", activador: "Introducir los cambios de forma gradual, explicándole el lado humano (ej: \"tu amigo te necesita en esta zona\").", desmotivacion: "Cambios bruscos de equipo que lo separen de sus referentes afectivos de golpe." }
    ],
    reseteo: `Cuando {nombre} comete una equivocación, su sistema tiende a "congelarse" emocionalmente. Puede sentirse desconectado del grupo por lo ocurrido. Acompañamiento sugerido: Ofrecerle una salida que use su fortaleza: la observación. Decirle: "No te preocupes por esa jugada, ahora fíjate cómo se mueven ellos para que en la próxima sepas dónde estar". Esto le da una tarea de procesamiento que puede sacarlo de la emoción y devolverlo al juego desde su zona de comodidad: el análisis del clima.`,
    ecos: `En casa: Tiende a necesitar "tiempo de descompresión" al llegar de la escuela. Es probable que sea mejor no preguntarle "¿cómo te fue?" nada más entrar; dejar que su ritmo baje y vendrá por cuenta propia a contar las cosas cuando se sienta en sintonía. En la escuela: Suele ser un excelente compañero, alguien que escucha y que prefiere los ambientes de aprendizaje tranquilos. Puede que necesite más tiempo para entregar tareas creativas porque tiende a ponerles mucha carga emocional y detalle.`,
    checklist: {
      antes: `Llegar con tiempo extra para que pueda ver el ambiente. El caos de llegar tarde tiende a desajustar su ritmo de Conector Reflexivo para todo el partido.`,
      durante: `Evitar las indicaciones en voz alta. Tu presencia silenciosa y un gesto de aprobación ocasional suelen ser suficientes.`,
      despues: `Valorar el bienestar. Preguntar: "¿Cómo te sentiste hoy con tus amigos?", "¿Hubo algún momento que te hiciera sonreír?".`,
    },
  },
  sosten_agil: {
    id: `sosten_agil`,
    eje: `S`,
    motor: `Rápido`,
    label: `Sostén Ágil`,
    perfil: `Reacción de Auxilio Veloz y Apoyo Dinámico`,
    bienvenida: `Este mapa nos invita a entender cómo {nombre} elige habitar el deporte hoy. En la Nave Argo, la seguridad de la travesía depende de quienes aseguran que cada pieza esté en su sitio. Este informe no es una etiqueta fija, sino una "fotografía del presente" diseñada para que los adultos podamos sintonizar con su naturaleza, protegiendo su autoestima y sus ganas de seguir jugando. Nota de seguridad: No evaluamos talento ni realizamos diagnósticos. Nuestro objetivo es identificar el contexto donde {nombre} fluye con mayor comodidad y menor estrés.`,
    wow: `En el mito de los Argonautas, {nombre} tiende a ser ese tripulante atento que, mientras todos miran hacia el horizonte, detecta una pequeña fisura en el casco y la repara al instante. Su naturaleza parece ser la de la protección activa. Es probable que notes que {nombre} tiene un "radar" especial para detectar cuándo un compañero necesita ayuda o cuándo ha quedado un espacio vacío en el campo. Su contribución a la tripulación suele ser la seguridad reactiva: no parece buscar el protagonismo del gol, sino la satisfacción de saber que "el equipo está a salvo" gracias a su intervención. Su gran fortaleza tiende a ser la omnipresencia de apoyo: estar donde se le necesita, justo en el momento en que se le necesita.`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente ágil. Pero a diferencia de otros perfiles ágiles que usan esa velocidad para atacar, {nombre} tiende a usarla para asistir. Mirada cercana: Su sistema nervioso parece estar en "alerta amable". Su velocidad de reacción tiende a activarse ante la necesidad del otro. Si un balón queda suelto o un compañero pierde su posición, su cuerpo parece responder de forma casi instintiva. No necesita pensar mucho la jugada; su inteligencia tiende a ser de auxilio inmediato. Invitación de sintonía: Valorar su capacidad de estar atento. Un "qué bien cubriste ese espacio" puede confirmarle que su ritmo ágil está cumpliendo su misión de proteger al grupo.`,
    combustible: `El combustible de {nombre} tiende a ser sentirse útil y necesario. Es probable que se sienta vibrante cuando percibe que su esfuerzo silencioso ha evitado una dificultad para el equipo. Su motivación parece ser relacional: "juego para que mi equipo esté bien". Feedback de sintonía: Tiende a nutrirse de la validación del esfuerzo invisible. En lugar de pedirle que "brille solo", probar con: "Hoy fuiste el motor que mantuvo a todos seguros, sin ti el equipo no habría estado tan ordenado". Esto refuerza su identidad de sostén.`,
    grupoEspacio: `En el equipo: Tiende a ser el compañero que siempre tiene un gesto de ayuda. Es probable que sea quien recoja los materiales sin que se lo pidan o quien ayude a un compañero a atarse los cordones. Se vincula a través del servicio. En el espacio: Suele sentirse cómodo en posiciones de cobertura. Le gusta tener el juego de frente para poder identificar dónde hace falta su ayuda. Los espacios vacíos no le asustan; tiende a verlos como "misiones de auxilio" que debe cumplir.`,
    corazon: `Para sintonizar con {nombre}, es valioso traducir su tendencia a quedarse en un segundo plano: Lo que puede parecer: A veces puede dar la impresión de que "no quiere ser el protagonista" o que le falta ambición individual. Lo que probablemente es (La Intención): Un alto sentido de la responsabilidad colectiva. {nombre} tiende a sentir que si deja su puesto de apoyo para ir a buscar el brillo personal, el equipo quedará vulnerable. Su aparente "falta de ambición" suele ser en realidad una entrega total al bienestar del grupo. El termómetro emocional: Su frustración puede aparecer cuando siente que su ayuda no es valorada o cuando el ambiente es tan desordenado que no sabe a quién acompañar primero. Ahí puede sentirse abrumado y perder su eficacia.`,
    palabrasPuente: ["Apoyo", "Asegura", "Acompaña", "Suma", "Equilibrio", "Te necesitamos ahí"],
    palabrasRuido: ["Olvídate de los demás", "Haz lo tuyo", "No te preocupes por el grupo", "Destaca tú solo", "No asistas a nadie"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Ofrecer una \"misión de apoyo\" específica (ej: \"Tu rol es acompañar a que la defensa esté tranquila\").", desmotivacion: "Dejarlo en una posición donde no tenga a nadie a quien acompañar o asistir." },
      { situacion: "Acompañar su confianza", activador: "Validar su trabajo silencioso e invisible: \"Vi ese cruce que hiciste, fue clave\".", desmotivacion: "Exigirle que tome riesgos individuales excesivos que dejen al equipo expuesto." },
      { situacion: "Facilitar un cambio", activador: "Explicar cómo su nueva función es vital para la seguridad de la Nave.", desmotivacion: "Hacer cambios que se perciban como una falta de confianza en su capacidad de acompañamiento." }
    ],
    reseteo: `Cuando {nombre} comete una equivocación, tiende a sentir que "le ha fallado al equipo". Acompañamiento sugerido: No pedirle que se olvide. Darle una nueva tarea de acompañamiento. Decirle: "Esa no salió, pero ahora tu compañero te necesita para cubrir esta zona, ¡ve a acompañarlo!". Al poner su ritmo ágil al servicio de otro, su sistema nervioso tiende a "limpiar" la equivocación propia y recuperar la sintonía de inmediato.`,
    ecos: `En casa: Tiende a reaccionar rápido cuando ve que necesitas ayuda con las bolsas de la compra o poniendo la mesa. Es probable que valore mucho que le des "misiones de ayuda" en casa; le hace sentirse parte importante de la familia. En la escuela: Suele ser el compañero que presta los lápices o ayuda a explicar algo a quien no entendió. Tiende a sentirse seguro en roles de acompañamiento o asistencia.`,
    checklist: {
      antes: `El objetivo puede girar en torno a la asistencia (ej: "Hoy vamos a enfocarnos en lo atento que estás para acompañar a tus compañeros").`,
      durante: `Evitar pedirle que "se lance al ataque" si eso implica abandonar su rol de sostén. Valorar su posicionamiento.`,
      despues: `La conversación puede centrarse en su valor para el equipo: "¿A quién sentiste que acompañaste más hoy?", "¿En qué momento sentiste que el equipo estuvo seguro gracias a ti?".`,
    },
  },
  sosten_confiable: {
    id: `sosten_confiable`,
    eje: `S`,
    motor: `Medio`,
    label: `Sostén Confiable`,
    perfil: `Consistencia Serena y Apoyo Estructurado`,
    bienvenida: `Este mapa es una invitación a comprender cómo {nombre} elige habitar el deporte hoy. En la Nave Argo, la seguridad del viaje no solo depende de la velocidad, sino de la solidez de quienes mantienen el rumbo sin flaquear. Este informe es una "fotografía del presente" diseñada para que los adultos podamos sintonizar con su ritmo, protegiendo su bienestar y asegurando que el deporte sea su lugar de confianza. Nota de seguridad: No evaluamos talento ni realizamos diagnósticos de salud mental. Nuestro objetivo es identificar el contexto donde {nombre} fluye con mayor comodidad para evitar el estrés innecesario.`,
    wow: `En el mito de los Argonautas, {nombre} tiende a ser ese tripulante que asegura que cada cabo esté bien atado y que el ritmo del remo sea constante, sin importar si el mar está calmo o picado. Su naturaleza parece ser la de la presencia incondicional. Es probable que notes que {nombre} no busca los focos ni hace las jugadas más vistosas, pero tiende a ser quien nunca abandona su posición. Su contribución a la tripulación suele ser la fiabilidad absoluta: tiende a ser el "seguro de vida" del equipo. Su valor no reside en la sorpresa, sino en la repetición de lo que funciona. Su gran fortaleza tiende a ser la estabilidad emocional: la capacidad de mantener la calma y el orden cuando los demás empiezan a perder los nervios.`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente equilibrado. Esto se traduce en un procesamiento armónico: no tiende a ser impulsivo ni excesivamente pausado; es rítmico. Mirada cercana: Su sistema nervioso parece preferir la previsibilidad. Tiende a necesitar entender la secuencia de lo que va a pasar para poner su ritmo en marcha. Si el entrenamiento sigue una estructura clara, {nombre} probablemente rinda al máximo. Los cambios bruscos de planes o los ejercicios desordenados pueden desajustar su sincronía, no por falta de capacidad, sino porque su manera de procesar parece estar diseñada para la eficiencia técnica y el orden. Invitación de sintonía: Anticiparle lo que va a pasar. "Primero haremos esto y luego aquello". Esa pequeña estructura puede darle la seguridad necesaria para que su ritmo equilibrado funcione como un reloj.`,
    combustible: `El combustible de {nombre} tiende a ser la competencia y el deber cumplido. Es probable que se sienta motivado cuando sabe exactamente qué se espera y logra realizarlo de forma correcta. No parece buscar el aplauso masivo, sino la satisfacción interna de "haber hecho su parte". Feedback de sintonía: Tiende a valorar mucho el reconocimiento de su consistencia. En lugar de pedirle que haga algo "increíble", probar con: "Me da mucha seguridad verte en el campo porque siempre estás donde tienes que estar". Esto valida su identidad de sostén confiable.`,
    grupoEspacio: `En el equipo: Tiende a vincularse a través de la lealtad y el respeto a los acuerdos. Es probable que sea el compañero que respeta los turnos y que sigue las instrucciones del entrenador al pie de la letra. Suele evitar los conflictos y ser una figura conciliadora que aporta "normalidad" al grupo. En el espacio: Tiende a sentirse cómodo en zonas bien definidas. Le gusta tener una "parcela" de responsabilidad clara en el campo. Si sabe que "esta es su zona", probablemente la defienda con una tenacidad admirable. El desorden espacial (todos corriendo tras el balón) puede generarle una fatiga mental mayor que a otros perfiles.`,
    corazon: `Para sintonizar con {nombre}, es valioso valorar su moderación: Lo que puede parecer: A veces puede dar la impresión de que "no se arriesga" o que es demasiado conservador en su juego. Lo que probablemente es (La Intención): Un deseo profundo de preservar la seguridad del equipo. {nombre} tiende a sentir que arriesgar innecesariamente es poner en peligro el equilibrio del grupo. Su "cautela" suele ser en realidad una gestión responsable del juego. El termómetro emocional: Su frustración tiende a ser sorda. Si el ambiente se vuelve demasiado errático o si los acuerdos no se cumplen, puede empezar a mostrarse apático o desmotivado, probablemente porque el entorno ha dejado de ser "lógico" para su sistema.`,
    palabrasPuente: ["Constante", "Seguro", "Orden", "Cumplir", "Paso a paso", "Confianza"],
    palabrasRuido: ["¡Inventa algo!", "Cambia todo ahora", "Haz lo que quieras", "Olvida el plan", "No sigas la estructura"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Ofrecer una función clara y estable (ej: \"Tu tarea hoy es cuidar esta posición\").", desmotivacion: "Cambiarle de posición o de tarea cada cinco minutos sin explicación." },
      { situacion: "Acompañar su confianza", activador: "Validar su fiabilidad: \"Hiciste exactamente lo que el equipo necesitaba\".", desmotivacion: "Presionarlo para que sea \"creativo\" o \"explosivo\" de forma forzada." },
      { situacion: "Facilitar un cambio", activador: "Explicar el cambio con lógica y antelación: \"A partir de ahora, vamos a probar esto para...\".", desmotivacion: "Modificaciones abruptas de última hora en el equipo o en los acuerdos." }
    ],
    reseteo: `Cuando {nombre} comete una equivocación, tiende a sentirse desajustado porque "se salió del plan". Acompañamiento sugerido: Devolverle la estructura. No buscar una reacción emocional, buscar una técnica. Decirle: "No pasa nada, vuelve a tu posición y recuerda el paso 1 y el paso 2". Al recordarle el procedimiento, su mente tiende a volver a sentir que tiene el rumbo y su ritmo equilibrado recupera la sintonía.`,
    ecos: `En casa: Tiende a agradecer las rutinas. Saber qué se va a cenar o qué haremos el fin de semana probablemente le dé mucha paz mental. Es probable que sea alguien en quien "puedes confiar" para que cumpla con sus pequeñas responsabilidades diarias sin tener que recordárselo constantemente. En la escuela: Suele tener un perfil académico metódico. Le va muy bien en materias que tienen procesos claros y lógica. Puede preferir los exámenes donde sabe exactamente qué temas van a evaluarse antes que las pruebas de "creatividad abierta".`,
    checklist: {
      antes: `Mantener la rutina previa al partido (mismo horario, misma bolsa). La previsibilidad tiende a ser su mejor calentamiento mental.`,
      durante: `Evitar las indicaciones emocionales. Si necesitas ajustar algo, ofrecérselo como un dato técnico concreto.`,
      despues: `Valorar la consistencia. Preguntar: "¿En qué momento sentiste que tenías todo en orden?", "¿Te sentiste cómodo siguiendo el plan del equipo?".`,
    },
  },
  sosten_sereno: {
    id: `sosten_sereno`,
    eje: `S`,
    motor: `Lento`,
    label: `Sostén Sereno`,
    perfil: `Resistencia Imperturbable y Calma Estructural`,
    bienvenida: `Este mapa es una invitación a comprender cómo {nombre} elige habitar el deporte hoy. En la Nave Argo, la seguridad de la misión depende de quienes mantienen la calma cuando el resto de la tripulación entra en alerta. Este informe es una "fotografía del presente" diseñada para que los adultos podamos sintonizar con su ritmo, protegiendo su bienestar y asegurando que el deporte sea su refugio de confianza. Nota de seguridad: No evaluamos talento ni realizamos diagnósticos de salud mental. Nuestro objetivo es identificar el contexto donde {nombre} fluye con mayor comodidad para evitar el estrés innecesario y fomentar su disfrute.`,
    wow: `En el mito de los Argonautas, {nombre} tiende a ser ese tripulante que, en medio de la niebla más espesa, permanece sentado en su sitio, manteniendo el ritmo del remo con una paz que tranquiliza a todos los demás. Su naturaleza parece ser la de la estabilidad profunda. Es probable que notes que {nombre} parece "no sentir la presión". Mientras otros se aceleran o se frustran, {nombre} tiende a mantener su expresión y su ritmo. Su contribución a la tripulación suele ser la calma estructural: tiende a ser el ancla emocional del equipo. Su valor no reside en la velocidad de su ataque, sino en su capacidad para no desordenarse nunca. Su gran fortaleza tiende a ser la imperturbabilidad: ser el lugar seguro al que sus compañeros pueden mirar cuando el partido se vuelve desordenado.`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente profundo. Es fundamental que como adultos entendamos que este ritmo es su mayor recurso: su sistema nervioso parece procesar la información a una profundidad que requiere tiempo, pero que una vez activada, tiende a ser imparable. Mirada cercana: Su ritmo parece funcionar por inercia. Puede que le cueste el arranque inicial y los cambios bruscos, pero una vez que encuentra su "velocidad de crucero", tiende a mantenerla durante horas sin fatigarse mentalmente. Si parece que no reacciona ante una consigna urgente, es probable que no sea desobediencia; es que su ritmo parece estar diseñado para la resistencia, no para la explosividad. Invitación de sintonía: No intentar acelerar su proceso de "arranque". Darle los primeros minutos del partido para que su sistema se asiente. Es probable que su mejor versión aparezca cuando el cansancio empieza a afectar a los demás, pero {nombre} sigue como si nada.`,
    combustible: `El combustible de {nombre} tiende a ser la paz y el sentido de pertenencia. Es probable que se sienta vibrante cuando el ambiente es predecible, amable y estable. Le motiva saber que su presencia ayuda a que el equipo esté tranquilo. Feedback de sintonía: Tiende a valorar mucho el reconocimiento de su temple. En lugar de pedirle que sea "más intenso", probar con: "Me encanta la tranquilidad que transmites al equipo, nos ayudas a todos a pensar mejor". Esto valida su identidad de sostén sereno.`,
    grupoEspacio: `En el equipo: Tiende a vincularse a través de la lealtad silenciosa. Es probable que sea el compañero que no busca conflictos y que siempre está disponible para un amigo. Su forma de cuidar al grupo suele ser estar presente. Es probable que sea quien todos quieren tener cerca cuando las cosas van mal, porque su calma tiende a ser contagiosa. En el espacio: Suele sentirse cómodo en posiciones de retaguardia o de apoyo. Le gusta tener el panorama completo frente a sus ojos. La aglomeración de jugadores puede resultarle estresante; tiende a preferir las zonas donde puede mantener su estructura y su orden técnico sin interferencias.`,
    corazon: `Para sintonizar con {nombre}, es valioso entender qué hay detrás de su ritmo pausado: Lo que puede parecer: A veces puede dar la impresión de ser pasivo, que "le faltan ganas" o que no está conectado con la intensidad del partido. Lo que probablemente es (La Intención): Una búsqueda de preservación del equilibrio. {nombre} tiende a sentir que la sobre-excitación no le sirve. Su pausa suele ser una forma de asegurar que cada movimiento que haga sea sólido y seguro. Su aparente "falta de intensidad" probablemente sea en realidad una economía de esfuerzo estratégica. El termómetro emocional: Su frustración tiende a ser casi invisible. Si se siente excesivamente presionado para actuar rápido, puede simplemente "desconectarse". Dejará de participar no por enojo, sino por saturación sensorial.`,
    palabrasPuente: ["Tranquilo", "A tu ritmo", "Firme", "Sólido", "Confío en tu calma", "Paso a paso"],
    palabrasRuido: ["¡Explota!", "¡Reacciona ya!", "¡Más intensidad!", "No pienses tanto", "Todos ya arrancaron"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Ofrecer un rol de \"organizador de la calma\" o de último recurso de seguridad.", desmotivacion: "Someterlo a una presión constante de velocidad o resultados inmediatos." },
      { situacion: "Acompañar su confianza", activador: "Validar su imperturbabilidad: \"Qué bien mantuviste tu sitio a pesar del caos\".", desmotivacion: "Gritarle para que \"reaccione\" ante una jugada que no salió." },
      { situacion: "Facilitar un cambio", activador: "Explicar el cambio con mucha antelación y suavidad, apelando a la seguridad del equipo.", desmotivacion: "Cambios de posición \"sorpresa\" o de última hora que rompan su inercia de juego." }
    ],
    reseteo: `Cuando {nombre} comete una equivocación, su sistema no tiende a entrar en alerta, pero puede "ralentizarse" aún más. Acompañamiento sugerido: No buscar una reacción rápida. Ofrecer un gesto de calma. Un simple "Seguimos igual, confío en ti" puede ser suficiente. Su mente tiende a necesitar sentir que la equivocación no ha destruido la estabilidad del entorno para volver a poner su ritmo en marcha.`,
    ecos: `En casa: Tiende a aportar paz en casa. No suele generar conflictos, pero probablemente necesite sus tiempos de silencio. Es probable que valore mucho que no se le apure por la mañana para ir al colegio; tiende a necesitar un despertar suave para que su ritmo empiece a activarse con sintonía. En la escuela: Suele no bloquearse en los exámenes difíciles. Puede que tarde más en terminar, pero su nivel de precisión tiende a ser alto debido a su procesamiento profundo.`,
    checklist: {
      antes: `Asegurar un ambiente tranquilo. Evitar las prisas y los estímulos excesivamente ruidosos antes de salir de casa.`,
      durante: `Observar su lenguaje corporal. Si notas demasiada quietud, no pedir velocidad; invitar con un "objetivo de posición" pequeño.`,
      despues: `Valorar su resistencia. Preguntar: "¿Cómo lograste mantener la calma cuando todos corrían?", "¿Te sentiste cómodo acompañando a que el equipo estuviera tranquilo?".`,
    },
  },
  estratega_reactivo: {
    id: `estratega_reactivo`,
    eje: `C`,
    motor: `Rápido`,
    label: `Estratega Reactivo`,
    perfil: `Precisión Instantánea y Ajuste Táctico Veloz`,
    bienvenida: `Este mapa es una invitación a entender cómo {nombre} procesa el deporte hoy. En la Nave Argo, la victoria depende de quienes saben leer las estrellas y ajustar las velas al segundo. Este informe es una "fotografía del presente" diseñada para que los adultos acompañemos su naturaleza analítica, protegiendo su autoestima y asegurando que su búsqueda de la precisión sea una fuente de disfrute. Nota de seguridad: Este no es un diagnóstico clínico. Es una herramienta para identificar el contexto donde {nombre} fluye con menor fricción emocional.`,
    wow: `En el mito de los Argonautas, {nombre} tiende a ser Tifis, el timonel capaz de detectar una roca sumergida mucho antes que los demás. Su naturaleza parece ser la de la vigilancia técnica. Es probable que notes que {nombre} tiende a ser el primero en darse cuenta si un compañero está mal ubicado o si un acuerdo no se está cumpliendo. Su contribución a la tripulación suele ser la anticipación preventiva: no parece buscar el balón por impulso, sino para poner orden. Su gran fortaleza tiende a ser la agudeza perceptiva: la capacidad de procesar la táctica a una velocidad asombrosa, convirtiéndose en el "ojo del entrenador" dentro del campo.`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente ágil. En su caso, la agilidad no parece ser física (correr más), sino mental. Mirada cercana: Su mente parece funcionar como un escáner que procesa a alta velocidad. Tiende a detectar patrones, oportunidades y detalles de forma casi inmediata. Si notas que señala o da indicaciones rápidas a sus compañeros, es probable que no sea que quiera dirigir, sino que su ritmo procesa el "deber ser" del juego tan rápido que siente la necesidad de comunicarlo para que el equipo funcione mejor. Invitación de sintonía: Valorar su lectura. Un "qué buena visión tuviste ahí" puede confirmarle que su ritmo de estratega está cumpliendo su misión de dar claridad al grupo.`,
    combustible: `El combustible de {nombre} tiende a ser la precisión y el orden. Es probable que se sienta vibrante cuando el plan sale "limpio" y cuando siente que su conocimiento de los acuerdos ayuda al equipo. Le motiva la sensación de "hacer las cosas bien". Feedback de sintonía: Tiende a nutrirse del feedback lógico. En lugar de un "¡Bien hecho!", probar con: "Esa anticipación de posición que hiciste fue exacta para recuperar el balón". Esto valida su proceso de pensamiento y lo hace sentir competente.`,
    grupoEspacio: `En el equipo: Tiende a vincularse a través de la claridad y la norma. Es probable que sea el compañero que recuerda los acuerdos y el que espera que todos cumplan su parte. Su lealtad suele demostrarse asegurando que el equipo no cometa tropiezos evitables. En el espacio: Tiende a sentirse cómodo en posiciones de visión periférica. Le gusta estar donde pueda "ver el tablero" completo. La falta de consignas claras o de una lógica visible puede generarle un estrés inmediato; tiende a necesitar que el espacio tenga un sentido.`,
    corazon: `Para sintonizar con {nombre}, es valioso traducir su "exigencia": Lo que puede parecer: A veces puede dar la impresión de "saberlo todo" o de señalar demasiado a sus compañeros. Lo que probablemente es (La Intención): Un deseo de excelencia colectiva. {nombre} no señala por maldad; tiende a sufrir si el equipo pierde el orden porque siente que así son más vulnerables. Su intención suele ser proteger el éxito del grupo a través del orden. El termómetro emocional: Su frustración tiende a ser reactiva y técnica. Si el árbitro se equivoca o un compañero ignora una indicación obvia, su ritmo ágil puede saltar en forma de protesta o de un gesto de "brazos caídos".`,
    palabrasPuente: ["Precisión", "Lógica", "Analiza", "Ajuste", "Táctica", "Fíjate en..."],
    palabrasRuido: ["Da igual cómo salga", "No importan las reglas", "Tira sin pensar", "Olvida el plan", "No analices tanto"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Ofrecer una \"misión de ajuste\" (ej: \"Ayúdanos a que la defensa mantenga la línea\").", desmotivacion: "Consignas ambiguas o entrenamientos basados solo en el azar." },
      { situacion: "Acompañar su confianza", activador: "Validar su lógica: \"Tienes razón en lo que viste, ahora veamos cómo comunicarlo mejor\".", desmotivacion: "Minimizar su atención a los acuerdos y el orden." },
      { situacion: "Facilitar un cambio", activador: "Explicar la lógica técnica detrás del cambio de posición o de grupo.", desmotivacion: "Cambios de planes sin una explicación coherente que se pueda procesar." }
    ],
    reseteo: `Cuando {nombre} comete una equivocación, su ritmo ágil puede entrar en "bucle de análisis": tiende a quedarse pensando en qué falló técnicamente. Acompañamiento sugerido: Ofrecerle un nuevo dato táctico. No decirle "ya pasó". Decirle: "Analizaste bien, pero el viento cambió la trayectoria. En la próxima, ajusta un metro a la izquierda". Al darle una solución técnica, su mente tiende a "cerrar" la equivocación y volver al presente con una misión clara.`,
    ecos: `En casa: Tiende a recordarte si te saltaste un paso de una receta o si es hora de irse. Es probable que valore mucho que seas coherente con los acuerdos que estableces. En la escuela: Suele destacar en matemáticas o ciencias, donde hay una "respuesta correcta" y una lógica que seguir. Puede frustrarse si el profesor es desorganizado.`,
    checklist: {
      antes: `Repasar el "objetivo táctico" del día. Saber qué tiene que observar le da mucha seguridad.`,
      durante: `Evitar las indicaciones emocionales. Usar señales breves que apelen a su visión del campo (ej: "¡Escanea el espacio!").`,
      despues: `La conversación puede girar en torno al "ajuste técnico". Preguntar: "¿Qué fue lo más interesante que notaste hoy en la defensa del otro equipo?".`,
    },
  },
  estratega_analitico: {
    id: `estratega_analitico`,
    eje: `C`,
    motor: `Medio`,
    label: `Estratega Analítico`,
    perfil: `Procesamiento Técnico y Ejecución con Propósito`,
    bienvenida: `Este mapa es una invitación a comprender cómo {nombre} procesa y habita el deporte hoy. En la Nave Argo, el éxito de la misión no solo depende de la fuerza, sino de la exactitud de los cálculos. Este informe es una "fotografía del presente" diseñada para que los adultos podamos sintonizar con su ritmo analítico, protegiendo su autoestima y asegurando que el deporte sea un espacio de aprendizaje y disfrute. Nota de seguridad: No evaluamos talento ni realizamos diagnósticos. Nuestro objetivo es identificar el contexto donde {nombre} fluye con mayor comodidad y menor estrés.`,
    wow: `En el mito de los Argonautas, {nombre} tiende a ser ese tripulante que estudia las estrellas y los mapas antes de que la nave zarpe. Su naturaleza parece ser la de la preparación inteligente. Es probable que notes que {nombre} tiende a valorar profundamente las instrucciones. Su contribución a la tripulación suele ser la calidad en la ejecución: no parece buscar ser el más rápido ni el más ruidoso, sino el más preciso. Su valor tiende a residir en su capacidad para seguir el plan de juego con una fidelidad que aporta orden a todo el equipo. Su gran fortaleza tiende a ser la atención al detalle: la capacidad de notar esos pequeños ajustes técnicos que hacen que una jugada pase de "buena" a "perfecta".`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente equilibrado. Esto sugiere que su sistema prefiere procesar la información antes de activar la respuesta física. Mirada cercana: El deporte probablemente sea un desafío que hay que resolver correctamente. No "tira el balón" por tirar; su mente tiende a evaluar la posición, la fuerza y la dirección. Si a veces parece que se toma un instante extra, es probable que no sea duda, sino calibración. Una vez que su ritmo equilibrado procesa la instrucción y la encuentra lógica, su ejecución suele ser de las más limpias del grupo. Invitación de sintonía: Darle tiempo para "masticar" la nueva táctica. Es probable que después de ver el ejercicio un par de veces, lo realice con una precisión que sorprenda a todos.`,
    combustible: `El combustible de {nombre} tiende a ser la competencia técnica y la claridad. Es probable que se sienta vibrante cuando entiende el "por qué" de las cosas y cuando logra realizar un movimiento tal como se lo explicaron. Le motiva el dominio de la técnica. Feedback de sintonía: Tiende a nutrirse del feedback específico. En lugar de un "¡Bien hecho!", probar con: "Me fijé en cómo pusiste el pie para ese pase, fue técnicamente perfecto". Esto valida su proceso mental y su esfuerzo por la precisión.`,
    grupoEspacio: `En el equipo: Tiende a vincularse a través de la tarea compartida. Suele respetar mucho a los compañeros que se esfuerzan por jugar bien y que siguen los acuerdos. No suele buscar el liderazgo emocional, pero tiende a ser una referencia táctica para los demás: "si quieres saber cómo se hace este ejercicio, mira a {nombre}". En el espacio: Suele sentirse cómodo en entornos estructurados. Le gusta saber cuáles son los límites del campo y cuál es su posición exacta. El desorden o los entrenamientos donde "todo vale" pueden generarle una fatiga mental invisible porque su mente tiende a intentar encontrar un orden donde no lo hay.`,
    corazon: `Para sintonizar con {nombre}, es valioso entender qué hay detrás de su seriedad: Lo que puede parecer: A veces puede dar la impresión de cierta meticulosidad, seriedad o de elegir con cuidado antes de actuar. Lo que probablemente es (La Intención): Un deseo de no fallar al equipo. {nombre} tiende a tomarse el juego con responsabilidad porque siente que su precisión es su forma de ayudar. Su "meticulosidad" suele ser en realidad concentración y respeto por el deporte. El termómetro emocional: Su frustración tiende a ser interna y técnica. Si no logra realizar un movimiento como sabe que debe hacerse, puede mostrarse muy autocrítico o silencioso. Tiende a temer el desajuste técnico más que el resultado del marcador.`,
    palabrasPuente: ["Técnica", "Precisión", "Plan", "Lógica", "Ajuste", "Cómo"],
    palabrasRuido: ["Como salga", "No planifiques", "No pienses", "Improvisa sin más", "Olvida la técnica"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Proponerle retos de precisión (ej: \"Hoy el objetivo es que 4 de cada 5 pases lleguen al destino\").", desmotivacion: "Entrenamientos desordenados o basados solo en el contacto físico sin táctica." },
      { situacion: "Acompañar su confianza", activador: "Validar la calidad de su proceso: \"Vi cómo pensaste la jugada, la lógica era perfecta\".", desmotivacion: "Señalamientos genéricos o comparaciones con compañeros que juegan de forma más impulsiva." },
      { situacion: "Facilitar un cambio", activador: "Explicar detalladamente las nuevas reglas y el sentido del cambio de posición.", desmotivacion: "Cambios de planes de último segundo que rompan su mapa mental del juego." }
    ],
    reseteo: `Cuando {nombre} comete una equivocación, su sistema puede entrar en "modo análisis técnico". Acompañamiento sugerido: Usar la lógica. No pedirle que se olvide. Decirle: "El análisis fue bueno, pero la ejecución se desvió por X detalle. En la próxima, ajusta esto". Al darle un dato técnico para ajustar, su mente tiende a "cerrar" la equivocación y volver al presente con una misión de mejora clara.`,
    ecos: `En casa: Tiende a preferir saber el "por qué" de los acuerdos. Es probable que valore mucho que seas coherente y que los planes se cumplan. Le gusta tener su espacio y sus materiales ordenados a su manera. En la escuela: Suele tener un perfil académico muy cumplidor, disfrutando de las materias con procesos claros (matemáticas, gramática, música). Tiende a necesitar saber qué se espera exactamente en un examen para no sentirse ansioso.`,
    checklist: {
      antes: `Asegurar que sepa el horario y el lugar con antelación. La previsibilidad tiende a ser su mejor calentamiento mental.`,
      durante: `Evitar las indicaciones constantes. Confiar en su capacidad de auto-ajuste; probablemente ya sepa cuándo algo no salió técnicamente bien.`,
      despues: `La conversación puede girar en torno a la inteligencia del juego. Preguntar: "¿Qué fue lo que más te gustó de cómo funcionó hoy la táctica del equipo?".`,
    },
  },
  estratega_observador: {
    id: `estratega_observador`,
    eje: `C`,
    motor: `Lento`,
    label: `Estratega Observador`,
    perfil: `Análisis Profundo del Entorno y Precisión Lógica`,
    bienvenida: `Este mapa es una invitación a descubrir cómo {nombre} procesa el mundo del deporte hoy. En la Nave Argo, el éxito no solo dependía de la fuerza de los remeros, sino de la capacidad del vigía para leer las corrientes invisibles. Este informe es una "fotografía del presente" diseñada para que los adultos sintonicen con su ritmo analítico, protegiendo su autoestima y asegurando que su inteligencia sea su mayor fuente de disfrute. Nota de seguridad: No evaluamos talento ni realizamos diagnósticos. Nuestro objetivo es identificar el contexto donde {nombre} fluye con menor fricción emocional para que nunca quiera dejar de jugar.`,
    wow: `En el mito de los Argonautas, {nombre} tiende a ser aquel que permanece en silencio observando el horizonte, detectando patrones que los demás ignoran por la prisa. Su naturaleza parece ser la de la comprensión integral. Es muy probable que notes que {nombre} tiende a "mirar el partido incluso mientras juega". Su contribución a la tripulación suele ser la claridad estratégica: no parece correr tras el balón por instinto, sino que busca entender hacia dónde se dirige la jugada. Su gran fortaleza tiende a ser la visión periférica mental: la capacidad de procesar la lógica del juego desde una calma imperturbable, convirtiéndose en el ancla inteligente del equipo.`,
    motorDesc: `El perfil de {nombre} se asocia a un ritmo naturalmente profundo. En un entorno deportivo que a menudo exige inmediatez, es vital entender que su ritmo no sugiere falta de capacidad, sino riqueza de datos procesados. Mirada cercana: Su mente parece ser un procesador de alta fidelidad. Antes de mover un músculo, tiende a analizar la posición del rival, el espacio disponible y la mejor opción técnica. Su "pausa" inicial no parece ser duda, sino recopilación de información. Una vez que tiene la certeza de qué debe hacer, su ejecución suele ser asombrosamente precisa. Invitación de sintonía: Permitirle ser el observador. Si se le dan un par de minutos para mirar cómo otros hacen un ejercicio nuevo, su ritmo tiende a sintonizarse mucho mejor que si se le pide ser el primero en probar.`,
    combustible: `El combustible de {nombre} tiende a ser el entendimiento. Es probable que se sienta vibrante cuando logra descifrar cómo funciona el juego del equipo contrario o cuando una estrategia que previó se cumple. Le motiva la sensación de "tener la comprensión mental" de la situación. Feedback de sintonía: Tiende a valorar el feedback intelectual. En lugar de elogios genéricos, probar con: "Me di cuenta de cómo estabas observando al defensa antes de dar ese pase; tu lectura fue excelente". Esto valida su identidad de estratega.`,
    grupoEspacio: `En el equipo: Tiende a vincularse a través del respeto técnico y la calma. No suele ser el que más habla, pero es probable que sea a quien sus compañeros miran cuando necesitan orden. Su lealtad tiende a demostrarse manteniendo su posición y cumpliendo el plan con una disciplina impecable. En el espacio: Suele sentirse cómodo en zonas que le permitan ver el campo completo. Tiende a preferir tener espacio a su alrededor para poder pensar. El contacto físico excesivo o la aglomeración de jugadores puede generarle una fatiga mental inmediata porque le impide leer el juego con claridad.`,
    corazon: `Para sintonizar con {nombre}, es valioso traducir su silencio: Lo que puede parecer: A veces puede dar la impresión de estar distraído, tímido o que "le falta intensidad" ante la dinámica del partido. Lo que probablemente es (La Intención): Un deseo de actuar con lógica. {nombre} tiende a preferir no actuar de forma desordenada o por puro impulso. Su pausa suele ser un acto de respeto por la eficiencia. Moverse sin sentido probablemente sea peor que no moverse. El termómetro emocional: Su frustración puede presentarse como una "pausa prolongada de análisis". Si el juego se vuelve demasiado desordenado o impredecible, puede retraerse y dejar de participar porque su mente no encuentra un patrón que seguir.`,
    palabrasPuente: ["Analiza", "Fíjate", "Qué ves", "Tómate tu tiempo", "Lógica", "Precisión"],
    palabrasRuido: ["¡No pienses!", "¡Reacciona sin analizar!", "¡Corre como sea!", "Olvida el plan", "No observes, actúa"],
    guia: [
      { situacion: "Sostener su conexión", activador: "Ofrecer una \"misión de lectura\": \"Fíjate por dónde están atacando más\".", desmotivacion: "Pedirle que sea \"explosivo\" de forma constante y sin motivo táctico." },
      { situacion: "Acompañar su confianza", activador: "Validar su lectura: \"Qué buena visión tuviste del campo hoy\".", desmotivacion: "Exponer su ritmo pausado como algo que necesita cambiarse frente al grupo." },
      { situacion: "Facilitar un cambio", activador: "Explicar detalladamente la lógica y las nuevas reglas de la posición.", desmotivacion: "Cambios de planes repentinos que rompan su mapa mental del juego." }
    ],
    reseteo: `Cuando {nombre} comete una equivocación, su mente tiende a quedarse "atrapada" analizando lo ocurrido para que no vuelva a suceder. Acompañamiento sugerido: Ofrecerle un ancla técnica. No decirle "ya pasó". Decirle: "Analizaste bien el pase, solo faltó ajustar la dirección por el viento. Ahora, vuelve a observar el centro". Al darle un dato nuevo para procesar, su mente tiende a salir del bucle y volver al presente.`,
    ecos: `En casa: Tiende a necesitar entender el "por qué" de las cosas. Es probable que no acepte un "porque sí". Suele valorar mucho los juegos de estrategia, los puzzles o cualquier actividad que requiera pensar un plan. En la escuela: Puede dar la impresión de estar en su mundo, pero cuando le preguntas, tiene la respuesta más profunda. Le tienden a encantar las ciencias, el ajedrez o la lectura, donde puede sumergirse en sistemas lógicos.`,
    checklist: {
      antes: `Llegar con tiempo. {nombre} tiende a necesitar observar el campo, el clima y el ambiente para sentirse seguro antes de empezar.`,
      durante: `Utilizar un tono de voz calmado. Evitar las indicaciones constantes; confiar en su proceso interno de ajuste.`,
      despues: `Conversar sobre la táctica. Preguntar: "¿Qué fue lo más interesante que notaste hoy en el otro equipo?". Esto valida su identidad y refuerza su pasión por el aspecto inteligente del deporte.`,
    },
  },
};

export function getArchetypeByEjeMotor(eje: string, motor: string): ArchetypeData | null {
  return Object.values(ARCHETYPE_DATA).find(a => a.eje === eje && a.motor === motor) ?? null;
}

// ─── Tendencia secundaria: contenido diferenciado por sub-perfil ─────────────

export interface TendenciaContent {
  parrafo: string;
  palabrasPuenteExtra: string[];
  palabrasRuidoExtra: string[];
}

export const TENDENCIA_CONTENT: Record<string, TendenciaContent> = {
  // ── D primario ──────────────────────────────────────────────────────────────
  D_I: {
    parrafo: `Además de su impulso natural hacia la acción, {nombre} tiende a tener una sensibilidad especial hacia el clima emocional del grupo. Es probable que no solo quiera resolver la jugada, sino que los demás se entusiasmen con la solución. Esta combinación sugiere un perfil que lidera arrastrando: su energía tiende a ser contagiosa y su manera de motivar probablemente pase más por el carisma que por la autoridad. Cuando el equipo necesita un empujón anímico, es probable que {nombre} sea quien lo active de forma espontánea.`,
    palabrasPuenteExtra: ["Equipo", "Contagiar", "Juntos"],
    palabrasRuidoExtra: ["Hazlo solo", "No hables", "Silencio total"],
  },
  D_S: {
    parrafo: `Junto a su impulso de acción, {nombre} tiende a mostrar una preocupación genuina por el bienestar del grupo. Es probable que no solo quiera avanzar rápido, sino asegurarse de que nadie se quede atrás. Esta combinación sugiere un perfil protector: su manera de liderar probablemente incluya mirar hacia los costados para verificar que todos estén bien antes de acelerar. Si notas que frena su propio ritmo para esperar a un compañero, es probable que no sea indecisión sino cuidado instintivo.`,
    palabrasPuenteExtra: ["Proteger", "Cuidar", "Todos juntos"],
    palabrasRuidoExtra: ["Deja al que se atrasa", "No mires atrás", "Cada uno por su cuenta"],
  },
  D_C: {
    parrafo: `La acción de {nombre} tiende a no ser impulsiva: detrás de su rapidez probablemente haya un proceso de análisis que ocurre en fracciones de segundo. Esta combinación sugiere un perfil que actúa con precisión quirúrgica. Es probable que le interese no solo hacer las cosas rápido, sino hacerlas bien. Puede frustrarse si siente que la velocidad del juego le impide ejecutar con la calidad que visualiza internamente. Reconocer la inteligencia detrás de sus decisiones rápidas tiende a ser la forma más efectiva de nutrir su confianza.`,
    palabrasPuenteExtra: ["Precisión", "Inteligente", "Dato clave"],
    palabrasRuidoExtra: ["No pienses tanto", "Da igual cómo", "Rápido y ya"],
  },

  // ── I primario ──────────────────────────────────────────────────────────────
  I_D: {
    parrafo: `Además de su naturaleza social, {nombre} tiende a tener una chispa de protagonismo que lo impulsa a tomar la iniciativa dentro del grupo. Es probable que no solo quiera ser parte del equipo, sino sentir que su participación genera un impacto visible. Esta combinación sugiere un perfil que conecta liderando: tiende a ser ese compañero que propone el juego, organiza al grupo y se asegura de que la energía no decaiga. Si siente que su contribución pasa desapercibida, su entusiasmo puede apagarse rápidamente.`,
    palabrasPuenteExtra: ["Protagonismo", "Tu idea", "Liderar"],
    palabrasRuidoExtra: ["Quédate al margen", "Solo observa", "Tu opinión no importa"],
  },
  I_S: {
    parrafo: `La sociabilidad de {nombre} tiende a ir acompañada de una sensibilidad profunda hacia cómo se sienten los demás. Es probable que sea el primero en notar si un compañero está triste o si alguien quedó excluido de una actividad. Esta combinación sugiere un perfil de "pegamento emocional": su presencia tiende a generar cohesión porque no solo busca pasarla bien, sino que todos la pasen bien. Cuando el grupo atraviesa un momento difícil, {nombre} probablemente sea quien mantenga el tejido emocional intacto.`,
    palabrasPuenteExtra: ["Cuidar al otro", "Incluir", "Bienestar"],
    palabrasRuidoExtra: ["No te preocupes por los demás", "Enfócate solo en ti", "Eso no es asunto tuyo"],
  },
  I_C: {
    parrafo: `Detrás de la calidez social de {nombre} tiende a haber un observador atento. Es probable que mientras conecta con sus compañeros, su mente esté registrando patrones: quién está cómodo, quién necesita apoyo, qué dinámica funciona y cuál no. Esta combinación sugiere un perfil que entiende al grupo desde adentro. Su feedback tiende a ser sorprendentemente preciso porque lo construye desde la experiencia compartida, no desde la distancia. Puede ser un gran aliado del entrenador si se le da espacio para compartir lo que observa.`,
    palabrasPuenteExtra: ["Observar", "Entender", "Notar"],
    palabrasRuidoExtra: ["No analices", "Deja de mirar", "Eso no importa"],
  },

  // ── S primario ──────────────────────────────────────────────────────────────
  S_D: {
    parrafo: `Aunque {nombre} tiende a preferir la estabilidad, lleva dentro una reserva de iniciativa que puede sorprender. Es probable que en los momentos donde la situación exige acción inmediata — cuando un compañero necesita ayuda o cuando el equipo está en riesgo — su impulso dormido se active con una fuerza inesperada. Esta combinación sugiere un perfil de "reserva de emergencia": su acción tiende a ser puntual pero contundente. Después de ese estallido, es probable que vuelva a su ritmo calmo, casi como si nada hubiera pasado.`,
    palabrasPuenteExtra: ["Momento clave", "Reaccionar", "Tu fuerza"],
    palabrasRuidoExtra: ["Nunca tomes la iniciativa", "Quédate siempre atrás", "No intervengas"],
  },
  S_I: {
    parrafo: `La estabilidad de {nombre} tiende a venir acompañada de una calidez natural hacia sus compañeros. Es probable que no busque ser el centro de atención, pero que su presencia genere un efecto tranquilizador en quienes lo rodean. Esta combinación sugiere un perfil de acompañamiento silencioso: tiende a estar siempre disponible, escuchar sin juzgar y ofrecer apoyo sin que se lo pidan. Los compañeros probablemente lo busquen de forma intuitiva cuando necesitan sentirse seguros.`,
    palabrasPuenteExtra: ["Acompañar", "Escuchar", "Estar presente"],
    palabrasRuidoExtra: ["No te metas", "Eso no va contigo", "Aléjate del grupo"],
  },
  S_C: {
    parrafo: `La estabilidad de {nombre} tiende a tener una base técnica sólida. Es probable que su constancia no sea solo emocional sino también metódica: le gusta hacer las cosas de la misma manera porque ha encontrado un sistema que funciona. Esta combinación sugiere un perfil de "ancla técnica": el compañero que siempre está en su posición, que ejecuta la rutina sin errores y que da tranquilidad al grupo con su previsibilidad. Si se le pide cambiar su método, es importante explicarle el porqué técnico, no solo el porqué emocional.`,
    palabrasPuenteExtra: ["Método", "Sistema", "Paso a paso"],
    palabrasRuidoExtra: ["Cambia todo", "Improvisa", "Olvida lo que sabes"],
  },

  // ── C primario ──────────────────────────────────────────────────────────────
  C_D: {
    parrafo: `El análisis de {nombre} tiende a no quedarse en la observación: una vez que comprende la situación, es probable que actúe con una determinación que sorprenda. Esta combinación sugiere un perfil de "estratega ejecutor": no solo diseña el plan, sino que quiere implementarlo. Puede frustrarse si después de encontrar la solución óptima, el equipo no la ejecuta. Su manera de liderar tiende a ser desde la evidencia: "hagámoslo así porque los datos muestran que funciona". Validar tanto su análisis como su impulso de ejecución tiende a ser la clave para mantenerlo motivado.`,
    palabrasPuenteExtra: ["Ejecutar", "Decidir", "Implementar"],
    palabrasRuidoExtra: ["Solo piensa, no hagas", "Espera indefinidamente", "Tu plan no importa"],
  },
  C_I: {
    parrafo: `Aunque {nombre} tiende a procesar la información de forma interna, lleva dentro una necesidad de compartir sus hallazgos con el grupo. Es probable que cuando descubre algo — un patrón en el rival, una mejora técnica — quiera contárselo a sus compañeros. Esta combinación sugiere un perfil de "traductor táctico": alguien que observa con profundidad y luego traduce su análisis a un lenguaje que el equipo puede usar. Si se le da un espacio para compartir lo que ve (un mini rol de asistente táctico, por ejemplo), su motivación tiende a multiplicarse.`,
    palabrasPuenteExtra: ["Compartir", "Explicar", "Enseñar"],
    palabrasRuidoExtra: ["Guárdatelo", "Nadie quiere saber eso", "No expliques"],
  },
  C_S: {
    parrafo: `El perfil analítico de {nombre} tiende a estar acompañado de una paciencia natural que le permite observar sin prisa. Es probable que no necesite respuestas inmediatas: su sistema se siente cómodo procesando la información hasta encontrar el momento justo para actuar. Esta combinación sugiere un perfil de "observador paciente": tiende a ser el compañero que nota detalles que otros pasan por alto precisamente porque no tiene urgencia por intervenir. Su contribución al equipo suele ser silenciosa pero altamente valiosa cuando se le consulta.`,
    palabrasPuenteExtra: ["Paciencia", "Observar", "Tu momento"],
    palabrasRuidoExtra: ["Apúrate", "Responde ya", "No pierdas tiempo mirando"],
  },
};

export function getTendenciaContent(ejePrimario: string, ejeSecundario: string): TendenciaContent | null {
  return TENDENCIA_CONTENT[`${ejePrimario}_${ejeSecundario}`] ?? null;
}
