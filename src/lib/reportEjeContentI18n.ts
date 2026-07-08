// src/lib/reportEjeContentI18n.ts
// Contenido de eje (combustible/palabras/guia/reset/ecos) + motor, en EN y PT. GENERADO por
// scripts/gen_eje.py desde docs/_i18n/report-v4-translations.json (traducciones verificadas por 3
// workflows adversariales) con los fixes del verificador aplicados (docs/METODO-V4-EN-PT-INTEGRACION.md).
// NO editar a mano: editar el JSON o el generador y correr `python3 scripts/gen_eje.py`.
// El es vive en archetypeContentV4.EJE_BASE_DRAFT_ES (voz aprobada por el owner, snapshot-guarded).
import type { Axis } from './evidenceFicha';
import type { EjeBaseContent, ReportBlock } from './archetypeContentV4';

export const EJE_BASE_EN: Record<Axis, EjeBaseContent> = {
  "D": {
    "eje": "D",
    "label": "Driver",
    "combustible": {
      "cuerpo": "What tends to light {nombre} up most is **having a clear goal and feeling that their drive moves things forward**. When they sense that their initiative leaves a real mark, they truly come alive, and recognizing that impact is often their best fuel.",
      "ejemplo": "A \"thanks to you getting it going, this worked out\" will probably motivate {nombre} far more than general praise."
    },
    "palabrasPuente": ["You start this one off.", "What do you suggest to solve it?", "Today you set the pace.", "Show me how you'd do it."],
    "palabrasRuido": ["Wait, it's not your turn yet.", "Just do it exactly as I say.", "Better stay on the sidelines and watch."],
    "palabrasNota": "It's not a script, it's a compass for tone: what usually **reaches {nombre} most is anything that recognizes their initiative**, and what grates is anything that halts their drive without explaining why. With that in mind, the exact words are up to you.",
    "guia": {
      "lead": "Three moments where a small intention changes a lot.",
      "antes": "Offer them a concrete goal and room to take the initiative. Knowing they'll be able to **get something of their own going** focuses and excites {nombre}.",
      "durante": "If they speed up too much, instead of stopping the momentum, **channel their drive**: acknowledge the eagerness and add a quick read of the situation before going. It's about adding, not shutting down.",
      "despues": "Recognize what they **set in motion**, not just the result. For an action-oriented profile, a \"you got everything going\" usually lands better than general praise.",
      "ejemplo": "If there's a new activity on Saturday, telling them \"you'll get to start it off\" turns the nerves into eagerness."
    },
    "reset": {
      "cuerpo": "When {nombre} gets frustrated, waiting around tends to be hard for them, and that's very understandable in an action-oriented profile. What **tends to help most is a small, concrete action** to take right then: a clear task, a short goal, something that brings back the feeling of making progress.",
      "ejemplo": "Instead of \"calm down\", a \"take care of this for a minute\" usually gets things back on track much better."
    },
    "ecos": {
      "cuerpo": "This drive to move forward **doesn't live only in sport**. It tends to show up when {nombre} organizes a game, suggests plans, or wants to solve something right away. Seeing it in those moments helps you understand it's not impatience: it's **their way of being in the world**.",
      "ejemplo": "If at home they're one of the first to say \"come on, let's do this\", you're seeing the same engine that drives {nombre} in the activity."
    }
  },
  "I": {
    "eje": "I",
    "label": "Connector",
    "combustible": {
      "cuerpo": "What usually lights {nombre} up most is **feeling part of the group and being able to spread their enthusiasm to others**. When the mood is good and there's someone to share it with, they really come alive. Feeling that their energy adds to the group is often their best fuel.",
      "ejemplo": "A \"you can tell when you're around, you get everyone excited\" will probably land with {nombre} more than praise given in private."
    },
    "palabrasPuente": ["Tell the group whatever comes to mind.", "You can lift everyone's spirits.", "Who should we bring in for this?", "I love your energy, spread it around."],
    "palabrasRuido": ["This isn't the time to talk.", "Work quietly, on your own.", "Stop distracting the group."],
    "palabrasNota": "It's not a script, it's a compass for tone: what usually **lands most with {nombre} is anything that celebrates their way of connecting**, and what grates is anything that dims their spark or cuts off the bond. With that in mind, the exact words are up to you.",
    "guia": {
      "lead": "Three moments where a small intention changes a lot.",
      "antes": "Give them a space where their enthusiasm has room and someone to share it with. Knowing they'll get to **add to the others** focuses and excites {nombre}.",
      "durante": "If the energy scatters, instead of asking for silence, **channel their spark**: give them a role where their enthusiasm pushes the group toward the task.",
      "despues": "Recognize **when they lift the group's spirits**, not just the result. A connector profile is usually reached more by a \"you got everyone excited\" than by general praise.",
      "ejemplo": "If there's a new activity on Saturday, telling them \"you're going to meet a bunch of people\" turns the nerves into excitement."
    },
    "reset": {
      "cuerpo": "When they get frustrated, feeling left out tends to weigh on {nombre}, and what they need is to reconnect. What **usually helps most is a moment of connection**: listening to {nombre}, naming what they feel and reminding them they're not in this alone. Once the mood is restored, they usually light back up.",
      "ejemplo": "Instead of \"figure it out on your own\", a \"let's look at it together\" usually gets the situation back on track much better."
    },
    "ecos": {
      "cuerpo": "This way of connecting **doesn't only live in sport**. It tends to show up when {nombre} gathers friends together, brings life to an outing or strikes up a chat with whoever's nearby. Seeing it in those moments helps you understand that it's not \"talking too much\": it's **their way of being in the world**.",
      "ejemplo": "If at home they're the one who suggests plans with friends and organizes the outing, you're seeing the same engine that drives {nombre} in the activity."
    }
  },
  "S": {
    "eje": "S",
    "label": "Sustainer",
    "combustible": {
      "cuerpo": "What usually lights {nombre} up most is **feeling that the group is doing well and being able to be a reliable support**. A calm atmosphere, with no surprises, and knowing that others count on their support, make {nombre} feel right at home. Feeling trusted is often their best fuel.",
      "ejemplo": "An \"I know I can count on you\" will probably reach {nombre} more than loud praise."
    },
    "palabrasPuente": ["I'm counting on you for this.", "Thank you for holding the group together.", "Take all the time you need.", "Your calm is good for everyone."],
    "palabrasRuido": ["Come on, hurry up, there's no time.", "We're changing everything on the fly.", "If you don't like it, deal with it."],
    "palabrasNota": "It's not a script, it's a compass for tone: what usually **reaches {nombre} most is valuing their steadiness and their calm**, and what jars is rushing or abrupt changes with no warning. With that in mind, the exact words are up to you.",
    "guia": {
      "lead": "Three moments where a small intention changes a lot.",
      "antes": "Give them predictability: tell them what's going to happen and what their place is. Knowing that **the ground is firm and that there's a place for their contribution** focuses and calms {nombre}.",
      "durante": "If something creates tension, instead of rushing them, **stay alongside them calmly**: slow the pace for a moment and reassure them that everything is in order.",
      "despues": "Acknowledge **when they hold the group together**, not just the result. A supportive profile is usually reached more by a \"you were everyone's support\" than by general praise.",
      "ejemplo": "If there's a new activity on Saturday, telling them \"you'll know what comes next at every moment\" turns nerves into calm."
    },
    "reset": {
      "cuerpo": "When they get frustrated, noise and tension usually weigh on {nombre}, and what they need is to get their calm back. What **usually helps most is easing off and returning to the familiar**: a quiet moment, a familiar routine, the reassurance that everything is in order. With a calm atmosphere, they usually settle back in.",
      "ejemplo": "Instead of \"come on, keep going now\", a \"take a minute, there's no rush\" usually gets things back on track much better."
    },
    "ecos": {
      "cuerpo": "This way of supporting **doesn't live only in sport**. It tends to show up when {nombre} looks after a sibling, calms an argument, or is the one everyone turns to when something gets tricky. Seeing it in those moments helps you understand that their calm isn't passivity: it's **their way of being in the world**.",
      "ejemplo": "If at home they're the one who brings peace and whom everyone leans on, you're seeing the same engine that drives {nombre} in the activity."
    }
  },
  "C": {
    "eje": "C",
    "label": "Strategist",
    "combustible": {
      "cuerpo": "What usually lights {nombre} up most is **understanding how things work and having a clear plan**. When they can analyze, anticipate and get things right, they really come alive. Feeling that their careful eye makes a difference is often their best fuel.",
      "ejemplo": "A \"I love how you thought that through\" will probably reach {nombre} more than general praise."
    },
    "palabrasPuente": ["How would you think it through?", "You see the details others miss.", "Take a moment to analyze it.", "Show me your plan."],
    "palabrasRuido": ["Stop asking so much and just do it.", "Just improvise, we'll see.", "You don't need to understand it, just do it."],
    "palabrasNota": "It's not a script, it's a compass for tone: what usually **reaches {nombre} most is anything that values their thinking and their care**, and what tends to grate is being rushed or asked to improvise without understanding. With that in mind, the exact words are yours to choose.",
    "guia": {
      "lead": "Three moments where a small intention changes a lot.",
      "antes": "Give them information and a moment to think. Knowing they'll get to **understand before acting** focuses and calms {nombre}.",
      "durante": "If they get stuck analyzing, instead of adding pressure, **support the decision**: help them choose with the info they already have and let go of the search for the perfect plan.",
      "despues": "Acknowledge **when they think things through and care about the details**, not just the result. A strategist profile is usually reached more by a \"you can tell you had it well thought out\" than by general praise.",
      "ejemplo": "If there's a new activity on Saturday, telling them ahead of time \"this is how it'll go, these are the steps\" turns the nerves into confidence."
    },
    "reset": {
      "cuerpo": "When they get frustrated, {nombre} usually struggles with the feeling of not understanding or having to improvise. What **usually helps most is giving them clarity**: explaining what's going on, organizing the information and giving them a moment to think. With the full picture clear, they tend to settle back down.",
      "ejemplo": "Instead of \"don't overthink it,\" a \"let's look at what comes next together\" usually gets the situation back on track much better."
    },
    "ecos": {
      "cuerpo": "This way of analyzing **doesn't live only in sport**. It tends to show up when {nombre} builds a strategy in a game, asks how things work or wants to understand the why behind everything. Seeing it in those moments helps you understand that it isn't \"overcomplicating things\": it's **their way of being in the world**.",
      "ejemplo": "If at home they're the one who wants to understand how each thing works and makes their own plan, you're seeing the same engine that drives {nombre} in the activity."
    }
  }
};

export const EJE_BASE_PT: Record<Axis, EjeBaseContent> = {
  "D": {
    "eje": "D",
    "label": "Impulsionador",
    "combustible": {
      "cuerpo": "O que mais costuma acender {nombre} é **ter um objetivo claro e sentir que seu impulso move as coisas**. Quando percebe que sua iniciativa deixa uma marca concreta, se anima de verdade, e reconhecer esse impacto é muitas vezes seu melhor combustível.",
      "ejemplo": "Um \"foi porque você começou que isso deu certo\" provavelmente motiva {nombre} muito mais do que um elogio genérico."
    },
    "palabrasPuente": ["Comece você com isso.", "O que você propõe para resolver?", "Hoje é você quem marca o ritmo.", "Me mostra como você faria."],
    "palabrasRuido": ["Espera, ainda não é a sua vez.", "Faz exatamente como eu digo.", "Melhor ficar de lado e só observar."],
    "palabrasNota": "Não é um roteiro, é uma bússola de tom: {nombre} costuma **sentir mais o que reconhece sua iniciativa**, e se incomoda com o que freia seu impulso sem explicar por quê. Com isso em mente, as palavras exatas quem escolhe é você.",
    "guia": {
      "lead": "Três momentos em que uma pequena intenção muda muita coisa.",
      "antes": "Ofereça um objetivo concreto e um espaço para tomar a iniciativa. Saber que vai poder **começar algo próprio** foca e entusiasma {nombre}.",
      "durante": "Se acelera demais, em vez de cortar o embalo, **canalize esse impulso**: reconheça a vontade e acrescente uma leitura rápida antes de ir. A ideia é somar, não apagar.",
      "despues": "Reconheça o que {nombre} **põe em movimento**, não só o resultado. Um perfil de ação costuma sentir mais um \"você fez tudo começar\" do que um elogio genérico.",
      "ejemplo": "Se no sábado tem uma atividade nova, dizer \"você vai poder começar\" transforma o nervosismo em vontade."
    },
    "reset": {
      "cuerpo": "Quando se frustra, {nombre} costuma ter dificuldade para ficar esperando, e isso é muito compreensível em um perfil de ação. O que **mais costuma ajudar é uma ação pequena e concreta** para fazer na hora: uma tarefa clara, um objetivo curto, algo que devolva a sensação de estar avançando.",
      "ejemplo": "Em vez de \"se acalma\", um \"cuida disso por um minuto\" costuma reorientar a situação muito melhor."
    },
    "ecos": {
      "cuerpo": "Esse impulso de avançar **não vive só no esporte**. Costuma aparecer quando {nombre} organiza uma brincadeira, propõe planos ou quer resolver algo na hora. Ver isso nesses momentos ajuda a entender que não é impaciência: é **seu jeito de estar no mundo**.",
      "ejemplo": "Se em casa {nombre} é dos primeiros a dizer \"vamos, bora fazer isso\", você está vendo o mesmo motor que move {nombre} na atividade."
    }
  },
  "I": {
    "eje": "I",
    "label": "Conector",
    "combustible": {
      "cuerpo": "O que mais costuma acender {nombre} é **sentir-se parte e poder contagiar os outros com seu entusiasmo**. Quando o clima é bom e há com quem compartilhar, {nombre} se anima de verdade. Sentir que sua energia soma ao grupo é muitas vezes seu melhor combustível.",
      "ejemplo": "Um \"nota-se quando você está, você contagia a vontade\" provavelmente chega mais a {nombre} do que um elogio a sós."
    },
    "palabrasPuente": ["Conte ao grupo o que você está pensando.", "Você pode levantar o ânimo de todos.", "Quem vamos incluir nisso?", "Adoro sua energia, contagie os outros."],
    "palabrasRuido": ["Agora não é hora de falar.", "Trabalhe em silêncio, por conta própria.", "Pare de dispersar o grupo."],
    "palabrasNota": "Não é um roteiro, é uma bússola de tom: a {nombre} costuma **chegar mais o que celebra seu jeito de conectar**, e fazer ruído o que apaga sua faísca ou corta o vínculo. Com isso em mente, as palavras exatas quem escolhe é você.",
    "guia": {
      "lead": "Três momentos em que uma pequena intenção muda muita coisa.",
      "antes": "Dê um espaço onde o entusiasmo de {nombre} tenha lugar e alguém com quem compartilhar. Saber que vai poder **somar aos outros** foca e entusiasma {nombre}.",
      "durante": "Se a energia se dispersa, em vez de pedir silêncio, **canalize essa faísca**: dê um papel onde o entusiasmo de {nombre} empurre o grupo para a tarefa.",
      "despues": "Reconheça **quando soma ao ânimo do grupo**, não só o resultado. A um perfil conector costuma chegar mais um \"você contagiou a vontade de todos\" do que um elogio geral.",
      "ejemplo": "Se no sábado tem uma atividade nova, contar a {nombre} \"você vai conhecer um monte de gente\" transforma o nervosismo em vontade."
    },
    "reset": {
      "cuerpo": "Quando se frustra, a {nombre} costuma pesar sentir-se de lado, e o que precisa é reconectar. O que **mais costuma ajudar é um momento de vínculo**: escutar {nombre}, nomear o que sente e lembrar que não enfrenta isso em solidão. Com o clima recomposto, {nombre} costuma voltar a se acender.",
      "ejemplo": "Em vez de \"resolva sozinho\", um \"vamos ver isso juntos\" costuma reencaminhar a situação muito melhor."
    },
    "ecos": {
      "cuerpo": "Esse jeito de conectar **não vive só no esporte**. Costuma aparecer quando {nombre} junta os amigos, anima um programa ou começa a conversar com quem estiver por perto. Ver isso nesses momentos ajuda a entender que não é \"falar demais\": é **seu jeito de estar no mundo**.",
      "ejemplo": "Se em casa é quem propõe programas com os amigos e organiza a saída, você está vendo o mesmo motor que move {nombre} na atividade."
    }
  },
  "S": {
    "eje": "S",
    "label": "Sustentador",
    "combustible": {
      "cuerpo": "O que mais costuma acender {nombre} é **sentir que o grupo está bem e poder ser um apoio de confiança**. Um clima tranquilo, sem sobressaltos, e saber que os demais contam com seu apoio, fazem {nombre} sentir-se no seu lugar. Sentir-se de confiança é muitas vezes seu melhor combustível.",
      "ejemplo": "Um \"sei que posso contar com você\" provavelmente chega a {nombre} mais do que um elogio barulhento."
    },
    "palabrasPuente": ["Conto com você para isto.", "Que bom poder contar com você para sustentar o grupo.", "Leve o tempo que precisar.", "Sua calma faz bem a todos."],
    "palabrasRuido": ["Vamos, se apure, não há tempo.", "Mudamos tudo em cima da hora.", "Se você não gosta, se vire."],
    "palabrasNota": "Não é um roteiro, é uma bússola de tom: a {nombre} costuma **chegar mais o que valoriza sua constância e sua calma**, e fazer ruído a pressa ou as mudanças bruscas sem aviso. Com isso em mente, as palavras exatas você escolhe.",
    "guia": {
      "lead": "Três momentos em que uma pequena intenção muda muita coisa.",
      "antes": "Dê previsibilidade: conte o que vai acontecer e qual é o seu lugar. Saber que **o terreno é firme e que há um lugar para sua contribuição** foca e tranquiliza {nombre}.",
      "durante": "Se algo gera tensão, em vez de apressar, **acompanhe com calma**: baixe o ritmo um momento e dê a segurança de que está tudo em ordem.",
      "despues": "Reconheça **quando sustenta o grupo**, não só o resultado. A um perfil sustentador costuma chegar mais um \"você foi o apoio de todos\" do que um elogio geral.",
      "ejemplo": "Se no sábado há uma atividade nova, contar \"você vai saber a todo momento o que vem a seguir\" transforma o nervosismo em tranquilidade."
    },
    "reset": {
      "cuerpo": "Quando se frustra, a {nombre} costuma pesar o ruído e a tensão, e o que precisa é recuperar a calma. O que **mais costuma ajudar é dar uma pausa e voltar ao conhecido**: um momento tranquilo, uma rotina familiar, a segurança de que está tudo em ordem. Com o clima sereno, costuma se reacomodar.",
      "ejemplo": "Em vez de \"vamos, continue já\", um \"leve um minuto, não há pressa\" costuma reencaminhar a situação muito melhor."
    },
    "ecos": {
      "cuerpo": "Essa forma de sustentar **não vive só no esporte**. Costuma aparecer quando {nombre} cuida de um irmão, acalma uma discussão ou é a quem todos procuram quando algo se complica. Ver isso nesses momentos ajuda a entender que sua calma não é passividade: é **sua maneira de estar no mundo**.",
      "ejemplo": "Se em casa é quem traz paz e em quem todos se apoiam, você está vendo o mesmo motor que move {nombre} na atividade."
    }
  },
  "C": {
    "eje": "C",
    "label": "Estrategista",
    "combustible": {
      "cuerpo": "O que mais costuma acender {nombre} é **entender como as coisas funcionam e ter um plano claro**. Quando pode analisar, antecipar e fazer as coisas bem, se envolve de verdade. Sentir que seu olhar cuidadoso faz a diferença é muitas vezes seu melhor combustível.",
      "ejemplo": "Um \"que ótimo como você pensou nisso\" provavelmente chega a {nombre} mais do que um elogio genérico."
    },
    "palabrasPuente": ["Como você pensaria nisso?", "Você enxerga os detalhes que passam despercebidos para os outros.", "Reserve um momento para analisar.", "Me mostra o seu plano."],
    "palabrasRuido": ["Não pergunte tanto e faça logo.", "Improvisa, depois a gente vê.", "Não precisa entender, faça e pronto."],
    "palabrasNota": "Não é um roteiro, é uma bússola de tom: a {nombre} costuma **chegar mais o que valoriza sua análise e seu cuidado**, e incomodar quando o apressam ou pedem que improvise sem entender. Com isso em mente, as palavras exatas são você quem escolhe.",
    "guia": {
      "lead": "Três momentos em que uma pequena intenção muda muita coisa.",
      "antes": "Dê informação e um momento para pensar. Saber que vai poder **entender antes de agir** foca e tranquiliza {nombre}.",
      "durante": "Se travar analisando, em vez de colocar pressão, **acompanhe a decisão**: ajude a escolher com a informação que já tem e a abrir mão da busca pelo plano perfeito.",
      "despues": "Reconheça **quando pensa e cuida dos detalhes**, não só o resultado. A um perfil estrategista costuma chegar mais um \"dá para ver que você tinha pensado bem nisso\" do que um elogio genérico.",
      "ejemplo": "Se no sábado tem uma atividade nova, contar com antecedência \"vai ser assim, estes são os passos\" transforma o nervosismo em confiança."
    },
    "reset": {
      "cuerpo": "Quando se frustra, a {nombre} costuma pesar a sensação de não entender ou de ter que improvisar. O que **mais costuma ajudar é dar clareza**: explicar o que está acontecendo, organizar a informação e dar um momento para pensar. Com o panorama claro, costuma se reacomodar.",
      "ejemplo": "Em vez de \"não pensa tanto nisso\", um \"vamos ver juntos como segue\" costuma reencaminhar a situação muito melhor."
    },
    "ecos": {
      "cuerpo": "Essa forma de analisar **não vive só no esporte**. Costuma aparecer quando {nombre} monta uma estratégia num jogo, pergunta como as coisas funcionam ou quer entender o porquê de tudo. Ver isso nesses momentos ajuda a entender que não é \"complicar demais\": é **seu jeito de estar no mundo**.",
      "ejemplo": "Se em casa é quem quer entender como cada coisa funciona e monta seu plano, você está vendo o mesmo motor que move {nombre} na atividade."
    }
  }
};

export const MOTOR_EN: Record<'rapido' | 'intermedio' | 'lento', ReportBlock> = {
  "rapido": {
    "cuerpo": "In the reaction-and-decision mini-games, {nombre} moved with a **nimble pace**: they tend to read quickly and trust their first impulse. They usually **get actions going and resolve things with ease when a decision has to be made on the spot**. Supporting {nombre} means giving room for that speed and, little by little, offering chances to discover when it's worth taking one more second.",
    "ejemplo": "If something needs to be started, {nombre} is usually among the first to get going. Adding the question \"what if I look for a second first?\" helps {nombre} grow without dimming their drive."
  },
  "intermedio": {
    "cuerpo": "In the reaction-and-decision mini-games, {nombre} showed a **balanced pace**: they tend to fit their timing to what each moment calls for, without rushing or dragging. They're usually **flexible with tempo**, and that's a very valuable resource. Supporting {nombre} means helping recognize when their game calls for speed and when it calls for a pause.",
    "ejemplo": "Faced with a decision, {nombre} can speed up if needed or take a moment if it helps: that read of the tempo is a strength."
  },
  "lento": {
    "cuerpo": "In the reaction-and-decision mini-games, {nombre} moved with a **measured pace**: they tend to take a moment to read the scene before moving. They usually **choose thoughtfully, without rushing**. Supporting {nombre} means valuing that read (without asking them to hurry just for the sake of it) and giving them the confidence to hold their own timing when the situation allows.",
    "ejemplo": "Before responding, {nombre} usually looks at the situation for a second: that \"understand first, then go\" is part of their strength."
  }
};

export const MOTOR_PT: Record<'rapido' | 'intermedio' | 'lento', ReportBlock> = {
  "rapido": {
    "cuerpo": "Nos minijogos de reação e decisão, {nombre} se moveu com um **ritmo ágil**: tende a ler rápido e a confiar em seu primeiro impulso. Costuma **iniciar as ações e resolver com desenvoltura quando é preciso decidir na hora**. Acompanhar {nombre} é dar espaço para essa velocidade e, aos poucos, oferecer oportunidades para descobrir quando vale a pena levar um segundo a mais.",
    "ejemplo": "Se há algo para começar, {nombre} costuma estar entre os primeiros a iniciar. Acrescentar a pergunta \"e se eu olhar um segundo antes?\" ajuda {nombre} a crescer sem apagar seu impulso."
  },
  "intermedio": {
    "cuerpo": "Nos minijogos de reação e decisão, {nombre} mostrou um **ritmo equilibrado**: tende a ajustar seu tempo ao que cada momento pede, sem se apressar nem se demorar. Costuma ser **flexível com os tempos**, e esse é um recurso muito valioso. Acompanhar {nombre} é ajudar a reconhecer quando seu jogo pede velocidade e quando pede uma pausa.",
    "ejemplo": "Diante de uma decisão, {nombre} pode acelerar se for preciso ou levar um momento se convém: essa leitura do tempo é uma força."
  },
  "lento": {
    "cuerpo": "Nos minijogos de reação e decisão, {nombre} se moveu com um **ritmo medido**: tende a levar um momento para ler a cena antes de se mover. Costuma **escolher com critério, sem se apressar**. Acompanhar {nombre} é valorizar essa leitura (sem pedir que se apresse só por se apressar) e dar confiança para sustentar seu tempo quando a situação permite.",
    "ejemplo": "Antes de responder, {nombre} costuma olhar um segundo a situação: esse \"primeiro entendo, depois vou\" é parte de sua força."
  }
};
