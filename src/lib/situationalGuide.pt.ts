// Auto-generated Portuguese (PT-BR) translations for situationalGuide.ts
// Situation IDs, eje values, and category keys are kept as-is (identifiers).
// Profile names: Impulsor→Impulsionador, Conector→Conector, Sosten→Sustentador, Estratega→Estrategista

import type { Situation, SituationCard } from './situationalGuide';

/* ── As 15 situações ────────────────────────────────────────────────────────── */

export const SITUATIONS_PT: Situation[] = [
    {
        id: 'no-quiere-arrancar',
        title: 'Não quer começar',
        whatYouSee: 'O jogador chega ao treino e não quer participar. Está apático, reclama, senta no canto ou diz "hoje não estou com vontade".',
        whatsHappening: 'Não é falta de comprometimento. A criança ainda está no "modo" do que estava fazendo antes (escola, casa, uma briga com um amigo). Ela precisa de um momento para fazer a transição para o esporte.',
        profilePerspectives: 'Se o jogador tem perfil {{Impulsionador}}, pode ser que não veja um desafio que o motive a começar — precisa sentir que o que vem vale a pena. Se é {{Conector}}, provavelmente falta a conexão social: se o amigo não veio ou o clima do grupo está estranho, fica difícil se engajar. Um perfil {{Sustentador}} pode precisar de mais tempo para fazer a transição, especialmente se algo na rotina mudou. E se é {{Estrategista}}, talvez esteja processando algo que aconteceu antes e precise fechar aquela ideia antes de conseguir focar em outra coisa.',
        category: 'Motivación',
        icon: '',
    },
    {
        id: 'se-frustra-cuando-pierde',
        title: 'Se frustra muito quando perde',
        whatYouSee: 'O jogador reage com raiva, fica mal, às vezes joga coisas ou se recusa a continuar depois de perder um ponto, uma partida ou um exercício.',
        whatsHappening: 'Ele sente que perder apaga todo o esforço que fez. Naquele momento não consegue separar "fui mal nessa jogada" de "sou ruim". A emoção tampa o aprendizado. O primeiro passo é validar o que ele sente antes de tentar explicar a jogada.',
        profilePerspectives: 'Um {{Impulsionador}} pode reagir com raiva visível porque perder bate direto na sua necessidade de vencer e controlar. O {{Conector}} tende a se frustrar mais se sentir que decepcionou o grupo ou alguém que estava olhando. O {{Sustentador}} pode guardar a frustração e mostrá-la depois, de forma mais silenciosa mas persistente. E o {{Estrategista}} provavelmente vai se irritar consigo mesmo porque já tinha antecipado o que fazer e sente que falhou na execução.',
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'no-hace-lo-que-pido',
        title: 'Não faz o que peço',
        whatYouSee: 'Você dá uma instrução e o jogador faz outra coisa, demora muito para começar, ou parece que não escutou.',
        whatsHappening: 'Ele não está ignorando você. Cada criança processa as instruções no seu próprio ritmo. Alguns agem antes de terminar de ouvir, outros precisam de mais tempo para entender a lógica do que foi pedido. É uma diferença de velocidade de processamento, não de atitude.',
        profilePerspectives: 'O {{Impulsionador}} pode já ter saído para executar antes de você terminar de falar — o motor dele o empurra à ação antes de escutar. O {{Conector}} talvez estivesse conversando com um colega e perdeu a instrução. Um {{Sustentador}} pode ter escutado tudo perfeitamente, mas precisa de um momento a mais para se sentir seguro antes de começar. E o {{Estrategista}} provavelmente está analisando se a instrução faz sentido antes de se mover — não é resistência, é o jeito dele processar.',
        category: 'Comunicación',
        icon: '',
    },
    {
        id: 'raro-antes-del-partido',
        title: 'Está estranho antes de um jogo',
        whatYouSee: 'O jogador está mais quieto ou mais agitado que o normal antes de competir. Pode estar nervoso, ir ao banheiro várias vezes, ou ao contrário, estar hiperativo e sem parar de se mexer.',
        whatsHappening: 'Ele sente que as expectativas estão altas (as próprias ou as de fora) e o corpo reage diante da incerteza do que vai acontecer. Cada perfil mostra isso de um jeito diferente: uns se fecham, outros aceleram.',
        profilePerspectives: 'O {{Impulsionador}} pode ficar hiperativo, falar muito e se mexer sem parar — é a forma dele canalizar a adrenalina. O {{Conector}} tende a buscar alguém por perto e falar de qualquer coisa para se sentir acompanhado. Um {{Sustentador}} pode ficar bem quieto e precisar que você confirme que tudo vai ficar bem. E o {{Estrategista}} provavelmente está revisando mentalmente cada jogada possível — o silêncio dele não é nervosismo, é preparação.',
        category: 'Presión',
        icon: '',
    },
    {
        id: 'mira-desde-afuera',
        title: 'Fica olhando de fora',
        whatYouSee: 'O jogador não entra no grupo. Fica na beira da quadra observando, especialmente quando é um exercício novo ou um grupo que ele não conhece bem.',
        whatsHappening: 'Ele está fazendo um "escaneamento" do terreno. Precisa entender como funciona a dinâmica antes de entrar. Não é timidez nem covardia — é a forma dele se preparar para participar com segurança.',
        profilePerspectives: 'Se é {{Impulsionador}}, provavelmente não está de fora por medo, mas porque ainda não encontrou o momento certo para entrar com protagonismo. O {{Conector}} pode estar esperando que alguém o convide ou o inclua — precisa do sinal social. Um {{Sustentador}} está avaliando se o ambiente é previsível e seguro antes de se expor. E o {{Estrategista}} está literalmente estudando a dinâmica: quem faz o quê, como funciona o exercício, quais são as regras implícitas.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'llora-o-se-enoja',
        title: 'Chora ou se irrita no meio do treino',
        whatYouSee: 'O jogador se desestabiliza emocionalmente durante uma atividade. Pode ser choro, raiva, ou os dois. Às vezes é depois de uma correção, às vezes parece "do nada".',
        whatsHappening: 'Tudo se acumulou: o cansaço, o barulho, as correções, a exigência do exercício. O sistema dele saturou e a emoção transbordou. Não é birra — é que naquele momento a demanda superou o que ele conseguia processar.',
        profilePerspectives: 'O {{Impulsionador}} tende a transbordar com raiva — grita, chuta algo, reclama em voz alta. É a forma dele soltar a pressão rápido. O {{Conector}} pode chorar se sentir que foi corrigido na frente do grupo ou se alguém o excluiu. Um {{Sustentador}} provavelmente vinha acumulando há um tempo e o colapso é a gota d\'água — o transbordamento costuma surpreender porque antes não dava sinais. O {{Estrategista}} pode se irritar consigo mesmo em silêncio e precisar de um momento sozinho para se reorganizar.',
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'roce-con-companero',
        title: 'Tem um atrito com um colega',
        whatYouSee: 'Dois jogadores entram em conflito durante um exercício. Pode ser uma discussão, uma reclamação, ou simplesmente não conseguir trabalhar juntos.',
        whatsHappening: 'Cada criança tem um estilo natural de encarar as coisas. Quando dois estilos muito diferentes se encontram sem mediação, gera atrito. Não é que um tem razão e o outro não — são ritmos e abordagens diferentes.',
        profilePerspectives: 'Se há um {{Impulsionador}} no atrito, é provável que queira impor a ideia ou o ritmo dele — não por maldade, mas porque a natureza dele é liderar. O {{Conector}} pode levar para o pessoal e se sentir rejeitado pelo colega. Um {{Sustentador}} provavelmente tenta evitar o conflito até não aguentar mais, e aí reage de uma vez. E o {{Estrategista}} pode se frustrar se sentir que o outro não está seguindo a lógica correta do exercício.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'se-castiga',
        title: 'Se pune quando erra',
        whatYouSee: 'Depois de um erro, o jogador bate na própria cabeça, se xinga, diz "sou um desastre" ou se irrita consigo mesmo de forma exagerada.',
        whatsHappening: 'Ele mede o próprio valor em função da perfeição do movimento. Cada erro sente como uma prova de que "não serve". A autoexigência saiu do controle e entrou num ciclo de punição que não o deixa continuar jogando bem.',
        profilePerspectives: 'O {{Impulsionador}} se pune porque precisa se sentir capaz, e o erro ameaça essa imagem — a reação costuma ser rápida, intensa e visível. O {{Conector}} pode se punir pensando no que os outros acham dele depois do erro. Um {{Sustentador}} tende a se punir em silêncio, ruminando internamente. E o {{Estrategista}} pode ser o mais duro consigo mesmo porque já tinha calculado o que fazer e sente que "deveria ter feito certo".',
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'se-distrae',
        title: 'Se distrai o tempo todo',
        whatYouSee: 'O jogador olha para outro lado, conversa com o colega ao lado, brinca com algo que não tem nada a ver, ou simplesmente não está "presente" no exercício.',
        whatsHappening: 'O treino não está sintonizando com o ritmo dele. Pode ser que o exercício seja lento demais para o motor dele (fica entediado) ou caótico demais para o estilo dele (se desconecta). A distração é um sinal de que algo no formato não está chegando até ele.',
        profilePerspectives: 'O {{Impulsionador}} se distrai quando o exercício é lento ou repetitivo demais — precisa de mais intensidade ou competição para se manter engajado. O {{Conector}} pode se distrair socializando porque para ele conversar com o colega É estar presente — a atenção dele funciona diferente. Um {{Sustentador}} se desconecta quando há caos, barulho ou mudanças demais — precisa de previsibilidade para se concentrar. E o {{Estrategista}} pode parecer distraído quando na verdade está pensando em outra coisa: uma jogada anterior, um padrão que detectou, algo que chamou sua atenção.',
        category: 'Concentración',
        icon: '',
    },
    {
        id: 'quiere-dejar',
        title: 'Diz que quer parar o esporte',
        whatYouSee: 'O jogador diz que não quer mais vir, que não gosta, ou simplesmente para de aparecer.',
        whatsHappening: 'O esforço emocional que custa se adaptar ao ambiente esportivo ficou maior do que o prazer que sente. Não é que não goste do esporte — é que algo no contexto está drenando mais do que preenchendo. O objetivo não é convencê-lo a ficar a qualquer custo, mas ajustar o ambiente para ver se o prazer pode voltar.',
        profilePerspectives: 'Um {{Impulsionador}} pode querer parar se sentir que não tem espaço para liderar ou que o nível de desafio não o motiva. O {{Conector}} tende a ir embora quando sente que não pertence ao grupo ou que a dinâmica social o deixa de fora. Um {{Sustentador}} pode querer parar se as mudanças constantes ou a pressão o esgotam — precisa de estabilidade para aproveitar. E o {{Estrategista}} pode se desconectar se sentir que ninguém valoriza a forma como vê o jogo ou se a atividade parece caótica demais.',
        category: 'Motivación',
        icon: '',
    },
    {
        id: 'jugador-nuevo',
        title: 'Chega um jogador novo no grupo',
        whatYouSee: 'Um jogador que não conhece ninguém entra no grupo. O grupo reage: alguns o recebem bem, outros o ignoram, outros se sentem desconfortáveis com a mudança.',
        whatsHappening: 'A chegada de alguém novo altera o equilíbrio que o grupo já tinha. Os jogadores que valorizam a estabilidade sentem que algo se quebrou. Os mais sociais provavelmente o recebem rápido. Cada perfil vive a mudança de forma diferente.',
        profilePerspectives: 'O {{Impulsionador}} provavelmente vai recebê-lo bem se vir que o novo pode ser um aliado ou um rival interessante — avalia rápido. O {{Conector}} pode ser o primeiro a se aproximar e fazê-lo sentir bem-vindo — é a natureza integradora dele. Um {{Sustentador}} pode se sentir desconfortável com a mudança na dinâmica do grupo e precisar de tempo para se adaptar. E o {{Estrategista}} vai observar o novo de longe antes de interagir — não é rejeição, é a forma dele entender quem é.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'se-congela',
        title: 'Trava na partida',
        whatYouSee: 'Um jogador que rende bem no treino, na partida parece outro: não corre, não pede a bola, não reage. Como se tivesse "desligado".',
        whatsHappening: 'A pressão da partida ativou um mecanismo de proteção. Diante do olhar do público ou da importância do momento, o corpo escolhe "não fazer nada" para evitar errar. Não é que não queira — é que travou.',
        profilePerspectives: 'O {{Impulsionador}} trava quando sente que há muito em jogo e não pode se dar ao luxo de errar — a pressão freia o motor em vez de acelerá-lo. O {{Conector}} pode travar se sentir que o olhar do público ou dos pais está o avaliando. Um {{Sustentador}} tende a travar quando a situação parece imprevisível ou caótica — precisa de uma âncora de segurança. E o {{Estrategista}} pode paralisar por excesso de análise: vê opções demais e não consegue escolher uma a tempo.',
        category: 'Presión',
        icon: '',
    },
    {
        id: 'no-quiere-ser-centro',
        title: 'Não quer ser o centro das atenções',
        whatYouSee: 'Quando toca liderar uma atividade, falar na frente do grupo, ou fazer uma demonstração sozinho, o jogador se recusa, se esconde ou fica muito desconfortável.',
        whatsHappening: 'A forma natural dele de participar é de um lugar mais reservado. Obrigá-lo a ser o centro das atenções é como pedir a um canhoto que escreva com a direita: pode fazer, mas sofre. Existem formas de liderança que não exigem estar no centro.',
        profilePerspectives: 'Um {{Impulsionador}} normalmente quer estar no centro, então se resistir pode ser por outra coisa: insegurança pontual ou cansaço. O {{Conector}} pode querer participar, mas tem vergonha de fazer sozinho — funciona melhor acompanhado. Um {{Sustentador}} genuinamente prefere o segundo plano e se sente exposto quando colocado à frente — pode liderar pelo apoio, não pelo palco. E o {{Estrategista}} pode sentir que falar na frente de todos o obriga a improvisar, algo que gera muito desconforto — dê um tempo para se preparar e responde diferente.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'cambio-repentino',
        title: 'Mudou de um dia para o outro',
        whatYouSee: 'Um jogador que sempre foi de um jeito de repente está diferente: quieto, irritado, ou desconectado. E não volta ao estado normal.',
        whatsHappening: 'Algo fora da quadra está o afetando: pode ser a escola, a casa, uma situação familiar, uma dificuldade com amigos. A mudança de comportamento sustentada é um sinal de que algo externo está drenando a energia emocional dele.',
        profilePerspectives: 'Um {{Impulsionador}} que de repente está apagado é um sinal claro de que algo acontece — a natureza dele é estar ativo, e a ausência dessa energia é significativa. O {{Conector}} pode se tornar quieto ou se isolar do grupo quando algo externo o afeta. Um {{Sustentador}} pode mostrar irritabilidade ou resistência onde antes havia calma — a mudança costuma ser sutil mas persistente. E um {{Estrategista}} que se desconecta pode estar processando algo internamente que o absorve por completo.',
        category: 'Observación',
        icon: '',
    },
    {
        id: 'derrota-grupal',
        title: 'O time perdeu e ninguém quer saber de nada',
        whatYouSee: 'Depois de uma derrota, o grupo inteiro está desanimado. Ninguém fala, ou todos se culpam. O clima fica pesado.',
        whatsHappening: 'O time como grupo parou de ver o processo e ficou preso no resultado. A derrota se sente coletiva e isso pesa mais do que quando perde um único jogador. O grupo precisa se reconectar com o que os une além do placar.',
        category: 'Grupal',
        icon: '',
    },
];

/* ── Os 57 cartões ──────────────────────────────────────────────────────────── */

export const SITUATION_CARDS_PT: SituationCard[] = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. Não quer começar
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-quiere-arrancar',
        eje: 'D',
        whatsHappeningForProfile: 'O Impulsionador precisa sentir que o que vem vale a pena. Se não vê um desafio claro, a transição custa mais. O motor dele o empurra à ação, mas só quando o objetivo o motiva.',
        howToAccompany: [
            'Proponha um mini-desafio pessoal para os primeiros 5 minutos: "Vamos ver se você começa mais rápido do que da última vez".',
            'Dê um papel ativo desde o início: que monte os cones, que escolha o primeiro exercício, que lidere o aquecimento.',
        ],
        ifNotResponding: 'Deixe-o observar os primeiros minutos sem pressão. Quando vir o grupo em ação, o instinto competitivo dele se ativa sozinho.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector precisa de conexão social para se ativar. Se chegou sozinho, se o amigo não veio, ou se o clima do grupo está estranho, fica difícil se engajar. A energia dele se acende nas pessoas, não na atividade em si.',
        howToAccompany: [
            'Chegue perto e pergunte algo pessoal: "Como foi o dia?". Essa micro-conexão é o interruptor de ignição dele.',
            'Coloque-o ao lado de alguém com quem tem afinidade no primeiro exercício.',
        ],
        ifNotResponding: 'Inclua-o em uma atividade grupal divertida (não técnica). Uma brincadeira de aquecimento onde ele ria costuma ser suficiente para entrar.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador precisa que tudo esteja "no lugar" para se sentir seguro. Se o treino mudou de horário, se há alguém novo, ou se algo na rotina foi alterado, a transição fica mais pesada. O motor mais lento dele faz com que a troca de modo leve mais tempo.',
        howToAccompany: [
            'Mantenha a rotina: que faça o mesmo aquecimento de sempre, no mesmo lugar, com os mesmos colegas.',
            'Não peça que explique por que não quer. Simplesmente dê um par de minutos e diga: "Começamos quando você estiver pronto".',
        ],
        ifNotResponding: 'Dê uma tarefa pequena e previsível ("Faça 10 toques de bola aqui do meu lado") para que entre no ritmo sem pular direto para o grupo.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista precisa entender o que vai acontecer antes de se comprometer. Se não sabe o que vai ser treinado, ou se o plano mudou sem explicação, prefere ficar de fora processando. O motor de processamento dele precisa fechar a lógica antes de começar.',
        howToAccompany: [
            'Conte brevemente o que vão fazer hoje: "Primeiro aquecimento, depois um exercício tático, e terminamos com jogo". A previsibilidade o ativa.',
            'Se algo do plano habitual mudou, explique o porquê: "Hoje vamos fazer algo diferente porque precisamos praticar X".',
        ],
        ifNotResponding: 'Deixe-o observar a primeira atividade de fora. Quando entender a lógica do exercício, ele entra sozinho.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. Se frustra muito quando perde
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'D',
        whatsHappeningForProfile: 'Para o Impulsionador, perder é pessoal. Ele sente que o resultado define o próprio valor. A energia de liderança dele se vira contra si mesmo ou contra os outros quando o placar não o acompanha.',
        howToAccompany: [
            'Primeiro valide: "Entendo que está com raiva, é normal quando você dá tudo". Não minimize o que ele sente.',
            'Depois redirecione a energia competitiva: "O que você faria diferente se pudesse repetir essa jogada?". Isso o tira do resultado e leva ao processo.',
        ],
        ifNotResponding: 'Dê um momento sozinho. O Impulsionador precisa processar a frustração em privado antes de conseguir ouvir qualquer conselho.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector sente a derrota como uma ruptura social: "falhei com o grupo", "não fui suficiente para o time". A frustração dele vem mais do impacto nos outros do que do resultado em si.',
        howToAccompany: [
            'Valide a emoção pelo lado do vínculo: "Dá para ver o quanto você se importa com o time — isso diz muito de você".',
            'Separe-o do "falhei com o grupo" com dados: "Olha tudo que o time conquistou hoje, e você foi parte disso".',
        ],
        ifNotResponding: 'Peça para um colega de confiança conversar com ele. O Conector se recupera mais rápido com o apoio de um par do que com a palavra do adulto.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador não explode com a derrota, mas guarda. Fica quieto, se recolhe, e pode arrastar a frustração por vários dias. A estabilidade natural dele o faz parecer "bem" por fora, mas por dentro custa soltar.',
        howToAccompany: [
            'Valide sem forçar: "Se precisar conversar, estou aqui". Não peça que processe na hora.',
            'Nos treinos seguintes, observe se está mais quieto que o habitual. Se notar diferença, um "como você está?" sem pressão costuma abrir a porta.',
        ],
        ifNotResponding: 'Mantenha a rotina e a normalidade. O Sustentador se recupera quando sente que tudo continua igual ao redor, apesar do resultado.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista analisa a derrota em loop: revisa cada erro, cada jogada, buscando o momento exato onde tudo saiu errado. A frustração dele é mais cerebral do que emocional, mas ainda assim o paralisa.',
        howToAccompany: [
            'Valide a análise: "Está certo pensar no que aconteceu, isso vai te fazer melhorar". Depois limite o loop: "Vamos escolher apenas uma coisa para trabalhar na próxima vez".',
            'Ofereça dados concretos: "Olha, em 10 jogadas você acertou 7. O saldo é positivo". Os números o tiram do circuito emocional.',
        ],
        ifNotResponding: 'Proponha que escreva ou desenhe o que sentiu. O Estrategista processa melhor quando pode organizar os pensamentos fora da cabeça.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. Não faz o que peço
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'D',
        whatsHappeningForProfile: 'O Impulsionador ouviu a instrução, mas já decidiu como fazer do jeito dele. Não é desobediência — é que o motor rápido o lança à ação antes de você terminar de falar, e ele confia no instinto.',
        howToAccompany: [
            'Dê a instrução curta e direta, em uma frase. "Passe para o pivô, chute ao gol." Menos palavras, mais ação.',
            'Se fez algo diferente mas funcionou, reconheça: "Boa decisão. Agora vamos testar também dessa outra forma".',
        ],
        ifNotResponding: 'Dê o "porquê" competitivo: "Se você praticar isso, vai ter mais uma ferramenta para ganhar". O Impulsionador faz o que entende que o deixa melhor.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector provavelmente estava conversando com alguém quando você deu a instrução, ou se prendeu na dinâmica social e perdeu o foco. Não é falta de respeito — é que a atenção dele vai primeiro para as pessoas e depois para a tarefa.',
        howToAccompany: [
            'Garanta a atenção dele antes de dar a instrução: contato visual, nome, e depois a consigna.',
            'Dê a instrução em chave social: "Você e seu colega vão fazer isso juntos" funciona melhor do que uma ordem individual.',
        ],
        ifNotResponding: 'Peça para ele explicar a consigna para outro colega. Ao traduzir, processa e executa.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador ouviu tudo, mas se a instrução foi complexa ou nova, o motor de processamento dele precisa de mais tempo para fechar a lógica antes de começar. Não é lentidão — é que quer fazer certo.',
        howToAccompany: [
            'Dê a instrução passo a passo: "Primeiro fazemos isso... bem, agora isso outro". Não tudo de uma vez.',
            'Dê alguns segundos depois da consigna antes de esperar que comece. Esse silêncio é o tempo de processamento dele.',
        ],
        ifNotResponding: 'Faça uma demonstração rápida do exercício. O Sustentador processa muito melhor vendo do que ouvindo.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista está processando a instrução a fundo. Se você disse algo que não faz lógica para ele, ou que contradiz o que fizeram antes, ele trava. O motor dele precisa fechar a lógica da primeira instrução antes de poder começar a segunda.',
        howToAccompany: [
            'Explique o "para quê" do exercício: "Fazemos isso porque trabalha a reação lateral". Com o propósito claro, ele executa.',
            'Se perguntar "por quê", não leve como questionamento. É a forma dele se comprometer: entender primeiro, agir depois.',
        ],
        ifNotResponding: 'Diga: "Tenta uma vez e depois me fala o que achou". O Estrategista se desbloqueia com a experiência direta mais do que com a explicação verbal.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. Está estranho antes de um jogo
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'raro-antes-del-partido',
        eje: 'D',
        whatsHappeningForProfile: 'O Impulsionador mostra o nervosismo com hiperatividade: fala além da conta, se move muito, ou ao contrário, fica irritado e quieto. A incerteza o incomoda porque quer controlar o resultado e não pode.',
        howToAccompany: [
            'Dê uma tarefa concreta que o faça sentir no controle: "Aquece com bola, faz 20 chutes". A ação física canaliza a ansiedade.',
            'Fale em chave de plano: "Hoje seu papel é X. Se acontecer Y, você faz Z". A clareza do plano o acalma.',
        ],
        ifNotResponding: 'Deixe-o aquecer sozinho com música ou em um espaço separado. O Impulsionador processa a pressão se movendo, não falando.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector busca contenção social: fala com todos, faz piadas, ou se cola na pessoa de confiança. Os nervos ele processa pelo vínculo. Se está quieto, algo pesa mais do que o normal.',
        howToAccompany: [
            'Gere um momento grupal de conexão: uma roda de mãos, um grito de time, um "como estamos?". Isso o centra.',
            'Se estiver mais quieto que o normal, chegue sem pressionar: "Tudo bem?" e um gesto de apoio (palmadinhas, punho no punho).',
        ],
        ifNotResponding: 'Peça para ele animar o grupo. Dar um papel social ("Você fica responsável por manter todo mundo ligado") transforma a ansiedade em energia positiva.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador se fecha. Está mais quieto, mais apegado à rotina, faz exatamente o mesmo de sempre como para sentir que algo não mudou. A incerteza do jogo bate na base de segurança dele.',
        howToAccompany: [
            'Mantenha a rotina pré-jogo o mais igual possível: mesmo aquecimento, mesmo lugar, mesmos colegas por perto.',
            'Diga algo que dê segurança: "Hoje jogamos como no treino, nada diferente, o mesmo que já sabemos fazer".',
        ],
        ifNotResponding: 'Não force a "animação". O Sustentador compete bem a partir da calma. Deixe-o entrar em campo no próprio ritmo.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista está pensando em todos os cenários possíveis: "E se me tocarem marcar o maior?", "O que acontece se erramos na saída?". A mente analítica dele vira uma máquina de preocupações quando não tem dados suficientes.',
        howToAccompany: [
            'Dê informação concreta: o adversário, o plano de jogo, o papel específico dele. Os dados substituem a incerteza.',
            'Pergunte: "Tem alguma dúvida sobre o que vamos fazer?". Que ele possa esvaziar as perguntas o alivia.',
        ],
        ifNotResponding: 'Diga: "Você pensou bastante e isso está ótimo. Agora confie no que já preparou e jogue". A permissão para soltar a análise o libera.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. Fica olhando de fora
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'mira-desde-afuera',
        eje: 'D',
        whatsHappeningForProfile: 'Raro em um Impulsionador, mas quando acontece é porque não se sente seguro de dominar a situação. Se o exercício ou o grupo são novos, prefere esperar até ter claro como pode se destacar.',
        howToAccompany: [
            'Dê um papel pela borda: "Olha e me diz o que faria diferente". Isso o mantém ativo enquanto observa.',
            'Proponha um desafio de entrada: "Quer tentar? Se não gostar, volta". A saída garantida o encoraja a entrar.',
        ],
        ifNotResponding: 'Deixe-o observar uma rodada completa e depois pergunte diretamente: "Pronto?". O Impulsionador responde bem ao convite direto.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector observa de fora quando não conhece ninguém ou quando sente que o clima social não é seguro. Precisa identificar "a pessoa dele" dentro do grupo antes de entrar.',
        howToAccompany: [
            'Apresente-o a alguém: "Ele é o Mateus, joga na mesma posição que você. Treinem juntos". Um aliado é a porta de entrada dele.',
            'Inclua-o em uma atividade em dupla ou grupo pequeno antes de mandá-lo para o grupo grande.',
        ],
        ifNotResponding: 'Dê um papel social de fora: "Me ajuda a contar os pontos" ou "Me avisa quando terminarem". Isso o conecta ao grupo sem forçar a exposição.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'S',
        whatsHappeningForProfile: 'É o comportamento mais natural do Sustentador diante do novo. Está fazendo a leitura de segurança: quem está, como se movem, quais são as regras. Não está perdendo tempo — está se preparando.',
        howToAccompany: [
            'Não apresse. Dê o tempo de observação que precisa. Um "Quando estiver pronto, entra" sem pressão é o que mais funciona.',
            'Se puder, coloque-o fazendo a mesma atividade ao lado, em paralelo, sem exposição grupal.',
        ],
        ifNotResponding: 'Deixe-o observar a sessão inteira se necessário. Na próxima vez vai entrar mais rápido. O Sustentador constrói segurança acumulando experiências positivas de observação.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista está analisando as regras do jogo de fora. Quer entender a lógica do exercício antes de executá-lo. Não entra até ter claro o "como".',
        howToAccompany: [
            'Explique o exercício brevemente enquanto observa: "Olha, a ideia é fazer isso quando acontece aquilo". Com a lógica clara, ele entra.',
            'Pergunte: "Quer que eu explique?". Isso dá permissão para fazer as perguntas que ele tem na cabeça.',
        ],
        ifNotResponding: 'Diga: "Faz uma vez de teste, não conta". O Estrategista se anima quando sabe que a primeira tentativa é sem avaliação.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. Chora ou se irrita no meio do treino
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'llora-o-se-enoja',
        eje: 'D',
        whatsHappeningForProfile: 'O Impulsionador se irrita mais do que chora. A frustração sai como raiva: joga coisas, grita, ou vai embora. Ele sente que perdeu o controle da situação e isso o desequilibra.',
        howToAccompany: [
            'Não enfrente no calor do momento. Deixe esfriar alguns segundos e depois chegue com tom neutro: "Quando estiver pronto, a gente conversa".',
            'Quando se acalmar, dê uma via de ação: "Agora voltamos e fazemos esse exercício direito". Ele precisa sentir que pode recuperar o controle.',
        ],
        ifNotResponding: 'Tire-o da atividade brevemente ("Bebe água, respira") e deixe-o voltar por conta própria. O Impulsionador precisa sentir que a decisão de voltar foi dele.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector se abala quando sente que a correção rompeu o vínculo. "Está me repreendendo porque não gosta de mim?" O colapso é emocional e social ao mesmo tempo.',
        howToAccompany: [
            'Primeiro repare o vínculo: "Não estou com raiva, quero te ajudar a melhorar". Isso baixa a ameaça emocional.',
            'Depois de se acalmar, reconecte pelo afeto: uma palmadinhas, um "estamos bem?". Para ele é fundamental saber que a relação não se quebrou.',
        ],
        ifNotResponding: 'Peça a um colega de confiança que fique com ele um momento. O Conector se regula melhor com um par do que com uma figura de autoridade.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador raramente se desestabiliza, então se chora, é que realmente saturou. Provavelmente acumulou cansaço, frustração ou desconforto por um bom tempo antes de explodir.',
        howToAccompany: [
            'Dê pausa sem obrigá-lo a explicar: "Senta aqui um momento, não tem problema". A ausência de pressão é o que mais ajuda.',
            'Não pergunte "o que aconteceu?" no momento. Espere que se acalme e depois, com tranquilidade: "Como você está agora?".',
        ],
        ifNotResponding: 'Mantenha-o por perto mas sem atividade. Que fique sentado ao seu lado vendo o grupo. A proximidade sem demanda é a forma dele se recuperar.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista se frustra quando sente que algo não tem lógica ou que a correção foi injusta. O colapso pode parecer "do nada", mas vem de um acumulado de coisas que não fecharam para ele.',
        howToAccompany: [
            'Quando se acalmar, dê uma explicação clara do que aconteceu: "Corrigi porque quero que você faça isso melhor, e o jeito de fazer é este". A lógica o organiza.',
            'Pergunte o que o frustrou especificamente. Muitas vezes o gatilho não é o óbvio.',
        ],
        ifNotResponding: 'Deixe-o sozinho com os pensamentos por alguns minutos. O Estrategista precisa organizar internamente o que aconteceu antes de conseguir falar.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. Tem um atrito com um colega
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'roce-con-companero',
        eje: 'D',
        whatsHappeningForProfile: 'O Impulsionador entra em atrito quando sente que outro está tomando o protagonismo dele ou freando o ritmo. O atrito vem da competição pelo espaço de decisão.',
        howToAccompany: [
            'Separe o conflito da pessoa: "Os dois querem ganhar e isso está ótimo. Agora vamos ver como fazem isso juntos".',
            'Atribua a ele um aspecto do exercício onde ele decide. Se tem seu território, diminui a necessidade de brigar pelo do outro.',
        ],
        ifNotResponding: 'Troque-os de dupla temporariamente. Às vezes a melhor mediação é a distância breve.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector vive o atrito como uma ruptura na relação. Dói mais o "já não somos amigos" do que o conflito em si. Pode reagir buscando aliados ou dramatizando.',
        howToAccompany: [
            'Fale com os dois juntos e foque no vínculo: "Vocês são colegas, isso se resolve conversando. O que aconteceu?".',
            'Depois do exercício, dê um momento ao Conector para fechar: "Estamos bem com seu colega?". Ele precisa saber que a relação continua.',
        ],
        ifNotResponding: 'Dê um papel de ponte: "Me ajuda a fazer o grupo funcionar bem". Transformar o conflito em missão social o tira da mágoa pessoal.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador evita o conflito. Se teve um atrito, provavelmente está muito desconfortável e quer que tudo volte ao normal o quanto antes. Não vai confrontar — vai se fechar.',
        howToAccompany: [
            'Não force a "conversa" na frente do grupo. Chegue em particular: "Vi que aconteceu algo aí, você está bem?".',
            'Ajude-o a voltar para a zona de conforto: a mesma atividade, os mesmos colegas de sempre, rotina normal.',
        ],
        ifNotResponding: 'Deixe o tempo fazer o trabalho. O Sustentador não precisa "resolver" o conflito verbalmente — precisa sentir que tudo voltou ao normal.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista entra em atrito quando sente que o outro faz as coisas "errado" ou sem lógica. O atrito vem da diferença de critério: ele quer fazer bem e o outro quer fazer rápido (ou vice-versa).',
        howToAccompany: [
            'Valide a perspectiva dele: "Sua forma de ver faz sentido". Depois amplie: "E a do seu colega também, porque vem de outro lugar".',
            'Proponha um acordo de método: "Primeiro tentamos do seu jeito, depois do jeito dele, e vemos qual funcionou melhor".',
        ],
        ifNotResponding: 'Dê uma tarefa individual breve. O Estrategista processa melhor os conflitos interpessoais quando tem um momento sozinho para organizar as ideias.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 8. Se pune quando erra
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-castiga',
        eje: 'D',
        whatsHappeningForProfile: 'O Impulsionador se pune com raiva: "Sou um desastre!". Sente que deveria ser capaz de fazer certo sempre, e cada erro é uma traição à autoimagem de líder.',
        howToAccompany: [
            'Interrompa o circuito com ação: "Ok, errou. Agora faz 3 repetições e pronto". A ação imediata substitui a autocrítica.',
            'Use a competitividade a favor: "Os melhores jogadores erram — a diferença é o que fazem depois".',
        ],
        ifNotResponding: 'Tire-o do exercício um momento e dê uma tarefa física simples (correr, quicar a bola). O Impulsionador regula a frustração se movendo.',
    },
    {
        situationId: 'se-castiga',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector se pune pela vergonha: "Todo mundo me viu errar". O que pesa não é o erro técnico, mas a exposição social do erro.',
        howToAccompany: [
            'Normalize o erro na frente do grupo: "Todo mundo erra, é assim que se aprende". Isso baixa a vergonha pública.',
            'Depois, em particular: "Para mim importa que você tente, não que saia perfeito". A reconexão com o adulto o acalma.',
        ],
        ifNotResponding: 'Coloque-o em uma atividade onde o erro faz parte do jogo (um exercício onde todos erram). Isso dilui a sensação de ser "o único".',
    },
    {
        situationId: 'se-castiga',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador se pune em silêncio. Não grita nem se bate, mas fica quieto, abaixa a cabeça, e perde energia. Sente culpa por não ter mantido a consistência que se espera dele.',
        howToAccompany: [
            'Chegue com calma: "Esse erro não define como você joga. Olha tudo que você vem fazendo bem". Ele precisa que alguém devolva a perspectiva.',
            'No exercício seguinte, coloque-o em algo que domina bem para recuperar a confiança antes de voltar ao que errou.',
        ],
        ifNotResponding: 'Não insista em que "não é para tanto". Simplesmente continue o treino normalmente. O Sustentador se recupera quando sente que o ambiente não mudou por causa do erro dele.',
    },
    {
        situationId: 'se-castiga',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista se pune pela análise: revisa o erro uma e outra vez buscando o que fez errado. Se autoexige porque tem padrões altos e sente que deveria ter previsto a falha.',
        howToAccompany: [
            'Dê dados que contrabalanciem o erro: "Errou esse, mas os 5 anteriores fez perfeitamente". Os números o tiram do loop negativo.',
            'Proponha que o erro seja um dado, não um julgamento: "Que informação esse erro te dá? O que você ajustaria?".',
        ],
        ifNotResponding: 'Diga: "Chega de análise por hoje. Amanhã a gente olha com a cabeça fria". Às vezes o Estrategista precisa de permissão para parar de pensar.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 9. Se distrai o tempo todo
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-distrae',
        eje: 'D',
        whatsHappeningForProfile: 'O Impulsionador se distrai quando o exercício não tem intensidade ou desafio suficiente. O motor rápido dele precisa de ação constante e, se o ritmo cai, busca estímulos por conta própria.',
        howToAccompany: [
            'Suba a intensidade: "Agora o mesmo mas na metade do tempo" ou "Quem chegar primeiro escolhe o próximo exercício".',
            'Dê responsabilidade dentro do exercício: que conte, que apite, que lidere uma variação.',
        ],
        ifNotResponding: 'Proponha um desafio paralelo: "Enquanto espera a vez, faz isso aqui". O Impulsionador não tolera o vazio de atividade.',
    },
    {
        situationId: 'se-distrae',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector se distrai porque o que mais o atrai é a interação social. Se o exercício é individual ou silencioso, a atenção vai para o colega ao lado.',
        howToAccompany: [
            'Transforme o exercício em algo social: em duplas, com comunicação entre eles, ou com papéis que exijam conversar.',
            'Use a sociabilidade dele como ferramenta: "Explica para o seu colega como se faz esse exercício".',
        ],
        ifNotResponding: 'Coloque-o no papel de assistente seu: "Vem, me ajuda a organizar isso". A proximidade social com o adulto recupera a atenção dele.',
    },
    {
        situationId: 'se-distrae',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador se distrai quando há estímulo demais: muito barulho, mudanças constantes de exercício, ou instruções novas sem pausa. O sistema dele se desconecta para se proteger do caos.',
        howToAccompany: [
            'Reduza o ritmo das mudanças: deixe que faça o mesmo exercício por mais tempo antes de trocar.',
            'Dê um espaço previsível dentro da atividade: "Você sempre nessa posição, seu trabalho é este".',
        ],
        ifNotResponding: 'Chegue e reconecte com calma: "Está com a gente? Ótimo. O próximo que fazemos é isso". O contato pessoal o traz de volta.',
    },
    {
        situationId: 'se-distrae',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista se distrai quando o exercício parece repetitivo ou sem propósito. A mente dele busca algo para analisar e, se o exercício não oferece isso, busca estímulos em outro lugar.',
        howToAccompany: [
            'Adicione uma camada ao exercício: "Enquanto faz isso, conta quantas vezes o padrão se repete" ou "Vê qual colega se move melhor e por quê".',
            'Explique o que está buscando com o exercício: "Parece simples mas estamos trabalhando X". O propósito o reconecta.',
        ],
        ifNotResponding: 'Proponha que ele invente uma variação do exercício. O Estrategista se concentra quando pode criar.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 10. Diz que quer parar o esporte
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'quiere-dejar',
        eje: 'D',
        whatsHappeningForProfile: 'O Impulsionador quer parar quando sente que não pode ganhar, crescer ou liderar. Se ficou muito tempo sem novos desafios ou sem sentir que progride, o esporte perde sentido para ele.',
        howToAccompany: [
            'Pergunte o que mudaria para ter vontade de voltar: "Se pudesse mudar uma coisa no treino, o que seria?". Ouça a resposta.',
            'Proponha um objetivo concreto e mensurável: "E se nas próximas 3 semanas trabalharmos especificamente nisso?".',
        ],
        ifNotResponding: 'Não pressione. Diga: "A porta está aberta quando quiser". O Impulsionador às vezes precisa sentir falta do desafio para voltar com vontade.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector quer parar quando os vínculos se romperam: se o amigo foi embora, se o grupo mudou, ou se sente que não pertence mais. Para ele, o esporte é o grupo — e se o grupo não o sustenta, não há razão para estar.',
        howToAccompany: [
            'Explore o vínculo: "Tem algo no grupo que te incomoda?". Muitas vezes a razão não é o esporte, mas uma relação social que se quebrou.',
            'Se possível, reconecte-o com um colega próximo ou mude-o para um grupo onde tenha mais afinidade.',
        ],
        ifNotResponding: 'Fale com o adulto responsável. O abandono do Conector costuma ter uma raiz social que pode ser resolvida se identificada a tempo.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador quer parar quando algo mudou demais: novo treinador, novos colegas, mudança de horário ou de local. Não é que não goste do esporte — é que o contexto não se sente mais como "o lugar dele".',
        howToAccompany: [
            'Identifique o que mudou: "Tem algo que antes você gostava e agora não?". O Sustentador pode apontar exatamente o ponto de virada.',
            'Se puder, restaure algo do contexto anterior: o mesmo horário, o mesmo grupo, as mesmas rotinas.',
        ],
        ifNotResponding: 'Dê tempo. Não peça uma decisão definitiva. "Não precisa decidir agora. Vem semana que vem e a gente vê". O Sustentador precisa processar as mudanças com calma.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista quer parar quando sente que não aprende nada novo ou que o treino não faz sentido. Se ficou semanas fazendo a mesma coisa sem entender para quê, a motivação apaga.',
        howToAccompany: [
            'Mostre o progresso que ele fez: "Olha onde você estava 3 meses atrás e onde está agora". Os dados de evolução o reconectam com o processo.',
            'Pergunte o que gostaria de aprender: "Tem algo que você gostaria de praticar?". Dar voz no plano o re-engaja.',
        ],
        ifNotResponding: 'Proponha um desafio intelectual dentro do esporte: analisar um vídeo, planejar uma jogada, assistir a uma partida profissional. Às vezes o Estrategista precisa se conectar com o esporte pela cabeça, não só pelo corpo.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 11. Chega um jogador novo no grupo
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'jugador-nuevo',
        eje: 'D',
        whatsHappeningForProfile: 'O Impulsionador vê o novo como uma variável a avaliar: "É bom? Vai me tirar o lugar?". Pode reagir competindo para marcar território ou ignorando-o.',
        howToAccompany: [
            'Dê um papel de boas-vindas com liderança: "Mostra para ele como fazemos o aquecimento". Isso o coloca em posição de líder, não de competidor.',
            'Monte um exercício onde os dois se destaquem: "Um ataca, o outro defende, depois trocam".',
        ],
        ifNotResponding: 'Deixe a competição natural fazer o trabalho. O Impulsionador vai aceitar o novo quando vir que eleva o nível do grupo.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector provavelmente vai ser o primeiro a se aproximar do novo. Se não o fizer, é porque algo no novo o intimida ou porque sente que o lugar social dele no grupo está ameaçado.',
        howToAccompany: [
            'Peça que seja o "anfitrião": "Acompanha ele hoje, explica como tudo funciona aqui". É o papel natural dele e o empodera.',
            'Se o Conector se mostrar relutante, fale em particular: "Está tudo bem com a chegada de X?". Pode haver uma insegurança social que vale explorar.',
        ],
        ifNotResponding: 'Monte uma atividade onde os dois precisem cooperar obrigatoriamente. A conexão do Conector se ativa fazendo coisas junto.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador é o que mais sente a "ruptura" do equilíbrio. O grupo dele era previsível e seguro, e agora tem alguém que muda a dinâmica. Pode se mostrar distante ou desconfortável.',
        howToAccompany: [
            'Não mude a rotina por causa da chegada do novo. Mantenha para o Sustentador tudo o que puder igual: mesmo lugar, mesmo exercício, mesmos colegas.',
            'Apresente o novo como uma "adição" e não como uma "mudança": "Entra alguém no grupo, tudo o mais continua igual".',
        ],
        ifNotResponding: 'Dê tempo. O Sustentador vai aceitar o novo gradualmente, à medida que ele se torna parte da rotina. Não force a integração.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista observa o novo com curiosidade analítica: "Como ele joga? Onde vai se posicionar? Como afeta o time?". Não chega logo porque está processando as informações.',
        howToAccompany: [
            'Dê informação sobre o novo: "Vem de tal clube, joga em tal posição". Os dados o tranquilizam e permitem que ele posicione o novo no mapa mental.',
            'Proponha que ajude taticamente: "Explica para ele como fazemos essa jogada". Isso o conecta a partir da própria fortaleza.',
        ],
        ifNotResponding: 'Deixe a integração ser orgânica. O Estrategista vai se aproximar do novo quando tiver informação suficiente. Não apresse.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 12. Trava na partida
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-congela',
        eje: 'D',
        whatsHappeningForProfile: 'Raro em um Impulsionador, mas quando trava é porque a pressão o sobrecarregou além do que consegue lidar. Sente que se errar na frente de todos, perde o status.',
        howToAccompany: [
            'Dê uma instrução concreta e simples: "Na próxima bola, chuta ao gol". Uma única ação clara o desbloqueia.',
            'De fora, transmita confiança na capacidade dele: "Você sabe fazer isso, confio em você". O Impulsionador reage ao voto de confiança.',
        ],
        ifNotResponding: 'Mude temporariamente o papel dele para algo menos exposto. Quando fizer uma boa jogada a partir daí, devolva à posição original. Ele precisa de uma pequena vitória para se reativar.',
    },
    {
        situationId: 'se-congela',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector trava quando sente que o erro vai deixá-lo "em evidência" diante do grupo. O bloqueio dele é social: tem medo de passar vergonha na frente dos colegas, não do erro em si.',
        howToAccompany: [
            'Retire a pressão do resultado: "Não importa se sai ou não, quero que você tente". A permissão para errar o desbloqueia.',
            'Envolva os colegas: "Time, todos juntos, todos dentro". Sentir-se acompanhado devolve a segurança.',
        ],
        ifNotResponding: 'Coloque-o em uma jogada coletiva onde o sucesso seja do time, não individual. O Conector se reativa quando a responsabilidade é compartilhada.',
    },
    {
        situationId: 'se-congela',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador trava porque a pressão do jogo quebra a base de segurança. O que no treino era previsível, no jogo é incerto. O sistema dele se protege ficando parado.',
        howToAccompany: [
            'Reduza a pressão com informação: "Faz o mesmo que no treino, nada diferente". Conectá-lo ao que já conhece o desbloqueia.',
            'Dê uma instrução repetitiva: "Cada vez que a bola vier, passa para X". A tarefa simples e previsível o ativa.',
        ],
        ifNotResponding: 'Tire-o alguns minutos se possível. Diga: "Respira, observa como está o jogo, e quando estiver pronto volta". O Sustentador se recupera com a pausa.',
    },
    {
        situationId: 'se-congela',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista trava porque está sobreanalisando: "Passo ou chuto? E se vier o adversário? Qual é a melhor opção?". A mente dele trabalha mais rápido do que o corpo, e o corpo trava.',
        howToAccompany: [
            'Simplifique a tomada de decisão: "Se você estiver livre, chuta. Se não, passa". Reduzir as opções o desbloqueia.',
            'Antes do próximo jogo, ensaie as decisões: "Quando acontecer isso, você faz aquilo". A automatização prévia libera a mente durante o jogo.',
        ],
        ifNotResponding: 'Diga: "Para de pensar, joga". Às vezes o Estrategista precisa de permissão explícita para desligar a análise e confiar no instinto.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 13. Não quer ser o centro das atenções
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'D',
        whatsHappeningForProfile: 'Muito raro em um Impulsionador. Se acontece, provavelmente ele se sente inseguro nessa atividade específica. Não quer se expor onde não se sente forte.',
        howToAccompany: [
            'Ofereça-lhe liderar algo onde se sinta seguro: "Quer mostrar o exercício que você manda mais?". O Impulsionador se expõe quando sabe que vai brilhar.',
            'Faça aos poucos: "Hoje você faz com um colega, na próxima você faz sozinho".',
        ],
        ifNotResponding: 'Não force. Diga: "Quando estiver pronto, a oportunidade está aqui". O Impulsionador volta sozinho quando se sentir preparado.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector pode curtir a atenção social, mas não a atenção avaliativa. Se sente que estão "examinando" em vez de "acompanhando", se retrai.',
        howToAccompany: [
            'Transforme a exposição em algo social: "Faz com o seu colega" ou "Explica para o grupo enquanto faz".',
            'Retire a carga avaliativa: "Não é para ver quem faz melhor, é para todos aprendermos".',
        ],
        ifNotResponding: 'Deixe-o participar de um papel social: que escolha quem passa, que comente a jogada, que anime. É a forma dele estar presente sem estar exposto.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'S',
        whatsHappeningForProfile: 'É natural no Sustentador. A forma de contribuir dele é pelo suporte, não pelo protagonismo. Forçá-lo a ser o centro vai contra a natureza dele e o faz sentir vulnerável.',
        howToAccompany: [
            'Proponha formas de liderança silenciosa: "Garante que todos tenham o que precisam" ou "Você é o que mantém o ritmo".',
            'Se precisar que se exponha, avise com antecedência: "Semana que vem vou te pedir para mostrar o exercício". A antecipação baixa a ansiedade.',
        ],
        ifNotResponding: 'Não insista. Busque outra forma de ele participar onde se sinta confortável. O Sustentador contribui mais a partir da zona de segurança do que da exposição forçada.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista não quer se expor se não está seguro de que vai fazer bem. O padrão dele é alto e a ideia de errar em público gera muito desconforto.',
        howToAccompany: [
            'Dê tempo de preparação: "Semana que vem te peço para explicar essa jogada ao grupo. Vai se preparando". Com tempo, o Estrategista se sente seguro.',
            'Ofereça um formato que use a fortaleza dele: que analise uma jogada em vez de demonstrá-la fisicamente, que desenhe num quadro, que explique a lógica.',
        ],
        ifNotResponding: 'Proponha que faça por escrito ou desenhado. O Estrategista se expressa melhor quando pode organizar as ideias antes de compartilhá-las.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 14. Mudou de um dia para o outro
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'cambio-repentino',
        eje: 'D',
        whatsHappeningForProfile: 'Um Impulsionador que apaga provavelmente perdeu algo que o fazia sentir poderoso: um papel, uma relação, uma segurança fora da quadra. A energia vital está indo para outra briga.',
        howToAccompany: [
            'Não pergunte "o que aconteceu?" de cara. Primeiro observe alguns dias. Se persistir, chegue com algo concreto: "Estou te achando diferente, posso ajudar em algo?".',
            'Se não quiser falar, dê um desafio físico que o ative: "Hoje preciso que você lidere o aquecimento". Às vezes a ação devolve a energia que as palavras não conseguem.',
        ],
        ifNotResponding: 'Fale com o adulto responsável (pai, mãe). A mudança persistente num Impulsionador costuma ser sinal de algo importante fora da quadra.',
    },
    {
        situationId: 'cambio-repentino',
        eje: 'I',
        whatsHappeningForProfile: 'Um Conector que se fecha é um sinal forte. A natureza dele é social, então se está quieto ou isolado, algo está doendo no plano vincular: uma briga com amigos, uma mudança na família, ou bullying.',
        howToAccompany: [
            'Chegue pelo vínculo: "Eu te conheço e sei que algo está acontecendo. Não precisa me contar, mas quero que saiba que estou aqui".',
            'Dê espaço para se reconectar no próprio ritmo. Não force o "estar bem" — isso invalida o que ele sente.',
        ],
        ifNotResponding: 'Contate o adulto responsável. A mudança sustentada num Conector costuma estar ligada a uma situação relacional que precisa de atenção fora da quadra.',
    },
    {
        situationId: 'cambio-repentino',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador que muda de repente está mostrando que algo quebrou a base de segurança dele. É o perfil que mais "aguenta" antes de mostrar desconforto — se você já está vendo, provavelmente vem acumulando há um tempo.',
        howToAccompany: [
            'Mantenha a rotina o mais estável possível. No meio do que quer que esteja acontecendo lá fora, o treino pode ser o refúgio de normalidade dele.',
            'Chegue sem drama: "Como você está hoje?" de forma natural, como parte da rotina. Se quiser falar, vai falar.',
        ],
        ifNotResponding: 'Contate o adulto responsável com cuidado: "Percebi que ele vem diferente essas últimas semanas, está tudo bem em casa?". O Sustentador raramente pede ajuda — é preciso ir buscar.',
    },
    {
        situationId: 'cambio-repentino',
        eje: 'C',
        whatsHappeningForProfile: 'Um Estrategista que muda de comportamento pode estar processando internamente algo que não consegue resolver. A mente analítica dele pode estar em loop com uma situação sem solução lógica (um problema familiar, uma injustiça percebida).',
        howToAccompany: [
            'Ofereça espaço para organizar o que pensa: "Quer me contar o que está passando pela cabeça? Às vezes ajuda dizer em voz alta".',
            'Se não quiser falar, respeite. Proponha algo que o ajude a processar do jeito dele: "Se quiser, escreve o que está sentindo e me mostra quando estiver pronto".',
        ],
        ifNotResponding: 'Contate o adulto responsável. Mudanças sustentadas no Estrategista, especialmente se ficar irritado ou distante, costumam indicar uma situação que precisa de suporte profissional.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 15. O time perdeu e ninguém quer saber de nada (GRUPAL)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'derrota-grupal',
        eje: 'group',
        whatsHappeningForProfile: 'O grupo inteiro está processando a derrota a partir do próprio perfil: os Impulsionadores estão com raiva, os Conectores sentem que falharam como time, os Sustentadores se fecharam, e os Estrategistas estão revisando cada erro. O clima coletivo está baixo.',
        howToAccompany: [
            'Não tente falar do jogo imediatamente depois de perder. Dê ao grupo alguns minutos de silêncio ou de descompressão livre antes de reuni-los.',
            'Quando os reunir, comece pelo que funcionou: "Hoje fizemos bem isso, isso e isso. O que não saiu, trabalhamos semana que vem". Resultado no final, processo primeiro.',
            'Proponha ao grupo um ritual de encerramento: uma roda onde cada um diz uma coisa boa que viu em um colega. Isso reconecta o time pelo vínculo, não pelo placar.',
        ],
        ifNotResponding: 'Não force a positividade. Às vezes o grupo precisa ficar triste um tempo. Diga: "Hoje dói, e está tudo bem que doa. Amanhã começamos de novo". A permissão para sentir a derrota é o primeiro passo para superá-la.',
    },
];
