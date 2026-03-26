// Auto-generated English translations for situationalGuide.ts
// Situation IDs, eje values, and category keys are kept as-is (identifiers).
// Profile names: Impulsor→Driver, Conector→Connector, Sosten/Sostén→Supporter, Estratega→Strategist

import type { Situation, SituationCard } from './situationalGuide';

/* ── The 15 situations ─────────────────────────────────────────────────────── */

export const SITUATIONS_EN: Situation[] = [
    {
        id: 'no-quiere-arrancar',
        title: "Won't get started",
        whatYouSee: 'The player shows up to practice and refuses to participate. They seem checked out, complain, sit on the sideline, or say "I\'m not feeling it today".',
        whatsHappening: "This isn't a lack of commitment. The kid is still mentally in whatever they were doing before — school, home, a fight with a friend. They need a moment to shift gears into sport mode.",
        profilePerspectives: "If the player's profile is {{Driver}}, they may not see a challenge that makes starting worth it. They need to feel like what's coming is worth the effort. If they're a {{Connector}}, they probably need the social connection first — if their friend didn't show up or the group vibe feels off, it's hard to get going. A {{Supporter}} profile may simply need more time to make the transition, especially if anything in the routine changed. And if they're a {{Strategist}}, they may be processing something that happened earlier and need to mentally close that out before they can focus on something new.",
        category: 'Motivación',
        icon: '',
    },
    {
        id: 'se-frustra-cuando-pierde',
        title: 'Gets very frustrated when losing',
        whatYouSee: 'The player reacts with anger, gets upset, sometimes throws things, or refuses to keep going after losing a point, a game, or a drill.',
        whatsHappening: "They feel like losing erases all the effort they put in. In that moment they can't separate \"I had a bad play\" from \"I'm bad.\" The emotion blocks the learning. The first step is always to validate what they're feeling before trying to explain the play.",
        profilePerspectives: "A {{Driver}} can react with visible anger because losing hits directly at their need to win and stay in control. The {{Connector}} tends to get more frustrated if they feel they let the team down or someone important was watching. The {{Supporter}} may hold the frustration inside and show it later — quietly but persistently. And the {{Strategist}} will likely get angry at themselves because they had already thought through what to do, and they feel they failed at executing it.",
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'no-hace-lo-que-pido',
        title: "Won't do what I ask",
        whatYouSee: "You give an instruction and the player does something else, takes way too long to start, or seems like they didn't hear you.",
        whatsHappening: "They're not ignoring you. Every kid processes instructions at their own pace. Some act before you finish talking, others need more time to understand the logic behind what you asked. It's a difference in processing speed, not attitude.",
        profilePerspectives: "The {{Driver}} may have already started executing before you finished talking — their drive pushes them to action before listening. The {{Connector}} was probably talking to a teammate and missed the instruction. A {{Supporter}} may have heard perfectly but needs a little extra time to feel confident before starting. And the {{Strategist}} is likely evaluating whether the instruction makes sense before moving. It's not resistance — it's just how they process.",
        category: 'Comunicación',
        icon: '',
    },
    {
        id: 'raro-antes-del-partido',
        title: 'Acting strange before a game',
        whatYouSee: 'The player is quieter or more restless than usual before competing. They might be nervous, making multiple trips to the bathroom, or the opposite — hyperactive and unable to stay still.',
        whatsHappening: "They're feeling the weight of expectations — their own or from outside — and their body is reacting to the uncertainty of what's about to happen. Each profile shows it differently: some shut down, others rev up.",
        profilePerspectives: "The {{Driver}} can get hyperactive — talking a lot and moving non-stop. That's how they channel the adrenaline. The {{Connector}} tends to seek out someone nearby and talk about anything just to feel accompanied. A {{Supporter}} may go very quiet and need you to reassure them that everything is going to be fine. And the {{Strategist}} is probably mentally running through every possible play. Their silence isn't nerves — it's preparation.",
        category: 'Presión',
        icon: '',
    },
    {
        id: 'mira-desde-afuera',
        title: 'Watching from the outside',
        whatYouSee: "The player doesn't join the group. They stay at the edge of the court observing, especially when it's a new drill or a group they don't know well.",
        whatsHappening: 'They\'re doing a "scan" of the situation. They need to understand how the dynamics work before jumping in. It\'s not shyness or cowardice — it\'s how they prepare to participate confidently.',
        profilePerspectives: "If they're a {{Driver}}, they're probably not watching from outside out of fear — they just haven't found the right moment to enter with impact. The {{Connector}} may be waiting for someone to invite them or include them — they need the social signal. A {{Supporter}} is evaluating whether the environment is predictable and safe before exposing themselves. And the {{Strategist}} is literally studying the dynamics: who does what, how the drill works, what the unspoken rules are.",
        category: 'Social',
        icon: '',
    },
    {
        id: 'llora-o-se-enoja',
        title: 'Cries or gets angry in the middle of practice',
        whatYouSee: 'The player breaks down emotionally during an activity. It might be crying, anger, or both. Sometimes it happens after a correction, sometimes it seems to come out of nowhere.',
        whatsHappening: "Everything piled up: fatigue, noise, corrections, the demands of the drill. Their system got overloaded and the emotion spilled over. It's not a tantrum — in that moment the demand exceeded what they could handle.",
        profilePerspectives: "The {{Driver}} tends to overflow with anger — they shout, kick something, complain loudly. That's their way of releasing pressure fast. The {{Connector}} may cry if they feel they were corrected in front of the group or if someone left them out. A {{Supporter}} has probably been accumulating for a while and the breakdown is the last straw — their outburst often surprises people because they showed no signs beforehand. The {{Strategist}} may get quietly angry at themselves and need a moment alone to get back on track.",
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'roce-con-companero',
        title: 'Has a clash with a teammate',
        whatYouSee: "Two players bump heads during a drill. It might be an argument, a complaint, or simply that they can't work together.",
        whatsHappening: "Every kid has a natural style for approaching things. When two very different styles meet without any mediation, friction happens. It's not that one is right and the other is wrong — they have different rhythms and approaches.",
        profilePerspectives: "If there's a {{Driver}} in the clash, they're likely trying to push their idea or pace — not because they're being mean, but because leading is their natural instinct. The {{Connector}} may take it personally and feel rejected by their teammate. A {{Supporter}} will probably try to avoid the conflict until they can't anymore, and then react all at once. And the {{Strategist}} can get frustrated if they feel the other person isn't following the correct logic of the drill.",
        category: 'Social',
        icon: '',
    },
    {
        id: 'se-castiga',
        title: 'Beats themselves up when they make a mistake',
        whatYouSee: 'After an error, the player hits their own head, insults themselves, says "I\'m a disaster," or gets angry at themselves in an exaggerated way.',
        whatsHappening: "They measure their self-worth by the perfection of their performance. Every mistake feels like proof that they \"aren't good enough.\" Their self-demand got out of hand and they're stuck in a punishing loop that keeps them from playing well.",
        profilePerspectives: "The {{Driver}} beats themselves up because they need to feel capable, and the mistake threatens that image. Their reaction is usually quick, intense, and visible. The {{Connector}} may punish themselves thinking about what others are thinking of them after the mistake. A {{Supporter}} tends to punish themselves quietly — ruminating internally. And the {{Strategist}} can be the harshest on themselves because they had already planned what to do and feel they \"should have done it right.\"",
        category: 'Emocional',
        icon: '',
    },
    {
        id: 'se-distrae',
        title: 'Gets distracted all the time',
        whatYouSee: "The player looks around, talks to the person next to them, plays with something unrelated, or simply isn't \"present\" in the drill.",
        whatsHappening: "Practice isn't matching their rhythm. The drill might be too slow for their motor (they get bored) or too chaotic for their style (they disengage). Distraction is a signal that something about the format isn't landing.",
        profilePerspectives: "The {{Driver}} gets distracted when the drill doesn't have enough intensity or challenge. They need more pace or competition to stay engaged. The {{Connector}} may get distracted by socializing because for them, talking to a teammate IS being present — their attention works differently. A {{Supporter}} disconnects when there's too much chaos, noise, or constant changes — they need predictability to focus. And the {{Strategist}} may seem distracted when they're actually thinking about something else: a previous play, a pattern they noticed, something that caught their attention.",
        category: 'Concentración',
        icon: '',
    },
    {
        id: 'quiere-dejar',
        title: 'Says they want to quit the sport',
        whatYouSee: "The player says they don't want to come back, that they don't like it, or they simply stop showing up.",
        whatsHappening: "The emotional effort it takes them to adapt to the sports environment has become greater than what they enjoy. It's not that they don't like the sport — something about the context is draining them more than it's filling them up. The goal isn't to convince them to stay at all costs, but to adjust the environment and see if the enjoyment can come back.",
        profilePerspectives: "A {{Driver}} may want to quit if they feel they have no room to lead or that the challenge level isn't motivating. The {{Connector}} tends to leave when they feel they don't belong to the group or the social dynamics are leaving them out. A {{Supporter}} may want to quit if constant changes or pressure wear them out — they need stability to enjoy it. And the {{Strategist}} can disengage if they feel no one values their perspective on the game or if the activity feels too chaotic.",
        category: 'Motivación',
        icon: '',
    },
    {
        id: 'jugador-nuevo',
        title: 'A new player joins the group',
        whatYouSee: "A player joins who doesn't know anyone. The group reacts: some welcome them, others ignore them, others feel uncomfortable with the change.",
        whatsHappening: "The arrival of someone new disrupts the balance the group already had. Players who value stability feel like something was broken. Those who are more social will probably welcome them quickly. Each profile experiences the change differently.",
        profilePerspectives: "The {{Driver}} will probably welcome the new player if they see them as a potential ally or interesting rival — they size them up fast. The {{Connector}} may be the first to go over and make them feel welcome — that's their integrating nature. A {{Supporter}} may feel uncomfortable with the shift in group dynamics and need time to adjust. And the {{Strategist}} will observe the new player from a distance before interacting — it's not rejection, it's how they figure out who someone is.",
        category: 'Social',
        icon: '',
    },
    {
        id: 'se-congela',
        title: 'Freezes up in the game',
        whatYouSee: 'A player who performs well in practice looks like a completely different person in the game: they don\'t run, don\'t call for the ball, don\'t react. Like they\'ve been "switched off."',
        whatsHappening: "The pressure of the game activated a protection mechanism. Faced with the crowd's eyes or the weight of the moment, their body chooses \"do nothing\" to avoid making a mistake. It's not that they don't want to — they've locked up.",
        profilePerspectives: "The {{Driver}} freezes when they feel too much is at stake and they can't afford to fail — the pressure stalls their engine instead of accelerating it. The {{Connector}} may lock up if they feel the eyes of the crowd or their parents are evaluating them. A {{Supporter}} tends to freeze when the situation feels unpredictable or chaotic — they need a safety anchor. And the {{Strategist}} can get paralyzed by over-analysis: they see too many options and can't pick one in time.",
        category: 'Presión',
        icon: '',
    },
    {
        id: 'no-quiere-ser-centro',
        title: "Doesn't want to be the center of attention",
        whatYouSee: 'When it\'s time to lead an activity, speak in front of the group, or demonstrate something alone, the player refuses, hides, or gets very uncomfortable.',
        whatsHappening: "Their natural way of participating is from a more reserved place. Forcing them to be the center of attention is like asking a left-handed person to write with their right hand — they can do it, but it's uncomfortable. There are forms of leadership that don't require being in the spotlight.",
        profilePerspectives: "A {{Driver}} usually wants to be at the center, so if they're resisting it's probably something else: a specific insecurity or fatigue. The {{Connector}} may want to participate but feels embarrassed doing it alone — they work better with company. A {{Supporter}} genuinely prefers the background and feels exposed when put out front. They can lead through support, not through the stage. And the {{Strategist}} may feel that speaking in front of everyone forces them to improvise, which generates real discomfort. Give them time to prepare and you'll get a different response.",
        category: 'Social',
        icon: '',
    },
    {
        id: 'cambio-repentino',
        title: 'Changed overnight',
        whatYouSee: "A player who was always one way suddenly seems different: quiet, irritable, or checked out. And they don't return to their normal self.",
        whatsHappening: "Something outside of practice is affecting them: school, home, a family situation, trouble with friends. A sustained change in behavior is a signal that something external is draining their emotional energy.",
        profilePerspectives: "A {{Driver}} who suddenly goes quiet is a clear signal that something is going on — their nature is to be active, and the absence of that energy is significant. The {{Connector}} may go quiet or pull away from the group when something outside affects them. A {{Supporter}} may show irritability or resistance where there used to be calm — the change is usually subtle but persistent. And a {{Strategist}} who disengages may be processing something internally that's completely consuming them.",
        category: 'Observación',
        icon: '',
    },
    {
        id: 'derrota-grupal',
        title: "The team lost and no one wants to talk about it",
        whatYouSee: "After a loss, the whole group is down. Nobody's talking, or everyone's blaming each other. The mood gets heavy.",
        whatsHappening: "The team as a group stopped seeing the process and got stuck on the result. A collective loss feels heavier than when just one player loses. The group needs to reconnect with what unites them beyond the scoreboard.",
        category: 'Grupal',
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
        whatsHappeningForProfile: "The Driver needs to feel like what's coming is worth it. If they don't see a clear challenge, the transition is harder. Their motor pushes them to action, but only when the goal is motivating.",
        howToAccompany: [
            'Offer a mini personal challenge for the first 5 minutes: "Let\'s see if you can get going faster than last time."',
            'Give them an active role from the start: have them set up the cones, pick the first drill, or lead the warm-up.',
        ],
        ifNotResponding: "Let them watch the first few minutes without pressure. Once they see the group in action, their competitive instinct will kick in on its own.",
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'I',
        whatsHappeningForProfile: "The Connector needs social connection to get activated. If they arrived alone, if their friend didn't come, or if the group vibe is off, it's hard for them to get going. Their energy turns on through people, not through the activity itself.",
        howToAccompany: [
            'Go up and ask something personal: "How was your day?" That small connection is their on-switch.',
            'Put them next to someone they click with for the first drill.',
        ],
        ifNotResponding: 'Add them to a fun group activity (not a technical one). A warm-up game where they laugh is usually enough to get them in.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter needs everything to feel \"in its place\" before they feel secure. If practice changed times, if there are new people, or if anything in their routine shifted, the transition gets harder. Their slower processing pace means the gear-switch takes more time.",
        howToAccompany: [
            'Keep them in their routine: the same warm-up as always, in the same spot, with the same teammates nearby.',
            "Don't ask them to explain why they don't want to. Just give them a couple of minutes and say: \"We'll start when you're ready.\"",
        ],
        ifNotResponding: 'Give them a small, predictable task ("Do 10 ball touches right here") so they can ease into the rhythm without jumping straight into the group.',
    },
    {
        situationId: 'no-quiere-arrancar',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist needs to understand what's going to happen before they commit. If they don't know what's being trained, or if the plan changed without explanation, they'd rather stay out and process. Their processing engine needs to close the logic before starting.",
        howToAccompany: [
            'Give them a brief overview of what you\'re doing today: "First warm-up, then a tactical drill, and we\'ll wrap up with a scrimmage." Predictability activates them.',
            'If something about the usual plan changed, explain why: "Today we\'re doing something different because we need to work on X."',
        ],
        ifNotResponding: "Let them watch the first activity from the sideline. Once they understand the logic of the drill, they'll join on their own.",
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. Gets very frustrated when losing
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'D',
        whatsHappeningForProfile: "For the Driver, losing is personal. They feel like the result defines their worth. Their leadership energy turns against themselves or others when the scoreboard doesn't go their way.",
        howToAccompany: [
            'Validate first: "I get that you\'re angry — that\'s normal when you give everything you have." Don\'t minimize what they feel.',
            'Then redirect the competitive energy: "What would you do differently if you could replay that last move?" That shifts them from the result to the process.',
        ],
        ifNotResponding: 'Give them a moment alone. The Driver needs to process frustration privately before they can hear any advice.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'I',
        whatsHappeningForProfile: 'The Connector feels the loss as a social rupture: "I let the team down," "I wasn\'t enough for the team." Their frustration comes more from the impact on others than from the result itself.',
        howToAccompany: [
            'Validate the emotion through the relational lens: "It\'s obvious how much you care about this team — that says a lot about you."',
            'Separate them from the "I let everyone down" narrative with specifics: "Look at everything the team accomplished today — and you were part of that."',
        ],
        ifNotResponding: 'Ask a trusted teammate to talk to them. The Connector recovers faster with peer support than with a word from the adult.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter doesn't explode after a loss — they hold it in. They go quiet, pull back, and can carry that frustration for several days. Their natural stability makes them look fine on the outside, but inside it's hard to let go.",
        howToAccompany: [
            'Validate without forcing: "If you need to talk, I\'m here." Don\'t ask them to process it on the spot.',
            'At the following practices, watch for whether they\'re quieter than usual. If they seem different, a low-pressure "How are you doing?" often opens the door.',
        ],
        ifNotResponding: 'Keep their routine and normalcy intact. The Supporter recovers when they feel everything around them is still the same, despite the result.',
    },
    {
        situationId: 'se-frustra-cuando-pierde',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist analyzes the loss on a loop: they replay every mistake, every play, looking for the exact moment things went wrong. Their frustration is more cognitive than emotional, but it still paralyzes them.",
        howToAccompany: [
            'Validate their analysis: "It\'s good that you think about what happened — that\'s what makes you better." Then set a limit on the loop: "Let\'s pick one thing to work on next time."',
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
        whatsHappeningForProfile: "The Driver heard the instruction, but they've already decided to do it their way. It's not disobedience — their quick motor launches them into action before you finish talking, and they trust their instinct.",
        howToAccompany: [
            'Keep the instruction short and direct, in one sentence. "Pass to the pivot, shoot on goal." Fewer words, more action.',
            'If they did something different but it worked, acknowledge it: "Good call. Now let\'s try it this way too."',
        ],
        ifNotResponding: 'Give them the competitive "why": "If you practice this, you\'ll have one more tool to win." The Driver does what they understand will make them better.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'I',
        whatsHappeningForProfile: "The Connector was probably talking to someone when you gave the instruction, or got caught up in the social dynamic and lost focus. It's not disrespect — their attention goes to people first and the task second.",
        howToAccompany: [
            'Make sure you have their attention before giving the instruction: eye contact, name, then the instruction.',
            'Frame the instruction socially: "You and your teammate are going to do this together" works better than an individual command.',
        ],
        ifNotResponding: 'Ask them to explain the instruction to another teammate. When they translate it, they process it and execute it.',
    },
    {
        situationId: 'no-hace-lo-que-pido',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter heard everything, but if the instruction was complex or new, their processing engine needs more time to close the logic before starting. It's not slowness — they want to get it right.",
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
        whatsHappeningForProfile: "The Driver shows nerves through hyperactivity: talks too much, can't stay still, or goes the opposite way — irritable and quiet. The uncertainty bothers them because they want to control the result and can't.",
        howToAccompany: [
            'Give them a concrete task that makes them feel in control: "Warm up with a ball, take 20 shots." Physical action channels the anxiety.',
            'Talk to them in terms of a plan: "Today your role is X. If Y happens, you do Z." The clarity of the plan calms them down.',
        ],
        ifNotResponding: 'Let them warm up alone with music or in a separate space. The Driver processes pressure by moving, not by talking.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'I',
        whatsHappeningForProfile: "The Connector seeks social containment: they talk to everyone, crack jokes, or stick close to their trusted person. They process nerves through connection. If they're quiet, something is weighing on them more than usual.",
        howToAccompany: [
            'Create a group connection moment: a team huddle, a group cheer, a "how are we feeling?" check-in. That centers them.',
            'If they\'re quieter than normal, approach without pressure: "All good?" with a supportive gesture (pat on the back, fist bump).',
        ],
        ifNotResponding: 'Ask them to pump up the group. Giving them a social role ("Your job is to make sure everyone\'s fired up") turns their anxiety into positive energy.',
    },
    {
        situationId: 'raro-antes-del-partido',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter shuts down. They go quieter, stick closer to their routine, and do exactly what they always do as if to hold onto something that hasn't changed. The uncertainty of the game hits their sense of security.",
        howToAccompany: [
            'Keep their pre-game routine as close to normal as possible: same warm-up, same spot, same teammates nearby.',
            'Give them something reassuring to hold onto: "Today we play exactly like we do in practice — nothing weird, just what we already know how to do."',
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
        ifNotResponding: 'Let them watch a full round and then ask directly: "Ready?" The Driver responds well to a direct invitation.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'I',
        whatsHappeningForProfile: "The Connector watches from outside when they don't know anyone or when the social climate doesn't feel safe. They need to identify \"their person\" within the group before joining.",
        howToAccompany: [
            '"Let me introduce you to someone: this is Mateo, he plays the same position as you. Train together." An ally is their way in.',
            'Include them in a pair or small group activity before sending them into the full group.',
        ],
        ifNotResponding: 'Give them a social role from the outside: "Help me keep score" or "Let me know when they\'re done." That connects them to the group without forcing exposure.',
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'S',
        whatsHappeningForProfile: "This is the most natural behavior of the Supporter when facing something new. They're doing their safety read: who's there, how people move, what the rules are. They're not wasting time — they're preparing.",
        howToAccompany: [
            "Don't rush them. Give them the observation time they need. A simple \"Join in when you're ready\" without pressure is what works best.",
            'If possible, have them do the same activity on the side, in parallel, without group exposure.',
        ],
        ifNotResponding: "Let them watch the whole session if needed. Next time they'll join faster. The Supporter builds confidence by accumulating positive observation experiences.",
    },
    {
        situationId: 'mira-desde-afuera',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist is analyzing the rules of the game from the outside. They want to understand the logic of the drill before executing it. They won't join until they have the \"how\" figured out.",
        howToAccompany: [
            'Explain the drill briefly while they watch: "Look — the idea is you do this when that happens." With the logic clear, they\'ll join.',
            '"Want me to walk you through it?" That gives them permission to ask the questions already in their head.',
        ],
        ifNotResponding: 'Say: "Just try it once — it doesn\'t count." The Strategist is more willing when they know the first attempt isn\'t being evaluated.',
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. Cries or gets angry in the middle of practice
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'llora-o-se-enoja',
        eje: 'D',
        whatsHappeningForProfile: "The Driver gets angry more than they cry. Frustration comes out as aggression — they throw something, shout, or walk off. They feel like they've lost control of the situation and that's what overwhelms them.",
        howToAccompany: [
            "Don't confront them in the heat of the moment. Let them cool down for a few seconds and then approach with a neutral tone: \"When you're ready, let's talk.\"",
            'Once they calm down, give them a path back: "Now let\'s go do that drill right." They need to feel they can get control back.',
        ],
        ifNotResponding: 'Remove them briefly from the activity ("Grab some water, take a breath") and let them come back on their own. The Driver needs to feel like the decision to return was theirs.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'I',
        whatsHappeningForProfile: 'The Connector breaks down when they feel the correction ruptured the bond. "Is the coach upset at me because they don\'t like me?" The overflow is emotional and social at the same time.',
        howToAccompany: [
            'Repair the bond first: "I\'m not upset — I want to help you get better." That lowers the emotional threat.',
            'After they calm down, reconnect with warmth: a pat on the back, a "are we good?" For them, knowing the relationship isn\'t broken is essential.',
        ],
        ifNotResponding: 'Ask a trusted teammate to be with them for a moment. The Connector regulates better with a peer than with an authority figure.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter rarely breaks down, so if they're crying, they are genuinely overloaded. They've probably been accumulating fatigue, frustration, or discomfort for a while before reaching this point.",
        howToAccompany: [
            'Give them a break without requiring explanation: "Come sit here for a minute — it\'s okay." The absence of pressure is what helps them most.',
            "Don't ask \"what's wrong?\" in the moment. Wait until they calm down, then gently ask: \"How are you feeling now?\"",
        ],
        ifNotResponding: 'Keep them close but without any task. Let them sit next to you and watch the group. Closeness without demands is how they recover.',
    },
    {
        situationId: 'llora-o-se-enoja',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist gets frustrated when something doesn't make sense or when a correction feels unfair. Their breakdown can seem like it comes out of nowhere, but it comes from an accumulation of things that didn't add up.",
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
        whatsHappeningForProfile: "The Driver clashes when they feel someone else is taking the spotlight or slowing their pace. The friction comes from competing for decision-making space.",
        howToAccompany: [
            'Separate the conflict from the person: "You both want to win, and that\'s good. Now let\'s figure out how to do it together."',
            'Give them ownership over one part of the drill. If they have their territory, the need to fight for someone else\'s goes down.',
        ],
        ifNotResponding: 'Switch up the pair temporarily. Sometimes the best mediation is a brief bit of distance.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'I',
        whatsHappeningForProfile: "The Connector experiences the clash as a rupture in the relationship. What hurts more than the conflict is \"we don't get along anymore.\" They may react by seeking allies or getting dramatic.",
        howToAccompany: [
            'Talk to both of them together and focus on the bond: "You\'re teammates — this gets resolved by talking. What happened?"',
            'After the drill, give the Connector a moment to close it: "Are you good with your teammate?" They need to know the relationship is still intact.',
        ],
        ifNotResponding: 'Give them a bridge role: "Help me keep the group running smoothly." Turning the conflict into a social mission pulls them out of the personal hurt.',
    },
    {
        situationId: 'roce-con-companero',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter avoids conflict. If there was a clash, they're probably extremely uncomfortable and want things back to normal as fast as possible. They won't confront — they'll shut down.",
        howToAccompany: [
            "Don't make them \"talk it out\" in front of the group. Pull them aside privately: \"I noticed something happened there — are you okay?\"",
            'Help them get back to their comfort zone: the same activity, the same usual teammates, normal routine.',
        ],
        ifNotResponding: "Let time do its work. The Supporter doesn't need to \"resolve\" the conflict verbally — they need to feel like things have returned to normal.",
    },
    {
        situationId: 'roce-con-companero',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist clashes when they feel the other person is doing things \"wrong\" or without logic. The friction comes from a difference in standards: they want to do it right, the other wants to do it fast (or vice versa).",
        howToAccompany: [
            'Validate their perspective: "Your way of seeing it makes sense." Then expand: "And so does your teammate\'s — it just comes from a different place."',
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
        whatsHappeningForProfile: 'The Driver beats themselves up through anger: "I\'m such a mess!" They feel they should always be capable, and every mistake is a betrayal of their self-image as a leader.',
        howToAccompany: [
            'Break the loop with action: "Okay, you missed. Now do 3 reps and we move on." Immediate action replaces self-criticism.',
            'Use their competitiveness in their favor: "The best players make mistakes — the difference is what they do next."',
        ],
        ifNotResponding: "Pull them out of the drill for a moment and give them a simple physical task (a run, juggling the ball). The Driver regulates frustration through movement.",
    },
    {
        situationId: 'se-castiga',
        eje: 'I',
        whatsHappeningForProfile: 'The Connector beats themselves up through shame: "Everyone saw me mess up." What weighs on them isn\'t the technical error — it\'s the social exposure of the mistake.',
        howToAccompany: [
            'Normalize the error in front of the group: "We all mess up — that\'s how we learn." That reduces the public shame.',
            'Then in private: "What matters to me is that you try, not that it comes out perfect." The reconnection with the adult calms them down.',
        ],
        ifNotResponding: 'Put them in an activity where mistakes are built into the game (a drill where everyone fails). That dilutes the feeling of being "the only one."',
    },
    {
        situationId: 'se-castiga',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter beats themselves up quietly. They don't shout or hit themselves — they go quiet, drop their head, and lose energy. They feel guilty for not maintaining the consistency they expect of themselves.",
        howToAccompany: [
            'Approach calmly: "That mistake doesn\'t define how you play. Look at everything you\'ve been doing well." They need someone to give them perspective.',
            'In the next drill, put them on something they do well so they can rebuild confidence before going back to what they struggled with.',
        ],
        ifNotResponding: "Don't push the \"it's not a big deal\" line. Just keep going with practice as if nothing changed. The Supporter recovers when they feel the environment didn't shift because of their mistake.",
    },
    {
        situationId: 'se-castiga',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist beats themselves up through analysis: they replay the mistake over and over looking for what they did wrong. They're hard on themselves because they have high standards and feel they should have anticipated the failure.",
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
        whatsHappeningForProfile: "The Driver gets distracted when the drill doesn't have enough intensity or challenge. Their quick motor needs constant action, and when the pace drops, they look for stimulation on their own.",
        howToAccompany: [
            '"Same drill but now in half the time" or "First one there gets to pick the next drill." Turn it up.',
            'Give them responsibility within the drill: have them count reps, referee, or lead a variation.',
        ],
        ifNotResponding: 'Offer a parallel challenge: "While you wait for your turn, do this." The Driver can\'t handle a gap in activity.',
    },
    {
        situationId: 'se-distrae',
        eje: 'I',
        whatsHappeningForProfile: "The Connector gets distracted because what draws them most is social interaction. If the drill is individual or quiet, their attention naturally drifts toward the person next to them.",
        howToAccompany: [
            'Make the drill social: pairs, communication between them, or roles that require talking.',
            'Use their social nature as a tool: "Explain to your teammate how to do this drill."',
        ],
        ifNotResponding: 'Make them your assistant: "Come help me organize this." The social closeness with you recaptures their attention.',
    },
    {
        situationId: 'se-distrae',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter gets distracted when there's too much stimulus: lots of noise, constant drill changes, or new instructions without a pause. Their system disengages to protect itself from the chaos.",
        howToAccompany: [
            'Slow down the pace of changes: let them stay with the same drill a bit longer before switching.',
            'Give them a predictable role within the activity: "You always stay in this position, your job is this."',
        ],
        ifNotResponding: 'Go up and reconnect with them calmly: "Still with me? Good. Next thing we\'re doing is this." Personal contact brings them back.',
    },
    {
        situationId: 'se-distrae',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist gets distracted when the drill feels repetitive or pointless. Their mind looks for something to analyze, and if the drill doesn't give it to them, they find stimulation elsewhere.",
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
        whatsHappeningForProfile: "The Driver wants to quit when they feel they can't win, grow, or lead. If they've gone a long time without new challenges or a sense of progress, the sport loses its meaning for them.",
        howToAccompany: [
            '"If you could change one thing about practice, what would it be?" Ask and actually listen to the answer.',
            'Offer a concrete, measurable goal: "What if over the next 3 weeks we focus specifically on this?"',
        ],
        ifNotResponding: "Don't push it. Say: \"The door is open whenever you want.\" The Driver sometimes needs to miss the challenge before they come back motivated.",
    },
    {
        situationId: 'quiere-dejar',
        eje: 'I',
        whatsHappeningForProfile: "The Connector wants to quit when the bonds broke: if their friend left, if the group changed, or if they feel like they no longer belong. For them, the sport is the group — and if the group isn't holding them, there's no reason to be there.",
        howToAccompany: [
            '"Is there something about the group that\'s bothering you?" Explore the bond. Often the real reason isn\'t the sport — it\'s a social relationship that broke down.',
            'If possible, reconnect them with a close teammate or move them to a group where they have more affinity.',
        ],
        ifNotResponding: "Talk to the parent or guardian. The Connector's departure usually has a social root that can be addressed if it's caught early.",
    },
    {
        situationId: 'quiere-dejar',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter wants to quit when too much changed: a new coach, new teammates, a schedule or location change. It's not that they don't like the sport — the environment no longer feels like \"their place.\"",
        howToAccompany: [
            '"Is there something you used to like that you don\'t anymore?" The Supporter can usually identify the exact breaking point.',
            'If you can, restore something from the previous context: the same schedule, the same group, the same routines.',
        ],
        ifNotResponding: "Give it time. Don't ask for a final decision. \"You don't have to decide right now. Come next week and we'll see.\" The Supporter needs to process changes slowly.",
    },
    {
        situationId: 'quiere-dejar',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist wants to quit when they feel they're not learning anything new or that practice doesn't make sense. If they've been doing the same thing for weeks without understanding why, their motivation shuts off.",
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
        whatsHappeningForProfile: 'The Driver sees the new player as a variable to evaluate: "Are they good? Are they going to take my spot?" They may react by competing to mark their territory or by ignoring them.',
        howToAccompany: [
            'Give them a leadership welcome role: "Show them how we do the warm-up." That puts them in the position of leader, not competitor.',
            'Set up a drill where both of them can shine: "One attacks, one defends, then switch."',
        ],
        ifNotResponding: "Let the natural competition do its work. The Driver will accept the new player once they see they raise the level of the group.",
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'I',
        whatsHappeningForProfile: "The Connector will probably be the first to go up to the new player. If they don't, it's because something about the new person intimidates them or because they feel their social place in the group is threatened.",
        howToAccompany: [
            '"Be their host today — walk them through how everything works here." It\'s their natural role and it empowers them.',
            'If the Connector seems reluctant, talk privately: "Everything okay with X joining?" There may be a social insecurity worth exploring.',
        ],
        ifNotResponding: "Set up an activity where they have to cooperate. The Connector's connection activates when doing things together.",
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter is the one who feels the \"disruption\" most. Their group was predictable and safe, and now someone is changing the dynamic. They may seem distant or uncomfortable.",
        howToAccompany: [
            "Don't change the routine because of the new player. Keep everything as consistent as possible for the Supporter: same spot, same drill, same teammates.",
            'Frame the new player as an "addition" not a "change": "Someone\'s joining the group — everything else stays the same."',
        ],
        ifNotResponding: "Give it time. The Supporter will accept the new player gradually as that person becomes part of the routine. Don't force the integration.",
    },
    {
        situationId: 'jugador-nuevo',
        eje: 'C',
        whatsHappeningForProfile: 'The Strategist observes the new player with analytical curiosity: "How do they play? Where are they going to fit? How do they affect the team?" They won\'t approach right away because they\'re still processing the information.',
        howToAccompany: [
            'Give them background on the new player: "They come from this club, they play this position." Data helps them place the new player in their mental map.',
            'Ask them to help tactically: "Walk them through how we do this play." That connects them through their strength.',
        ],
        ifNotResponding: "Let the integration happen organically. The Strategist will approach the new player once they have enough information. Don't rush it.",
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
            'From the sideline, give them confidence in their ability: "You know how to do this — I believe in you." The Driver responds to a vote of confidence.',
        ],
        ifNotResponding: "Temporarily move them to a less exposed role. Once they make a good play from there, put them back in their position. They need a small win to get going again.",
    },
    {
        situationId: 'se-congela',
        eje: 'I',
        whatsHappeningForProfile: 'The Connector freezes when they feel a mistake will put them "on blast" in front of the group. Their block is social: they\'re afraid of looking bad to their teammates, not of the mistake itself.',
        howToAccompany: [
            '"It doesn\'t matter if it works or not — I just want you to try." Permission to fail unblocks them.',
            '"Team, everyone in, all together." Feeling surrounded brings their confidence back.',
        ],
        ifNotResponding: "Put them in a group play where success belongs to the team, not to one individual. The Connector gets going again when responsibility is shared.",
    },
    {
        situationId: 'se-congela',
        eje: 'S',
        whatsHappeningForProfile: "The Supporter freezes because the pressure of the game breaks their sense of security. What was predictable in practice becomes uncertain in the game. Their system protects itself by going still.",
        howToAccompany: [
            '"Do exactly what we do in practice — nothing different." Connecting them to the familiar is what unblocks them.',
            '"Every time the ball comes to you, pass it to X." A simple, repeatable task activates them.',
        ],
        ifNotResponding: 'Sub them out for a few minutes if you can. "Take a breath, watch how the game is going, and come back in when you\'re ready." The Supporter recovers with the break.',
    },
    {
        situationId: 'se-congela',
        eje: 'C',
        whatsHappeningForProfile: 'The Strategist freezes because they\'re over-analyzing: "Do I pass or shoot? What if the defender comes? What\'s the best option?" Their mind runs faster than their body, and the body locks up.',
        howToAccompany: [
            '"If you\'re open, shoot. If you\'re not, pass." Reducing the options unblocks them.',
            'Before the next game, walk through the decisions: "When this happens, you do that." Pre-automating the choices frees the mind during the game.',
        ],
        ifNotResponding: 'Tell them: "Stop thinking — just play." Sometimes the Strategist needs explicit permission to turn off the analysis and trust their instincts.',
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
            'Remove the evaluative weight: "This isn\'t about seeing who does it best — it\'s so we all learn."',
        ],
        ifNotResponding: 'Let them participate through a social role: they choose who goes next, they comment on the play, they cheer the group on. That\'s their way of being present without being exposed.',
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'S',
        whatsHappeningForProfile: "This is natural for the Supporter. Their way of contributing is through support, not through the spotlight. Forcing them to be the center goes against their nature and makes them feel vulnerable.",
        howToAccompany: [
            'Offer forms of quiet leadership: "Make sure everyone has what they need" or "You\'re the one who keeps the rhythm."',
            'If you need them to step up, give them advance notice: "Next week I\'m going to ask you to demonstrate this drill." The heads-up lowers the anxiety.',
        ],
        ifNotResponding: "Don't push it. Find another way for them to participate where they feel comfortable. The Supporter contributes more from their comfort zone than from forced exposure.",
    },
    {
        situationId: 'no-quiere-ser-centro',
        eje: 'C',
        whatsHappeningForProfile: "The Strategist doesn't want to be exposed unless they're sure they're going to do it right. Their standards are high and the idea of failing in public causes real discomfort.",
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
            "Don't open with \"what's wrong?\" First, observe for a few days. If it persists, approach with something specific: \"I've noticed you seem different lately — is there anything I can do?\"",
            "If they don't want to talk, give them a physical challenge that gets them going: \"Today I need you to lead the warm-up.\" Sometimes action gives back the energy that words can't.",
        ],
        ifNotResponding: "Talk to the parent or guardian. A persistent change in a Driver is usually a sign of something significant happening outside of the field.",
    },
    {
        situationId: 'cambio-repentino',
        eje: 'I',
        whatsHappeningForProfile: "A Connector who shuts down is a strong signal. Their nature is social, so if they're quiet or pulling away from the group, something is hurting them in the relational realm — a fight with friends, a family change, or bullying.",
        howToAccompany: [
            '"I know you, and I can tell something\'s going on. You don\'t have to tell me, but I want you to know I\'m here."',
            "Give them space to reconnect at their own pace. Don't push them to \"cheer up\" — that invalidates what they're feeling.",
        ],
        ifNotResponding: "Reach out to the parent or guardian. A sustained change in a Connector is usually linked to a relational situation that needs attention outside of practice.",
    },
    {
        situationId: 'cambio-repentino',
        eje: 'S',
        whatsHappeningForProfile: "A Supporter who changes suddenly is showing that something broke their sense of security. They're the profile that holds it together the longest before showing distress — so if you're seeing it, they've probably been accumulating this for a while.",
        howToAccompany: [
            "Keep their routine as stable as possible. Whatever is going on outside, practice can be their refuge of normalcy.",
            'Check in naturally: "How are you today?" as part of the routine. If they want to talk, they will.',
        ],
        ifNotResponding: "Reach out to the parent or guardian carefully: \"I've noticed they seem different lately — is everything okay at home?\" The Supporter rarely asks for help — you have to go looking for it.",
    },
    {
        situationId: 'cambio-repentino',
        eje: 'C',
        whatsHappeningForProfile: "A Strategist who changes behavior may be processing something internally that they can't resolve. Their analytical mind can get stuck in a loop on a situation that has no logical solution (a family problem, a perceived injustice).",
        howToAccompany: [
            '"Do you want to tell me what\'s been going on in your head? Sometimes it helps to say it out loud."',
            "If they don't want to talk, respect that. Offer something that helps them process it their way: \"If you want, write down what you're feeling and show me when you're ready.\"",
        ],
        ifNotResponding: "Contact the parent or guardian. Sustained changes in the Strategist — especially if they become irritable or distant — usually indicate a situation that needs professional support.",
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 15. The team lost and no one wants to talk about it (GROUP)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        situationId: 'derrota-grupal',
        eje: 'group',
        whatsHappeningForProfile: "The whole group is processing the loss through their own profile: the Drivers are angry, the Connectors feel like they failed as a team, the Supporters have shut down, and the Strategists are replaying every mistake. The collective mood is low.",
        howToAccompany: [
            "Don't try to talk about the game right after the loss. Give the group a few minutes of silence or free decompression before bringing them together.",
            "When you do bring them in, start with what worked: \"Today we did this, this, and this well. What didn't go our way, we work on next week.\" Process first, result last.",
            "Offer the group a closing ritual: a circle where each person says one good thing they saw in a teammate. That reconnects the team through the relationship, not the scoreboard.",
        ],
        ifNotResponding: "Don't force positivity. Sometimes the group needs to be sad for a bit. Say: \"Today it hurts, and it's okay that it hurts. Tomorrow we start again.\" Permission to feel the loss is the first step to getting over it.",
    },
];
