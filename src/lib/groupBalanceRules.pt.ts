// Auto-generated Portuguese (PT-BR) translations for groupBalanceRules.ts
// Keys are kept in Spanish (they are identifiers). Only string values are translated.

import type { GroupType, IndicatorLevel, DiversityLevel, MotorGroupType } from './groupBalance';

/* ── Group Profile Texts ───────────────────────────────────────────────────── */

interface GroupProfileText {
    identity: string;
    strengths: string[];
    tools: string[];
}

export const GROUP_PROFILE_TEXTS_PT: Record<GroupType, GroupProfileText> = {
    Competitivo: {
        identity: 'Um grupo que se acende com os desafios. A energia competitiva é o combustível natural e o ritmo é ditado por quem toma a iniciativa.',
        strengths: [
            'Alta capacidade de reação em situações de pressão',
            'Determinação para sustentar o esforço quando o resultado importa',
            'Tendência grupal para a tomada de decisões distribuída: neste momento, vários jogadores mostram iniciativa em campo',
        ],
        tools: [
            'Atribua papéis claros dentro do grupo. Quando cada jogador sabe qual é o seu espaço de liderança, a energia competitiva se direciona para fora e não para dentro.',
            'Use desafios internos com estrutura: competições por tempo, por equipes rotativas, com regras claras. A competição é a linguagem natural desse grupo. Observe sempre o nível de prazer: se a competição gera frustração em algum jogador, retorne a dinâmicas de jogo livre.',
            'Após cada atividade competitiva, dedique um momento breve para reconhecer o esforço coletivo, não apenas o resultado individual.',
        ],
    },
    Social: {
        identity: 'Um grupo onde a conexão humana é protagonista. A energia vem do vínculo entre os jogadores e o clima emocional dita o ritmo do treino.',
        strengths: [
            'Clima positivo que facilita a integração de novos jogadores',
            'Alta capacidade de motivação coletiva em momentos-chave',
            'Comunicação fluida dentro do grupo',
        ],
        tools: [
            'Incorpore rituais de início e encerramento em cada sessão (uma roda de palavras, um grito de equipe). Esse grupo rende melhor quando sente que pertence a algo.',
            'Para momentos que exigem concentração individual, estabeleça sinais claros de transição: "agora é hora de prestar atenção" funciona melhor do que pedir silêncio.',
            'Aproveite a energia social como ferramenta de ensino: exercícios em grupo, explicações entre pares, liderança rotativa.',
        ],
    },
    Cohesivo: {
        identity: 'Um grupo com base sólida. A consistência e a lealdade são o tecido que une os jogadores, e o ritmo se constrói a partir da confiança acumulada.',
        strengths: [
            'Alta confiabilidade: o que é combinado é cumprido',
            'Estabilidade emocional que sustenta o grupo em momentos difíceis',
            'Companheirismo natural e baixo nível de conflito interno',
        ],
        tools: [
            'Introduza mudanças de forma gradual e explique o porquê. Esse grupo processa melhor as novidades quando entende a razão por trás da mudança.',
            'Desafie o grupo com metas progressivas: "na semana passada chegamos até aqui, nessa semana acrescentamos isso". O crescimento incremental é o ritmo natural desse grupo.',
            'Valorize explicitamente a consistência do grupo. Às vezes a estabilidade é invisível, e reconhecê-la reforça o que o grupo faz bem.',
        ],
    },
    Metódico: {
        identity: 'Um grupo que observa antes de agir. A precisão e a compreensão profunda são a forma natural de abordar qualquer desafio esportivo.',
        strengths: [
            'Atenção ao detalhe que reduz erros técnicos',
            'Capacidade de análise tática superior à média',
            'Tendência para compreender e seguir instruções estruturadas',
        ],
        tools: [
            'Explique o "para quê" de cada exercício. Esse grupo se engaja mais quando entende o propósito por trás da atividade.',
            'Intercale exercícios analíticos com momentos de jogo livre ou improvisação. A espontaneidade é uma habilidade que esse grupo pode desenvolver com a orientação certa.',
            'Quando um jogador analisa demais antes de agir, valide o processo dele: "boa leitura" e depois convide para a ação: "agora execute o que você viu".',
        ],
    },
    Balanceado: {
        identity: 'Um grupo diverso onde diferentes estilos de comportamento convivem. Essa variedade é uma força que permite se adaptar a múltiplas situações esportivas.',
        strengths: [
            'Flexibilidade para abordar diferentes tipos de desafios',
            'Cada jogador traz uma perspectiva diferente para o grupo',
            'Menor risco de cair em um único padrão de comportamento',
        ],
        tools: [
            'Alterne o estilo dos exercícios: competitivos, colaborativos, técnicos, criativos. A diversidade do grupo responde bem à variedade.',
            'Leve em conta que a comunicação grupal exige mais nuances: o que motiva um pode não ressoar com outro. Observe as reações individuais.',
            'Use a diversidade como recurso explícito: "vamos precisar que alguns liderem, outros sustentem e outros observem. cada um tem seu papel".',
        ],
    },
};

/* ── Composite Group Texts ─────────────────────────────────────────────────── */

interface CompositeText {
    identity: string;
    tools: string[];
}

export const COMPOSITE_TEXTS_PT: Record<string, CompositeText> = {
    'Competitivo-Social': {
        identity: 'Um grupo com muita energia e volume. A intensidade vem tanto da competição quanto da conexão social. O ritmo é alto e a expressividade é constante.',
        tools: [
            'Canalize a energia com estrutura flexível: regras claras, mas espaço para a expressão. "Compitam, mas quem vencer explica para quem ficou atrás como fez."',
            'Inclua pausas breves entre atividades de alta intensidade. Não para frear o grupo, mas para que possam processar o que acabaram de viver.',
            'Esse grupo responde muito bem ao reconhecimento público e a desafios grupais com recompensa coletiva.',
        ],
    },
    'Competitivo-Cohesivo': {
        identity: 'Um grupo que combina determinação com lealdade. A competição existe, mas dentro de um contexto de cuidado mútuo. Competem sem se destruir.',
        tools: [
            'Aproveite que a competição interna tem limites naturais: esse grupo sabe quando parar antes que alguém passe mal.',
            'Os líderes naturais tendem a proteger os mais estáveis. Reconheça essa dinâmica e nomeie-a: "gosto de como a equipe cuida de todos enquanto compete".',
            'As transições entre atividades competitivas e colaborativas são fluidas nesse grupo. Use isso a seu favor.',
        ],
    },
    'Competitivo-Metódico': {
        identity: 'Um grupo que quer vencer e sabe como. A ação e a análise convivem, gerando um estilo de jogo intenso mas inteligente.',
        tools: [
            'Ofereça ao grupo informação tática antes dos exercícios. A combinação de análise + ação faz com que processem as instruções rapidamente e as executem com convicção.',
            'Quando surgirem diferenças de ritmo (alguns querem agir imediatamente, outros querem entender primeiro), valide ambos: "boa leitura, agora execute" reúne os dois estilos.',
            'Exercícios de tomada de decisão sob pressão são ideais para esse grupo: combinam o melhor dos dois eixos.',
        ],
    },
    'Social-Cohesivo': {
        identity: 'Um grupo caloroso e unido. A prioridade natural é o bem-estar da equipe e a conexão entre os jogadores. O clima emocional é excelente.',
        tools: [
            'Aproveite o clima positivo para introduzir desafios progressivos. Esse grupo aceita sair da zona de conforto quando se sente emocionalmente seguro.',
            'Inclua momentos de intensidade competitiva como "convidados": um exercício pontual de alta exigência dentro de uma sessão mais tranquila.',
            'Quando precisar aumentar a intensidade, enquadre isso no cuidado grupal: "vamos nos esforçar um pouco mais porque confio no que esse grupo pode alcançar junto".',
        ],
    },
    'Social-Metódico': {
        identity: 'Um grupo que combina expressividade com observação. A comunicação é rica e detalhada: fala-se muito e analisa-se muito.',
        tools: [
            'Use a habilidade comunicativa do grupo para exercícios de feedback entre pares: "explica para seu colega o que você observou na jogada dele".',
            'Equilibre os momentos de análise verbal com ação física. Esse grupo tende a processar falando, o que é valioso, mas também se beneficia de momentos de "menos papo, mais jogo".',
            'Exercícios que combinam criatividade com precisão (jogadas ensaiadas, combinações táticas) são o terreno ideal para esse grupo.',
        ],
    },
    'Cohesivo-Metódico': {
        identity: 'Um grupo paciente e consistente. O ritmo é deliberado, a atenção ao detalhe é alta e a base emocional é sólida.',
        tools: [
            'Introduza elementos de surpresa e velocidade de forma gradual: exercícios com mudança de regras no meio da atividade, variações inesperadas na rotina.',
            'Valorize a consistência do grupo ("esse grupo não comete o mesmo erro duas vezes") e a partir disso convide para uma ação mais rápida.',
            'Momentos de alta pressão competitiva são a oportunidade de crescimento desse grupo. Prepare-os com antecedência: "hoje vamos praticar jogar com pressão de tempo".',
        ],
    },
    'Balanceado-Competitivo': {
        identity: 'Um grupo com base diversa que encontra seu motor na competição. A variedade de estilos permite abordar os desafios de múltiplos ângulos, e a energia competitiva dá direção.',
        tools: [
            'Aproveite a diversidade do grupo para criar equipes internas equilibradas: cada equipe tem um pouco de tudo, e a competição se torna mais rica.',
            'Use a variedade de estilos como vantagem tática: "nesse exercício, quem observa dá feedback para quem executa, e depois trocam". A rotação de papéis mantém todos ativos.',
            'A competição nesse grupo funciona melhor quando é coletiva e não individual. Desafios de equipe contra o relógio, recordes grupais ou metas compartilhadas canalizam a energia sem gerar atritos entre estilos diferentes.',
        ],
    },
    'Balanceado-Social': {
        identity: 'Um grupo diverso que se une através do vínculo. A variedade de estilos enriquece as interações, e a energia social funciona como a cola que mantém o grupo coeso apesar das diferenças.',
        tools: [
            'Use a energia social como ponte entre estilos: "explica para seu colega como você está vendo isso" gera trocas naturais entre jogadores que pensam de forma diferente.',
            'Atividades de integração são especialmente eficazes nesse grupo porque a diversidade garante que cada jogador contribua com algo diferente no momento compartilhado.',
            'Alterne entre exercícios sociais (em grupo, com comunicação) e exercícios individuais (concentração, técnica). A diversidade do grupo tolera bem as mudanças de formato se o clima emocional se mantiver positivo.',
        ],
    },
    'Balanceado-Cohesivo': {
        identity: 'Um grupo diverso que constrói a partir da confiança. A variedade de estilos se sustenta sobre uma base de estabilidade emocional que permite que cada jogador encontre seu espaço sem precisar disputá-lo.',
        tools: [
            'A estabilidade desse grupo permite introduzir novos desafios com segurança: a base coesiva amortece o desconforto da mudança, e a diversidade garante que alguém do grupo se adapte rapidamente.',
            'Mantenha rituais e rotinas que reforcem o pertencimento, mas dentro dessas rotinas varie os exercícios para ativar os diferentes estilos.',
            'Ao incorporar um novo jogador, apoie-se na coesão natural do grupo: "a equipe vai cuidar para que você se integre". A diversidade faz com que o novo logo encontre alguém com um estilo parecido.',
        ],
    },
    'Balanceado-Metódico': {
        identity: 'Um grupo diverso com tendência à reflexão. A variedade de estilos se complementa com uma inclinação natural para observar, analisar e entender antes de agir.',
        tools: [
            'Explique o propósito de cada exercício antes de começar. A diversidade do grupo faz com que cada jogador processe de forma diferente, mas a tendência analítica compartilhada precisa do "para quê" como ponto de partida.',
            'Use a capacidade de observação do grupo como ferramenta de feedback: "o que vocês viram nessa jogada?" gera respostas diversas e ricas porque cada estilo observa coisas diferentes.',
            'Alterne momentos de análise com momentos de ação espontânea. O equilíbrio entre reflexão e execução é essencial: "primeiro pensem 10 segundos o que vão fazer, depois executem sem parar".',
        ],
    },
};

/* ── Indicator Texts ───────────────────────────────────────────────────────── */

interface IndicatorText {
    label: string;
    description: string;
}

type AxisIndicatorTexts = Record<IndicatorLevel, IndicatorText>;

export const INDICATOR_TEXTS_PT: Record<string, AxisIndicatorTexts> = {
    D: {
        equilibrada:   { label: 'Presença equilibrada', description: 'O grupo tem presença de liderança natural bem distribuída.' },
        moderada:      { label: 'Presença moderada', description: 'A liderança nesse grupo tende a depender mais do adulto. Isso abre a oportunidade de desenvolver liderança em jogadores que ainda não a expressam.' },
        marcada:       { label: 'Presença marcada', description: 'O grupo tem vários líderes naturais. Cada um pode brilhar se tiver um espaço claro de responsabilidade.' },
        definido_alto: { label: 'Estilo definido', description: 'O grupo tem uma densidade alta de jogadores que buscam liderar. Definir papéis rotativos e espaços de responsabilidade permite que essa energia seja canalizada de forma produtiva.' },
        definido_bajo: { label: 'Estilo definido', description: 'O grupo funciona bem com orientação externa. O adulto é o principal referente de direção, o que permite trabalhar a liderança como habilidade a desenvolver.' },
    },
    I: {
        equilibrada:   { label: 'Presença equilibrada', description: 'O grupo tem boa capacidade de conexão social e expressividade.' },
        moderada:      { label: 'Presença moderada', description: 'A expressividade social do grupo é contida. Rituais de equipe (gritos, cumprimentos, celebrações breves) ajudam a construir esse tecido social.' },
        marcada:       { label: 'Presença marcada', description: 'O grupo tem muita energia social. Essa expressividade é um recurso valioso quando canalizada: celebrações grupais, liderança motivacional, integração de novos jogadores.' },
        definido_alto: { label: 'Estilo definido', description: 'A energia social do grupo é sua marca de identidade. Sinais claros de transição entre momentos sociais e momentos de concentração ajudam o grupo a ativar os dois modos.' },
        definido_bajo: { label: 'Estilo definido', description: 'O grupo é reservado na sua expressão social. Isso gera um ambiente focado e de baixo conflito. Momentos de conexão pessoal (uma roda de como cada um chegou hoje, uma história compartilhada) enriquecem o vínculo.' },
    },
    S: {
        equilibrada:   { label: 'Presença equilibrada', description: 'O grupo tem uma base emocional sólida que lhe dá consistência.' },
        moderada:      { label: 'Presença moderada', description: 'O grupo tem um ritmo variável que pode ser sua força em contextos dinâmicos. Rotinas previsíveis (mesmo aquecimento, mesma estrutura) oferecem uma âncora quando necessário.' },
        marcada:       { label: 'Presença marcada', description: 'O grupo tem alta estabilidade emocional. Essa consistência é a base sobre a qual o adulto pode ir construindo desafios graduais.' },
        definido_alto: { label: 'Estilo definido', description: 'A consistência é o superpoder desse grupo. Novos desafios, introduzidos de forma gradual e explicada, são a oportunidade de crescimento. O grupo aceita mudanças quando entende o porquê.' },
        definido_bajo: { label: 'Estilo definido', description: 'O grupo tem um estilo reativo e dinâmico. Isso o torna forte em situações de mudança. Rotinas breves e previsíveis no início de cada sessão oferecem uma base de referência.' },
    },
    C: {
        equilibrada:   { label: 'Presença equilibrada', description: 'O grupo tem boa capacidade de observação e atenção tática.' },
        moderada:      { label: 'Presença moderada', description: 'O grupo se move mais pelo instinto do que pela análise. Essa espontaneidade é valiosa, e pausas breves de observação ("olha essa jogada, o que você vê?") incorporam a análise sem frear a ação.' },
        marcada:       { label: 'Presença marcada', description: 'O grupo tem alta capacidade analítica. Exercícios que combinam observação com execução ("olha, decide, executa") são ideais para esse grupo.' },
        definido_alto: { label: 'Estilo definido', description: 'A observação é a força central desse grupo. Exercícios com tempo limitado para decidir ("três segundos para escolher") ajudam a conectar a análise com a ação rápida.' },
        definido_bajo: { label: 'Estilo definido', description: 'O grupo age com fluidez e espontaneidade. Revisões breves pós-exercício ("o que aconteceu ali?") permitem incorporar a reflexão sem interromper o ritmo natural.' },
    },
};

export const DIVERSITY_TEXTS_PT: Record<DiversityLevel, IndicatorText> = {
    alta:         { label: 'Alta diversidade', description: 'O grupo tem boa diversidade de estilos de comportamento. Isso permite se adaptar a diferentes tipos de situações esportivas.' },
    moderada_div: { label: 'Diversidade moderada', description: 'O grupo tem uma tendência marcada para alguns estilos de comportamento. Isso lhe dá uma identidade clara, e o adulto pode complementar com exercícios que ativem outros estilos.' },
    definida:     { label: 'Identidade definida', description: 'O grupo tem um estilo de comportamento muito definido. Isso é uma força em situações que exigem esse estilo, e uma oportunidade de crescimento em contextos que pedem algo diferente.' },
};

/* ── Motor Texts ───────────────────────────────────────────────────────────── */

interface MotorText {
    identity: string;
    tools: string;
}

export const MOTOR_TEXTS_PT: Record<MotorGroupType, MotorText> = {
    Rápido: {
        identity: 'Um grupo de reação imediata. A primeira resposta é rápida e a intensidade inicial é alta.',
        tools: 'As pausas estratégicas entre exercícios ("antes de começar, observem 5 segundos") acrescentam uma camada de reflexão que complementa a velocidade natural.',
    },
    Medio: {
        identity: 'Um grupo adaptável que consegue ajustar seu ritmo conforme o contexto. A flexibilidade é sua característica principal.',
        tools: 'Alterne exercícios de alta velocidade com exercícios de pausa e análise. Esse grupo responde bem à variedade porque seu ritmo se adapta.',
    },
    Lento: {
        identity: 'Um grupo que processa antes de agir. As decisões tendem a ser bem pensadas e a qualidade de execução é alta.',
        tools: 'Antecipe as transições ("em 30 segundos vamos mudar de exercício") para que o grupo possa se preparar. Exercícios com tempo de preparação seguidos de execução rápida combinam o melhor do estilo reflexivo com a prática da ação.',
    },
    Diverso: {
        identity: 'Um grupo com variedade de ritmos. Estilos rápidos, médios e reflexivos convivem, o que enriquece a dinâmica grupal.',
        tools: 'Exercícios que exigem ritmos diferentes em papéis diferentes são ideais. "Um lê a jogada (reflexivo), outro comunica (médio), outro executa (rápido)." A diversidade de motor é um recurso tático.',
    },
};
