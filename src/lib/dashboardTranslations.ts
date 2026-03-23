/**
 * Dashboard i18n — All UI strings for the tenant dashboard.
 * Covers: nav, pages, actions, empty states, toasts.
 */

export type Lang = 'es' | 'en' | 'pt';

interface DashboardTexts {
    // Nav
    nav: {
        inicio: string;
        jugadores: string;
        grupos: string;
        guia: string;
        chat: string;
        miLink: string;
        ajustes: string;
        cerrarSesion: string;
    };

    // Common
    common: {
        crear: string;
        cancelar: string;
        confirmar: string;
        guardar: string;
        eliminar: string;
        buscar: string;
        volver: string;
        continuar: string;
        todas: string;
        nuevo: string;
        nueva: string;
        anos: string;
        jugador: string;
        jugadores: string;
        agregado: string;
        agregados: string;
    };

    // Home
    home: {
        bienvenida: (name: string) => string;
        creditos: string;
        creditosDisponibles: string;
        sinCreditos: string;
        comprarPack: string;
        sesionesRealizadas: string;
        sinSesiones: string;
        sinSesionesDesc: string;
        copiarLink: string;
        linkCopiado: string;
        reenviarInforme: string;
        informeEnviado: string;
        errorEnvio: string;
        pagoConfirmado: string;
        pagoCancelado: string;
        errorPago: string;
    };

    // Players
    players: {
        titulo: string;
        subtitulo: string;
        buscarPlaceholder: string;
        rePerfilar: string;
        rePerfilarAlerta: (count: number) => string;
        rePerfilarAlertaDesc: string;
        loEsencial: string;
        palabrasPuente: string;
        evitarComunicacion: string;
        brujulaSecundaria: string;
        guiaRapida: string;
        activar: string;
        aConsiderar: string;
        checklistEntrenamiento: string;
        antes: string;
        durante: string;
        despues: string;
        perfiladoEl: string;
        dias: string;
        seRecomiendaRePerfilar: string;
        meses: string;
        sinJugadores: string;
        sinResultados: string;
    };

    // Groups
    groups: {
        titulo: string;
        subtitulo: string;
        crearGrupo: string;
        nombrePlaceholder: string;
        tusGrupos: string;
        sinGrupos: string;
        sinGruposDesc: string;
        agregarJugadores: string;
        sinMiembros: string;
        sinMiembrosDesc: string;
        eliminarGrupo: string;
        confirmarEliminar: string;
        grupoCreado: string;
        grupoRenombrado: string;
        grupoEliminado: string;
        jugadorQuitado: string;
        jugadoresAgregados: (n: number) => string;
        sinJugadoresDisponibles: string;
        todosEnGrupo: string;
        noSePudoQuitar: string;
    };

    // Guide
    guide: {
        titulo: string;
        subtitulo: string;
        buscarPlaceholder: string;
        tusJugadores: string;
        seleccionaJugador: string;
        sinJugadores: string;
        verContextoGeneral: string;
        loQueVes: string;
        loQuePasa: string;
        conEstePerfil: (name: string) => string;
        paraElGrupo: string;
        comoAcompanar: string;
        siNoResponde: string;
        volverSituaciones: string;
        cambiarJugador: string;
    };

    // Chat
    chat: {
        titulo: string;
        subtitulo: string;
        nuevaConsulta: string;
        conversaciones: string;
        sinConversaciones: string;
        sinConversacionesDesc: string;
        consultaDISC: string;
        consultaDesc: string;
        escribePlaceholder: string;
        disclaimer: string;
        errorIA: string;
        errorConexion: string;
        errorGenerico: string;
    };

    // Link
    link: {
        titulo: string;
    };

    // Settings
    settings: {
        titulo: string;
    };
}

const es: DashboardTexts = {
    nav: {
        inicio: 'Inicio',
        jugadores: 'Jugadores',
        grupos: 'Grupos',
        guia: 'Guía',
        chat: 'Chat',
        miLink: 'Mi link',
        ajustes: 'Ajustes',
        cerrarSesion: 'Cerrar sesión',
    },
    common: {
        crear: 'Crear',
        cancelar: 'Cancelar',
        confirmar: 'Confirmar',
        guardar: 'Guardar',
        eliminar: 'Eliminar',
        buscar: 'Buscar',
        volver: 'Volver',
        continuar: 'Continuar',
        todas: 'Todas',
        nuevo: 'Nuevo',
        nueva: 'Nueva',
        anos: 'años',
        jugador: 'jugador',
        jugadores: 'jugadores',
        agregado: 'agregado',
        agregados: 'agregados',
    },
    home: {
        bienvenida: (name) => `Hola, ${name}`,
        creditos: 'créditos',
        creditosDisponibles: 'créditos disponibles',
        sinCreditos: 'No tienes créditos disponibles. Compra un pack para seguir invitando deportistas.',
        comprarPack: 'Comprar',
        sesionesRealizadas: 'Sesiones realizadas',
        sinSesiones: 'Todavía no hay sesiones registradas.',
        sinSesionesDesc: 'Comparte tu link para que empiecen a llegar.',
        copiarLink: 'Copiar link',
        linkCopiado: 'Link copiado',
        reenviarInforme: 'Reenviar informe',
        informeEnviado: 'Informe enviado con éxito',
        errorEnvio: 'Error al enviar el informe',
        pagoConfirmado: 'Pago confirmado. Tus créditos fueron acreditados.',
        pagoCancelado: 'Pago cancelado.',
        errorPago: 'No se pudo iniciar el pago. Intenta de nuevo.',
    },
    players: {
        titulo: 'Jugadores',
        subtitulo: 'Todos los deportistas perfilados. Toca un jugador para ver su resumen de perfil.',
        buscarPlaceholder: 'Buscar por nombre, arquetipo o deporte...',
        rePerfilar: 'Re-perfilar',
        rePerfilarAlerta: (n) => `${n} ${n === 1 ? 'jugador tiene' : 'jugadores tienen'} más de 6 meses desde su último perfil.`,
        rePerfilarAlertaDesc: 'Los perfiles de niños cambian con el tiempo. Un nuevo perfilamiento captura su evolución.',
        loEsencial: 'Lo esencial',
        palabrasPuente: 'Palabras puente',
        evitarComunicacion: 'Evitar en la comunicación',
        brujulaSecundaria: 'Brújula secundaria',
        guiaRapida: 'Guía rápida',
        activar: 'Activar',
        aConsiderar: 'A considerar',
        checklistEntrenamiento: 'Checklist de entrenamiento',
        antes: 'Antes',
        durante: 'Durante',
        despues: 'Después',
        perfiladoEl: 'Perfilado el',
        dias: 'días',
        seRecomiendaRePerfilar: 'Se recomienda re-perfilar',
        meses: 'meses',
        sinJugadores: 'Todavía no tienes jugadores perfilados.',
        sinResultados: 'No se encontraron jugadores con esos filtros.',
    },
    groups: {
        titulo: 'Grupos',
        subtitulo: 'Organiza a tus deportistas en grupos para analizar el equilibrio del equipo.',
        crearGrupo: 'Crear grupo',
        nombrePlaceholder: 'Nombre del grupo (ej: Sub-15 Femenino)',
        tusGrupos: 'Tus grupos',
        sinGrupos: 'No tienes grupos creados todavía.',
        sinGruposDesc: 'Crea tu primer grupo para empezar a organizar a tus deportistas.',
        agregarJugadores: 'Agregar jugadores',
        sinMiembros: 'Este grupo no tiene jugadores todavía.',
        sinMiembrosDesc: 'Agrega jugadores desde tus sesiones completadas.',
        eliminarGrupo: 'Eliminar grupo',
        confirmarEliminar: '¿Eliminar este grupo permanentemente?',
        grupoCreado: 'Grupo creado',
        grupoRenombrado: 'Grupo renombrado',
        grupoEliminado: 'Grupo eliminado',
        jugadorQuitado: 'Jugador quitado del grupo',
        jugadoresAgregados: (n) => `${n} ${n === 1 ? 'jugador agregado' : 'jugadores agregados'}`,
        sinJugadoresDisponibles: 'No hay jugadores disponibles para agregar.',
        todosEnGrupo: 'Todos tus jugadores ya están en este grupo.',
        noSePudoQuitar: 'No se pudo quitar al jugador',
    },
    guide: {
        titulo: 'Guía situacional',
        subtitulo: 'Selecciona una situación que estés viviendo con un jugador o con el grupo. Te damos herramientas concretas según su perfil.',
        buscarPlaceholder: 'Buscar situación...',
        tusJugadores: 'Tus jugadores',
        seleccionaJugador: 'Selecciona el jugador involucrado para ver recomendaciones personalizadas según su perfil.',
        sinJugadores: 'Todavía no tienes jugadores registrados.',
        verContextoGeneral: 'Ver contexto general (sin seleccionar jugador)',
        loQueVes: 'Lo que ves',
        loQuePasa: 'Lo que está pasando',
        conEstePerfil: (name) => `Con este perfil (${name})`,
        paraElGrupo: 'Para el grupo',
        comoAcompanar: 'Cómo acompañar',
        siNoResponde: 'Si no responde al primer intento',
        volverSituaciones: 'Volver a situaciones',
        cambiarJugador: 'Cambiar jugador',
    },
    chat: {
        titulo: 'Chat DISC',
        subtitulo: 'Tu asistente personal de perfilamiento DISC. Pregunta sobre tus jugadores, situaciones o dinámica de equipo.',
        nuevaConsulta: 'Nueva consulta',
        conversaciones: 'Conversaciones',
        sinConversaciones: 'Todavía no tienes conversaciones.',
        sinConversacionesDesc: 'Inicia una nueva consulta sobre tus jugadores.',
        consultaDISC: 'Consulta sobre DISC',
        consultaDesc: 'Pregunta lo que necesites sobre tus jugadores, el equipo, o situaciones de entrenamiento.',
        escribePlaceholder: 'Escribe tu consulta...',
        disclaimer: 'Argo Engine puede cometer errores. Las respuestas son orientativas y están basadas en el modelo DISC. No reemplazan el criterio profesional.',
        errorIA: 'Hubo un problema con el servicio de IA. Intenta de nuevo en unos segundos.',
        errorConexion: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
        errorGenerico: 'Ocurrió un error. Intenta de nuevo.',
    },
    link: { titulo: 'Mi link' },
    settings: { titulo: 'Ajustes' },
};

const en: DashboardTexts = {
    nav: {
        inicio: 'Home',
        jugadores: 'Players',
        grupos: 'Groups',
        guia: 'Guide',
        chat: 'Chat',
        miLink: 'My link',
        ajustes: 'Settings',
        cerrarSesion: 'Sign out',
    },
    common: {
        crear: 'Create',
        cancelar: 'Cancel',
        confirmar: 'Confirm',
        guardar: 'Save',
        eliminar: 'Delete',
        buscar: 'Search',
        volver: 'Back',
        continuar: 'Continue',
        todas: 'All',
        nuevo: 'New',
        nueva: 'New',
        anos: 'years',
        jugador: 'player',
        jugadores: 'players',
        agregado: 'added',
        agregados: 'added',
    },
    home: {
        bienvenida: (name) => `Hi, ${name}`,
        creditos: 'credits',
        creditosDisponibles: 'credits available',
        sinCreditos: 'No credits available. Purchase a pack to keep inviting athletes.',
        comprarPack: 'Buy',
        sesionesRealizadas: 'Completed sessions',
        sinSesiones: 'No sessions recorded yet.',
        sinSesionesDesc: 'Share your link to start receiving athletes.',
        copiarLink: 'Copy link',
        linkCopiado: 'Link copied',
        reenviarInforme: 'Resend report',
        informeEnviado: 'Report sent successfully',
        errorEnvio: 'Failed to send the report',
        pagoConfirmado: 'Payment confirmed. Your credits have been added.',
        pagoCancelado: 'Payment cancelled.',
        errorPago: 'Could not start payment. Try again.',
    },
    players: {
        titulo: 'Players',
        subtitulo: 'All profiled athletes. Tap a player to see their profile summary.',
        buscarPlaceholder: 'Search by name, archetype or sport...',
        rePerfilar: 'Re-profile',
        rePerfilarAlerta: (n) => `${n} ${n === 1 ? 'player has' : 'players have'} been profiled more than 6 months ago.`,
        rePerfilarAlertaDesc: 'Children\'s profiles change over time. A new profiling captures their evolution.',
        loEsencial: 'Key insight',
        palabrasPuente: 'Bridge words',
        evitarComunicacion: 'Avoid in communication',
        brujulaSecundaria: 'Secondary compass',
        guiaRapida: 'Quick guide',
        activar: 'Activate',
        aConsiderar: 'To consider',
        checklistEntrenamiento: 'Training checklist',
        antes: 'Before',
        durante: 'During',
        despues: 'After',
        perfiladoEl: 'Profiled on',
        dias: 'days',
        seRecomiendaRePerfilar: 'Re-profiling recommended',
        meses: 'months',
        sinJugadores: 'No profiled players yet.',
        sinResultados: 'No players found with those filters.',
    },
    groups: {
        titulo: 'Groups',
        subtitulo: 'Organize your athletes into groups to analyze team balance.',
        crearGrupo: 'Create group',
        nombrePlaceholder: 'Group name (e.g.: U-15 Girls)',
        tusGrupos: 'Your groups',
        sinGrupos: 'No groups created yet.',
        sinGruposDesc: 'Create your first group to start organizing your athletes.',
        agregarJugadores: 'Add players',
        sinMiembros: 'This group has no players yet.',
        sinMiembrosDesc: 'Add players from your completed sessions.',
        eliminarGrupo: 'Delete group',
        confirmarEliminar: 'Delete this group permanently?',
        grupoCreado: 'Group created',
        grupoRenombrado: 'Group renamed',
        grupoEliminado: 'Group deleted',
        jugadorQuitado: 'Player removed from group',
        jugadoresAgregados: (n) => `${n} ${n === 1 ? 'player added' : 'players added'}`,
        sinJugadoresDisponibles: 'No players available to add.',
        todosEnGrupo: 'All your players are already in this group.',
        noSePudoQuitar: 'Could not remove the player',
    },
    guide: {
        titulo: 'Situational guide',
        subtitulo: 'Select a situation you\'re experiencing with a player or the team. We\'ll give you concrete tools based on their profile.',
        buscarPlaceholder: 'Search situation...',
        tusJugadores: 'Your players',
        seleccionaJugador: 'Select the player involved to see personalized recommendations based on their profile.',
        sinJugadores: 'No registered players yet.',
        verContextoGeneral: 'View general context (without selecting a player)',
        loQueVes: 'What you see',
        loQuePasa: 'What\'s happening',
        conEstePerfil: (name) => `With this profile (${name})`,
        paraElGrupo: 'For the group',
        comoAcompanar: 'How to accompany',
        siNoResponde: 'If they don\'t respond to the first attempt',
        volverSituaciones: 'Back to situations',
        cambiarJugador: 'Change player',
    },
    chat: {
        titulo: 'DISC Chat',
        subtitulo: 'Your personal DISC profiling assistant. Ask about your players, situations or team dynamics.',
        nuevaConsulta: 'New conversation',
        conversaciones: 'Conversations',
        sinConversaciones: 'No conversations yet.',
        sinConversacionesDesc: 'Start a new conversation about your players.',
        consultaDISC: 'DISC consultation',
        consultaDesc: 'Ask anything about your players, the team, or training situations.',
        escribePlaceholder: 'Write your question...',
        disclaimer: 'Argo Engine may make mistakes. Responses are guidance-based on the DISC model. They do not replace professional judgment.',
        errorIA: 'There was a problem with the AI service. Try again in a few seconds.',
        errorConexion: 'Connection error. Check your internet and try again.',
        errorGenerico: 'An error occurred. Try again.',
    },
    link: { titulo: 'My link' },
    settings: { titulo: 'Settings' },
};

const pt: DashboardTexts = {
    nav: {
        inicio: 'Início',
        jugadores: 'Jogadores',
        grupos: 'Grupos',
        guia: 'Guia',
        chat: 'Chat',
        miLink: 'Meu link',
        ajustes: 'Configurações',
        cerrarSesion: 'Sair',
    },
    common: {
        crear: 'Criar',
        cancelar: 'Cancelar',
        confirmar: 'Confirmar',
        guardar: 'Salvar',
        eliminar: 'Excluir',
        buscar: 'Buscar',
        volver: 'Voltar',
        continuar: 'Continuar',
        todas: 'Todas',
        nuevo: 'Novo',
        nueva: 'Nova',
        anos: 'anos',
        jugador: 'jogador',
        jugadores: 'jogadores',
        agregado: 'adicionado',
        agregados: 'adicionados',
    },
    home: {
        bienvenida: (name) => `Olá, ${name}`,
        creditos: 'créditos',
        creditosDisponibles: 'créditos disponíveis',
        sinCreditos: 'Sem créditos disponíveis. Compre um pacote para continuar convidando atletas.',
        comprarPack: 'Comprar',
        sesionesRealizadas: 'Sessões realizadas',
        sinSesiones: 'Ainda não há sessões registradas.',
        sinSesionesDesc: 'Compartilhe seu link para começar a receber atletas.',
        copiarLink: 'Copiar link',
        linkCopiado: 'Link copiado',
        reenviarInforme: 'Reenviar relatório',
        informeEnviado: 'Relatório enviado com sucesso',
        errorEnvio: 'Erro ao enviar o relatório',
        pagoConfirmado: 'Pagamento confirmado. Seus créditos foram adicionados.',
        pagoCancelado: 'Pagamento cancelado.',
        errorPago: 'Não foi possível iniciar o pagamento. Tente novamente.',
    },
    players: {
        titulo: 'Jogadores',
        subtitulo: 'Todos os atletas perfilados. Toque em um jogador para ver o resumo do perfil.',
        buscarPlaceholder: 'Buscar por nome, arquétipo ou esporte...',
        rePerfilar: 'Re-perfilar',
        rePerfilarAlerta: (n) => `${n} ${n === 1 ? 'jogador tem' : 'jogadores têm'} mais de 6 meses desde o último perfil.`,
        rePerfilarAlertaDesc: 'Os perfis das crianças mudam com o tempo. Um novo perfilamento captura sua evolução.',
        loEsencial: 'O essencial',
        palabrasPuente: 'Palavras ponte',
        evitarComunicacion: 'Evitar na comunicação',
        brujulaSecundaria: 'Bússola secundária',
        guiaRapida: 'Guia rápido',
        activar: 'Ativar',
        aConsiderar: 'A considerar',
        checklistEntrenamiento: 'Checklist de treino',
        antes: 'Antes',
        durante: 'Durante',
        despues: 'Depois',
        perfiladoEl: 'Perfilado em',
        dias: 'dias',
        seRecomiendaRePerfilar: 'Recomenda-se re-perfilar',
        meses: 'meses',
        sinJugadores: 'Ainda não há jogadores perfilados.',
        sinResultados: 'Nenhum jogador encontrado com esses filtros.',
    },
    groups: {
        titulo: 'Grupos',
        subtitulo: 'Organize seus atletas em grupos para analisar o equilíbrio da equipe.',
        crearGrupo: 'Criar grupo',
        nombrePlaceholder: 'Nome do grupo (ex: Sub-15 Feminino)',
        tusGrupos: 'Seus grupos',
        sinGrupos: 'Nenhum grupo criado ainda.',
        sinGruposDesc: 'Crie seu primeiro grupo para começar a organizar seus atletas.',
        agregarJugadores: 'Adicionar jogadores',
        sinMiembros: 'Este grupo ainda não tem jogadores.',
        sinMiembrosDesc: 'Adicione jogadores das suas sessões concluídas.',
        eliminarGrupo: 'Excluir grupo',
        confirmarEliminar: 'Excluir este grupo permanentemente?',
        grupoCreado: 'Grupo criado',
        grupoRenombrado: 'Grupo renomeado',
        grupoEliminado: 'Grupo excluído',
        jugadorQuitado: 'Jogador removido do grupo',
        jugadoresAgregados: (n) => `${n} ${n === 1 ? 'jogador adicionado' : 'jogadores adicionados'}`,
        sinJugadoresDisponibles: 'Nenhum jogador disponível para adicionar.',
        todosEnGrupo: 'Todos os seus jogadores já estão neste grupo.',
        noSePudoQuitar: 'Não foi possível remover o jogador',
    },
    guide: {
        titulo: 'Guia situacional',
        subtitulo: 'Selecione uma situação que você está vivenciando com um jogador ou com o grupo. Damos ferramentas concretas de acordo com o perfil.',
        buscarPlaceholder: 'Buscar situação...',
        tusJugadores: 'Seus jogadores',
        seleccionaJugador: 'Selecione o jogador envolvido para ver recomendações personalizadas de acordo com seu perfil.',
        sinJugadores: 'Ainda não há jogadores registrados.',
        verContextoGeneral: 'Ver contexto geral (sem selecionar jogador)',
        loQueVes: 'O que você vê',
        loQuePasa: 'O que está acontecendo',
        conEstePerfil: (name) => `Com este perfil (${name})`,
        paraElGrupo: 'Para o grupo',
        comoAcompanar: 'Como acompanhar',
        siNoResponde: 'Se não responder à primeira tentativa',
        volverSituaciones: 'Voltar às situações',
        cambiarJugador: 'Mudar jogador',
    },
    chat: {
        titulo: 'Chat DISC',
        subtitulo: 'Seu assistente pessoal de perfilamento DISC. Pergunte sobre seus jogadores, situações ou dinâmica de equipe.',
        nuevaConsulta: 'Nova conversa',
        conversaciones: 'Conversas',
        sinConversaciones: 'Ainda não há conversas.',
        sinConversacionesDesc: 'Inicie uma nova conversa sobre seus jogadores.',
        consultaDISC: 'Consulta DISC',
        consultaDesc: 'Pergunte o que precisar sobre seus jogadores, a equipe ou situações de treino.',
        escribePlaceholder: 'Escreva sua pergunta...',
        disclaimer: 'Argo Engine pode cometer erros. As respostas são orientativas e baseadas no modelo DISC. Não substituem o critério profissional.',
        errorIA: 'Houve um problema com o serviço de IA. Tente novamente em alguns segundos.',
        errorConexion: 'Erro de conexão. Verifique sua internet e tente novamente.',
        errorGenerico: 'Ocorreu um erro. Tente novamente.',
    },
    link: { titulo: 'Meu link' },
    settings: { titulo: 'Configurações' },
};

const ALL: Record<Lang, DashboardTexts> = { es, en, pt };

export function getDashboardT(lang: string): DashboardTexts {
    return ALL[lang as Lang] ?? ALL.es;
}
