// Auto-generated English translations for situationalGuide.ts
// Situation IDs, eje values, and category keys are kept as-is (identifiers).
// Profile names: Impulsor→Driver, Conector→Connector, Sosten/Sostén→Supporter, Estratega→Strategist

import type { Situation, SituationCard } from './situationalGuide';

/* ── The 15 situations ─────────────────────────────────────────────────────── */

export const SITUATIONS_EN: Situation[] = [
    {
        id: 'no-quiere-arrancar',
        title: "Struggles to get into the session",
        whatYouSee: 'The player shows up to practice and refuses to participate. They seem checked out, complain, sit on the sideline, or say "I\'m not feeling it today".',
        whatsHappening: "This isn't a lack of commitment. The kid is still mentally in whatever they were doing before (school, home, a fight with a friend). They need a moment to shift gears into sport mode.",
        profilePerspectives: "If the player's profile is {{Driver}}, they may not see a challenge that makes starting worth it. They need to feel like what's coming is worth the effort. If they're a {{Connector}}, they probably need the social connection first: if their friend didn't show up or the group vibe feels off, it's hard to get going. A {{Supporter}} profile may simply need more time to make the transition, especially if anything in the routine changed. And if they're a {{Strategist}}, they may be processing something that happened earlier and need to mentally close that out before they can focus on something new.",
        category: 'Motivación',
        icon: '',
    },
    {
        id: 'se-frustra-cuando-pierde',
        title: 'Gets very frustrated when losing',
        whatYouSee: 'The player reacts with anger, gets upset, sometimes throws things, or refuses to keep going after losing a point, a game, or a drill.',
        whatsHappening: "They feel like losing erases all the effort they put in. In that moment they can't separate \"I had a bad play\" from \"I'm bad.\" The emotion blocks the learning. The first step is always to validate what they're feeling before trying to explain the play.",
        profilePerspectives: "A {{Driver}} can react with visible anger because losing hits directly at their need to win and stay in control. The {{Connector}} tends to get more frustrated if they feel they let the team down or someone important was watching. The {{Supporter}} may hold the frustration inside and show it later, quietly but persistently. And the {{Strategist}} will likely get angry at themselves because they had already thought through what to do, and they feel they failed at executing it.",
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'no-hace-lo-que-pido',
        title: "Processes instructions at their own pace",
        whatYouSee: "You give an instruction and the player does something else, takes way too long to start, or seems like they didn't hear you.",
        whatsHappening: "They're not ignoring you. Every kid processes instructions at their own pace. Some act before you finish talking, others need more time to understand the logic behind what you asked. It's a difference in processing speed, not attitude.",
        profilePerspectives: "The {{Driver}} may have already started executing before you finished talking (their drive pushes them to action before listening). The {{Connector}} was probably talking to a teammate and missed the instruction. A {{Supporter}} may have heard perfectly but needs a little extra time to feel confident before starting. And the {{Strategist}} is likely evaluating whether the instruction makes sense before moving. It's not resistance, it's just how they process.",
        category: 'Comunicación',
        icon: '',
    },
    {
        id: 'raro-antes-del-partido',
        title: 'Feels the tension before a game',
        whatYouSee: 'The player is quieter or more restless than usual before competing. They might be nervous, making multiple trips to the bathroom, or the opposite: hyperactive and unable to stay still.',
        whatsHappening: "They're feeling the weight of expectations (their own or from outside) and their body is reacting to the uncertainty of what's about to happen. Each profile shows it differently: some shut down, others rev up.",
        profilePerspectives: "The {{Driver}} can get hyperactive, talking a lot and moving non-stop. That's how they channel the adrenaline. The {{Connector}} tends to seek out someone nearby and talk about anything just to feel accompanied. A {{Supporter}} may go very quiet and need you to reassure them that everything is going to be fine. And the {{Strategist}} is probably mentally running through every possible play. Their silence isn't nerves, it's preparation.",
        category: 'Presión',
        icon: '',
    },
    {
        id: 'mira-desde-afuera',
        title: 'Watching from the outside',
        whatYouSee: "The player doesn't join the group. They stay at the edge of the court observing, especially when it's a new drill or a group they don't know well.",
        whatsHappening: 'They\'re doing a "scan" of the situation. They need to understand how the dynamics work before jumping in. It\'s not shyness or cowardice, it\'s how they prepare to participate confidently.',
        profilePerspectives: "If they're a {{Driver}}, they're probably not watching from outside out of fear: they just haven't found the right moment to enter with impact. The {{Connector}} may be waiting for someone to invite them or include them (they need the social signal). A {{Supporter}} is evaluating whether the environment is predictable and safe before exposing themselves. And the {{Strategist}} is literally studying the dynamics: who does what, how the drill works, what the unspoken rules are.",
        category: 'Social',
        icon: '',
    },
    {
        id: 'llora-o-se-enoja',
        title: 'Gets emotionally overwhelmed in practice',
        whatYouSee: 'The player breaks down emotionally during an activity. It might be crying, anger, or both. Sometimes it happens after a correction, sometimes it seems to come out of nowhere.',
        whatsHappening: "Everything piled up: fatigue, noise, corrections, the demands of the drill. Their system got overloaded and the emotion spilled over. It's not a tantrum: in that moment the demand exceeded what they could handle.",
        profilePerspectives: "The {{Driver}} tends to overflow with anger: they shout, kick something, complain loudly. That's their way of releasing pressure fast. The {{Connector}} may cry if they feel they were corrected in front of the group or if someone left them out. A {{Supporter}} has probably been accumulating for a while and the breakdown is the last straw (their outburst often surprises people because they showed no signs beforehand). The {{Strategist}} may get quietly angry at themselves and need a moment alone to get back on track.",
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'roce-con-companero',
        title: 'Has a clash with a teammate',
        whatYouSee: "Two players bump heads during a drill. It might be an argument, a complaint, or simply that they can't work together.",
        whatsHappening: "Every kid has a natural style for approaching things. When two very different styles meet without any mediation, friction happens. It's not that one is right and the other is wrong: they have different rhythms and approaches.",
        profilePerspectives: "If there's a {{Driver}} in the clash, they're likely trying to push their idea or pace, not because they're being mean, but because leading is their natural instinct. The {{Connector}} may take it personally and feel rejected by their teammate. A {{Supporter}} will probably try to avoid the conflict until they can't anymore, and then react all at once. And the {{Strategist}} can get frustrated if they feel the other person isn't following the correct logic of the drill.",
        category: 'Social',
        icon: '',
    },
    {
        id: 'se-castiga',
        title: 'Beats themselves up when they make a mistake',
        whatYouSee: 'After an error, the player hits their own head, insults themselves, says "I\'m a disaster," or gets angry at themselves in an exaggerated way.',
        whatsHappening: "They measure their self-worth by the perfection of their performance. Every mistake feels like proof that they \"aren't good enough.\" Their self-demand got out of hand and they're stuck in a punishing loop that keeps them from playing well.",
        profilePerspectives: "The {{Driver}} beats themselves up because they need to feel capable, and the mistake threatens that image. Their reaction is usually quick, intense, and visible. The {{Connector}} may punish themselves thinking about what others are thinking of them after the mistake. A {{Supporter}} tends to punish themselves quietly, ruminating internally. And the {{Strategist}} can be the harshest on themselves because they had already planned what to do and feel they \"should have done it right.\"",
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'se-distrae',
        title: 'Struggles to hold attention',
        whatYouSee: "The player looks around, talks to the person next to them, plays with something unrelated, or simply isn't \"present\" in the drill.",
        whatsHappening: "Practice isn't matching their rhythm. The drill might be too slow for their motor (they get bored) or too chaotic for their style (they disengage). Distraction is a signal that something about the format isn't landing.",
        profilePerspectives: "The {{Driver}} gets distracted when the drill doesn't have enough intensity or challenge. They need more pace or competition to stay engaged. The {{Connector}} may get distracted by socializing because for them, talking to a teammate IS being present (their attention works differently). A {{Supporter}} disconnects when there's too much chaos, noise, or constant changes: they need predictability to focus. And the {{Strategist}} may seem distracted when they're actually thinking about something else: a previous play, a pattern they noticed, something that caught their attention.",
        category: 'Concentración',
        icon: '',
    },
    {
        id: 'quiere-dejar',
        title: 'Says they want to quit the sport',
        whatYouSee: "The player says they don't want to come back, that they don't like it, or they simply stop showing up.",
        whatsHappening: "The emotional effort it takes them to adapt to the sports environment has become greater than what they enjoy. It's not that they don't like the sport: something about the context is draining them more than it's filling them up. The goal isn't to convince them to stay at all costs, but to adjust the environment and see if the enjoyment can come back.",
        profilePerspectives: "A {{Driver}} may want to quit if they feel they have no room to lead or that the challenge level isn't motivating. The {{Connector}} tends to leave when they feel they don't belong to the group or the social dynamics are leaving them out. A {{Supporter}} may want to quit if constant changes or pressure wear them out (they need stability to enjoy it). And the {{Strategist}} can disengage if they feel no one values their perspective on the game or if the activity feels too chaotic.",
        category: 'Motivación',
        icon: '',
    },
    {
        id: 'jugador-nuevo',
        title: 'A new player joins the group',
        whatYouSee: "A player joins who doesn't know anyone. The group reacts: some welcome them, others ignore them, others feel uncomfortable with the change.",
        whatsHappening: "The arrival of someone new disrupts the balance the group already had. Players who value stability feel like something was broken. Those who are more social will probably welcome them quickly. Each profile experiences the change differently.",
        profilePerspectives: "The {{Driver}} will probably welcome the new player if they see them as a potential ally or interesting rival (they size them up fast). The {{Connector}} may be the first to go over and make them feel welcome, that's their integrating nature. A {{Supporter}} may feel uncomfortable with the shift in group dynamics and need time to adjust. And the {{Strategist}} will observe the new player from a distance before interacting: it's not rejection, it's how they figure out who someone is.",
        category: 'Social',
        icon: '',
    },
    {
        id: 'se-congela',
        title: 'Freezes up in the game',
        whatYouSee: 'A player who performs well in practice looks like a completely different person in the game: they don\'t run, don\'t call for the ball, don\'t react. Like they\'ve been "switched off."',
        whatsHappening: "The pressure of the game activated a protection mechanism. Faced with the crowd's eyes or the weight of the moment, their body chooses \"do nothing\" to avoid making a mistake. It's not that they don't want to: they've locked up.",
        profilePerspectives: "The {{Driver}} freezes when they feel too much is at stake and they can't afford to fail: the pressure stalls their engine instead of accelerating it. The {{Connector}} may lock up if they feel the eyes of the crowd or their parents are evaluating them. A {{Supporter}} tends to freeze when the situation feels unpredictable or chaotic (they need a safety anchor). And the {{Strategist}} can get paralyzed by over-analysis: they see too many options and can't pick one in time.",
        category: 'Presión',
        icon: '',
    },
    {
        id: 'no-quiere-ser-centro',
        title: "Doesn't want to be the center of attention",
        whatYouSee: 'When it\'s time to lead an activity, speak in front of the group, or demonstrate something alone, the player refuses, hides, or gets very uncomfortable.',
        whatsHappening: "Their natural way of participating is from a more reserved place. Forcing them to be the center of attention is like asking a left-handed person to write with their right hand: they can do it, but it's uncomfortable. There are forms of leadership that don't require being in the spotlight.",
        profilePerspectives: "A {{Driver}} usually wants to be at the center, so if they're resisting it's probably something else: a specific insecurity or fatigue. The {{Connector}} may want to participate but feels embarrassed doing it alone (they work better with company). A {{Supporter}} genuinely prefers the background and feels exposed when put out front. They can lead through support, not through the stage. And the {{Strategist}} may feel that speaking in front of everyone forces them to improvise, which generates real discomfort. Give them time to prepare and you'll get a different response.",
        category: 'Social',
        icon: '',
    },
    {
        id: 'cambio-repentino',
        title: 'Changed overnight',
        whatYouSee: "A player who was always one way suddenly seems different: quiet, irritable, or checked out. And they don't return to their normal self.",
        whatsHappening: "Something outside of practice is affecting them: school, home, a family situation, trouble with friends. A sustained change in behavior is a signal that something external is draining their emotional energy.",
        profilePerspectives: "A {{Driver}} who suddenly goes quiet is a clear signal that something is going on: their nature is to be active, and the absence of that energy is significant. The {{Connector}} may go quiet or pull away from the group when something outside affects them. A {{Supporter}} may show irritability or resistance where there used to be calm (the change is usually subtle but persistent). And a {{Strategist}} who disengages may be processing something internally that's completely consuming them.",
        category: 'Observación',
        icon: '',
    },
    {
        id: 'derrota-grupal',
        title: "The team struggles to bounce back from a loss",
        whatYouSee: "After a loss, the whole group is down. Nobody's talking, or everyone's blaming each other. The mood gets heavy.",
        whatsHappening: "The team as a group stopped seeing the process and got stuck on the result. A collective loss feels heavier than when just one player loses. The group needs to reconnect with what unites them beyond the scoreboard.",
        category: 'Grupal',
        icon: '',
    },
    {
        id: "acepta-ser-suplente",
        title: "Struggling to accept being a substitute",
        whatYouSee: "The player ends up on the bench and you can tell. They look down, shut down, give short answers, or from the sidelines show frustration or low energy while they wait for their turn.",
        whatsHappening: "At this age, the child still doesn't fully separate being a starter from being worth something as a person. Not being on the field isn't experienced as a phase or a tactical decision, it's experienced as a message about how much they matter to you and to the group. They aren't complaining about the role, they're protecting their place. They need someone to confirm that they're still part of this and that it doesn't define who they are.",
        profilePerspectives: "Each child holds this moment in their own way. The {{Driver}} feels it as a loss of control and of the spotlight, struggles to sit still watching others play, and may show impatience or intensity from the bench. The {{Connector}} fears they've let someone down, looks at the group and wonders whether they're still wanted there, and needs to feel included even when they're not on the field. The {{Supporter}} keeps the discomfort silent, seems to accept it without any trouble, but bottles it up inside and it can surface later as low spirits. The {{Strategist}} turns it over and over, looks for the exact reason why them and not someone else, and if they don't understand the criteria they can get stuck thinking they did something wrong.",
        category: "Rol",
        icon: '',
    },
    {
        id: "companero-se-destaca",
        title: "It's hard for them when a teammate stands out",
        whatYouSee: "A teammate gets praised, gets picked, or makes the difference on a play, and the player shuts down. They make a sour face, downplay the other's achievement (\"they got lucky anyway\"), complain about who gets the spotlight, or drop their intensity for the rest of practice.",
        whatsHappening: "It is not selfishness or bad intent. At this age, the child still measures their worth by comparing themselves to others, so when someone else shines they feel their own place shrink. What shows up (jealousy, irritation, low motivation) is really a fear of not being enough. They need help understanding that someone else can stand out without it taking anything away from them.",
        profilePerspectives: "Each profile lives this comparison in their own way. The {{Driver}} feels it as a direct competition for first place: if the other shines, they read it as a defeat and react quickly, wanting to prove right away that they can do it too. The {{Connector}} suffers most from the social displacement: it hurts them that the group's attention and affection are going to someone else, and they may take it to mean they are no longer liked the same. The {{Supporter}} tends to keep the discomfort to themselves in silence, dials it back, and steps into the background, until the built-up irritation surfaces later all at once. And the {{Strategist}} loops, analyzing why the other did it better, comparing point by point and being incredibly hard on themselves in that internal tally.",
        category: "Social",
        icon: '',
    },
    {
        id: "recibe-correccion",
        title: "Struggles to take a correction",
        whatYouSee: "Every time you point out something to improve, the player shuts down, makes excuses, looks annoyed or deflates. A technical correction shifts their mood more than you would expect.",
        whatsHappening: "They are not challenging your authority or lacking humility. At this age, many children still don't separate what they do from who they are, so they hear \"this can get better\" and inside they feel \"I'm not enough.\" The reaction you see (making excuses, getting offended, going quiet) is a way of protecting themselves from that blow to their sense of worth. When they understand that the correction is about the action and not about who they are, the door opens.",
        profilePerspectives: "Each child protects their sense of worth in their own way. The {{Driver}} tends to read the correction as a loss of control or status, so they make excuses quickly or argue so as not to come out underneath. The {{Connector}} experiences it through the relationship: they feel they let you down or got exposed in front of the group, and that hits harder than the technique itself. The {{Supporter}} takes it in silence, nodding to avoid friction, but inside they hold on to the discomfort and may deflate later. The {{Strategist}} gets hard on themselves, dwells on the detail and gets stuck analyzing everything they did, finding it difficult to let go of the mistake and move on.",
        category: "Comunicación",
        icon: '',
    },
    {
        id: "gestiona-exito",
        title: "Success goes to their head",
        whatYouSee: "When things go well (they score a goal, win, or get praised) their attitude shifts. They ease up, put in less effort, tune out from the team, or start underestimating the opponent.",
        whatsHappening: "This is not arrogance or disrespect. The child does not yet have the internal tools to hold such a big emotion without getting overwhelmed, and success fills them with an intensity they are not quite sure where to put. At this age, euphoria is just as hard to regulate as frustration, and it almost always spills outward. Learning to handle the good is part of the same process as learning to hold the hard.",
        profilePerspectives: "Each profile experiences euphoria in their own way. The {{Driver}} lights up fast and needs their achievement to be noticed, so success can lead them to ease off because they already feel like they have won and the challenge is over. The {{Connector}} enjoys the group's recognition and, carried away by the emotion, can take over the moment looking for everyone to celebrate with them and lose sight of the rest of the team. The {{Supporter}} usually lives success more quietly, but holds it inside and sometimes relaxes too much when they sense the pressure has dropped. The {{Strategist}} analyzes their good performance and can convince themselves that they have already figured it all out, letting their guard down because they feel there is nothing left to improve.",
        category: "Emocional",
        icon: '',
    },
    {
        id: "rol-referente",
        title: "They struggle to take on a leadership role",
        whatYouSee: "The group or you point to them as a leader or captain, and the player gets uncomfortable. They avoid the role, downplay it, get tense when they have to set the example, or carry it out in a way that doesn't come naturally to them.",
        whatsHappening: "It's not that they can't lead. It's that the role being offered feels too big or unfamiliar, and they feel the weight of the responsibility before they have a clear sense of how to step into it. Leading isn't one single thing, and this child is still discovering their own way of doing it. The discomfort is a sign of respect for the role, not a lack of ability.",
        profilePerspectives: "Each player experiences the leadership role from their own nature. The {{Driver}} usually accepts it quickly because they like being out front, though they may confuse leading with bossing, and they struggle when the group doesn't follow at the pace they set. The {{Connector}} leads through connection and wants everyone to be okay, so the weight hits when they feel they have to choose or set a limit with their teammates. The {{Supporter}} usually prefers the background and fears being too exposed, even though they already hold the group together in quiet ways that almost no one names. The {{Strategist}} hesitates because they feel they still don't fully understand what's expected of them, and they'd rather wait than carry out the role halfway or get it wrong in front of everyone.",
        category: "Rol",
        icon: '',
    },
    {
        id: "expectativa-padres",
        title: "Carrying their parents' expectations",
        whatYouSee: "The player keeps glancing toward the stands during the game or practice. They tense up when their parents are present and play differently: more nervous, more rigid, or fixated on how they are being seen from the outside.",
        whatsHappening: "The child is still learning to play for themselves and not for others. They feel that their performance decides something important for the adults they love most, and that weight presses on them harder than any opponent. It is not that they care too much about what others think: they simply have not yet learned to separate their own wish to play from the wish their parents place on them.",
        profilePerspectives: "Every child carries this expectation in their own way. The {{Driver}} turns it into pressure to win at all costs: if they fail, they feel they let everyone down and react with anger or by overdemanding from themselves to prove they can do it. The {{Connector}} experiences it as a matter of connection: they need their parents to be proud and deflate the moment they catch a serious face in the stands, because for them playing well and being loved get tangled together. The {{Supporter}} keeps the tension inside and does not show it, keeps playing quietly but more rigidly, until the built-up weight surfaces all at once on a bad day. The {{Strategist}} gets stuck inside their own head: they analyze what is expected of them, demand twice as much from themselves, and end up playing tight out of fear of not living up to what they believe the adults want to see.",
        category: "Presión",
        icon: '',
    },
    {
        id: "sube-categoria",
        title: "Struggling to adjust after moving up a category",
        whatYouSee: "The player moved up to a higher category and they seem different. They take part less, look for the ball less, stay quiet or stick close to the teammates they already knew. Sometimes they compare themselves out loud to the older players.",
        whatsHappening: "They did not lose their level. In their previous category they were a reference point, and now they are the newcomer among players who are older, faster and more physical. That feeling of starting from scratch touches their confidence, and they need time to find their place again and feel like part of the group. The transition is about identity, not just about play.",
        profilePerspectives: "Each child experiences this jump through their own way of operating. The {{Driver}} feels they are no longer the one setting the pace, and losing that reference point can make them cover up the insecurity behind anger or competing too hard to win back the spotlight. The {{Connector}} mostly experiences the social side: they left their group behind and have not yet found their place among the new ones, so they feel alone even when surrounded by people. The {{Supporter}} gets destabilized by the change of routine and familiar faces, pulls back into the background and carries the discomfort in silence until one day it weighs on them all at once. The {{Strategist}} turns inward to read everything that is new (the pace, the unspoken rules, where they fit) and, while they process, they can seem switched off or hesitate before playing because they do not yet fully understand the setting.",
        category: "Rol",
        icon: '',
    },
];

/* ── The 57 cards ──────────────────────────────────────────────────────────── */

export const SITUATION_CARDS_EN: SituationCard[] = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. Won't get started
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-quiere-arrancar',
        eje: 'D',
        whatsHappeningForProfile: "The Driver tends to need to feel like what's coming is worth it. If they don't see a clear challenge, the transition is usually harder. Their motor pushes them to action, but only when the goal is motivating.",
        howToAccompany: [
            'Offer a mini personal challenge for the first 5 minutes: "Let\'s see if you can get going faster than last time."',
            'Give them an active role from the start: have them set up the cones, pick the first drill, or lead the warm-up.',
        ],
        ifNotResponding: "Let them watch the first few minutes without pressure. Once they see the group in action, their competitive instinct usually kicks in on its own.",
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'I',
        whatsHappeningForProfile: "The Connector tends to need social connection to get activated. If they arrived alone, if their friend didn't come, or if the group vibe is off, it's usually hard for them to get going. Their energy turns on through people, not through the activity itself.",
        howToAccompany: [
            'Go up and ask something personal: "How was your day?" That small connection is their on-switch.',
            'Put them next to someone they click with for the first drill.',
        ],
        ifNotResponding: 'Add them to a fun group activity (not a technical one). A warm-up game where they laugh is usually enough to get them in.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter tends to need everything to feel \"in its place\" before they feel secure. If practice changed times, if there are new people, or if anything in their routine shifted, the transition usually gets harder. Their slower processing pace means the gear-switch takes more time.",
        howToAccompany: [
            'Keep them in their routine: the same warm-up as always, in the same spot, with the same teammates nearby.',
            "Don't ask them to explain why they don't want to. Just give them a couple of minutes and say: \"We'll start when you're ready.\"",
        ],
        ifNotResponding: 'Give them a small, predictable task ("Do 10 ball touches right here") so they can ease into the rhythm without jumping straight into the group.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist tends to need to understand what's going to happen before they commit. If they don't know what's being trained, or if the plan changed without explanation, they'd usually rather stay out and process. Their processing engine needs to close the logic before starting.",
        howToAccompany: [
            'Give them a brief overview of what you\'re doing today: "First warm-up, then a tactical drill, and we\'ll wrap up with a scrimmage." Predictability activates them.',
            'If something about the usual plan changed, explain why: "Today we\'re doing something different because we need to work on X."',
        ],
        ifNotResponding: "Let them watch the first activity from the sideline. Once they understand the logic of the drill, they usually join on their own.",
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. Gets very frustrated when losing
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'D',
        whatsHappeningForProfile: "For the Driver, losing is personal. They feel like the result defines their worth. Their leadership energy turns against themselves or others when the scoreboard doesn't go their way.",
        howToAccompany: [
            'Validate first: "I get that you\'re angry, that\'s normal when you give everything you have." Don\'t minimize what they feel.',
            'Then redirect the competitive energy: "What would you do differently if you could replay that last move?" That shifts them from the result to the process.',
        ],
        ifNotResponding: 'Give them a moment alone. The Driver needs to process frustration privately before they can hear any advice.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'I',
        whatsHappeningForProfile: 'The Connector tends to feel the loss as a social rupture: "I let the team down," "I wasn\'t enough for the team." Their frustration usually comes more from the impact on others than from the result itself.',
        howToAccompany: [
            'Validate the emotion through the relational lens: "It\'s obvious how much you care about this team, that says a lot about you."',
            'Separate them from the "I let everyone down" narrative with specifics: "Look at everything the team accomplished today, and you were part of that."',
        ],
        ifNotResponding: 'Ask a trusted teammate to talk to them. The Connector recovers faster with peer support than with a word from the adult.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter usually doesn't explode after a loss; they tend to hold it in. They go quiet, pull back, and can carry that frustration for several days. Their natural stability makes them look fine on the outside, but inside it's hard to let go.",
        howToAccompany: [
            'Validate without forcing: "If you need to talk, I\'m here." Don\'t ask them to process it on the spot.',
            'At the following practices, watch for whether they\'re quieter than usual. If they seem different, a low-pressure "How are you doing?" often opens the door.',
        ],
        ifNotResponding: 'Keep their routine and normalcy intact. The Supporter recovers when they feel everything around them is still the same, despite the result.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist tends to analyze the loss on a loop: they replay every mistake, every play, looking for the exact moment things went wrong. Their frustration is usually more cognitive than emotional, but it still paralyzes them.",
        howToAccompany: [
            'Validate their analysis: "It\'s good that you think about what happened, that\'s what makes you better." Then set a limit on the loop: "Let\'s pick one thing to work on next time."',
            'Give them concrete data: "You got 7 out of 10 plays right. The balance is positive." Numbers pull them out of the emotional loop.',
        ],
        ifNotResponding: 'Suggest they write or draw what they felt. The Strategist processes better when they can organize their thoughts outside of their head.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. Won't do what I ask
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'D',
        whatsHappeningForProfile: "The Driver probably heard the instruction, but they've already decided to do it their way. It's not disobedience: their quick motor often launches them into action before you finish talking, and they trust their instinct.",
        howToAccompany: [
            'Keep the instruction short and direct, in one sentence. "Pass to the pivot, shoot on goal." Fewer words, more action.',
            'If they did something different but it worked, acknowledge it: "Good call. Now let\'s try it this way too."',
        ],
        ifNotResponding: 'Give them the competitive "why": "If you practice this, you\'ll have one more tool to win." The Driver does what they understand will make them better.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'I',
        whatsHappeningForProfile: "The Connector was probably talking to someone when you gave the instruction, or got caught up in the social dynamic and lost focus. It's not disrespect: their attention goes to people first and the task second.",
        howToAccompany: [
            'Make sure you have their attention before giving the instruction: eye contact, name, then the instruction.',
            'Frame the instruction socially: "You and your teammate are going to do this together" works better than an individual command.',
        ],
        ifNotResponding: 'Ask them to explain the instruction to another teammate. When they translate it, they process it and execute it.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter heard everything, but if the instruction was complex or new, their processing engine needs more time to close the logic before starting. It's not slowness: they want to get it right.",
        howToAccompany: [
            'Give the instruction step by step: "First we do this... good, now this next part." Not everything at once.',
            'After the instruction, give them a few seconds before expecting them to start. That silence is their processing time.',
        ],
        ifNotResponding: 'Do a quick demonstration of the drill. The Supporter processes much better watching than listening.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist is processing the instruction thoroughly. If you told them something that doesn't make sense to them, or contradicts what they've done before, they stop. Their engine needs to close the logic of the first instruction before starting the second.",
        howToAccompany: [
            'Explain the "why" of the drill: "We\'re doing this because it trains lateral reaction." With a clear purpose, they execute.',
            'If they ask "why," don\'t take it as pushback. It\'s how they commit: understand first, act second.',
        ],
        ifNotResponding: 'Say: "Try it once and then tell me what you think." The Strategist gets unblocked by direct experience more than verbal explanation.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. Acting strange before a game
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'raro-antes-del-partido',
        eje: 'D',
        whatsHappeningForProfile: "The Driver tends to show nerves through hyperactivity: talks too much, can't stay still, or goes the opposite way (irritable and quiet). The uncertainty bothers them because they want to control the result and can't.",
        howToAccompany: [
            'Give them a concrete task that makes them feel in control: "Warm up with a ball, take 20 shots." Physical action channels the anxiety.',
            'Talk to them in terms of a plan: "Today your role is X. If Y happens, you do Z." The clarity of the plan calms them down.',
        ],
        ifNotResponding: 'Let them warm up alone with music or in a separate space. The Driver processes pressure by moving, not by talking.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'I',
        whatsHappeningForProfile: "The Connector tends to seek social containment: they talk to everyone, crack jokes, or stick close to their trusted person. They usually process nerves through connection. If they're quiet, something is weighing on them more than usual.",
        howToAccompany: [
            'Create a group connection moment: a team huddle, a group cheer, a "how are we feeling?" check-in. That centers them.',
            'If they\'re quieter than normal, approach without pressure: "All good?" with a supportive gesture (pat on the back, fist bump).',
        ],
        ifNotResponding: 'Ask them to pump up the group. Giving them a social role ("Your job is to make sure everyone\'s fired up") turns their anxiety into positive energy.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter tends to shut down. They go quieter, stick closer to their routine, and do exactly what they always do as if to hold onto something that hasn't changed. The uncertainty of the game hits their sense of security.",
        howToAccompany: [
            'Keep their pre-game routine as close to normal as possible: same warm-up, same spot, same teammates nearby.',
            'Give them something reassuring to hold onto: "Today we play exactly like we do in practice, nothing weird, just what we already know how to do."',
        ],
        ifNotResponding: "Don't push them to \"look excited.\" The Supporter competes well from a calm state. Let them come onto the field at their own pace.",
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'C',
        whatsHappeningForProfile: 'The Strategist is thinking through every possible scenario: "What if I have to mark the biggest guy?" "What if we mess up the kickoff?" Their analytical mind turns into a worry machine when they don\'t have enough information.',
        howToAccompany: [
            'Give them concrete information: the opponent, the game plan, their specific role. Data replaces uncertainty.',
            '"Do you have any questions about what we\'re going to do?" Letting them empty out their questions is a relief.',
        ],
        ifNotResponding: 'Tell them: "You\'ve thought it through and that\'s good. Now trust what you\'ve prepared and just play." The permission to let go of the analysis sets them free.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. Watching from the outside
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'mira-desde-afuera',
        eje: 'D',
        whatsHappeningForProfile: "Unusual for a Driver, but when it happens it's because they don't feel confident they can dominate the situation. If the drill or the group are new, they'd rather wait until they see how they can stand out.",
        howToAccompany: [
            'Give them a role from the sideline: "Watch and tell me what you would do differently." That keeps them active while they observe.',
            'Offer a low-stakes entry: "Want to try it? If you don\'t like it, you can step back." The exit option makes it easier to step in.',
        ],
        ifNotResponding: 'Let them watch a full round and then ask directly: "Ready?" The Driver usually responds well to a direct invitation.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'I',
        whatsHappeningForProfile: "The Connector tends to watch from outside when they don't know anyone or when the social climate doesn't feel safe. They usually need to identify \"their person\" within the group before joining.",
        howToAccompany: [
            '"Let me introduce you to someone: this is Mateo, he plays the same position as you. Train together." An ally is their way in.',
            'Include them in a pair or small group activity before sending them into the full group.',
        ],
        ifNotResponding: 'Give them a social role from the outside: "Help me keep score" or "Let me know when they\'re done." That connects them to the group without forcing exposure.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'S',
        whatsHappeningForProfile: "This is the most natural behavior of the Supporter when facing something new. They're doing their safety read: who's there, how people move, what the rules are. They're not wasting time: they're preparing.",
        howToAccompany: [
            "Don't rush them. Give them the observation time they need. A simple \"Join in when you're ready\" without pressure is what works best.",
            'If possible, have them do the same activity on the side, in parallel, without group exposure.',
        ],
        ifNotResponding: "Let them watch the whole session if needed. Next time they usually join faster. The Supporter builds confidence by accumulating positive observation experiences.",
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist is analyzing the rules of the game from the outside. They want to understand the logic of the drill before executing it. They won't join until they have the \"how\" figured out.",
        howToAccompany: [
            'Explain the drill briefly while they watch: "Look, the idea is you do this when that happens." With the logic clear, they\'ll join.',
            '"Want me to walk you through it?" That gives them permission to ask the questions already in their head.',
        ],
        ifNotResponding: 'Say: "Just try it once, it doesn\'t count." The Strategist is more willing when they know the first attempt isn\'t being evaluated.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. Cries or gets angry in the middle of practice
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'llora-o-se-enoja',
        eje: 'D',
        whatsHappeningForProfile: "The Driver tends to get angry more than they cry. Frustration usually comes out as aggression: they throw something, shout, or walk off. They feel like they've lost control of the situation and that's what overwhelms them.",
        howToAccompany: [
            "Don't confront them in the heat of the moment. Let them cool down for a few seconds and then approach with a neutral tone: \"When you're ready, let's talk.\"",
            'Once they calm down, give them a path back: "Now let\'s go do that drill right." They need to feel they can get control back.',
        ],
        ifNotResponding: 'Remove them briefly from the activity ("Grab some water, take a breath") and let them come back on their own. The Driver needs to feel like the decision to return was theirs.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'I',
        whatsHappeningForProfile: 'The Connector tends to break down when they feel the correction ruptured the bond. "Is the coach upset at me because they don\'t like me?" The overflow is usually emotional and social at the same time.',
        howToAccompany: [
            'Repair the bond first: "I\'m not upset, I want to help you get better." That lowers the emotional threat.',
            'After they calm down, reconnect with warmth: a pat on the back, a "are we good?" For them, knowing the relationship isn\'t broken is essential.',
        ],
        ifNotResponding: 'Ask a trusted teammate to be with them for a moment. The Connector regulates better with a peer than with an authority figure.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter rarely breaks down, so if they're crying, they are genuinely overloaded. They've probably been accumulating fatigue, frustration, or discomfort for a while before reaching this point.",
        howToAccompany: [
            'Give them a break without requiring explanation: "Come sit here for a minute, it\'s okay." The absence of pressure is what helps them most.',
            "Don't ask \"what's wrong?\" in the moment. Wait until they calm down, then gently ask: \"How are you feeling now?\"",
        ],
        ifNotResponding: 'Keep them close but without any task. Let them sit next to you and watch the group. Closeness without demands is how they recover.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist tends to get frustrated when something doesn't make sense or when a correction feels unfair. Their breakdown can seem like it comes out of nowhere, but it comes from an accumulation of things that didn't add up.",
        howToAccompany: [
            'Once they calm down, give them a clear explanation of what happened: "I corrected you because I want you to do this better, and here\'s how." The logic re-orients them.',
            'Ask them what specifically frustrated them. Often the trigger isn\'t what it seems.',
        ],
        ifNotResponding: 'Leave them alone with their thoughts for a few minutes. The Strategist needs to internally organize what happened before they can talk.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. Has a clash with a teammate
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'roce-con-companero',
        eje: 'D',
        whatsHappeningForProfile: "The Driver tends to clash when they feel someone else is taking the spotlight or slowing their pace. The friction usually comes from competing for decision-making space.",
        howToAccompany: [
            'Separate the conflict from the person: "You both want to win, and that\'s good. Now let\'s figure out how to do it together."',
            'Give them ownership over one part of the drill. If they have their territory, the need to fight for someone else\'s goes down.',
        ],
        ifNotResponding: 'Switch up the pair temporarily. Sometimes the best mediation is a brief bit of distance.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'I',
        whatsHappeningForProfile: "The Connector tends to experience the clash as a rupture in the relationship. What hurts more than the conflict is usually \"we don't get along anymore.\" They may react by seeking allies or getting dramatic.",
        howToAccompany: [
            'Talk to both of them together and focus on the bond: "You\'re teammates, this gets resolved by talking. What happened?"',
            'After the drill, give the Connector a moment to close it: "Are you good with your teammate?" They need to know the relationship is still intact.',
        ],
        ifNotResponding: 'Give them a bridge role: "Help me keep the group running smoothly." Turning the conflict into a social mission pulls them out of the personal hurt.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter tends to avoid conflict. If there was a clash, they're probably extremely uncomfortable and want things back to normal as fast as possible. They probably won't confront; they usually shut down.",
        howToAccompany: [
            "Don't make them \"talk it out\" in front of the group. Pull them aside privately: \"I noticed something happened there, are you okay?\"",
            'Help them get back to their comfort zone: the same activity, the same usual teammates, normal routine.',
        ],
        ifNotResponding: "Let time do its work. The Supporter usually doesn't need to \"resolve\" the conflict verbally; they tend to need to feel like things have returned to normal.",
    },
    {
        situationId: 'roce-con-companero',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist tends to clash when they feel the other person is doing things \"wrong\" or without logic. The friction usually comes from a difference in standards: they want to do it right, the other wants to do it fast (or vice versa).",
        howToAccompany: [
            'Validate their perspective: "Your way of seeing it makes sense." Then expand: "And so does your teammate\'s, it just comes from a different place."',
            'Propose a method agreement: "Let\'s try it your way first, then their way, and see which worked better."',
        ],
        ifNotResponding: "Give them a brief individual task. The Strategist processes interpersonal conflicts better when they have a moment alone to sort their thoughts.",
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 8. Beats themselves up when they make a mistake
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-castiga',
        eje: 'D',
        whatsHappeningForProfile: 'The Driver tends to beat themselves up through anger: "I\'m such a mess!" They feel they should be capable almost always, and a mistake can feel like a betrayal of their self-image as a leader.',
        howToAccompany: [
            'Break the loop with action: "Okay, you missed. Now do 3 reps and we move on." Immediate action replaces self-criticism.',
            'Use their competitiveness in their favor: "The best players make mistakes, the difference is what they do next."',
        ],
        ifNotResponding: "Pull them out of the drill for a moment and give them a simple physical task (a run, juggling the ball). The Driver regulates frustration through movement.",
    },
    {
        situationId: 'se-castiga',
        eje: 'I',
        whatsHappeningForProfile: 'The Connector tends to beat themselves up through shame: "Everyone saw me mess up." What weighs on them usually isn\'t the technical error: it\'s the social exposure of the mistake.',
        howToAccompany: [
            'Normalize the error in front of the group: "We all mess up, that\'s how we learn." That reduces the public shame.',
            'Then in private: "What matters to me is that you try, not that it comes out perfect." The reconnection with the adult calms them down.',
        ],
        ifNotResponding: 'Put them in an activity where mistakes are built into the game (a drill where everyone fails). That dilutes the feeling of being "the only one."',
    },
    {
        situationId: 'se-castiga',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter tends to beat themselves up quietly. They don't shout or hit themselves; they go quiet, drop their head, and lose energy. They usually feel guilty for not maintaining the consistency they expect of themselves.",
        howToAccompany: [
            'Approach calmly: "That mistake doesn\'t define how you play. Look at everything you\'ve been doing well." They need someone to give them perspective.',
            'In the next drill, put them on something they do well so they can rebuild confidence before going back to what they struggled with.',
        ],
        ifNotResponding: "Don't push the \"it's not a big deal\" line. Just keep going with practice as if nothing changed. The Supporter recovers when they feel the environment didn't shift because of their mistake.",
    },
    {
        situationId: 'se-castiga',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist tends to beat themselves up through analysis: they replay the mistake over and over looking for what they did wrong. They're usually hard on themselves because they have high standards and feel they should have anticipated the failure.",
        howToAccompany: [
            'Give them data that counterbalances the mistake: "You missed this one, but the 5 before it were perfect." Numbers pull them out of the negative loop.',
            'Reframe the mistake as data, not a verdict: "What does this mistake tell you? What would you adjust?"',
        ],
        ifNotResponding: 'Tell them: "Enough analysis for today. Tomorrow we look at it with fresh eyes." Sometimes the Strategist needs explicit permission to stop thinking.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 9. Gets distracted all the time
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-distrae',
        eje: 'D',
        whatsHappeningForProfile: "The Driver tends to get distracted when the drill doesn't have enough intensity or challenge. Their quick motor needs constant action, and when the pace drops, they usually look for stimulation on their own.",
        howToAccompany: [
            '"Same drill but now in half the time" or "First one there gets to pick the next drill." Turn it up.',
            'Give them responsibility within the drill: have them count reps, referee, or lead a variation.',
        ],
        ifNotResponding: 'Offer a parallel challenge: "While you wait for your turn, do this." The Driver can\'t handle a gap in activity.',
    },
    {
        situationId: 'se-distrae',
        eje: 'I',
        whatsHappeningForProfile: "The Connector tends to get distracted because what draws them most is social interaction. If the drill is individual or quiet, their attention usually drifts toward the person next to them.",
        howToAccompany: [
            'Make the drill social: pairs, communication between them, or roles that require talking.',
            'Use their social nature as a tool: "Explain to your teammate how to do this drill."',
        ],
        ifNotResponding: 'Make them your assistant: "Come help me organize this." The social closeness with you recaptures their attention.',
    },
    {
        situationId: 'se-distrae',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter tends to get distracted when there's too much stimulus: lots of noise, constant drill changes, or new instructions without a pause. Their system usually disengages to protect itself from the chaos.",
        howToAccompany: [
            'Slow down the pace of changes: let them stay with the same drill a bit longer before switching.',
            'Give them a predictable role within the activity: "You always stay in this position, your job is this."',
        ],
        ifNotResponding: 'Go up and reconnect with them calmly: "Still with me? Good. Next thing we\'re doing is this." Personal contact brings them back.',
    },
    {
        situationId: 'se-distrae',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist tends to get distracted when the drill feels repetitive or pointless. Their mind looks for something to analyze, and if the drill doesn't give it to them, they usually find stimulation elsewhere.",
        howToAccompany: [
            'Add a layer to the drill: "While you do this, count how many times the pattern repeats" or "Notice which teammate moves best and why."',
            'Tell them what you\'re looking for with the drill: "This looks simple but we\'re working on X." Purpose reconnects them.',
        ],
        ifNotResponding: 'Ask them to invent a variation of the drill. The Strategist focuses when they get to design.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 10. Says they want to quit the sport
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'quiere-dejar',
        eje: 'D',
        whatsHappeningForProfile: "The Driver tends to want to quit when they feel they can't win, grow, or lead. If they've gone a long time without new challenges or a sense of progress, the sport usually loses its meaning for them.",
        howToAccompany: [
            '"If you could change one thing about practice, what would it be?" Ask and actually listen to the answer.',
            'Offer a concrete, measurable goal: "What if over the next 3 weeks we focus specifically on this?"',
        ],
        ifNotResponding: "Don't push it. Say: \"The door is open whenever you want.\" The Driver sometimes needs to miss the challenge before they come back motivated.",
    },
    {
        situationId: 'quiere-dejar',
        eje: 'I',
        whatsHappeningForProfile: "The Connector tends to want to quit when the bonds broke: if their friend left, if the group changed, or if they feel like they no longer belong. For them, the sport is usually the group, and if the group isn't holding them, they may feel there's no reason to be there.",
        howToAccompany: [
            '"Is there something about the group that\'s bothering you?" Explore the bond. Often the real reason isn\'t the sport, it\'s a social relationship that broke down.',
            'If possible, reconnect them with a close teammate or move them to a group where they have more affinity.',
        ],
        ifNotResponding: "Talk to the parent or guardian. The Connector's departure usually has a social root that can be addressed if it's caught early.",
    },
    {
        situationId: 'quiere-dejar',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter tends to want to quit when too much changed: a new coach, new teammates, a schedule or location change. It's not that they don't like the sport: the environment no longer feels like \"their place.\"",
        howToAccompany: [
            '"Is there something you used to like that you don\'t anymore?" The Supporter can usually identify the exact breaking point.',
            'If you can, restore something from the previous context: the same schedule, the same group, the same routines.',
        ],
        ifNotResponding: "Give it time. Don't ask for a final decision. \"You don't have to decide right now. Come next week and we'll see.\" The Supporter needs to process changes slowly.",
    },
    {
        situationId: 'quiere-dejar',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist tends to want to quit when they feel they're not learning anything new or that practice doesn't make sense. If they've been doing the same thing for weeks without understanding why, their motivation usually shuts off.",
        howToAccompany: [
            '"Look where you were 3 months ago versus where you are now." Show them the progress. Evolution data reconnects them to the process.',
            '"Is there something you\'d like to practice?" Giving them a voice in the plan re-engages them.',
        ],
        ifNotResponding: "Offer them an intellectual challenge within the sport: analyze a video, plan a play, watch a professional game. Sometimes the Strategist needs to connect with the sport through their mind, not just their body.",
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 11. A new player joins the group
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'jugador-nuevo',
        eje: 'D',
        whatsHappeningForProfile: 'A Driver may see the new player as a variable to evaluate: "Are they good? Are they going to take my spot?" They may react by competing to mark their territory or by ignoring them.',
        howToAccompany: [
            'Give them a leadership welcome role: "Show them how we do the warm-up." That puts them in the position of leader, not competitor.',
            'Set up a drill where both of them can shine: "One attacks, one defends, then switch."',
        ],
        ifNotResponding: "Let the natural competition do its work. The Driver tends to accept the new player once they see they raise the level of the group.",
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'I',
        whatsHappeningForProfile: "The Connector will probably be the first to go up to the new player. If they don't, it's because something about the new person intimidates them or because they feel their social place in the group is threatened.",
        howToAccompany: [
            '"Be their host today, walk them through how everything works here." It\'s their natural role and it empowers them.',
            'If the Connector seems reluctant, talk privately: "Everything okay with X joining?" There may be a social insecurity worth exploring.',
        ],
        ifNotResponding: "Set up an activity where they have to cooperate. The Connector's connection activates when doing things together.",
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter tends to be the one who feels the \"disruption\" most. Their group was predictable and safe, and now someone is changing the dynamic. They may seem distant or uncomfortable.",
        howToAccompany: [
            "Don't change the routine because of the new player. Keep everything as consistent as possible for the Supporter: same spot, same drill, same teammates.",
            'Frame the new player as an "addition" not a "change": "Someone\'s joining the group, everything else stays the same."',
        ],
        ifNotResponding: "Give it time. The Supporter tends to accept the new player gradually as that person becomes part of the routine. Don't force the integration.",
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'C',
        whatsHappeningForProfile: 'The Strategist tends to observe the new player with analytical curiosity: "How do they play? Where are they going to fit? How do they affect the team?" They usually won\'t approach right away because they\'re still processing the information.',
        howToAccompany: [
            'Give them background on the new player: "They come from this club, they play this position." Data helps them place the new player in their mental map.',
            'Ask them to help tactically: "Walk them through how we do this play." That connects them through their strength.',
        ],
        ifNotResponding: "Let the integration happen organically. The Strategist tends to approach the new player once they have enough information. Don't rush it.",
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 12. Freezes up in the game
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-congela',
        eje: 'D',
        whatsHappeningForProfile: "Unusual for a Driver, but when they freeze it's because the pressure overwhelmed them more than they can handle. They feel that if they make a mistake in front of everyone, they lose their status.",
        howToAccompany: [
            '"Next ball, shoot on goal." One clear, simple action is what unblocks them.',
            'From the sideline, give them confidence in their ability: "You know how to do this, I believe in you." The Driver usually responds to a vote of confidence.',
        ],
        ifNotResponding: "Temporarily move them to a less exposed role. Once they make a good play from there, put them back in their position. They need a small win to get going again.",
    },
    {
        situationId: 'se-congela',
        eje: 'I',
        whatsHappeningForProfile: 'The Connector tends to freeze when they feel a mistake will put them "on blast" in front of the group. Their block is usually social: they\'re afraid of looking bad to their teammates, not of the mistake itself.',
        howToAccompany: [
            '"It doesn\'t matter if it works or not, I just want you to try." Permission to fail unblocks them.',
            '"Team, everyone in, all together." Feeling surrounded brings their confidence back.',
        ],
        ifNotResponding: "Put them in a group play where success belongs to the team, not to one individual. The Connector gets going again when responsibility is shared.",
    },
    {
        situationId: 'se-congela',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter tends to freeze because the pressure of the game breaks their sense of security. What was predictable in practice becomes uncertain in the game. Their system usually protects itself by going still.",
        howToAccompany: [
            '"Do exactly what we do in practice, nothing different." Connecting them to the familiar is what unblocks them.',
            '"Every time the ball comes to you, pass it to X." A simple, repeatable task activates them.',
        ],
        ifNotResponding: 'Sub them out for a few minutes if you can. "Take a breath, watch how the game is going, and come back in when you\'re ready." The Supporter recovers with the break.',
    },
    {
        situationId: 'se-congela',
        eje: 'C',
        whatsHappeningForProfile: 'The Strategist tends to freeze because they\'re over-analyzing: "Do I pass or shoot? What if the defender comes? What\'s the best option?" Their mind runs faster than their body, and the body locks up.',
        howToAccompany: [
            '"If you\'re open, shoot. If you\'re not, pass." Reducing the options unblocks them.',
            'Before the next game, walk through the decisions: "When this happens, you do that." Pre-automating the choices frees the mind during the game.',
        ],
        ifNotResponding: 'Tell them: "Stop thinking, just play." Sometimes the Strategist needs explicit permission to turn off the analysis and trust their instincts.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 13. Doesn't want to be the center of attention
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'D',
        whatsHappeningForProfile: "Very unusual for a Driver. If it's happening, they probably feel insecure about this specific activity. They don't want to be exposed in an area where they don't feel strong.",
        howToAccompany: [
            '"Do you want to demonstrate the drill you\'re best at?" The Driver exposes themselves when they know they\'re going to shine.',
            'Take it in steps: "Today you do it with a partner, next time you do it solo."',
        ],
        ifNotResponding: 'Don\'t force it. "When you\'re ready, the opportunity is there." The Driver will come back on their own when they feel prepared.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'I',
        whatsHappeningForProfile: "The Connector may enjoy social attention but not evaluative attention. If they feel they're being \"examined\" rather than \"supported,\" they pull back.",
        howToAccompany: [
            'Make the exposure social: "Do it with your teammate" or "Walk the group through it while you do it."',
            'Remove the evaluative weight: "This isn\'t about seeing who does it best, it\'s so we all learn."',
        ],
        ifNotResponding: 'Let them participate through a social role: they choose who goes next, they comment on the play, they cheer the group on. That\'s their way of being present without being exposed.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'S',
        whatsHappeningForProfile: "This is usually natural for the Supporter. Their way of contributing tends to be through support, not through the spotlight. Forcing them to be the center goes against their nature and usually makes them feel vulnerable.",
        howToAccompany: [
            'Offer forms of quiet leadership: "Make sure everyone has what they need" or "You\'re the one who keeps the rhythm."',
            'If you need them to step up, give them advance notice: "Next week I\'m going to ask you to demonstrate this drill." The heads-up lowers the anxiety.',
        ],
        ifNotResponding: "Don't push it. Find another way for them to participate where they feel comfortable. The Supporter contributes more from their comfort zone than from forced exposure.",
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist tends not to want to be exposed unless they're sure they're going to do it right. Their standards are usually high and the idea of failing in public causes real discomfort.",
        howToAccompany: [
            '"Next week I\'m going to ask you to explain this play to the group. Prepare for it." With time, the Strategist feels secure.',
            'Offer a format that plays to their strength: analyze a play instead of physically demonstrating it, draw it on a whiteboard, explain the logic.',
        ],
        ifNotResponding: 'Suggest they do it in writing or as a diagram. The Strategist expresses themselves better when they can organize their ideas before sharing them.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 14. Changed overnight
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'cambio-repentino',
        eje: 'D',
        whatsHappeningForProfile: "A Driver who goes quiet has probably lost something that made them feel powerful: a role, a relationship, a sense of security outside of the field. Their vital energy is being spent on another fight.",
        howToAccompany: [
            "Don't open with \"what's wrong?\" First, observe for a few days. If it persists, approach with something specific: \"I've noticed you seem different lately, is there anything I can do?\"",
            "If they don't want to talk, give them a physical challenge that gets them going: \"Today I need you to lead the warm-up.\" Sometimes action gives back the energy that words can't.",
        ],
        ifNotResponding: "Talk to the parent or guardian. A persistent change in a Driver is usually a sign of something significant happening outside of the field.",
    },
    {
        situationId: 'cambio-repentino',
        eje: 'I',
        whatsHappeningForProfile: "A Connector who shuts down is usually a strong signal. Their nature tends to be social, so if they're quiet or pulling away from the group, something may be hurting them in the relational realm: a fight with friends, a family change, or bullying.",
        howToAccompany: [
            '"I know you, and I can tell something\'s going on. You don\'t have to tell me, but I want you to know I\'m here."',
            "Give them space to reconnect at their own pace. Don't push them to \"cheer up\"; that invalidates what they're feeling.",
        ],
        ifNotResponding: "Reach out to the parent or guardian. A sustained change in a Connector is usually linked to a relational situation that needs attention outside of practice.",
    },
    {
        situationId: 'cambio-repentino',
        eje: 'S',
        whatsHappeningForProfile: "A Supporter who changes suddenly is usually showing that something broke their sense of security. They tend to be the profile that holds it together the longest before showing distress, so if you're seeing it, they've probably been accumulating this for a while.",
        howToAccompany: [
            "Keep their routine as stable as possible. Whatever is going on outside, practice can be their refuge of normalcy.",
            'Check in naturally: "How are you today?" as part of the routine. If they want to talk, they will.',
        ],
        ifNotResponding: "Reach out to the parent or guardian carefully: \"I've noticed they seem different lately, is everything okay at home?\" The Supporter rarely asks for help; you have to go looking for it.",
    },
    {
        situationId: 'cambio-repentino',
        eje: 'C',
        whatsHappeningForProfile: "A Strategist who changes behavior may be processing something internally that they can't resolve. Their analytical mind can get stuck in a loop on a situation that has no logical solution (a family problem, a perceived injustice).",
        howToAccompany: [
            '"Do you want to tell me what\'s been going on in your head? Sometimes it helps to say it out loud."',
            "If they don't want to talk, respect that. Offer something that helps them process it their way: \"If you want, write down what you're feeling and show me when you're ready.\"",
        ],
        ifNotResponding: "Contact the parent or guardian. Sustained changes in the Strategist (especially if they become irritable or distant) usually indicate a situation that needs professional support.",
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 15. The team lost and no one wants to talk about it (GROUP)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'derrota-grupal',
        eje: 'group',
        whatsHappeningForProfile: "The whole group is processing the loss through their own profile: the Drivers are probably angry, the Connectors usually feel like they failed as a team, the Supporters tend to shut down, and the Strategists will be replaying every mistake. The collective mood is low.",
        howToAccompany: [
            "Don't try to talk about the game right after the loss. Give the group a few minutes of silence or free decompression before bringing them together.",
            "When you do bring them in, start with what worked: \"Today we did this, this, and this well. What didn't go our way, we work on next week.\" Process first, result last.",
            "Offer the group a closing ritual: a circle where each person says one good thing they saw in a teammate. That reconnects the team through the relationship, not the scoreboard.",
        ],
        ifNotResponding: "Don't force positivity. Sometimes the group needs to be sad for a bit. Say: \"Today it hurts, and it's okay that it hurts. Tomorrow we start again.\" Permission to feel the loss is the first step to getting over it.",
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "D",
        whatsHappeningForProfile: "The Driver tends to experience the bench as a loss of control and of their place in the spotlight. Sitting still while others play usually weighs heavily on them, and that tension often comes out as frustration or impatience.",
        howToAccompany: ["Give them an active role from the bench: ask them to read the game and tell you what's going on, for example say to them: I want your eyes on the field, what do you see that we can improve?","Set a concrete goal for when they come in, something that depends on them: tell them when you come on, this is yours, I want you setting the pace."],
        ifNotResponding: "If they stay tense, don't demand that they accept it right away. Acknowledge their drive to play (I can tell you want to be out there and that's a good thing) and give them time. Their drive settles back in when they feel that you're counting on them.",
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "I",
        whatsHappeningForProfile: "The Connector tends to fear that being on the bench means they let someone down or that they're no longer part of the group. More than the role, it usually hurts to feel left out of the bond.",
        howToAccompany: ["Confirm their place on the team right from the start: come over and say to them today you start off the field, but you're a key part of this, I need you connecting the group from the bench.","Give them a task that keeps them tied to their teammates: cheering, welcoming whoever comes off, helping hold the team's mood together."],
        ifNotResponding: "If you notice them down, prioritize the bond before the role. A warm gesture, sitting next to them for a moment, gives them back that sense of belonging, which is what they need most.",
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "S",
        whatsHappeningForProfile: "The Supporter usually accepts the bench without protesting, but that doesn't mean it doesn't hurt. They keep the discomfort silent and can bottle it up until it surfaces later as low spirits.",
        howToAccompany: ["Let them know their role ahead of time, calmly and clearly, so it doesn't catch them off guard: tell them today you come in for the second half, I want you ready and at ease for that moment.","Make a brief space for them to share how they're taking it: come over without pressure and say to them I know waiting isn't easy, how are you feeling about this?"],
        ifNotResponding: "If they answer with an it's all fine and shut down, respect the silence without treating it as resolved. Come back to them at another calm moment. They tend to open up when they feel there's trust and no rush.",
    },
    {
        situationId: "acepta-ser-suplente",
        eje: "C",
        whatsHappeningForProfile: "The Strategist tends to need to understand why they're on the bench. If the criteria aren't clear, they usually turn it over and over and can conclude on their own that they did something wrong or that they're not good enough.",
        howToAccompany: ["Explain the reason concretely and without beating around the bush: tell them this is a team and planning decision, not a judgment about you, and let me show you what I'm looking for today.","Give them something clear to focus on while they wait: ask them to watch a particular play or opponent and bring you their read when they come in."],
        ifNotResponding: "If you see them stuck turning it over, ease the internal pressure. Remind them that today's role doesn't measure their worth and that understanding takes time, without asking them to resolve it right now.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "D",
        whatsHappeningForProfile: "The Driver tends to experience the teammate's achievement as a competition they are losing. Their instinct is usually to prove right away that they can do it too, and if they cannot find a way, they get frustrated.",
        howToAccompany: ["Channel that energy toward a challenge of their own instead of toward the other: you have your own challenge today, let's see how far you can go.","Acknowledge something concrete they do well so they don't feel they are losing their place: nobody beats you on the mark, that one is yours."],
        ifNotResponding: "Give them a couple of minutes to bring the intensity down without demanding that they applaud their teammate. Once they feel capable again at their own thing, the comparison loses its grip on its own.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "I",
        whatsHappeningForProfile: "The Connector tends to feel the group's affection and attention went to someone else, and they may take it to mean they are liked less. The social displacement usually hurts more than the result.",
        howToAccompany: ["Give them back their place in the group with something genuine: your energy is what lifts the team, nobody replaces that.","Invite them to join in the other's joy so they feel they are still part of it: let's celebrate it all together, you are part of this."],
        ifNotResponding: "Don't force them to celebrate if it is still hard for them. Come over for a moment one on one and make them feel that their place with you is still intact, without asking for anything in return.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "S",
        whatsHappeningForProfile: "The Supporter tends to keep the discomfort to themselves and step into the background without saying a word. On the outside it looks like it doesn't affect them, but the irritation keeps building and can surface later all at once.",
        howToAccompany: ["Give them permission to name what they feel, no rush: it's okay that today was hard for you, there's nothing wrong with talking about it.","Offer them a safe, predictable spot where they can feel comfortable again: pair up with me for this drill and we'll take it easy."],
        ifNotResponding: "Don't pressure them to talk. Stay close and keep the routine steady. Your consistency gives them back their sense of safety better than any forced conversation.",
    },
    {
        situationId: "companero-se-destaca",
        eje: "C",
        whatsHappeningForProfile: "The Strategist tends to stay stuck analyzing why the other did it better and to compare themselves point by point. That internal tally usually makes them incredibly hard on themselves.",
        howToAccompany: ["Take their focus off the comparison and put it on their own process: it's not about who is better, but about what you can learn by watching them.","Give them a concrete, observable detail to settle their mind: notice how they position themselves before receiving, try copying just that today."],
        ifNotResponding: "If they stay caught in the loop, ease the pressure on them. Remind them that everyone progresses at their own pace and that understanding takes its own process, there's no rush.",
    },
    {
        situationId: "recibe-correccion",
        eje: "D",
        whatsHappeningForProfile: "The Driver tends to confuse a correction with losing ground. They usually need to feel that they are still capable and that they have room to improve on their own, not that they were left looking bad.",
        howToAccompany: ["Frame the correction as a challenge, not a flaw: you've got this almost ready, you just need one adjustment to make it unstoppable.","Give them control of the change: let them be the one who decides how to fix it on the next play, instead of imposing it on them."],
        ifNotResponding: "If they get defensive, lower the intensity and let them try it their own way for a few minutes. When they see that the adjustment works for them, they adopt it on their own and without arguing.",
    },
    {
        situationId: "recibe-correccion",
        eje: "I",
        whatsHappeningForProfile: "The Connector tends to feel the correction as a blow to the relationship, not to the technique. They usually care more about whether they let you down or got exposed than about the detail you pointed out.",
        howToAccompany: ["Correct them in private and mind your tone: start with the relationship, things between you and the team are perfect, let's polish just this one detail.","Remind them that the correction doesn't change how you see them: I'm pointing this out because I trust what you can give."],
        ifNotResponding: "If they still deflate, give them a sign of closeness and wait. For them, feeling accepted matters more than any instruction, and from there they start listening again.",
    },
    {
        situationId: "recibe-correccion",
        eje: "S",
        whatsHappeningForProfile: "The Supporter usually nods and seems to take it well, but inside they hold on to the discomfort. They tend to avoid friction in the moment and the unease shows up later, more quietly.",
        howToAccompany: ["Give them time and predictability: let them know calmly and without surprises, I want to show you something for next time, no rush.","Confirm that things are fine and open the door for them to talk: this happens all the time, if something didn't sit right with you, you can tell me whenever you want."],
        ifNotResponding: "If you notice them withdrawing, don't push in the moment. Approach them later, in a calm setting, and give them room to let out what they held back.",
    },
    {
        situationId: "recibe-correccion",
        eje: "C",
        whatsHappeningForProfile: "The Strategist usually understands the correction, but tends to get stuck on the detail and to become very demanding with themselves. They find it hard to let go of what happened and keep playing.",
        howToAccompany: ["Explain the why, which is what settles them most: we're correcting this because it gives you more time to decide on the play.","Help them turn the page with a concrete focus: you've already analyzed it, now just try this one adjustment on the next play and we'll look at it."],
        ifNotResponding: "If they keep dwelling on it, give them a single point to think about and leave the rest for later. Less information frees them up to go back to playing calmly.",
    },
    {
        situationId: "gestiona-exito",
        eje: "D",
        whatsHappeningForProfile: "The Driver tends to feel success with a lot of intensity and needs to show it. Once they feel like a winner, their effort engine usually eases off because they believe the challenge is over.",
        howToAccompany: ["Set a new goal as soon as they achieve something: you got that, now let's see if you can hold that level all the way to the end.","Acknowledge the achievement and right away invite them to add to the team: whoever is already playing well today can lift a teammate up."],
        ifNotResponding: "Let them enjoy the moment without correcting them in the heat of it. When the euphoria settles, come back to them with a concrete challenge and their engine reactivates on its own.",
    },
    {
        situationId: "gestiona-exito",
        eje: "I",
        whatsHappeningForProfile: "The Connector tends to experience success through others and gets excited when they feel the group celebrating. Carried away by that emotion, they can unintentionally take over the moment and leave the rest of the team out.",
        howToAccompany: ["Redirect their excitement toward the team: great goal, now celebrate it with the ones who gave you the pass.","Give them a role of spreading the good energy while looking after everyone: you are fired up, help lift the ones who are quieter."],
        ifNotResponding: "Do not shut them down in front of the group. Later, one on one, remind them how great it is when the whole team celebrates together, and that they have the gift to make it happen.",
    },
    {
        situationId: "gestiona-exito",
        eje: "S",
        whatsHappeningForProfile: "The Supporter usually experiences success on the inside, without showing it much. But when they sense the pressure has dropped, they can relax too much and let go of the steadiness that had been carrying them.",
        howToAccompany: ["Acknowledge their good moment calmly and give it continuity: you are doing really well, let's keep that same way of playing for the rest of the match.","Anchor them to their effort routine: your strength is consistency, let's keep doing what we were doing step by step."],
        ifNotResponding: "Do not pressure them to show more. Stay with them quietly, close by, and remind them with a gesture that you trust them to hold their level without overstraining.",
    },
    {
        situationId: "gestiona-exito",
        eje: "C",
        whatsHappeningForProfile: "The Strategist tends to analyze their good performance and can convince themselves that they have already figured it all out. Sensing there is nothing left to improve, they tend to let their guard down without realizing it.",
        howToAccompany: ["Validate their analysis and open a new question: you played really well, what do you think you could still fine-tune?","Show them that the good is worth studying too: write down what worked for you today, so you can repeat it when the opponent is tougher."],
        ifNotResponding: "Give them space to process their good moment at their own pace. When they are ready, suggest looking at the next challenge together without taking away from what they have already achieved.",
    },
    {
        situationId: "rol-referente",
        eje: "D",
        whatsHappeningForProfile: "The Driver usually takes on the role eagerly, but they may experience it as bossing rather than guiding. If the group doesn't respond to their intensity, they take it personally.",
        howToAccompany: ["Give them a leadership mission that depends on others: today your job is to get your teammates to the end of the drill, not to finish first yourself.","Recognize them when they help, not only when they win: I saw how you waited for your teammate, that's part of being a leader too."],
        ifNotResponding: "Lower their exposure for a while and give them short, concrete leadership tasks. Once they feel they can do it well, they'll want more.",
    },
    {
        situationId: "rol-referente",
        eje: "I",
        whatsHappeningForProfile: "The Connector usually leads naturally through connection, but it tends to weigh on them when the role means setting a limit or deciding between friends. They don't want to let anyone down.",
        howToAccompany: ["Define the role from their strength: your job as a leader is to make sure no one is left out, and you already do that really well.","Stand with them in the hard decisions so they don't carry them alone: if there's a choice to make, we'll think it through together."],
        ifNotResponding: "For now, let them keep the part they enjoy and ease off the part that makes them uncomfortable. Over time, the fuller role will weigh on them less.",
    },
    {
        situationId: "rol-referente",
        eje: "S",
        whatsHappeningForProfile: "The Supporter usually prefers the background and feels uncomfortable being exposed. They still hold the group together quietly, even when they're not looking to.",
        howToAccompany: ["Name the leadership they already show, without asking anything new of them: when you're here, the group is calmer, that's leading.","Offer them a quiet leadership role, without putting them out front: help me make sure the newer ones feel comfortable."],
        ifNotResponding: "Don't push them to the center. Let them lead in their own way, from the side, and respect their pace for taking on more space.",
    },
    {
        situationId: "rol-referente",
        eje: "C",
        whatsHappeningForProfile: "The Strategist tends to hesitate because they're still not clear on what's expected of them, and they'd usually rather wait than carry out the role halfway. The idea of getting it wrong in front of everyone weighs on them.",
        howToAccompany: ["Explain the role clearly and in parts: being a leader here means these three things, nothing more.","Give them time to observe before acting: watch how the group works for a few days, then tell me how you'd do it."],
        ifNotResponding: "Offer them a more concrete role first, something they can understand and master. The confidence to lead comes once they feel they understand.",
    },
    {
        situationId: "expectativa-padres",
        eje: "D",
        whatsHappeningForProfile: "The Driver tends to turn the expectation into pressure to win no matter what. When they feel the result decides whether or not they let their parents down, they may overdemand from themselves and react with frustration to a mistake.",
        howToAccompany: ["Bring their focus back to what they control: today I am not looking at the scoreboard, I am looking at how you compete for every ball.","Recognize the effort more than the result, out loud and in front of the group: I liked how you did not give up when things got tough."],
        ifNotResponding: "If they keep playing for the stands, lower the importance of the result in your own words. When they see that for you their worth does not depend on winning, they start to release the pressure.",
    },
    {
        situationId: "expectativa-padres",
        eje: "I",
        whatsHappeningForProfile: "The Connector tends to need to feel their parents' pride in order to play freely. A serious face from the outside usually disconnects them right away, because for them performing well and being loved are linked together.",
        howToAccompany: ["Remind them that their parents' love is not won or lost on a field: your family loves you no matter how you play, that is not at stake today.","Give them a reason to enjoy the game with their teammates and not only for those watching: go out and have fun with your team, that is your place here."],
        ifNotResponding: "If they stay fixated on the stands, help them reconnect with the group instead of with the outside. When they feel part of the team, their parents' eyes stop being the only thing that matters.",
    },
    {
        situationId: "expectativa-padres",
        eje: "S",
        whatsHappeningForProfile: "The Supporter tends to keep the tension inside and not show it. They keep playing quietly, but more rigidly, and the weight builds up until it surfaces all at once at a bad moment.",
        howToAccompany: ["Come close calmly and without exposing them, to open the door: if at any point the outside gets heavy for you, you can tell me, no rush.","Give them stable routines and reference points that do not depend on the stands: you just focus on your usual job, you already know how to do that."],
        ifNotResponding: "If they cannot release the weight, do not force them to talk. Keep a predictable, safe atmosphere around them and give them time: trusting you is what later lets them open up.",
    },
    {
        situationId: "expectativa-padres",
        eje: "C",
        whatsHappeningForProfile: "The Strategist tends to get stuck inside their head trying to figure out what is expected of them. They usually demand twice as much from themselves and end up playing tight out of fear of not living up to what they believe the adults want to see.",
        howToAccompany: ["Take away the pressure of having to guess expectations and give them a clear goal of their own: your only job today is to read the game well, nothing more.","Help them separate their wish from their parents' wish with a concrete question: setting aside what they expect, what do you feel like trying today?"],
        ifNotResponding: "If they stay stuck in their analysis, reduce the variables: one simple instruction at a time. When they stop carrying everything they think is expected, they go back to playing freely.",
    },
    {
        situationId: "sube-categoria",
        eje: "D",
        whatsHappeningForProfile: "The Driver used to be a reference point and now they are the newcomer among the older players. Losing that spotlight usually touches their confidence, and they may cover it up with anger or by competing too hard to win back ground.",
        howToAccompany: ["Give them a concrete goal for their adjustment: over these weeks your challenge is to earn a place in this group, and we will track it game by game.","Acknowledge every step of progress in the new setting: today you kept up with the pace of the older players, and two weeks ago that was not happening."],
        ifNotResponding: "If they stay tense, ease off the pressure to perform right away and let them focus on one single thing per training session. Regaining control bit by bit gives them back their confidence.",
    },
    {
        situationId: "sube-categoria",
        eje: "I",
        whatsHappeningForProfile: "The Connector left their usual group behind and has not yet found their place among the new ones. Even surrounded by teammates, they usually feel left out, and that tends to drain their motivation more than any matter of play.",
        howToAccompany: ["Connect them with a teammate from the new category who will welcome them well: let me introduce you to Tomás, he will be your partner this week.","Give them a role that brings them in through the social side, such as setting up a drill in pairs or leading the warm-up alongside someone else."],
        ifNotResponding: "If they stay withdrawn, do not put them on the spot in front of the group. Approach them privately and show them that you want them there. Feeling expected brings their motivation back.",
    },
    {
        situationId: "sube-categoria",
        eje: "S",
        whatsHappeningForProfile: "The Supporter tends to get destabilized by the change of routine, schedule and familiar faces. They usually pull back into the background and carry the discomfort in silence, until one day it all weighs on them at once.",
        howToAccompany: ["Give them predictability about what is new: explain how the training will go and what is expected of them, step by step.","Offer them a stable point of reference, such as a fixed spot on the field or a teammate they always start with: always start next to them until you feel comfortable."],
        ifNotResponding: "If you see them closed off, give them more time without rushing them and ask in private how they are feeling. Change takes them longer, and that is okay.",
    },
    {
        situationId: "sube-categoria",
        eje: "C",
        whatsHappeningForProfile: "The Strategist tends to be reading the whole new setting: the pace, the group's unspoken rules, where they fit in. While they process, they can seem switched off or hesitate before playing, because they do not yet fully understand how this category works.",
        howToAccompany: ["Give them clear information that helps them get their bearings: in this category the play is faster, so gain a second by thinking before you receive.","Validate their way of observing before jumping in: take the first few minutes to read the game, then come in with everything."],
        ifNotResponding: "If they keep hesitating, do not pressure them to loosen up before they are ready. Once they finish understanding the new setting, they will start playing with confidence on their own.",
    },
];
