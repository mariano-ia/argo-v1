/**
 * Portuguese Help Center content. Mirrors helpContent.ts (Spanish master).
 * Keep ids, category, audience and link `to` routes identical to the master.
 * Archetype naming (single source of truth, docs/archetype-naming.md):
 *   eixos = Impulsionador / Conector / Sustentador / Estrategista
 *   motores = Dinâmico / Rítmico / Sereno (C + lento = Observador)
 */

import type { HelpArticle } from './helpContent';

export const HELP_ARTICLES_PT: HelpArticle[] = [
    /* ═══ Primeiros passos ═══ */
    {
        id: 'como-funciona',
        category: 'getting-started',
        title: 'Como funciona o Argo em poucas palavras?',
        body: 'O Argo transforma uma aventura de cerca de 10 minutos em um perfil comportamental da criança, pensado para o adulto que a acompanha.\n\nO caminho é simples: você cria um plantel, compartilha o link dele, a criança joga a odisseia e, ao terminar, o perfil aparece no seu painel e um relatório é enviado por email ao adulto responsável.',
    },
    {
        id: 'configura-institucion',
        category: 'getting-started',
        title: 'Como configuro os dados da minha instituição?',
        body: 'Em Ajustes você define o nome, o esporte, o logo e o país da sua instituição. Esses dados personalizam o relatório e a experiência da criança.',
        steps: [
            'Abra Ajustes no menu lateral.',
            'Preencha o nome, o esporte principal, o país e a cidade.',
            'Se quiser, envie o logo da sua instituição.',
            'Salve com o botão no pé do cartão. Todas as alterações são salvas juntas.',
        ],
        audience: 'admin',
        links: [{ label: 'Ir para Ajustes', to: '/dashboard/settings' }],
    },
    {
        id: 'deporte-bloqueado',
        category: 'getting-started',
        title: 'Por que não consigo mudar o esporte?',
        body: 'O esporte fica fixo assim que a primeira criança completa a aventura. É de propósito: as perguntas da odisseia e os perfis já gerados estão ligados a esse esporte, e mudá-lo depois deixaria esses relatórios sem sentido.\n\nSe você precisar de outro esporte, escreva para nós e resolvemos com você.',
        audience: 'admin',
    },
    {
        id: 'primer-plantel',
        category: 'getting-started',
        title: 'Como crio o meu primeiro plantel?',
        body: 'O plantel é a unidade que organiza os seus jogadores e é a dona do link de jogo. Você precisa de pelo menos um para começar.',
        steps: [
            'Abra Plantéis no menu.',
            'Toque em Criar e dê um nome (por exemplo, Sub 12 Futebol).',
            'Pronto: o plantel é criado e o link dele é gerado sozinho.',
            'Atribua um treinador tocando no chip dele no plantel (ou no chip "Eu" para se atribuir) e confirme, ou compartilhe você mesmo o link.',
        ],
        audience: 'admin',
        links: [{ label: 'Ir para Plantéis', to: '/dashboard/planteles' }],
    },
    {
        id: 'compartir-link',
        category: 'getting-started',
        title: 'Como compartilho o link de jogo?',
        body: 'Cada plantel tem o seu próprio link. Você o encontra na Home, ao lado do nome do plantel. Copie e compartilhe com as famílias pelo meio que preferir (mensagem, email, grupo).\n\nQuando uma criança termina a aventura, o perfil é associado ao seu painel sozinho. Você não precisa registrar nada à mão.',
        tip: 'Cada link pertence ao plantel, não a uma pessoa. Vários treinadores podem compartilhar o mesmo link.',
        links: [{ label: 'Ir para a Home', to: '/dashboard' }],
    },
    {
        id: 'que-vive-deportista',
        category: 'getting-started',
        title: 'O que a criança vive ao entrar no link?',
        body: 'A criança joga uma aventura de cerca de 10 minutos com tema náutico. Responde perguntas e mini jogos sem saber que está revelando a sua forma de decidir e de se relacionar.\n\nNão há respostas certas nem erradas, e nunca parece um exame. No final, o relatório vai para o adulto responsável, não para a criança.',
    },

    {
        id: 'usar-selector',
        category: 'getting-started',
        title: 'Como troco de instituição ou de plantel? (o seletor)',
        body: 'Se você pertence a mais de uma instituição, ou dirige algum plantel, no canto superior esquerdo do menu vai ver um seletor (sua instituição com uma seta ⇅).\n\nDali você escolhe o contexto em que está: a instituição completa (Administração) ou um plantel específico. O que escolher reconfigura tudo: os jogadores, as estatísticas, o Preditor, a química e até o Argo Coach se concentram nesse contexto.',
        tip: 'Se você tem apenas uma instituição e nenhum plantel atribuído, o seletor não aparece (não há nada entre o que trocar).',
    },
    {
        id: 'varias-instituciones',
        category: 'getting-started',
        title: 'Posso pertencer a várias instituições?',
        body: 'Sim. Uma mesma conta pode fazer parte de várias instituições (por exemplo, se você treina em dois clubes). Quando um administrador adiciona você pelo email, essa instituição aparece no seu seletor, no canto superior esquerdo.\n\nVocê não precisa de outra conta nem de outro email: entra com a sua e troca de uma para outra pelo seletor.',
    },

    /* ═══ Plantéis e treinadores ═══ */
    {
        id: 'que-es-plantel',
        category: 'planteles',
        title: 'O que é um plantel e por que ele tem o próprio link?',
        body: 'Um plantel é a unidade estrutural da sua instituição (por exemplo, uma categoria ou um time). Ele é o dono do link de jogo: cada criança que entra por esse link fica atribuída a esse plantel.\n\nPor isso o link vive no plantel e não em uma pessoa. Mesmo que os treinadores mudem, o plantel e os seus jogadores continuam no lugar.',
        audience: 'admin',
    },
    {
        id: 'crear-renombrar-plantel',
        category: 'planteles',
        title: 'Como crio, renomeio ou excluo um plantel?',
        body: 'Você pode ter quantos plantéis precisar (por exemplo, um por categoria).',
        steps: [
            'Abra Plantéis.',
            'Para criar, toque em Criar e digite o nome.',
            'Para renomear, selecione o plantel e toque no lápis ao lado do nome.',
            'Para excluir, use o menu do plantel e confirme.',
        ],
        audience: 'admin',
        links: [{ label: 'Ir para Plantéis', to: '/dashboard/planteles' }],
    },
    {
        id: 'invitar-entrenadores',
        category: 'planteles',
        title: 'Como convido treinadores e os atribuo a um plantel?',
        body: 'São dois passos separados. Primeiro você cria o treinador em Usuários (com email e nível). Depois o atribui a um plantel na seção Plantéis, tocando no chip dele. Cada um verá apenas os jogadores dos seus plantéis.',
        steps: [
            'Abra Usuários.',
            'Toque em Convidar, digite o email do treinador e escolha o nível Treinador.',
            'Envie o convite. O treinador recebe um email para criar a senha.',
            'Vá em Plantéis, abra o plantel e toque no chip do treinador para atribuí-lo. Confirme a mudança.',
        ],
        audience: 'admin',
        links: [{ label: 'Ir para Usuários', to: '/dashboard/users' }, { label: 'Ir para Plantéis', to: '/dashboard/planteles' }],
    },
    {
        id: 'admin-vs-entrenador',
        category: 'planteles',
        title: 'Qual é a diferença entre um administrador e um treinador?',
        body: 'O administrador vê toda a instituição: cria plantéis, convida treinadores e vê todos os jogadores.\n\nO treinador vê apenas os jogadores dos plantéis que lhe atribuíram. Pode compartilhar o seu link, ver os perfis, criar grupos de química e usar o Argo Coach com os seus jogadores.',
    },
    {
        id: 'coach-no-ve-planteles',
        category: 'planteles',
        title: 'Sou treinador e não vejo a seção Plantéis. Está certo?',
        body: 'Sim, é normal. A gestão de plantéis (criá-los e atribuir treinadores) é feita pelo administrador da instituição.\n\nVocê trabalha com os jogadores dos plantéis que lhe atribuíram: vê eles em Jogadores e o link aparece na Home. Se faltar acesso a um plantel, peça ao administrador.',
        audience: 'coach',
    },

    {
        id: 'admin-tambien-entrena',
        category: 'planteles',
        title: 'Sou administrador e também dirijo um plantel. Como faço?',
        body: 'Você pode ser administrador da instituição e, além disso, treinador de um ou mais plantéis. Você não perde nada: apenas soma o plantel à sua conta.',
        steps: [
            'Abra Plantéis e selecione o plantel que você dirige.',
            'Na seção Treinadores, toque no chip "Eu" para se atribuir (toque de novo para se remover) e confirme.',
            'Pronto: esse plantel aparece no seu seletor. Ao escolhê-lo você entra na visão de treinador dele (o link, os jogadores, o chat).',
            'Para voltar à visão completa, escolha "Administração" no seletor.',
        ],
        audience: 'admin',
        links: [{ label: 'Ir para Plantéis', to: '/dashboard/planteles' }],
    },
    {
        id: 'cambiar-nivel-miembro',
        category: 'planteles',
        title: 'Como mudo o nível de um membro (Administrador ou Treinador)?',
        body: 'Em Usuários, cada membro tem um seletor de nível. Administrador vê e gerencia toda a instituição; Treinador vê apenas os seus plantéis.',
        steps: [
            'Abra Usuários.',
            'Na linha do membro, troque o seletor entre Administrador e Treinador.',
            'A mudança é imediata.',
        ],
        tip: 'O proprietário da conta não pode ter o nível alterado (a linha dele diz "Proprietário"). Assim a instituição sempre mantém um dono.',
        audience: 'admin',
        links: [{ label: 'Ir para Usuários', to: '/dashboard/users' }],
    },

    /* ═══ Jogadores e perfis ═══ */
    {
        id: 'donde-aparecen-jugadores',
        category: 'players',
        title: 'Onde vejo as crianças que já jogaram?',
        body: 'Na seção Jogadores. Cada criança que completa a aventura aparece ali com o seu perfil, idade, esporte e data.\n\nToque em uma linha para abrir o perfil completo. Se uma criança começou mas não terminou, ela aparece como pendente até concluir.',
        links: [{ label: 'Ir para Jogadores', to: '/dashboard/players' }],
    },
    {
        id: 'entender-arquetipos',
        category: 'players',
        title: 'O que significam os 12 perfis?',
        body: 'Cada perfil combina um eixo (como a criança decide e se relaciona: Impulsionador, Conector, Sustentador ou Estrategista) com um motor (o seu ritmo: Dinâmico, Rítmico ou Sereno). Daí saem os 12 perfis, como Impulsionador Dinâmico ou Estrategista Sereno.\n\nNenhum perfil é melhor que outro. Dinâmico não é melhor que Sereno: apenas descrevem formas diferentes de se mover no mundo. O perfil é uma foto do presente, não um rótulo para sempre.',
    },
    {
        id: 'brujula-palabras',
        category: 'players',
        title: 'O que são a bússola secundária e as palavras ponte?',
        body: 'A bússola secundária é o segundo eixo mais forte da criança: dá nuance ao perfil principal.\n\nAs palavras ponte são frases que conectam com ela e a motivam. As palavras a evitar são as que geram ruído ou resistência. Elas dão a você uma forma concreta de falar com cada criança.',
        trialNote: 'Estas seções são desbloqueadas ao passar para um plano pago.',
    },
    {
        id: 'descargar-reenviar-reporte',
        category: 'players',
        title: 'Como baixo o relatório ou o reenvio por email?',
        body: 'Abra o perfil da criança em Jogadores. No pé você encontra as opções para baixar o relatório em PDF ou reenviá-lo por email ao adulto responsável. O relatório é gerado no idioma em que a criança jogou.',
        steps: [
            'Abra Jogadores e toque na linha da criança.',
            'No pé do perfil, use Baixar PDF ou Reenviar relatório.',
            'Para reenviar, confirme o email do adulto.',
        ],
        links: [{ label: 'Ir para Jogadores', to: '/dashboard/players' }],
    },
    {
        id: 'reperfilar',
        category: 'players',
        title: 'Como e quando refaço o perfil de uma criança?',
        body: 'As crianças crescem e mudam, por isso o perfil pode ser atualizado a cada 6 meses. Quando esse tempo passa, o jogador mostra um aviso de que convém refazer o perfil.\n\nNão há um botão especial: você compartilha de novo o mesmo link e a criança joga outra vez. O perfil é atualizado no lugar, sem ocupar uma nova vaga.',
        links: [{ label: 'Ir para Jogadores', to: '/dashboard/players' }],
    },
    {
        id: 'jugador-pendiente',
        category: 'players',
        title: 'Uma criança aparece como pendente. O que aconteceu?',
        body: 'Pendente significa que ela começou a aventura mas não chegou ao final. A vaga fica reservada, mas ainda não há perfil para ver.\n\nPara concluir, compartilhe o link com a família de novo: a criança pode retomar e terminar.',
    },
    {
        id: 'archivar-reactivar',
        category: 'players',
        title: 'Como arquivo ou reativo um jogador?',
        body: 'Arquivar um jogador o tira da lista ativa e libera uma vaga na sua equipe, sem perder o perfil. Você pode reativá-lo quando quiser, se tiver vaga disponível.',
        steps: [
            'Abra Jogadores e abra a linha da criança.',
            'Use Arquivar para tirá-la da lista ativa.',
            'Para recuperá-la, abra a seção de arquivados no pé e toque em Reativar.',
        ],
        links: [{ label: 'Ir para Jogadores', to: '/dashboard/players' }],
    },
    {
        id: 'perfil-no-coincide',
        category: 'players',
        title: 'O perfil não combina com o que vejo nos treinos.',
        body: 'O perfil é uma foto de como a criança se mostrou durante a aventura, em um momento específico. É uma ferramenta de leitura, não uma verdade absoluta.\n\nO mais valioso é cruzar esse dado com a sua observação do dia a dia. Se já passaram vários meses, vale a pena refazer o perfil: as crianças mudam.',
    },

    /* ═══ Química de grupos ═══ */
    {
        id: 'que-es-grupo',
        category: 'grupos',
        title: 'O que é a química de grupos e como ela difere de um plantel?',
        body: 'Um plantel é estrutural: organiza os seus jogadores e é dono do link. Um grupo de química é uma ferramenta de análise: você monta um subconjunto dos seus jogadores para ver como funcionam juntos.\n\nCada grupo pertence a um plantel (Sub-12 e Sub-14 são categorias diferentes, não se comparam). Para ver ou criar grupos, primeiro escolha um plantel no seletor. O grupo não tem link nem recebe jogadores novos: você o cria para responder perguntas como, por exemplo, como a sua linha defensiva se complementa.',
    },
    {
        id: 'crear-grupo',
        category: 'grupos',
        title: 'Como crio um grupo e adiciono jogadores?',
        body: 'Você pode criar quantos grupos quiser para analisar diferentes combinações dos seus jogadores.',
        steps: [
            'Abra Química de grupos.',
            'Toque em Criar e dê um nome ao grupo.',
            'Selecione-o e adicione os jogadores que quiser analisar.',
            'A análise se atualiza sozinha à medida que você adiciona jogadores.',
        ],
        links: [{ label: 'Ir para Química de grupos', to: '/dashboard/grupos' }],
    },
    {
        id: 'leer-analisis-grupo',
        category: 'grupos',
        title: 'Como leio a análise de um grupo?',
        body: 'A análise mostra o tipo de grupo (por exemplo, competitivo, social, coeso, metódico ou equilibrado), o seu nível de diversidade e as afinidades e possíveis atritos entre perfis.\n\nNão se trata de buscar o grupo perfeito, mas de entender a sua dinâmica para acompanhá-lo melhor.',
        trialNote: 'O detalhe de afinidades e ferramentas é desbloqueado ao passar para um plano pago.',
    },

    /* ═══ Argo Coach ═══ */
    {
        id: 'que-es-coach',
        category: 'coach',
        title: 'O que é o Argo Coach e o que posso perguntar a ele?',
        body: 'O Argo Coach é um assistente que responde sobre os seus jogadores e sobre como acompanhá-los. Ele conhece os perfis da sua equipe, então você pode perguntar coisas concretas.\n\nPor exemplo: como motivar uma criança que chega desanimada, como equilibrar um grupo com perfis muito diferentes, ou o que cuidar com um jogador específico antes de uma partida.',
        links: [{ label: 'Ir para o Argo Coach', to: '/dashboard/chat' }],
    },
    {
        id: 'coach-datos-limites',
        category: 'coach',
        title: 'Quais dados o Argo Coach vê e quais são os limites dele?',
        body: 'O Argo Coach vê os perfis dos jogadores aos quais você tem acesso, para dar respostas personalizadas.\n\nÉ uma ajuda, não um diagnóstico. Ele pode errar e não substitui o seu olhar nem o de um profissional. Use-o como um ponto de partida para pensar, não como a última palavra.',
    },

    /* ═══ Preditor Comportamental ═══ */
    {
        id: 'usar-predictor',
        category: 'guide',
        title: 'Como uso o Preditor Comportamental antes de um treino?',
        body: 'O Preditor reúne situações comuns do treino (uma criança que não quer começar, uma que se frustra, etc.). Você escolhe a que interessa e ele mostra o que pode estar acontecendo e como acompanhar conforme o perfil.',
        steps: [
            'Abra Preditor Comportamental.',
            'Busque ou filtre por categoria a situação que interessa.',
            'Leia para entender o que pode estar acontecendo.',
            'Se quiser, selecione um jogador para ver a orientação adaptada ao perfil dele.',
        ],
        links: [{ label: 'Ir para o Preditor Comportamental', to: '/dashboard/guide' }],
    },
    {
        id: 'personalizar-predictor',
        category: 'guide',
        title: 'Como personalizo a orientação para um jogador?',
        body: 'Dentro de uma situação, você pode escolher um dos seus jogadores. A orientação se adapta ao perfil dele e dá passos concretos para acompanhá-lo naquele caso.',
        trialNote: 'A personalização por jogador é desbloqueada ao passar para um plano pago.',
    },

    /* ═══ Sua equipe e conta ═══ */
    {
        id: 'equipo-x-y',
        category: 'account',
        title: 'O que significa Equipe X/Y?',
        body: 'É a quantidade de jogadores ativos (X) sobre o máximo do seu plano (Y). Cada criança perfilada ou pendente ocupa uma vaga.\n\nSe você chegar ao máximo, pode arquivar jogadores para liberar vaga. Arquivar não apaga o perfil: ele é guardado e você pode reativá-lo depois.',
        audience: 'admin',
        links: [{ label: 'Ir para Jogadores', to: '/dashboard/players' }],
    },
    {
        id: 'cupo-lleno',
        category: 'account',
        title: 'Meu link diz que a lotação está cheia. O que faço?',
        body: 'Significa que a sua equipe chegou ao máximo de jogadores do seu plano. Enquanto estiver cheia, não é possível adicionar jogadores novos pelo link.',
        steps: [
            'Abra Jogadores.',
            'Arquive os jogadores que você não está mais acompanhando para liberar vaga.',
            'Ou passe para um plano com mais capacidade quando precisar.',
        ],
        links: [{ label: 'Ir para Jogadores', to: '/dashboard/players' }],
    },
    {
        id: 'prueba-vs-pago',
        category: 'account',
        title: 'O que a avaliação inclui e o que é desbloqueado com um plano pago?',
        body: 'A avaliação dá a você o painel completo, vários jogadores e uma quantidade limitada de consultas ao Argo Coach, por tempo limitado.\n\nUm plano pago desbloqueia as palavras ponte e a evitar, o guia rápido, a personalização do Preditor por jogador, o detalhe dos grupos e o reperfilamento, além de mais capacidade de equipe.',
        audience: 'admin',
        links: [{ label: 'Ver planos', to: '/dashboard/pricing' }],
    },
    {
        id: 'cancelar-eliminar',
        category: 'account',
        title: 'Como cancelo a assinatura ou excluo a minha conta?',
        body: 'Ambas as opções estão em Ajustes e só o titular da conta pode fazê-las.\n\nAo cancelar, o painel passa para o modo leitura mas os seus dados são mantidos. Ao excluir a conta, a assinatura é cancelada e o acesso é removido. São ações sensíveis, então vale a pena ter certeza antes de confirmar.',
        audience: 'admin',
        links: [{ label: 'Ir para Ajustes', to: '/dashboard/settings' }],
    },
    {
        id: 'cambiar-idioma',
        category: 'account',
        title: 'Como mudo o idioma do painel?',
        body: 'Você pode escolher entre espanhol, inglês e português. A mudança afeta todo o seu painel.',
        steps: [
            'Abra Ajustes.',
            'Escolha o idioma (Español, English ou Português).',
            'Salve. O painel se atualiza na hora.',
        ],
        links: [{ label: 'Ir para Ajustes', to: '/dashboard/settings' }],
    },
];
