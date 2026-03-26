// Auto-generated English translations for groupBalanceRules.ts
// Keys are kept in Spanish (they are identifiers). Only string values are translated.

import type { GroupType, IndicatorLevel, DiversityLevel, MotorGroupType } from './groupBalance';

/* ── Group Profile Texts ───────────────────────────────────────────────────── */

interface GroupProfileText {
    identity: string;
    strengths: string[];
    tools: string[];
}

export const GROUP_PROFILE_TEXTS_EN: Record<GroupType, GroupProfileText> = {
    Competitivo: {
        identity: 'A group that comes alive under challenge. Competitive energy is their natural fuel, and the pace is set by whoever takes the initiative.',
        strengths: [
            'Strong ability to respond quickly in high-pressure situations',
            'Determination to push through when the result matters',
            'A group tendency toward distributed decision-making: right now, several players are showing initiative on the field',
        ],
        tools: [
            'Assign clear roles within the group. When each player knows their leadership territory, competitive energy flows outward rather than inward.',
            'Use structured internal challenges: timed competitions, rotating teams, clear rules. Competition is this group\'s native language. Always monitor enjoyment levels — if competition is generating frustration for any player, dial back to free-play formats.',
            'After each competitive activity, take a brief moment to acknowledge collective effort, not just individual results.',
        ],
    },
    Social: {
        identity: 'A group where human connection takes center stage. Energy comes from the bonds between players, and the emotional climate sets the tone of every session.',
        strengths: [
            'Positive atmosphere that makes integrating new players easy',
            'Strong capacity for collective motivation in key moments',
            'Fluid communication throughout the group',
        ],
        tools: [
            'Build opening and closing rituals into every session (a word-circle, a team chant). This group performs best when it feels it belongs to something.',
            'For moments that require individual focus, use clear transition signals: "now it\'s time to listen closely" works better than simply asking for quiet.',
            'Use the social energy as a teaching tool: group exercises, peer-to-peer explanations, rotating leadership.',
        ],
    },
    Cohesivo: {
        identity: 'A group built on a solid foundation. Consistency and loyalty are the threads that hold these players together, and trust built over time sets the rhythm.',
        strengths: [
            'High reliability: what gets agreed on, gets done',
            'Emotional stability that holds the group steady in difficult moments',
            'Natural team spirit and low internal conflict',
        ],
        tools: [
            'Introduce changes gradually and explain the reasoning. This group processes new things better when they understand the why behind the change.',
            'Challenge the group with progressive goals: "last week we got to this point — this week we add this." Incremental growth is the natural rhythm of this group.',
            'Explicitly recognize the group\'s consistency. Stability can be invisible; naming it reinforces what the group is already doing well.',
        ],
    },
    Metódico: {
        identity: 'A group that observes before it acts. Precision and deep understanding are their natural approach to any athletic challenge.',
        strengths: [
            'Attention to detail that reduces technical errors',
            'Tactical analysis ability above average',
            'A tendency to grasp and follow structured instructions',
        ],
        tools: [
            'Explain the "why" behind each exercise. This group commits more fully when they understand the purpose of the activity.',
            'Mix analytical exercises with moments of free play or improvisation. Spontaneity is a muscle this group can develop with the right guidance.',
            'When a player over-analyzes before acting, validate their process — "good read" — then invite the action: "now execute what you saw."',
        ],
    },
    Balanceado: {
        identity: 'A diverse group where different behavioral styles coexist. That variety is a strength — it lets the group adapt to a wide range of athletic situations.',
        strengths: [
            'Flexibility to take on different types of challenges',
            'Each player brings a distinct perspective to the group',
            'Lower risk of falling into a single behavioral pattern',
        ],
        tools: [
            'Vary the style of your exercises: competitive, collaborative, technical, creative. A diverse group responds well to variety.',
            'Keep in mind that group communication requires more nuance: what motivates one player may not resonate with another. Watch individual reactions.',
            'Use the diversity explicitly as a resource: "we\'re going to need some players to lead, some to support, and some to observe — everyone has a role."',
        ],
    },
};

/* ── Composite Group Texts ─────────────────────────────────────────────────── */

interface CompositeText {
    identity: string;
    tools: string[];
}

export const COMPOSITE_TEXTS_EN: Record<string, CompositeText> = {
    'Competitivo-Social': {
        identity: 'A high-energy, high-volume group. Intensity comes from both competition and social connection. The pace is fast and expressiveness is constant.',
        tools: [
            'Channel the energy with flexible structure: clear rules, but room for expression. "Compete — and whoever wins explains to the others how they did it."',
            'Build in brief pauses between high-intensity activities. Not to slow the group down, but to let them process what they just experienced.',
            'This group responds very well to public recognition and group challenges with collective rewards.',
        ],
    },
    'Competitivo-Cohesivo': {
        identity: 'A group that pairs determination with loyalty. Competition exists, but within a framework of mutual care. They compete without tearing each other apart.',
        tools: [
            'Lean into the fact that internal competition has natural limits: this group knows when to pull back before someone has a bad time.',
            'Natural leaders tend to look out for the more steady players. Recognize that dynamic and name it: "I like how this team takes care of everyone while it competes."',
            'Transitions between competitive and collaborative activities are smooth for this group. Use that to your advantage.',
        ],
    },
    'Competitivo-Metódico': {
        identity: 'A group that wants to win and knows how. Action and analysis coexist, producing an intense but intelligent style of play.',
        tools: [
            'Give the group tactical information before exercises. The combination of analysis plus action means they absorb instructions quickly and execute with conviction.',
            'When differences in tempo emerge — some players want to act now, others want to understand first — validate both: "good read, now execute" brings both styles together.',
            'Decision-making-under-pressure exercises are ideal for this group: they combine the best of both styles.',
        ],
    },
    'Social-Cohesivo': {
        identity: 'A warm, tight-knit group. The natural priority is team well-being and connection between players. The emotional climate is excellent.',
        tools: [
            'Use the positive climate to introduce progressive challenges. This group is willing to step outside its comfort zone when it feels emotionally safe.',
            'Bring in moments of competitive intensity as "guests": a single high-demand exercise within an otherwise relaxed session.',
            'When you need to raise the intensity, frame it in terms of collective care: "we\'re going to push a little harder because I trust what this group can achieve together."',
        ],
    },
    'Social-Metódico': {
        identity: 'A group that pairs expressiveness with observation. Communication is rich and detailed — they talk a lot and analyze a lot.',
        tools: [
            'Use the group\'s communication ability for peer-feedback exercises: "explain to your teammate what you observed in their play."',
            'Balance verbal analysis time with physical action. This group naturally processes by talking — which is valuable — but they also benefit from "less chatting, more playing" moments.',
            'Exercises that combine creativity with precision (rehearsed plays, tactical combinations) are the sweet spot for this group.',
        ],
    },
    'Cohesivo-Metódico': {
        identity: 'A patient, consistent group. The pace is deliberate, attention to detail is high, and the emotional foundation is solid.',
        tools: [
            'Introduce surprise and speed gradually: exercises where the rules change mid-activity, unexpected variations in the routine.',
            'Acknowledge the group\'s consistency ("this group doesn\'t make the same mistake twice") and use that as the launchpad for inviting faster action.',
            'High-pressure competitive moments are where this group grows. Prepare them in advance: "today we\'re going to practice playing under time pressure."',
        ],
    },
    'Balanceado-Competitivo': {
        identity: 'A diverse group that finds its drive in competition. The variety of styles lets them approach challenges from multiple angles, and competitive energy gives them direction.',
        tools: [
            'Use the group\'s diversity to build balanced internal teams: each team gets a bit of everything, and competition becomes richer.',
            'Use the variety of styles as a tactical advantage: "in this exercise, the observers give feedback to the ones executing, then they switch." Rotating roles keeps everyone engaged.',
            'Competition works best in this group when it\'s collective rather than individual. Team challenges against the clock, group records, or shared goals channel the energy without creating friction between different styles.',
        ],
    },
    'Balanceado-Social': {
        identity: 'A diverse group that comes together through connection. The variety of styles enriches interactions, and social energy acts as the glue that holds the group together despite its differences.',
        tools: [
            'Use social energy as a bridge between styles: "tell your teammate how you see it" generates natural exchanges between players who think differently.',
            'Integration activities are especially effective in this group because the diversity ensures each player brings something distinct to the shared moment.',
            'Alternate between social exercises (group-based, communication-heavy) and individual exercises (concentration, technique). The group\'s diversity handles format changes well as long as the emotional climate stays positive.',
        ],
    },
    'Balanceado-Cohesivo': {
        identity: 'A diverse group that builds from trust. The variety of styles is held together by a foundation of emotional stability that lets each player find their space without having to compete for it.',
        tools: [
            'The group\'s stability makes it safe to introduce new challenges: the cohesive base cushions the discomfort of change, and the diversity ensures someone in the group adapts quickly.',
            'Keep rituals and routines that reinforce belonging, but vary the exercises within those routines to activate the different styles.',
            'When integrating a new player, lean on the group\'s natural cohesion: "the team will take care of getting you settled in." The diversity means the newcomer will quickly find someone with a similar style.',
        ],
    },
    'Balanceado-Metódico': {
        identity: 'A diverse group with a reflective lean. The variety of styles is complemented by a natural inclination to observe, analyze, and understand before acting.',
        tools: [
            'Explain the purpose of each exercise before you start. The diversity in the group means each player processes it differently, but the shared analytical tendency needs the "what for" as a starting point.',
            'Use the group\'s observational ability as a feedback tool: "what did you see in that play?" generates diverse, rich responses because each style notices different things.',
            'Alternate moments of analysis with moments of spontaneous action. The balance between reflection and execution is key: "take 10 seconds to think about what you\'re going to do, then execute without stopping."',
        ],
    },
};

/* ── Indicator Texts ───────────────────────────────────────────────────────── */

interface IndicatorText {
    label: string;
    description: string;
}

type AxisIndicatorTexts = Record<IndicatorLevel, IndicatorText>;

export const INDICATOR_TEXTS_EN: Record<string, AxisIndicatorTexts> = {
    D: {
        equilibrada:   { label: 'Balanced presence', description: 'The group has natural leadership presence spread evenly across players.' },
        moderada:      { label: 'Moderate presence', description: 'Leadership in this group tends to lean on the adult. That opens the door to developing leadership in players who haven\'t expressed it yet.' },
        marcada:       { label: 'Strong presence', description: 'The group has several natural leaders. Each one can shine when given a clear area of ownership.' },
        definido_alto: { label: 'Defined style', description: 'The group has a high density of players who want to lead. Setting up rotating roles and defined areas of responsibility lets that energy flow productively.' },
        definido_bajo: { label: 'Defined style', description: 'The group works well with external guidance. The adult is the primary source of direction, which creates a good base for developing leadership as a skill.' },
    },
    I: {
        equilibrada:   { label: 'Balanced presence', description: 'The group has good social connection and expressiveness.' },
        moderada:      { label: 'Moderate presence', description: 'The group\'s social expressiveness is contained. Team rituals (chants, greetings, brief celebrations) help build that social fabric.' },
        marcada:       { label: 'Strong presence', description: 'The group has a lot of social energy. That expressiveness is a valuable resource when channeled: group celebrations, motivational leadership, bringing new players in.' },
        definido_alto: { label: 'Defined style', description: 'Social energy is this group\'s identity. Clear transition signals between social moments and focus moments help the group switch between both modes.' },
        definido_bajo: { label: 'Defined style', description: 'The group is reserved in social expression. That creates a focused, low-conflict environment. Brief personal connection moments (a quick check-in, a shared story) deepen the bond.' },
    },
    S: {
        equilibrada:   { label: 'Balanced presence', description: 'The group has a solid emotional foundation that gives it consistency.' },
        moderada:      { label: 'Moderate presence', description: 'The group has a shifting rhythm that can be an asset in dynamic contexts. Predictable routines (same warm-up, same structure) give it an anchor when needed.' },
        marcada:       { label: 'Strong presence', description: 'The group has high emotional stability. That consistency is the foundation from which the adult can build progressive challenges.' },
        definido_alto: { label: 'Defined style', description: 'Consistency is this group\'s superpower. New challenges, introduced gradually and with explanation, are the growth opportunity. The group accepts change when it understands why.' },
        definido_bajo: { label: 'Defined style', description: 'The group has a reactive, dynamic style. That makes it strong in fast-changing situations. Brief, predictable routines at the start of each session give it a reference point.' },
    },
    C: {
        equilibrada:   { label: 'Balanced presence', description: 'The group has good observational ability and tactical awareness.' },
        moderada:      { label: 'Moderate presence', description: 'The group moves more on instinct than analysis. That spontaneity is valuable, and brief observation pauses ("look at this play — what do you see?") bring in analysis without stopping the action.' },
        marcada:       { label: 'Strong presence', description: 'The group has strong analytical ability. Exercises that combine observation with execution ("see it, decide, execute") are a great fit.' },
        definido_alto: { label: 'Defined style', description: 'Observation is this group\'s core strength. Exercises with a limited decision window ("three seconds to choose") help them connect analysis to fast action.' },
        definido_bajo: { label: 'Defined style', description: 'The group acts with fluency and spontaneity. Brief post-exercise reviews ("what just happened there?") let them incorporate reflection without breaking their natural rhythm.' },
    },
};

export const DIVERSITY_TEXTS_EN: Record<DiversityLevel, IndicatorText> = {
    alta:         { label: 'High diversity', description: 'The group has a healthy variety of behavioral styles. That lets it adapt to different types of athletic situations.' },
    moderada_div: { label: 'Moderate diversity', description: 'The group leans toward a few behavioral styles. That gives it a clear identity, and the coach can complement it with exercises that activate other styles.' },
    definida:     { label: 'Defined identity', description: 'The group has a very defined behavioral style. That\'s a strength in situations that call for that style, and a growth opportunity in contexts that require something different.' },
};

/* ── Motor Texts ───────────────────────────────────────────────────────────── */

interface MotorText {
    identity: string;
    tools: string;
}

export const MOTOR_TEXTS_EN: Record<MotorGroupType, MotorText> = {
    Rápido: {
        identity: 'A group of immediate responders. First reactions are fast and early intensity is high.',
        tools: 'Strategic pauses between exercises ("before we start, take 5 seconds to observe") add a layer of reflection that complements their natural speed.',
    },
    Medio: {
        identity: 'An adaptable group that can adjust its pace to the context. Flexibility is their defining trait.',
        tools: 'Alternate high-speed exercises with pause-and-analyze exercises. This group handles variety well because its rhythm is built to adapt.',
    },
    Lento: {
        identity: 'A group that processes before acting. Decisions tend to be deliberate and execution quality is high.',
        tools: 'Anticipate transitions ("in 30 seconds we\'re switching exercises") so the group can prepare. Exercises with a preparation window followed by rapid execution combine the best of the reflective style with the practice of decisive action.',
    },
    Diverso: {
        identity: 'A group with a variety of rhythms. Fast, medium, and reflective styles coexist, which enriches the group dynamic.',
        tools: 'Exercises that require different rhythms in different roles are ideal. "One player reads the play (reflective), one communicates it (medium), one executes it (fast)." Motor diversity is a tactical resource.',
    },
};
