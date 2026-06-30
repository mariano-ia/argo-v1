// Auto-generated Portuguese (PT-BR) translations for situationalGuide.ts
// Situation IDs, eje values, and category keys are kept as-is (identifiers).
// Profile names: Impulsor→Impulsionador, Conector→Conector, Sosten→Sustentador, Estratega→Estrategista

import type { Situation, SituationCard } from './situationalGuide';

/* ── As 15 situações ────────────────────────────────────────────────────────── */

export const SITUATIONS_PT: Situation[] = [
    {
        id: 'no-quiere-arrancar',
        title: 'Custa entrar no treino',
        whatYouSee: 'O jogador chega ao treino e não quer participar. Está apático, reclama, senta no canto ou diz "hoje não estou com vontade".',
        whatsHappening: 'Não é falta de comprometimento. A criança ainda está no "modo" do que estava fazendo antes (escola, casa, uma briga com um amigo). Ela precisa de um momento para fazer a transição para o esporte.',
        profilePerspectives: 'Se o jogador tem perfil {{Impulsionador}}, pode ser que não veja um desafio que o motive a começar: precisa sentir que o que vem vale a pena. Se é {{Conector}}, provavelmente falta a conexão social: se o amigo não veio ou o clima do grupo está estranho, fica difícil se engajar. Um perfil {{Sustentador}} pode precisar de mais tempo para fazer a transição, especialmente se algo na rotina mudou. E se é {{Estrategista}}, talvez esteja processando algo que aconteceu antes e precise fechar aquela ideia antes de conseguir focar em outra coisa.',
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
        title: 'Processa as instruções no seu próprio ritmo',
        whatYouSee: 'Você dá uma instrução e o jogador faz outra coisa, demora muito para começar, ou parece que não escutou.',
        whatsHappening: 'Ele não está ignorando você. Cada criança processa as instruções no seu próprio ritmo. Alguns agem antes de terminar de ouvir, outros precisam de mais tempo para entender a lógica do que foi pedido. É uma diferença de velocidade de processamento, não de atitude.',
        profilePerspectives: 'O {{Impulsionador}} pode já ter saído para executar antes de você terminar de falar (o motor dele o empurra à ação antes de escutar). O {{Conector}} talvez estivesse conversando com um colega e perdeu a instrução. Um {{Sustentador}} pode ter escutado tudo perfeitamente, mas precisa de um momento a mais para se sentir seguro antes de começar. E o {{Estrategista}} provavelmente está analisando se a instrução faz sentido antes de se mover. Não é resistência, é o jeito dele processar.',
        category: 'Comunicación',
        icon: '',
    },
    {
        id: 'raro-antes-del-partido',
        title: 'Vive com tensão a véspera do jogo',
        whatYouSee: 'O jogador está mais quieto ou mais agitado que o normal antes de competir. Pode estar nervoso, ir ao banheiro várias vezes, ou ao contrário, estar hiperativo e sem parar de se mexer.',
        whatsHappening: 'Ele sente que as expectativas estão altas (as próprias ou as de fora) e o corpo reage diante da incerteza do que vai acontecer. Cada perfil mostra isso de um jeito diferente: uns se fecham, outros aceleram.',
        profilePerspectives: 'O {{Impulsionador}} pode ficar hiperativo, falar muito e se mexer sem parar: é a forma dele canalizar a adrenalina. O {{Conector}} tende a buscar alguém por perto e falar de qualquer coisa para se sentir acompanhado. Um {{Sustentador}} pode ficar bem quieto e precisar que você confirme que tudo vai ficar bem. E o {{Estrategista}} provavelmente está revisando mentalmente cada jogada possível. O silêncio dele não é nervosismo, é preparação.',
        category: 'Presión',
        icon: '',
    },
    {
        id: 'mira-desde-afuera',
        title: 'Fica olhando de fora',
        whatYouSee: 'O jogador não entra no grupo. Fica na beira da quadra observando, especialmente quando é um exercício novo ou um grupo que ele não conhece bem.',
        whatsHappening: 'Ele está fazendo um "escaneamento" do terreno. Precisa entender como funciona a dinâmica antes de entrar. Não é timidez nem covardia, é a forma dele se preparar para participar com segurança.',
        profilePerspectives: 'Se é {{Impulsionador}}, provavelmente não está de fora por medo, mas porque ainda não encontrou o momento certo para entrar com protagonismo. O {{Conector}} pode estar esperando que alguém o convide ou o inclua (precisa do sinal social). Um {{Sustentador}} está avaliando se o ambiente é previsível e seguro antes de se expor. E o {{Estrategista}} está literalmente estudando a dinâmica: quem faz o quê, como funciona o exercício, quais são as regras implícitas.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'llora-o-se-enoja',
        title: 'Transborda emocionalmente no treino',
        whatYouSee: 'O jogador se desestabiliza emocionalmente durante uma atividade. Pode ser choro, raiva, ou os dois. Às vezes é depois de uma correção, às vezes parece "do nada".',
        whatsHappening: 'Tudo se acumulou: o cansaço, o barulho, as correções, a exigência do exercício. O sistema dele saturou e a emoção transbordou. Não é birra: é que naquele momento a demanda superou o que ele conseguia processar.',
        profilePerspectives: 'O {{Impulsionador}} tende a transbordar com raiva: grita, chuta algo, reclama em voz alta. É a forma dele soltar a pressão rápido. O {{Conector}} pode chorar se sentir que foi corrigido na frente do grupo ou se alguém o excluiu. Um {{Sustentador}} provavelmente vinha acumulando há um tempo e o colapso é a gota d\'água (o transbordamento costuma surpreender porque antes não dava sinais). O {{Estrategista}} pode se irritar consigo mesmo em silêncio e precisar de um momento sozinho para se reorganizar.',
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'roce-con-companero',
        title: 'Tem um atrito com um colega',
        whatYouSee: 'Dois jogadores entram em conflito durante um exercício. Pode ser uma discussão, uma reclamação, ou simplesmente não conseguir trabalhar juntos.',
        whatsHappening: 'Cada criança tem um estilo natural de encarar as coisas. Quando dois estilos muito diferentes se encontram sem mediação, gera atrito. Não é que um tem razão e o outro não: são ritmos e abordagens diferentes.',
        profilePerspectives: 'Se há um {{Impulsionador}} no atrito, é provável que queira impor a ideia ou o ritmo dele, não por maldade, mas porque a natureza dele é liderar. O {{Conector}} pode levar para o pessoal e se sentir rejeitado pelo colega. Um {{Sustentador}} provavelmente tenta evitar o conflito até não aguentar mais, e aí reage de uma vez. E o {{Estrategista}} pode se frustrar se sentir que o outro não está seguindo a lógica correta do exercício.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'se-castiga',
        title: 'Se pune quando erra',
        whatYouSee: 'Depois de um erro, o jogador bate na própria cabeça, se xinga, diz "sou um desastre" ou se irrita consigo mesmo de forma exagerada.',
        whatsHappening: 'Ele mede o próprio valor em função da perfeição do movimento. Cada erro sente como uma prova de que "não serve". A autoexigência saiu do controle e entrou num ciclo de punição que não o deixa continuar jogando bem.',
        profilePerspectives: 'O {{Impulsionador}} se pune porque precisa se sentir capaz, e o erro ameaça essa imagem (a reação costuma ser rápida, intensa e visível). O {{Conector}} pode se punir pensando no que os outros acham dele depois do erro. Um {{Sustentador}} tende a se punir em silêncio, ruminando internamente. E o {{Estrategista}} pode ser o mais duro consigo mesmo porque já tinha calculado o que fazer e sente que "deveria ter feito certo".',
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'se-distrae',
        title: 'Custa sustentar a atenção',
        whatYouSee: 'O jogador olha para outro lado, conversa com o colega ao lado, brinca com algo que não tem nada a ver, ou simplesmente não está "presente" no exercício.',
        whatsHappening: 'O treino não está sintonizando com o ritmo dele. Pode ser que o exercício seja lento demais para o motor dele (fica entediado) ou caótico demais para o estilo dele (se desconecta). A distração é um sinal de que algo no formato não está chegando até ele.',
        profilePerspectives: 'O {{Impulsionador}} se distrai quando o exercício é lento ou repetitivo demais: precisa de mais intensidade ou competição para se manter engajado. O {{Conector}} pode se distrair socializando porque para ele conversar com o colega É estar presente (a atenção dele funciona diferente). Um {{Sustentador}} se desconecta quando há caos, barulho ou mudanças demais: precisa de previsibilidade para se concentrar. E o {{Estrategista}} pode parecer distraído quando na verdade está pensando em outra coisa: uma jogada anterior, um padrão que detectou, algo que chamou sua atenção.',
        category: 'Concentración',
        icon: '',
    },
    {
        id: 'quiere-dejar',
        title: 'Diz que quer parar o esporte',
        whatYouSee: 'O jogador diz que não quer mais vir, que não gosta, ou simplesmente para de aparecer.',
        whatsHappening: 'O esforço emocional que custa se adaptar ao ambiente esportivo ficou maior do que o prazer que sente. Não é que não goste do esporte: é que algo no contexto está drenando mais do que preenchendo. O objetivo não é convencê-lo a ficar a qualquer custo, mas ajustar o ambiente para ver se o prazer pode voltar.',
        profilePerspectives: 'Um {{Impulsionador}} pode querer parar se sentir que não tem espaço para liderar ou que o nível de desafio não o motiva. O {{Conector}} tende a ir embora quando sente que não pertence ao grupo ou que a dinâmica social o deixa de fora. Um {{Sustentador}} pode querer parar se as mudanças constantes ou a pressão o esgotam (precisa de estabilidade para aproveitar). E o {{Estrategista}} pode se desconectar se sentir que ninguém valoriza a forma como vê o jogo ou se a atividade parece caótica demais.',
        category: 'Motivación',
        icon: '',
    },
    {
        id: 'jugador-nuevo',
        title: 'Chega um jogador novo no grupo',
        whatYouSee: 'Um jogador que não conhece ninguém entra no grupo. O grupo reage: alguns o recebem bem, outros o ignoram, outros se sentem desconfortáveis com a mudança.',
        whatsHappening: 'A chegada de alguém novo altera o equilíbrio que o grupo já tinha. Os jogadores que valorizam a estabilidade sentem que algo se quebrou. Os mais sociais provavelmente o recebem rápido. Cada perfil vive a mudança de forma diferente.',
        profilePerspectives: 'O {{Impulsionador}} provavelmente vai recebê-lo bem se vir que o novo pode ser um aliado ou um rival interessante (avalia rápido). O {{Conector}} pode ser o primeiro a se aproximar e fazê-lo sentir bem-vindo, é a natureza integradora dele. Um {{Sustentador}} pode se sentir desconfortável com a mudança na dinâmica do grupo e precisar de tempo para se adaptar. E o {{Estrategista}} vai observar o novo de longe antes de interagir: não é rejeição, é a forma dele entender quem é.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'se-congela',
        title: 'Trava na partida',
        whatYouSee: 'Um jogador que rende bem no treino, na partida parece outro: não corre, não pede a bola, não reage. Como se tivesse "desligado".',
        whatsHappening: 'A pressão da partida ativou um mecanismo de proteção. Diante do olhar do público ou da importância do momento, o corpo escolhe "não fazer nada" para evitar errar. Não é que não queira: é que travou.',
        profilePerspectives: 'O {{Impulsionador}} trava quando sente que há muito em jogo e não pode se dar ao luxo de errar: a pressão freia o motor em vez de acelerá-lo. O {{Conector}} pode travar se sentir que o olhar do público ou dos pais está o avaliando. Um {{Sustentador}} tende a travar quando a situação parece imprevisível ou caótica (precisa de uma âncora de segurança). E o {{Estrategista}} pode paralisar por excesso de análise: vê opções demais e não consegue escolher uma a tempo.',
        category: 'Presión',
        icon: '',
    },
    {
        id: 'no-quiere-ser-centro',
        title: 'Não quer ser o centro das atenções',
        whatYouSee: 'Quando toca liderar uma atividade, falar na frente do grupo, ou fazer uma demonstração sozinho, o jogador se recusa, se esconde ou fica muito desconfortável.',
        whatsHappening: 'A forma natural dele de participar é de um lugar mais reservado. Obrigá-lo a ser o centro das atenções é como pedir a um canhoto que escreva com a direita: pode fazer, mas sofre. Existem formas de liderança que não exigem estar no centro.',
        profilePerspectives: 'Um {{Impulsionador}} normalmente quer estar no centro, então se resistir pode ser por outra coisa: insegurança pontual ou cansaço. O {{Conector}} pode querer participar, mas tem vergonha de fazer sozinho (funciona melhor acompanhado). Um {{Sustentador}} genuinamente prefere o segundo plano e se sente exposto quando colocado à frente: pode liderar pelo apoio, não pelo palco. E o {{Estrategista}} pode sentir que falar na frente de todos o obriga a improvisar, algo que gera muito desconforto. Dê um tempo para se preparar e responde diferente.',
        category: 'Social',
        icon: '',
    },
    {
        id: 'cambio-repentino',
        title: 'Mudou de um dia para o outro',
        whatYouSee: 'Um jogador que sempre foi de um jeito de repente está diferente: quieto, irritado, ou desconectado. E não volta ao estado normal.',
        whatsHappening: 'Algo fora da quadra está o afetando: pode ser a escola, a casa, uma situação familiar, uma dificuldade com amigos. A mudança de comportamento sustentada é um sinal de que algo externo está drenando a energia emocional dele.',
        profilePerspectives: 'Um {{Impulsionador}} que de repente está apagado é um sinal claro de que algo acontece: a natureza dele é estar ativo, e a ausência dessa energia é significativa. O {{Conector}} pode se tornar quieto ou se isolar do grupo quando algo externo o afeta. Um {{Sustentador}} pode mostrar irritabilidade ou resistência onde antes havia calma (a mudança costuma ser sutil mas persistente). E um {{Estrategista}} que se desconecta pode estar processando algo internamente que o absorve por completo.',
        category: 'Observación',
        icon: '',
    },
    {
        id: 'derrota-grupal',
        title: 'O time custa a se recuperar de uma derrota',
        whatYouSee: 'Depois de uma derrota, o grupo inteiro está desanimado. Ninguém fala, ou todos se culpam. O clima fica pesado.',
        whatsHappening: 'O time como grupo parou de ver o processo e ficou preso no resultado. A derrota se sente coletiva e isso pesa mais do que quando perde um único jogador. O grupo precisa se reconectar com o que os une além do placar.',
        category: 'Grupal',
        icon: '',
    },
    {
        id: "acepta-ser-suplente",
        title: "Ele tem dificuldade em aceitar ser reserva",
        whatYouSee: "O jogador fica no banco e dá para perceber. Ele abaixa o olhar, se fecha, responde curto ou, de lado, mostra irritação ou desânimo enquanto espera o seu momento.",
        whatsHappening: "Nessa idade, a criança ainda não separa totalmente entre ser titular e valer como pessoa. Não estar em campo não é vivido como uma etapa ou uma decisão técnica, é vivido como uma mensagem sobre o quanto ela importa para você e para o grupo. Ela não está reclamando do papel, está cuidando do seu lugar. Ela precisa que alguém confirme que continua fazendo parte e que isso não define quem ela é.",
        profilePerspectives: "Cada criança guarda esse momento à sua maneira. O {{Impulsionador}} sente como uma perda de controle e de protagonismo, tem dificuldade em ficar parado vendo outros jogarem e pode mostrar impaciência ou intensidade no banco. O {{Conector}} teme ter decepcionado, olha para o grupo e se pergunta se ainda o querem ali, e precisa se sentir incluído mesmo que não entre. O {{Sustentador}} guarda o mal-estar em silêncio, parece que aceita sem problema, mas por dentro acumula e isso pode aparecer mais tarde como desânimo. O {{Estrategista}} fica remoendo, procura a razão exata de por que ele e não outro, e se não entende o critério pode ficar travado pensando que fez algo errado.",
        category: "Rol",
        icon: '',
    },
    {
        id: "companero-se-destaca",
        title: "Ele tem dificuldade quando um colega se destaca",
        whatYouSee: "Um colega recebe parabéns, é escolhido ou faz a diferença em uma jogada, e a criança se apaga. Faz cara feia, minimiza a conquista do outro (\"ele teve sorte\"), reclama da divisão do protagonismo ou diminui a intensidade no resto do treino.",
        whatsHappening: "Não é egoísmo nem má intenção. Nessa idade, a criança ainda mede seu valor se comparando com os outros, então quando outro brilha ela sente que o seu próprio lugar fica menor. O que aparece (ciúmes, irritação, desmotivação) é na verdade medo de não ser suficiente. Ela precisa de ajuda para entender que o outro pode se destacar sem que isso tire nada dela.",
        profilePerspectives: "Cada perfil vive essa comparação à sua maneira. O {{Impulsionador}} a sente como uma competição direta pelo primeiro lugar: se o outro brilha, ele lê isso como uma derrota e reage rápido, querendo mostrar na hora que ele também pode. O {{Conector}} sofre sobretudo com o deslocamento social: dói ver a atenção e o carinho do grupo irem para outro, e pode entender isso como se já não o quisessem do mesmo jeito. O {{Sustentador}} costuma guardar o incômodo em silêncio, baixa um pouco e se afasta para o segundo plano, até que a irritação acumulada aparece mais tarde de uma vez. E o {{Estrategista}} entra em ciclo analisando por que o outro fez melhor, se comparando ponto por ponto e sendo duríssimo consigo mesmo nessa conta interna.",
        category: "Social",
        icon: '',
    },
    {
        id: "recibe-correccion",
        title: "Tem dificuldade para receber uma correção",
        whatYouSee: "Toda vez que você aponta algo para melhorar, o jogador se fecha, se justifica, faz cara de incômodo ou desanima. A correção técnica muda o humor dele mais do que você esperaria.",
        whatsHappening: "Ele não está desafiando a sua autoridade nem lhe falta humildade. Nessa idade, muitas crianças ainda não separam o que fazem do que são, então ouvem \"isto dá para melhorar\" e por dentro sentem \"não sou suficiente\". A reação que você vê (se justificar, se ofender, desanimar) é uma forma de se proteger desse golpe no seu valor. Quando ele entende que a correção fala do gesto e não da sua pessoa, a porta se abre.",
        profilePerspectives: "Cada criança protege o seu valor de um jeito. O {{Impulsionador}} costuma ler a correção como uma perda de controle ou de status, então se justifica rápido ou discute para não ficar por baixo. O {{Conector}} a vive em chave de vínculo: sente que decepcionou você ou que ficou exposto diante do grupo, e isso o atinge mais do que a técnica em si. O {{Sustentador}} encaixa em silêncio, concorda para evitar o atrito, mas por dentro guarda o incômodo e pode desanimar mais tarde. O {{Estrategista}} fica duro consigo mesmo, dá voltas no detalhe e se trava analisando tudo o que fez, e tem dificuldade para soltar o erro e seguir em frente.",
        category: "Comunicación",
        icon: '',
    },
    {
        id: "gestiona-exito",
        title: "Fica convencido quando as coisas vão bem",
        whatYouSee: "Quando as coisas vão bem (faz um gol, vence ou é elogiado) a atitude dele muda. Relaxa, diminui o esforço, se desliga do time ou começa a subestimar o adversário.",
        whatsHappening: "Não é soberba nem falta de respeito. A criança ainda não tem as ferramentas internas para sustentar uma emoção tão grande sem se desorganizar, e o sucesso a enche de uma intensidade que ela não sabe bem onde colocar. Nessa idade, a euforia é tão difícil de regular quanto a frustração, e quase sempre se expressa para fora. Aprender a lidar com o que é bom faz parte do mesmo processo que aprender a sustentar o que é difícil.",
        profilePerspectives: "Cada perfil vive a euforia à sua maneira. O {{Impulsionador}} se acende rápido e precisa que sua conquista seja notada, então o sucesso pode levá-lo a afrouxar porque já sente que venceu e que o desafio terminou. O {{Conector}} aproveita o reconhecimento do grupo e, levado pela emoção, pode monopolizar o momento buscando que todos comemorem com ele e perder de vista o resto do time. O {{Sustentador}} costuma viver o sucesso de forma mais calada, mas por dentro o guarda e às vezes relaxa demais ao sentir que a pressão diminuiu. O {{Estrategista}} analisa seu bom rendimento e pode se convencer de que já entendeu tudo, baixando a guarda porque sente que não tem mais nada a melhorar.",
        category: "Emocional",
        icon: '',
    },
    {
        id: "rol-referente",
        title: "Tem dificuldade em assumir um papel de referência",
        whatYouSee: "O grupo ou você o apontam como referência ou capitão, e o jogador fica desconfortável. Evita o papel, o minimiza, fica tenso quando precisa dar o exemplo, ou o exerce de uma forma que não sai natural.",
        whatsHappening: "Não é que ele não consiga liderar. É que o lugar que lhe propõem parece grande demais ou alheio a ele, e sente o peso da responsabilidade antes de ter clareza de como ocupá-lo. Liderar não é uma única forma, e esta criança ainda está descobrindo a sua. O desconforto é um sinal de respeito pelo papel, não de falta de capacidade.",
        profilePerspectives: "Cada jogador vive o papel de referência a partir da sua natureza. O {{Impulsionador}} costuma aceitá-lo rápido porque gosta de estar à frente, embora possa confundir liderar com mandar, e tem dificuldade quando o grupo não o segue no ritmo que ele marca. O {{Conector}} lidera a partir do vínculo e quer que todos estejam bem, então o peso chega quando sente que precisa escolher ou colocar um limite nos colegas. O {{Sustentador}} costuma preferir o segundo plano e teme ficar exposto demais, embora já sustente o grupo de formas silenciosas que quase ninguém nomeia. O {{Estrategista}} hesita porque sente que ainda não entende muito bem o que se espera dele, e prefere esperar a exercer o papel pela metade ou errar na frente de todos.",
        category: "Rol",
        icon: '',
    },
    {
        id: "expectativa-padres",
        title: "Carrega com a expectativa dos pais",
        whatYouSee: "O jogador olha com frequência para a arquibancada durante a partida ou o treino. Fica tenso quando os pais estão presentes e joga diferente: mais nervoso, mais rígido ou preocupado com a forma como o veem de fora.",
        whatsHappening: "A criança ainda está aprendendo a jogar para si mesma e não para os outros. Sente que o seu desempenho decide algo importante para os adultos que mais ama, e essa carga pesa mais do que qualquer adversário. Não é que se importe demais com o que pensam: ela ainda não aprendeu a separar o seu próprio desejo de jogar do desejo que os pais depositam sobre ela.",
        profilePerspectives: "Cada criança carrega essa expectativa à sua maneira. O {{Impulsionador}} a transforma em uma pressão por ganhar a qualquer custo: se erra, sente que decepcionou e reage com raiva ou se exigindo demais para mostrar que é capaz. O {{Conector}} vive isso como uma questão de vínculo: precisa que os pais estejam orgulhosos e se desinfla assim que percebe uma cara séria na arquibancada, porque para ele jogar bem e ser amado se misturam. O {{Sustentador}} guarda a tensão por dentro, não a mostra, segue jogando calado mas mais rígido, até que a carga acumulada aparece de repente em um dia ruim. O {{Estrategista}} se enfia na própria cabeça: analisa o que esperam dele, se autoexige o dobro e acaba jogando travado por medo de não estar à altura do que acredita que os adultos querem ver.",
        category: "Presión",
        icon: '',
    },
    {
        id: "sube-categoria",
        title: "Tem dificuldade de se adaptar ao subir de categoria",
        whatYouSee: "O jogador subiu para uma categoria superior e percebe-se que ele está diferente. Participa menos, busca menos a bola, fica calado ou se gruda nos colegas que já conhecia. Às vezes se compara em voz alta com os mais velhos.",
        whatsHappening: "Ele não perdeu o seu nível. Na categoria anterior era uma referência e agora é o mais novo entre jogadores maiores, mais rápidos e mais fortes fisicamente. Essa sensação de começar do zero mexe com a confiança dele e ele precisa de tempo para se reposicionar e voltar a se sentir parte. A transição é de identidade, não só de jogo.",
        profilePerspectives: "Cada criança vive esse salto a partir do seu jeito de funcionar. O {{Impulsionador}} sente que já não é quem dita o ritmo e, ao perder esse lugar de referência, pode esconder a insegurança por trás da raiva ou competindo demais para recuperar o protagonismo. O {{Conector}} vive principalmente o lado social: deixou para trás o seu grupo e ainda não encontrou o seu lugar entre os novos, então se sente sozinho mesmo cercado de gente. O {{Sustentador}} se desestabiliza com a mudança de rotina e de rostos conhecidos, recua para o segundo plano e sustenta o incômodo em silêncio até que um dia tudo pesa de uma vez. O {{Estrategista}} se volta para dentro para ler tudo o que é novo (o ritmo, os códigos, onde ele se encaixa) e, enquanto processa, pode parecer apagado ou hesitar antes de jogar porque ainda não entende totalmente o cenário.",
        category: "Rol",
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
        whatsHappeningForProfile: 'O Impulsionador costuma precisar sentir que o que vem vale a pena. Se não vê um desafio claro, a transição tende a custar mais. O motor dele o empurra à ação, mas só quando o objetivo o motiva.',
        howToAccompany: [
            'Proponha um mini-desafio pessoal para os primeiros 5 minutos: "Vamos ver se você começa mais rápido do que da última vez".',
            'Dê um papel ativo desde o início: que monte os cones, que escolha o primeiro exercício, que lidere o aquecimento.',
        ],
        ifNotResponding: 'Deixe-o observar os primeiros minutos sem pressão. Quando vir o grupo em ação, o instinto competitivo dele costuma se ativar sozinho.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector costuma precisar de conexão social para se ativar. Se chegou sozinho, se o amigo não veio, ou se o clima do grupo está estranho, tende a ficar difícil se engajar. A energia dele se acende nas pessoas, não na atividade em si.',
        howToAccompany: [
            'Chegue perto e pergunte algo pessoal: "Como foi o dia?". Essa micro-conexão é o interruptor de ignição dele.',
            'Coloque-o ao lado de alguém com quem tem afinidade no primeiro exercício.',
        ],
        ifNotResponding: 'Inclua-o em uma atividade grupal divertida (não técnica). Uma brincadeira de aquecimento onde ele ria costuma ser suficiente para entrar.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador costuma precisar que tudo esteja "no lugar" para se sentir seguro. Se o treino mudou de horário, se há alguém novo, ou se algo na rotina foi alterado, a transição tende a ficar mais pesada. O motor mais lento dele faz com que a troca de modo leve mais tempo.',
        howToAccompany: [
            'Mantenha a rotina: que faça o mesmo aquecimento de sempre, no mesmo lugar, com os mesmos colegas.',
            'Não peça que explique por que não quer. Simplesmente dê um par de minutos e diga: "Começamos quando você estiver pronto".',
        ],
        ifNotResponding: 'Dê uma tarefa pequena e previsível ("Faça 10 toques de bola aqui do meu lado") para que entre no ritmo sem pular direto para o grupo.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista costuma precisar entender o que vai acontecer antes de se comprometer. Se não sabe o que vai ser treinado, ou se o plano mudou sem explicação, tende a ficar de fora processando. O motor de processamento dele precisa fechar a lógica antes de começar.',
        howToAccompany: [
            'Conte brevemente o que vão fazer hoje: "Primeiro aquecimento, depois um exercício tático, e terminamos com jogo". A previsibilidade o ativa.',
            'Se algo do plano habitual mudou, explique o porquê: "Hoje vamos fazer algo diferente porque precisamos praticar X".',
        ],
        ifNotResponding: 'Deixe-o observar a primeira atividade de fora. Quando entender a lógica do exercício, é provável que entre sozinho.',
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
        whatsHappeningForProfile: 'O Conector tende a viver a derrota como uma ruptura social: "falhei com o grupo", "não fui suficiente para o time". A frustração dele costuma vir mais do impacto nos outros do que do resultado em si.',
        howToAccompany: [
            'Valide a emoção pelo lado do vínculo: "Dá para ver o quanto você se importa com o time, isso diz muito de você".',
            'Separe-o do "falhei com o grupo" com dados: "Olha tudo que o time conquistou hoje, e você foi parte disso".',
        ],
        ifNotResponding: 'Peça para um colega de confiança conversar com ele. O Conector se recupera mais rápido com o apoio de um par do que com a palavra do adulto.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador costuma não explodir com a derrota; mais que isso, tende a guardá-la. Fica quieto, se recolhe, e pode arrastar a frustração por vários dias. A estabilidade natural dele o faz parecer "bem" por fora, mas por dentro custa soltar.',
        howToAccompany: [
            'Valide sem forçar: "Se precisar conversar, estou aqui". Não peça que processe na hora.',
            'Nos treinos seguintes, observe se está mais quieto que o habitual. Se notar diferença, um "como você está?" sem pressão costuma abrir a porta.',
        ],
        ifNotResponding: 'Mantenha a rotina e a normalidade. O Sustentador se recupera quando sente que tudo continua igual ao redor, apesar do resultado.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista tende a analisar a derrota em loop: revisa cada erro, cada jogada, buscando o momento exato onde tudo saiu errado. A frustração dele costuma ser mais cerebral do que emocional, mas ainda assim o paralisa.',
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
        whatsHappeningForProfile: 'O Impulsionador provavelmente ouviu a instrução, mas já decidiu como fazer do jeito dele. Não é desobediência: é que o motor rápido costuma lançá-lo à ação antes de você terminar de falar, e ele confia no instinto.',
        howToAccompany: [
            'Dê a instrução curta e direta, em uma frase. "Passe para o pivô, chute ao gol." Menos palavras, mais ação.',
            'Se fez algo diferente mas funcionou, reconheça: "Boa decisão. Agora vamos testar também dessa outra forma".',
        ],
        ifNotResponding: 'Dê o "porquê" competitivo: "Se você praticar isso, vai ter mais uma ferramenta para ganhar". O Impulsionador faz o que entende que o deixa melhor.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector provavelmente estava conversando com alguém quando você deu a instrução, ou se prendeu na dinâmica social e perdeu o foco. Não é falta de respeito: é que a atenção dele vai primeiro para as pessoas e depois para a tarefa.',
        howToAccompany: [
            'Garanta a atenção dele antes de dar a instrução: contato visual, nome, e depois a consigna.',
            'Dê a instrução em chave social: "Você e seu colega vão fazer isso juntos" funciona melhor do que uma ordem individual.',
        ],
        ifNotResponding: 'Peça para ele explicar a consigna para outro colega. Ao traduzir, processa e executa.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador ouviu tudo, mas se a instrução foi complexa ou nova, o motor de processamento dele precisa de mais tempo para fechar a lógica antes de começar. Não é lentidão: é que quer fazer certo.',
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
        whatsHappeningForProfile: 'O Impulsionador costuma mostrar o nervosismo com hiperatividade: fala além da conta, se move muito, ou ao contrário, fica irritado e quieto. A incerteza o incomoda porque quer controlar o resultado e não pode.',
        howToAccompany: [
            'Dê uma tarefa concreta que o faça sentir no controle: "Aquece com bola, faz 20 chutes". A ação física canaliza a ansiedade.',
            'Fale em chave de plano: "Hoje seu papel é X. Se acontecer Y, você faz Z". A clareza do plano o acalma.',
        ],
        ifNotResponding: 'Deixe-o aquecer sozinho com música ou em um espaço separado. O Impulsionador processa a pressão se movendo, não falando.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector costuma buscar contenção social: fala com todos, faz piadas, ou se cola na pessoa de confiança. Os nervos ele tende a processar pelo vínculo. Se está quieto, algo pesa mais do que o normal.',
        howToAccompany: [
            'Gere um momento grupal de conexão: uma roda de mãos, um grito de time, um "como estamos?". Isso o centra.',
            'Se estiver mais quieto que o normal, chegue sem pressionar: "Tudo bem?" e um gesto de apoio (palmadinhas, punho no punho).',
        ],
        ifNotResponding: 'Peça para ele animar o grupo. Dar um papel social ("Você fica responsável por manter todo mundo ligado") transforma a ansiedade em energia positiva.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador costuma se fechar. Está mais quieto, mais apegado à rotina, faz exatamente o mesmo de sempre como para sentir que algo não mudou. A incerteza do jogo bate na base de segurança dele.',
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
        ifNotResponding: 'Deixe-o observar uma rodada completa e depois pergunte diretamente: "Pronto?". O Impulsionador costuma responder bem ao convite direto.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector costuma observar de fora quando não conhece ninguém ou quando sente que o clima social não é seguro. Tende a precisar identificar "a pessoa dele" dentro do grupo antes de entrar.',
        howToAccompany: [
            'Apresente-o a alguém: "Ele é o Mateus, joga na mesma posição que você. Treinem juntos". Um aliado é a porta de entrada dele.',
            'Inclua-o em uma atividade em dupla ou grupo pequeno antes de mandá-lo para o grupo grande.',
        ],
        ifNotResponding: 'Dê um papel social de fora: "Me ajuda a contar os pontos" ou "Me avisa quando terminarem". Isso o conecta ao grupo sem forçar a exposição.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'S',
        whatsHappeningForProfile: 'É o comportamento mais natural do Sustentador diante do novo. Está fazendo a leitura de segurança: quem está, como se movem, quais são as regras. Não está perdendo tempo: está se preparando.',
        howToAccompany: [
            'Não apresse. Dê o tempo de observação que precisa. Um "Quando estiver pronto, entra" sem pressão é o que mais funciona.',
            'Se puder, coloque-o fazendo a mesma atividade ao lado, em paralelo, sem exposição grupal.',
        ],
        ifNotResponding: 'Deixe-o observar a sessão inteira se necessário. Na próxima vez costuma entrar mais rápido. O Sustentador constrói segurança acumulando experiências positivas de observação.',
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
        whatsHappeningForProfile: 'O Impulsionador costuma se irritar mais do que chorar. A frustração tende a sair como raiva: joga coisas, grita, ou vai embora. Ele sente que perdeu o controle da situação e isso o desequilibra.',
        howToAccompany: [
            'Não enfrente no calor do momento. Deixe esfriar alguns segundos e depois chegue com tom neutro: "Quando estiver pronto, a gente conversa".',
            'Quando se acalmar, dê uma via de ação: "Agora voltamos e fazemos esse exercício direito". Ele precisa sentir que pode recuperar o controle.',
        ],
        ifNotResponding: 'Tire-o da atividade brevemente ("Bebe água, respira") e deixe-o voltar por conta própria. O Impulsionador precisa sentir que a decisão de voltar foi dele.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector tende a se abalar quando sente que a correção rompeu o vínculo. "Está me repreendendo porque não gosta de mim?" O colapso costuma ser emocional e social ao mesmo tempo.',
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
        whatsHappeningForProfile: 'O Estrategista costuma se frustrar quando sente que algo não tem lógica ou que a correção foi injusta. O colapso pode parecer "do nada", mas vem de um acumulado de coisas que não fecharam para ele.',
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
        whatsHappeningForProfile: 'O Impulsionador costuma entrar em atrito quando sente que outro está tomando o protagonismo dele ou freando o ritmo. O atrito tende a vir da competição pelo espaço de decisão.',
        howToAccompany: [
            'Separe o conflito da pessoa: "Os dois querem ganhar e isso está ótimo. Agora vamos ver como fazem isso juntos".',
            'Atribua a ele um aspecto do exercício onde ele decide. Se tem seu território, diminui a necessidade de brigar pelo do outro.',
        ],
        ifNotResponding: 'Troque-os de dupla temporariamente. Às vezes a melhor mediação é a distância breve.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector tende a viver o atrito como uma ruptura na relação. Costuma doer mais o "já não somos amigos" do que o conflito em si. Pode reagir buscando aliados ou dramatizando.',
        howToAccompany: [
            'Fale com os dois juntos e foque no vínculo: "Vocês são colegas, isso se resolve conversando. O que aconteceu?".',
            'Depois do exercício, dê um momento ao Conector para fechar: "Estamos bem com seu colega?". Ele precisa saber que a relação continua.',
        ],
        ifNotResponding: 'Dê um papel de ponte: "Me ajuda a fazer o grupo funcionar bem". Transformar o conflito em missão social o tira da mágoa pessoal.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador costuma evitar o conflito. Se teve um atrito, provavelmente está muito desconfortável e quer que tudo volte ao normal o quanto antes. Provavelmente não vai confrontar; costuma se fechar.',
        howToAccompany: [
            'Não force a "conversa" na frente do grupo. Chegue em particular: "Vi que aconteceu algo aí, você está bem?".',
            'Ajude-o a voltar para a zona de conforto: a mesma atividade, os mesmos colegas de sempre, rotina normal.',
        ],
        ifNotResponding: 'Deixe o tempo fazer o trabalho. O Sustentador costuma não precisar "resolver" o conflito verbalmente; mais que isso, precisa sentir que tudo voltou ao normal.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista costuma entrar em atrito quando sente que o outro faz as coisas "errado" ou sem lógica. O atrito tende a vir da diferença de critério: ele quer fazer bem e o outro quer fazer rápido (ou vice-versa).',
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
        whatsHappeningForProfile: 'O Impulsionador costuma se punir com raiva: "Sou um desastre!". Sente que deveria conseguir fazer certo quase sempre, e um erro pode soar como uma traição à autoimagem de líder.',
        howToAccompany: [
            'Interrompa o circuito com ação: "Ok, errou. Agora faz 3 repetições e pronto". A ação imediata substitui a autocrítica.',
            'Use a competitividade a favor: "Os melhores jogadores erram, a diferença é o que fazem depois".',
        ],
        ifNotResponding: 'Tire-o do exercício um momento e dê uma tarefa física simples (correr, quicar a bola). O Impulsionador regula a frustração se movendo.',
    },
    {
        situationId: 'se-castiga',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector costuma se punir pela vergonha: "Todo mundo me viu errar". O que tende a pesar não é o erro técnico, mas a exposição social do erro.',
        howToAccompany: [
            'Normalize o erro na frente do grupo: "Todo mundo erra, é assim que se aprende". Isso baixa a vergonha pública.',
            'Depois, em particular: "Para mim importa que você tente, não que saia perfeito". A reconexão com o adulto o acalma.',
        ],
        ifNotResponding: 'Coloque-o em uma atividade onde o erro faz parte do jogo (um exercício onde todos erram). Isso dilui a sensação de ser "o único".',
    },
    {
        situationId: 'se-castiga',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador costuma se punir em silêncio. Não grita nem se bate, mas fica quieto, abaixa a cabeça, e perde energia. Tende a sentir culpa por não ter mantido a consistência que se espera dele.',
        howToAccompany: [
            'Chegue com calma: "Esse erro não define como você joga. Olha tudo que você vem fazendo bem". Ele precisa que alguém devolva a perspectiva.',
            'No exercício seguinte, coloque-o em algo que domina bem para recuperar a confiança antes de voltar ao que errou.',
        ],
        ifNotResponding: 'Não insista em que "não é para tanto". Simplesmente continue o treino normalmente. O Sustentador se recupera quando sente que o ambiente não mudou por causa do erro dele.',
    },
    {
        situationId: 'se-castiga',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista costuma se punir pela análise: revisa o erro uma e outra vez buscando o que fez errado. Tende a se autoexigir porque tem padrões altos e sente que deveria ter previsto a falha.',
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
        whatsHappeningForProfile: 'O Impulsionador costuma se distrair quando o exercício não tem intensidade ou desafio suficiente. O motor rápido dele precisa de ação constante e, se o ritmo cai, tende a buscar estímulos por conta própria.',
        howToAccompany: [
            'Suba a intensidade: "Agora o mesmo mas na metade do tempo" ou "Quem chegar primeiro escolhe o próximo exercício".',
            'Dê responsabilidade dentro do exercício: que conte, que apite, que lidere uma variação.',
        ],
        ifNotResponding: 'Proponha um desafio paralelo: "Enquanto espera a vez, faz isso aqui". O Impulsionador não tolera o vazio de atividade.',
    },
    {
        situationId: 'se-distrae',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector costuma se distrair porque o que mais o atrai é a interação social. Se o exercício é individual ou silencioso, a atenção tende a ir para o colega ao lado.',
        howToAccompany: [
            'Transforme o exercício em algo social: em duplas, com comunicação entre eles, ou com papéis que exijam conversar.',
            'Use a sociabilidade dele como ferramenta: "Explica para o seu colega como se faz esse exercício".',
        ],
        ifNotResponding: 'Coloque-o no papel de assistente seu: "Vem, me ajuda a organizar isso". A proximidade social com o adulto recupera a atenção dele.',
    },
    {
        situationId: 'se-distrae',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador costuma se distrair quando há estímulo demais: muito barulho, mudanças constantes de exercício, ou instruções novas sem pausa. O sistema dele tende a se desconectar para se proteger do caos.',
        howToAccompany: [
            'Reduza o ritmo das mudanças: deixe que faça o mesmo exercício por mais tempo antes de trocar.',
            'Dê um espaço previsível dentro da atividade: "Você sempre nessa posição, seu trabalho é este".',
        ],
        ifNotResponding: 'Chegue e reconecte com calma: "Está com a gente? Ótimo. O próximo que fazemos é isso". O contato pessoal o traz de volta.',
    },
    {
        situationId: 'se-distrae',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista costuma se distrair quando o exercício parece repetitivo ou sem propósito. A mente dele busca algo para analisar e, se o exercício não oferece isso, tende a buscar estímulos em outro lugar.',
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
        whatsHappeningForProfile: 'O Impulsionador costuma querer parar quando sente que não pode ganhar, crescer ou liderar. Se ficou muito tempo sem novos desafios ou sem sentir que progride, o esporte tende a perder sentido para ele.',
        howToAccompany: [
            'Pergunte o que mudaria para ter vontade de voltar: "Se pudesse mudar uma coisa no treino, o que seria?". Ouça a resposta.',
            'Proponha um objetivo concreto e mensurável: "E se nas próximas 3 semanas trabalharmos especificamente nisso?".',
        ],
        ifNotResponding: 'Não pressione. Diga: "A porta está aberta quando quiser". O Impulsionador às vezes precisa sentir falta do desafio para voltar com vontade.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector costuma querer parar quando os vínculos se romperam: se o amigo foi embora, se o grupo mudou, ou se sente que não pertence mais. Para ele, o esporte tende a ser o grupo, e se o grupo não o sustenta, pode sentir que não há razão para estar.',
        howToAccompany: [
            'Explore o vínculo: "Tem algo no grupo que te incomoda?". Muitas vezes a razão não é o esporte, mas uma relação social que se quebrou.',
            'Se possível, reconecte-o com um colega próximo ou mude-o para um grupo onde tenha mais afinidade.',
        ],
        ifNotResponding: 'Fale com o adulto responsável. O abandono do Conector costuma ter uma raiz social que pode ser resolvida se identificada a tempo.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador costuma querer parar quando algo mudou demais: novo treinador, novos colegas, mudança de horário ou de local. Não é que não goste do esporte: é que o contexto não se sente mais como "o lugar dele".',
        howToAccompany: [
            'Identifique o que mudou: "Tem algo que antes você gostava e agora não?". O Sustentador pode apontar exatamente o ponto de virada.',
            'Se puder, restaure algo do contexto anterior: o mesmo horário, o mesmo grupo, as mesmas rotinas.',
        ],
        ifNotResponding: 'Dê tempo. Não peça uma decisão definitiva. "Não precisa decidir agora. Vem semana que vem e a gente vê". O Sustentador precisa processar as mudanças com calma.',
    },
    {
        situationId: 'quiere-dejar',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista costuma querer parar quando sente que não aprende nada novo ou que o treino não faz sentido. Se ficou semanas fazendo a mesma coisa sem entender para quê, a motivação tende a apagar.',
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
        whatsHappeningForProfile: 'Um Impulsionador pode ver o novo como uma variável a avaliar: "É bom? Vai me tirar o lugar?". Pode reagir competindo para marcar território ou ignorando-o.',
        howToAccompany: [
            'Dê um papel de boas-vindas com liderança: "Mostra para ele como fazemos o aquecimento". Isso o coloca em posição de líder, não de competidor.',
            'Monte um exercício onde os dois se destaquem: "Um ataca, o outro defende, depois trocam".',
        ],
        ifNotResponding: 'Deixe a competição natural fazer o trabalho. O Impulsionador tende a aceitar o novo quando vê que eleva o nível do grupo.',
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
        whatsHappeningForProfile: 'O Sustentador costuma ser o que mais sente a "ruptura" do equilíbrio. O grupo dele era previsível e seguro, e agora tem alguém que muda a dinâmica. Pode se mostrar distante ou desconfortável.',
        howToAccompany: [
            'Não mude a rotina por causa da chegada do novo. Mantenha para o Sustentador tudo o que puder igual: mesmo lugar, mesmo exercício, mesmos colegas.',
            'Apresente o novo como uma "adição" e não como uma "mudança": "Entra alguém no grupo, tudo o mais continua igual".',
        ],
        ifNotResponding: 'Dê tempo. O Sustentador tende a aceitar o novo gradualmente, à medida que ele se torna parte da rotina. Não force a integração.',
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista costuma observar o novo com curiosidade analítica: "Como ele joga? Onde vai se posicionar? Como afeta o time?". Tende a não chegar logo porque está processando as informações.',
        howToAccompany: [
            'Dê informação sobre o novo: "Vem de tal clube, joga em tal posição". Os dados o tranquilizam e permitem que ele posicione o novo no mapa mental.',
            'Proponha que ajude taticamente: "Explica para ele como fazemos essa jogada". Isso o conecta a partir da própria fortaleza.',
        ],
        ifNotResponding: 'Deixe a integração ser orgânica. O Estrategista costuma se aproximar do novo quando tem informação suficiente. Não apresse.',
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
            'De fora, transmita confiança na capacidade dele: "Você sabe fazer isso, confio em você". O Impulsionador costuma responder ao voto de confiança.',
        ],
        ifNotResponding: 'Mude temporariamente o papel dele para algo menos exposto. Quando fizer uma boa jogada a partir daí, devolva à posição original. Ele precisa de uma pequena vitória para se reativar.',
    },
    {
        situationId: 'se-congela',
        eje: 'I',
        whatsHappeningForProfile: 'O Conector costuma travar quando sente que o erro vai deixá-lo "em evidência" diante do grupo. O bloqueio dele tende a ser social: tem medo de passar vergonha na frente dos colegas, não do erro em si.',
        howToAccompany: [
            'Retire a pressão do resultado: "Não importa se sai ou não, quero que você tente". A permissão para errar o desbloqueia.',
            'Envolva os colegas: "Time, todos juntos, todos dentro". Sentir-se acompanhado devolve a segurança.',
        ],
        ifNotResponding: 'Coloque-o em uma jogada coletiva onde o sucesso seja do time, não individual. O Conector se reativa quando a responsabilidade é compartilhada.',
    },
    {
        situationId: 'se-congela',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador costuma travar porque a pressão do jogo quebra a base de segurança. O que no treino era previsível, no jogo é incerto. O sistema dele tende a se proteger ficando parado.',
        howToAccompany: [
            'Reduza a pressão com informação: "Faz o mesmo que no treino, nada diferente". Conectá-lo ao que já conhece o desbloqueia.',
            'Dê uma instrução repetitiva: "Cada vez que a bola vier, passa para X". A tarefa simples e previsível o ativa.',
        ],
        ifNotResponding: 'Tire-o alguns minutos se possível. Diga: "Respira, observa como está o jogo, e quando estiver pronto volta". O Sustentador se recupera com a pausa.',
    },
    {
        situationId: 'se-congela',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista costuma travar porque está sobreanalisando: "Passo ou chuto? E se vier o adversário? Qual é a melhor opção?". A mente dele trabalha mais rápido do que o corpo, e o corpo trava.',
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
        whatsHappeningForProfile: 'Costuma ser natural no Sustentador. A forma de contribuir dele tende a ser pelo suporte, não pelo protagonismo. Forçá-lo a ser o centro vai contra a natureza dele e costuma fazê-lo sentir vulnerável.',
        howToAccompany: [
            'Proponha formas de liderança silenciosa: "Garante que todos tenham o que precisam" ou "Você é o que mantém o ritmo".',
            'Se precisar que se exponha, avise com antecedência: "Semana que vem vou te pedir para mostrar o exercício". A antecipação baixa a ansiedade.',
        ],
        ifNotResponding: 'Não insista. Busque outra forma de ele participar onde se sinta confortável. O Sustentador contribui mais a partir da zona de segurança do que da exposição forçada.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'C',
        whatsHappeningForProfile: 'O Estrategista tende a não querer se expor se não está seguro de que vai fazer bem. O padrão dele costuma ser alto e a ideia de errar em público gera muito desconforto.',
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
        whatsHappeningForProfile: 'Um Conector que se fecha costuma ser um sinal forte. A natureza dele tende a ser social, então se está quieto ou isolado, algo pode estar doendo no plano vincular: uma briga com amigos, uma mudança na família, ou bullying.',
        howToAccompany: [
            'Chegue pelo vínculo: "Eu te conheço e sei que algo está acontecendo. Não precisa me contar, mas quero que saiba que estou aqui".',
            'Dê espaço para se reconectar no próprio ritmo. Não force o "estar bem"; isso invalida o que ele sente.',
        ],
        ifNotResponding: 'Contate o adulto responsável. A mudança sustentada num Conector costuma estar ligada a uma situação relacional que precisa de atenção fora da quadra.',
    },
    {
        situationId: 'cambio-repentino',
        eje: 'S',
        whatsHappeningForProfile: 'O Sustentador que muda de repente costuma estar mostrando que algo quebrou a base de segurança dele. Tende a ser o perfil que mais "aguenta" antes de mostrar desconforto, então se você já está vendo, provavelmente vem acumulando há um tempo.',
        howToAccompany: [
            'Mantenha a rotina o mais estável possível. No meio do que quer que esteja acontecendo lá fora, o treino pode ser o refúgio de normalidade dele.',
            'Chegue sem drama: "Como você está hoje?" de forma natural, como parte da rotina. Se quiser falar, vai falar.',
        ],
        ifNotResponding: 'Contate o adulto responsável com cuidado: "Percebi que ele vem diferente essas últimas semanas, está tudo bem em casa?". O Sustentador raramente pede ajuda. É preciso ir buscar.',
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
        whatsHappeningForProfile: 'O grupo inteiro está processando a derrota a partir do próprio perfil: os Impulsionadores provavelmente estão com raiva, os Conectores costumam sentir que falharam como time, os Sustentadores tendem a se fechar, e os Estrategistas estarão revisando cada erro. O clima coletivo está baixo.',
        howToAccompany: [
            'Não tente falar do jogo imediatamente depois de perder. Dê ao grupo alguns minutos de silêncio ou de descompressão livre antes de reuni-los.',
            'Quando os reunir, comece pelo que funcionou: "Hoje fizemos bem isso, isso e isso. O que não saiu, trabalhamos semana que vem". Resultado no final, processo primeiro.',
            'Proponha ao grupo um ritual de encerramento: uma roda onde cada um diz uma coisa boa que viu em um colega. Isso reconecta o time pelo vínculo, não pelo placar.',
        ],
        ifNotResponding: 'Não force a positividade. Às vezes o grupo precisa ficar triste um tempo. Diga: "Hoje dói, e está tudo bem que doa. Amanhã começamos de novo". A permissão para sentir a derrota é o primeiro passo para superá-la.',
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "D",
        whatsHappeningForProfile: "O Impulsionador costuma viver o banco como uma perda de controle e do seu lugar de protagonista. Ficar parado enquanto outros jogam tende a pesar muito para ele, e essa tensão costuma sair como irritação ou impaciência.",
        howToAccompany: ["Dê a ele um papel ativo no banco: peça que leia o jogo e te avise o que está acontecendo, por exemplo diga: quero os seus olhos no campo, o que você vê que podemos melhorar?","Defina um objetivo concreto para quando ele entrar, algo que dependa dele: diga quando você entrar, isso é seu, quero você marcando o ritmo."],
        ifNotResponding: "Se ele continuar tenso, não exija que aceite de uma vez. Reconheça a vontade de jogar (dá para ver que você quer estar dentro e isso é bom) e dê tempo, o impulso dele se reorganiza quando sente que você conta com ele.",
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "I",
        whatsHappeningForProfile: "O Conector costuma temer que estar no banco signifique que decepcionou ou que já não faz parte do grupo. Mais do que o papel, tende a doer nele sentir-se fora do vínculo.",
        howToAccompany: ["Confirme o lugar dele no time logo de cara: aproxime-se e diga hoje você começa de fora, mas é parte essencial disso, preciso de você conectando o grupo a partir do banco.","Dê a ele uma tarefa que o mantenha unido aos colegas: que incentive, que receba quem sai, que ajude a sustentar o clima do time."],
        ifNotResponding: "Se você o notar apagado, priorize o vínculo antes do papel. Um gesto próximo, sentar-se um momento ao lado dele, devolve a sensação de pertencer, que é o que ele mais precisa.",
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "S",
        whatsHappeningForProfile: "O Sustentador costuma aceitar o banco sem protestar, mas isso não quer dizer que não doa. Ele guarda o mal-estar em silêncio e pode acumulá-lo até aparecer mais adiante como desânimo.",
        howToAccompany: ["Antecipe o papel com calma e clareza para que não o pegue de surpresa: diga hoje você entra no segundo tempo, quero que esteja pronto e tranquilo para esse momento.","Abra um espaço breve para que ele conte como está vivendo isso: aproxime-se sem pressão e diga sei que esperar não é fácil, como você está se sentindo com isso?"],
        ifNotResponding: "Se ele responder com um está tudo bem e se fechar, respeite o silêncio sem dar por resolvido. Volte a procurá-lo em outro momento tranquilo, ele costuma se abrir quando sente que há confiança e nenhuma pressa.",
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "C",
        whatsHappeningForProfile: "O Estrategista costuma precisar entender por que está no banco. Se não tem claro o critério, tende a ficar remoendo e pode concluir sozinho que fez algo errado ou que não é bom o bastante.",
        howToAccompany: ["Explique o motivo de forma concreta e sem rodeios: diga esta é uma decisão de time e de planejamento, não um julgamento sobre você, e te mostro o que estou buscando hoje.","Dê a ele algo claro em que se concentrar enquanto espera: peça que observe uma jogada ou um adversário específico e que te traga a leitura dele quando entrar."],
        ifNotResponding: "Se você o vir travado, remoendo, alivie a exigência interna dele. Lembre-o de que o papel de hoje não mede o valor dele e que entender leva tempo, sem pedir que resolva já.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "D",
        whatsHappeningForProfile: "O Impulsionador costuma viver a conquista do colega como uma competição que está perdendo. Seu instinto tende a ser mostrar na hora que ele também pode, e se não encontra como, se frustra.",
        howToAccompany: ["Canalize essa energia para um desafio próprio em vez de para o outro: você tem o seu próprio desafio hoje, vamos ver até onde você chega.","Reconheça algo concreto que ele faz bem para que não sinta que perde seu lugar: na marcação ninguém te ganha, isso é seu."],
        ifNotResponding: "Dê alguns minutos para que baixe a intensidade sem exigir que ele aplauda o colega. Quando voltar a se sentir capaz no que é dele, a comparação perde força sozinha.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "I",
        whatsHappeningForProfile: "O Conector costuma sentir que o carinho e a atenção do grupo foram para outro, e tende a viver isso como se gostassem menos dele. Costuma doer mais o deslocamento social do que o resultado.",
        howToAccompany: ["Devolva o lugar dele no grupo com algo genuíno: a sua energia é a que levanta o time, isso ninguém substitui.","Convide-o a se somar à alegria do outro para que sinta que continua dentro: vamos festejar juntos, você é parte disso."],
        ifNotResponding: "Não o obrigue a comemorar se ainda está difícil. Aproxime-se um momento a sós e faça-o sentir que o lugar dele com você continua intacto, sem pedir nada em troca.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "S",
        whatsHappeningForProfile: "O Sustentador costuma guardar o incômodo e se afastar para o segundo plano sem dizer nada. Por fora parece que não o afeta, mas a irritação vai se acumulando e pode aparecer mais tarde de uma vez.",
        howToAccompany: ["Dê permissão para ele nomear o que sente, sem pressa: tudo bem que hoje tenha sido difícil para você, contar não tem nada de errado.","Ofereça um lugar seguro e previsível onde voltar a se sentir confortável: fique comigo neste exercício e vamos com calma."],
        ifNotResponding: "Não o pressione a falar. Fique por perto e mantenha a rotina estável. A sua constância devolve a segurança melhor do que qualquer conversa forçada.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "C",
        whatsHappeningForProfile: "O Estrategista costuma ficar analisando por que o outro fez melhor e se compara ponto por ponto. Essa conta interna tende a torná-lo duríssimo consigo mesmo.",
        howToAccompany: ["Tire o olhar da comparação e coloque-o no próprio processo dele: não se trata de quem é melhor, mas do que você pode aprender observando.","Dê um dado concreto e observável para que ele organize a cabeça: repare como ele se posiciona antes de receber, tente copiar só isso hoje."],
        ifNotResponding: "Se continuar preso no ciclo, baixe a exigência. Lembre-o de que cada um avança no seu tempo e que entender leva seu processo, não há pressa.",
    },
    {
        situationId: "recibe-correccion",
        eje: "D",
        whatsHappeningForProfile: "O Impulsionador costuma confundir a correção com perder terreno. Ele tende a precisar sentir que continua sendo capaz e que tem margem para melhorar por conta própria, não que o deixaram em má posição.",
        howToAccompany: ["Apresente a correção como um desafio, não como uma falha: você está quase lá com isto, falta um ajuste para ficar imparável.","Dê a ele o controle da mudança: que seja ele quem decide como corrigir na próxima jogada, em vez de impor a correção."],
        ifNotResponding: "Se ele ficar na defensiva, baixe a intensidade e deixe ele tentar do jeito dele por alguns minutos. Quando perceber que o ajuste funciona, ele o adota sozinho e sem discutir.",
    },
    {
        situationId: "recibe-correccion",
        eje: "I",
        whatsHappeningForProfile: "O Conector costuma sentir a correção como um golpe no vínculo, não na técnica. Tende a importar mais para ele se decepcionou você ou se ficou exposto do que o detalhe que você apontou.",
        howToAccompany: ["Corrija em particular e cuide do tom: comece pelo vínculo, a sua relação com o time está perfeita, vamos só lapidar este detalhe.","Lembre a ele que a correção não muda como você o enxerga: aponto isto porque confio no que você pode dar."],
        ifNotResponding: "Se ainda assim ele desanimar, ofereça um gesto de proximidade e espere. Para ele, sentir-se aceito pesa mais do que qualquer indicação, e é a partir daí que ele volta a escutar.",
    },
    {
        situationId: "recibe-correccion",
        eje: "S",
        whatsHappeningForProfile: "O Sustentador costuma concordar e parecer levar numa boa, mas por dentro guarda o incômodo. Tende a evitar o atrito na hora e o desconforto aparece depois, de um jeito mais calado.",
        howToAccompany: ["Dê tempo e previsibilidade: avise com calma e sem surpresas, quero te mostrar uma coisa para a próxima, sem pressa.","Confirme que está tudo bem e abra a porta para que ele fale: isto acontece o tempo todo, se algo não fechou para você, me conta quando quiser."],
        ifNotResponding: "Se você notá-lo retraído, não insista na hora. Aproxime-se depois, num clima tranquilo, e dê espaço para que ele solte o que guardou.",
    },
    {
        situationId: "recibe-correccion",
        eje: "C",
        whatsHappeningForProfile: "O Estrategista costuma entender a correção, mas tende a ficar preso no detalhe e a se tornar muito exigente consigo mesmo. Tem dificuldade para soltar o que aconteceu e voltar a jogar.",
        howToAccompany: ["Explique o porquê, que é o que mais o organiza: corrigimos isto porque te dá mais tempo para decidir na jogada.","Ajude-o a virar a página com um foco concreto: você já analisou, agora tente só este ajuste na próxima e a gente vê."],
        ifNotResponding: "Se ele continuar dando voltas, dê um único ponto para pensar e deixe o resto para depois. Menos informação o libera para voltar a jogar tranquilo.",
    },
    {
        situationId: "gestiona-exito",
        eje: "D",
        whatsHappeningForProfile: "O Impulsionador costuma sentir o sucesso com muita intensidade e precisa mostrá-lo. Quando já se sente vencedor, seu motor de esforço tende a afrouxar porque acredita que o desafio terminou.",
        howToAccompany: ["Proponha um novo objetivo assim que ele conquistar algo: você já conseguiu isso, agora vamos ver se sustenta esse nível até o final.","Reconheça a conquista e logo em seguida convide-o a somar com o time: quem já está jogando bem hoje pode levantar um companheiro."],
        ifNotResponding: "Deixe-o aproveitar o momento sem corrigi-lo no calor da hora. Quando a euforia baixar, volte a procurá-lo com um desafio concreto e o motor dele se reativa sozinho.",
    },
    {
        situationId: "gestiona-exito",
        eje: "I",
        whatsHappeningForProfile: "O Conector costuma viver o sucesso através dos outros e se entusiasma quando sente a comemoração do grupo. Levado por essa emoção, sem querer pode monopolizar o momento e deixar o resto do time de fora.",
        howToAccompany: ["Redirecione o entusiasmo dele para o time: que ótimo o seu gol, agora comemore com quem te deu o passe.","Dê a ele o papel de contagiar a boa energia cuidando de todos: você que está animado, ajude a levantar os que estão mais calados."],
        ifNotResponding: "Não o apague na frente do grupo. Mais tarde, a sós, lembre-o de como é lindo quando o time inteiro comemora junto, e que ele tem o dom de fazer isso acontecer.",
    },
    {
        situationId: "gestiona-exito",
        eje: "S",
        whatsHappeningForProfile: "O Sustentador costuma viver o sucesso por dentro, sem mostrar demais. Mas ao sentir que a pressão diminuiu, pode relaxar demais e soltar a constância que vinha sustentando.",
        howToAccompany: ["Reconheça o bom momento dele com calma e dê continuidade: você está muito bem, vamos manter essa mesma forma de jogar no resto da partida.","Ancore-o à sua rotina de esforço: sua força é a constância, vamos seguir com o que vínhamos fazendo passo a passo."],
        ifNotResponding: "Não o pressione para que demonstre mais. Acompanhe-o em silêncio, por perto, e lembre-o com um gesto de que você confia que ele vai sustentar o nível dele sem se sobrecarregar.",
    },
    {
        situationId: "gestiona-exito",
        eje: "C",
        whatsHappeningForProfile: "O Estrategista costuma analisar seu bom rendimento e pode se convencer de que já entendeu tudo. Ao sentir que não tem mais nada a melhorar, tende a baixar a guarda sem perceber.",
        howToAccompany: ["Valide a análise dele e abra uma nova pergunta: você jogou muito bem, o que acha que ainda poderia afinar?","Mostre que o que é bom também se estuda: anote o que você fez hoje que funcionou, assim pode repetir quando o adversário for mais difícil."],
        ifNotResponding: "Dê espaço para que ele processe o bom momento no ritmo dele. Quando estiver pronto, proponha olhar juntos o próximo desafio sem tirar o mérito do que ele já conquistou.",
    },
    {
        situationId: "rol-referente",
        eje: "D",
        whatsHappeningForProfile: "O Impulsionador costuma assumir o papel com vontade, mas pode vivê-lo como mandar mais do que como guiar. Se o grupo não responde à sua intensidade, sente isso como algo pessoal.",
        howToAccompany: ["Dê a ele uma missão de líder que dependa dos outros: hoje o seu trabalho é fazer com que seus colegas cheguem ao fim do exercício, não chegar você primeiro.","Reconheça quando ele ajuda, não só quando ganha: vi como você esperou seu colega, isso também é ser referência."],
        ifNotResponding: "Diminua a exposição por um tempo e dê a ele lideranças curtas e concretas. Quando sentir que consegue fazer bem, vai querer mais.",
    },
    {
        situationId: "rol-referente",
        eje: "I",
        whatsHappeningForProfile: "O Conector costuma liderar com naturalidade a partir do vínculo, mas tende a pesar quando o papel implica colocar um limite ou decidir entre amigos. Ele não quer decepcionar ninguém.",
        howToAccompany: ["Defina o papel a partir da sua força: a sua tarefa de referência é fazer com que ninguém fique de fora, e isso você já faz muito bem.","Acompanhe-o nas decisões difíceis para que não as carregue sozinho: se for preciso escolher, pensamos juntos."],
        ifNotResponding: "Deixe por enquanto a parte que ele aproveita e alivie a que o incomoda. Com o tempo, o papel mais completo vai pesar menos para ele.",
    },
    {
        situationId: "rol-referente",
        eje: "S",
        whatsHappeningForProfile: "O Sustentador costuma preferir o segundo plano e fica desconfortável ao ficar exposto. Mesmo assim sustenta o grupo em silêncio, ainda que não busque isso.",
        howToAccompany: ["Nomeie a liderança que ele já exerce, sem pedir nada novo: quando você está, o grupo fica mais tranquilo, isso é liderar.","Proponha um papel de referência discreto, sem colocá-lo à frente: me ajude a fazer com que os mais novos se sintam à vontade."],
        ifNotResponding: "Não o empurre para o centro. Deixe-o liderar do seu jeito, pelo lado, e respeite o ritmo dele para tomar mais espaço.",
    },
    {
        situationId: "rol-referente",
        eje: "C",
        whatsHappeningForProfile: "O Estrategista costuma hesitar porque ainda não tem clareza do que se espera dele, e tende a preferir esperar a exercer o papel pela metade. Pesa para ele a ideia de errar na frente de todos.",
        howToAccompany: ["Explique o papel com clareza e por partes: ser referência aqui significa estas três coisas, nada mais.","Dê tempo para ele observar antes de agir: olhe por alguns dias como o grupo funciona e depois me diz como você faria."],
        ifNotResponding: "Proponha primeiro um papel mais concreto, algo que ele consiga entender e dominar. A confiança para liderar chega quando ele sente que compreende.",
    },
    {
        situationId: "expectativa-padres",
        eje: "D",
        whatsHappeningForProfile: "O Impulsionador costuma transformar a expectativa em uma pressão por ganhar de qualquer jeito. Quando sente que o resultado define se decepcionou ou não os pais, pode se exigir demais e reagir com frustração diante de um erro.",
        howToAccompany: ["Devolva o foco para aquilo que ele controla: hoje não olho para o placar, olho para como você disputa cada bola.","Reconheça o esforço mais do que o resultado, em voz alta e diante do grupo: gostei de como você não baixou os braços quando complicou."],
        ifNotResponding: "Se continuar jogando para a arquibancada, seja você quem diminui a importância do resultado nas suas palavras. Quando ele perceber que, para você, o valor dele não depende de ganhar, começa a soltar a pressão.",
    },
    {
        situationId: "expectativa-padres",
        eje: "I",
        whatsHappeningForProfile: "O Conector costuma precisar sentir o orgulho dos pais para jogar leve. Uma cara séria lá de fora tende a desconectá-lo na hora, porque para ele render bem e ser amado estão unidos.",
        howToAccompany: ["Lembre-o de que o carinho dos pais não se ganha nem se perde em uma quadra: sua família te ama jogue como jogar, isso não está em jogo hoje.","Dê a ele um motivo para se divertir com os colegas e não só para os de fora: entre para curtir com o seu time, esse é o seu lugar aqui."],
        ifNotResponding: "Se continuar preocupado com a arquibancada, ajude-o a se reconectar com o grupo em vez de com o lado de fora. Quando se sente parte do time, o olhar dos pais deixa de ser a única coisa que importa.",
    },
    {
        situationId: "expectativa-padres",
        eje: "S",
        whatsHappeningForProfile: "O Sustentador costuma guardar a tensão por dentro e não a mostrar. Segue jogando calado, mas mais rígido, e a carga vai se acumulando até aparecer de repente em um momento ruim.",
        howToAccompany: ["Aproxime-se com calma e sem expô-lo para abrir a porta: se em algum momento o que vem de fora te pesar, você pode me contar tranquilo.","Dê a ele rotinas e referências estáveis que não dependam da arquibancada: você se concentre na sua marcação de sempre, isso você já sabe fazer."],
        ifNotResponding: "Se não conseguir soltar a carga, não o force a falar. Mantenha um clima previsível e seguro ao redor dele, e dê tempo: confiar em você é o que depois permite que ele se abra.",
    },
    {
        situationId: "expectativa-padres",
        eje: "C",
        whatsHappeningForProfile: "O Estrategista costuma se enfiar na própria cabeça tentando decifrar o que esperam dele. Tende a se autoexigir o dobro e a acabar jogando travado por medo de não estar à altura do que acredita que os adultos querem ver.",
        howToAccompany: ["Tire dele a pressão de ter que adivinhar expectativas e dê um objetivo claro e próprio: seu único trabalho hoje é ler bem o jogo, nada mais.","Ajude-o a separar o desejo dele do dos pais com uma pergunta concreta: deixando de fora o que eles esperam, o que dá vontade de você experimentar hoje."],
        ifNotResponding: "Se continuar travado na sua análise, reduza as variáveis: uma única instrução simples por vez. Quando para de carregar com tudo o que acredita que esperam, volta a jogar solto.",
    },
    {
        situationId: "sube-categoria",
        eje: "D",
        whatsHappeningForProfile: "O Impulsionador vinha sendo uma referência e agora é o novato entre os mais velhos. Perder esse lugar de protagonismo costuma mexer com a confiança dele, e ele pode esconder isso com raiva ou competindo demais para recuperar terreno.",
        howToAccompany: ["Dê a ele um objetivo concreto para a sua adaptação: nestas semanas o seu desafio é conquistar um lugar neste grupo, vamos acompanhar isso jogo a jogo.","Reconheça cada passo de progresso no que é novo: hoje você aguentou o ritmo dos mais velhos, isso há duas semanas não acontecia."],
        ifNotResponding: "Se ele continuar tenso, tire a exigência de render já e deixe que ele se concentre em uma só coisa por treino. Recuperar o controle aos poucos devolve a segurança a ele.",
    },
    {
        situationId: "sube-categoria",
        eje: "I",
        whatsHappeningForProfile: "O Conector deixou para trás o seu grupo de sempre e ainda não encontrou o seu lugar entre os novos. Mesmo cercado de colegas, ele costuma se sentir de fora, e isso tende a reduzir a vontade dele mais do que qualquer questão de jogo.",
        howToAccompany: ["Conecte-o com um colega da nova categoria que o receba bem: te apresento o Tomás, ele vai ser o seu parceiro esta semana.","Dê a ele um papel que o integre pelo lado social, como montar um exercício em duplas ou liderar o aquecimento junto com outro colega."],
        ifNotResponding: "Se ele continuar recolhido, não o exponha diante do grupo. Aproxime-se em particular e mostre que você o quer ali, sentir-se esperado devolve a vontade a ele.",
    },
    {
        situationId: "sube-categoria",
        eje: "S",
        whatsHappeningForProfile: "O Sustentador costuma se desestabilizar com a mudança de rotina, de horários e de rostos conhecidos. Tende a recuar para o segundo plano e a sustentar o incômodo em silêncio, até que um dia tudo pesa de uma vez.",
        howToAccompany: ["Dê a ele previsibilidade sobre o que é novo: explique como vai ser o treino e o que se espera dele, passo a passo.","Ofereça a ele um ponto de referência estável, como um lugar fixo no campo ou um colega com quem ele sempre começa: comece sempre ao lado dele até se sentir confortável."],
        ifNotResponding: "Se você o vê fechado, dê mais tempo a ele sem apressá-lo e pergunte em particular como ele está se sentindo. Para ele a mudança leva mais tempo, e isso está tudo bem.",
    },
    {
        situationId: "sube-categoria",
        eje: "C",
        whatsHappeningForProfile: "O Estrategista costuma estar lendo todo o cenário novo: o ritmo, os códigos do grupo, onde ele se encaixa. Enquanto processa pode parecer apagado ou hesitar antes de jogar, porque ainda não entende totalmente como funciona esta categoria.",
        howToAccompany: ["Dê a ele informação clara que o ajude a se posicionar: nesta categoria se joga mais rápido, então ganhe um segundo pensando antes de receber.","Valide o jeito dele de observar antes de entrar: tire os primeiros minutos para ler a partida, depois você entra com tudo."],
        ifNotResponding: "Se ele continuar em dúvida, não o pressione a se soltar antes da hora. Quando terminar de entender o cenário novo, ele vai começar a jogar com confiança sozinho.",
    },
];
