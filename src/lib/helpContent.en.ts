/**
 * English Help Center content. Mirrors helpContent.ts (Spanish master).
 * Keep ids, category, audience and link `to` routes identical to the master.
 * Archetype naming (single source of truth, docs/archetype-naming.md):
 *   axes = Driver / Connector / Sustainer / Strategist
 *   motors = Dynamic / Rhythmic / Serene (C + slow = Observant)
 */

import type { HelpArticle } from './helpContent';

export const HELP_ARTICLES_EN: HelpArticle[] = [
    /* ═══ Getting started ═══ */
    {
        id: 'como-funciona',
        category: 'getting-started',
        title: 'How does Argo work in a nutshell?',
        body: 'Argo turns a 10-minute adventure into a reading of the child\'s behavioral tendencies right now (not a fixed label), made for the adult who supports them.\n\nThe path is simple: you create a team, share its link, the child plays the odyssey and, when they finish, their profile appears in your dashboard and a report is emailed to the responsible adult.',
    },
    {
        id: 'configura-institucion',
        category: 'getting-started',
        title: 'How do I set up my institution details?',
        body: 'In Settings you define your institution name, sport, logo and country. These details personalize the report and the child experience.',
        steps: [
            'Open Settings from the side menu.',
            'Fill in the name, main sport, country and city.',
            'If you want, upload your institution logo.',
            'Save with the button at the bottom of the card. All changes are saved together.',
        ],
        audience: 'admin',
        links: [{ label: 'Go to Settings', to: '/dashboard/settings' }],
    },
    {
        id: 'deporte-bloqueado',
        category: 'getting-started',
        title: 'How does each team\'s sport work?',
        body: 'The sport is set per team, not per institution. When you create a team you choose its sport, and that is the sport carried by the profiles of the players who join through that team\'s link. A multi-sport institution can therefore have teams for different sports.\n\nYou can edit a team\'s sport from the Teams section. Reports already generated keep the sport they were created with (they are a snapshot of that moment).',
        audience: 'admin',
        links: [{ label: 'Go to Teams', to: '/dashboard/planteles' }],
    },
    {
        id: 'primer-plantel',
        category: 'getting-started',
        title: 'How do I create my first team?',
        body: 'The team is the unit that organizes your players and owns the play link. You need at least one to get started.',
        steps: [
            'Open Teams from the menu.',
            'Tap Create and give it a name (for example, U12 Soccer).',
            'Done: the team is created and its link is generated automatically.',
            'Assign a coach by tapping their chip in the team (or the "Me" chip to assign yourself) and confirm, or share the link yourself.',
        ],
        audience: 'admin',
        links: [{ label: 'Go to Teams', to: '/dashboard/planteles' }],
    },
    {
        id: 'compartir-link',
        category: 'getting-started',
        title: 'How do I share the play link?',
        body: 'Each team has its own link. You find it on Home, next to the team name. Copy it and share it with families however you prefer (message, email, group).\n\nWhen a child finishes the adventure, their profile is linked to your dashboard automatically. You do not have to enter anything by hand.',
        tip: 'Each link belongs to the team, not to a person. Several coaches can share the same link.',
        links: [{ label: 'Go to Home', to: '/dashboard' }],
    },
    {
        id: 'que-vive-deportista',
        category: 'getting-started',
        title: 'What does the child experience when they open the link?',
        body: 'The child plays a 10-minute adventure with a nautical theme. They answer questions and mini-games without knowing they are revealing how they decide and relate to others.\n\nThere are no right or wrong answers, and it never feels like a test. At the end, the report goes to the responsible adult, not to the child.',
    },

    {
        id: 'usar-selector',
        category: 'getting-started',
        title: 'How do I switch institution or team? (the selector)',
        body: 'If you belong to more than one institution, or you coach a team, you will see a selector at the top left of the menu (your institution with a ⇅ arrow).\n\nFrom there you pick the context you are in: the whole institution (Administration) or a specific team. Whatever you pick reconfigures everything: players, stats, the Predictor, group chemistry and even Argo Coach focus on that context.',
        tip: 'If you only have one institution and no team assigned, the selector does not appear (there is nothing to switch between).',
    },
    {
        id: 'varias-instituciones',
        category: 'getting-started',
        title: 'Can I belong to several institutions?',
        body: 'Yes. One account can be part of several institutions (for example, if you coach at two clubs). When an admin adds you by email, that institution appears in your selector, top left.\n\nYou do not need another account or email: sign in with yours and switch between them from the selector.',
    },

    /* ═══ Teams and coaches ═══ */
    {
        id: 'que-es-plantel',
        category: 'planteles',
        title: 'What is a team and why does it have its own link?',
        body: 'A team is the structural unit of your institution (for example, an age group or a squad). It owns the play link: every child who enters through that link is attributed to that team.\n\nThat is why the link lives in the team and not in a person. Even if coaches change, the team and its players stay in place.',
        audience: 'admin',
    },
    {
        id: 'crear-renombrar-plantel',
        category: 'planteles',
        title: 'How do I create, rename or delete a team?',
        body: 'You can have as many teams as you need (for example, one per age group).',
        steps: [
            'Open Teams.',
            'To create, tap Create and type the name.',
            'To rename, select the team and tap the pencil next to its name.',
            'To delete, use the team menu and confirm.',
        ],
        audience: 'admin',
        links: [{ label: 'Go to Teams', to: '/dashboard/planteles' }],
    },
    {
        id: 'invitar-entrenadores',
        category: 'planteles',
        title: 'How do I invite coaches and assign them to a team?',
        body: 'These are two separate steps. First you create the coach from Users (with their email and level). Then you assign them to a team from the Teams section, by tapping their chip. Each one will see only the players in their teams.',
        steps: [
            'Open Users.',
            'Tap Invite, enter the coach email and choose the Coach level.',
            'Send the invitation. The coach receives an email to create their password.',
            'Go to Teams, open the team and tap the coach chip to assign them. Confirm the change.',
        ],
        audience: 'admin',
        links: [{ label: 'Go to Users', to: '/dashboard/users' }, { label: 'Go to Teams', to: '/dashboard/planteles' }],
    },
    {
        id: 'admin-vs-entrenador',
        category: 'planteles',
        title: 'What is the difference between an administrator and a coach?',
        body: 'The administrator sees the whole institution: creates teams, invites coaches and sees all players.\n\nThe coach sees only the players in the teams they were assigned. They can share their link, view their profiles, create chemistry groups and use Argo Coach with their players.',
    },
    {
        id: 'coach-no-ve-planteles',
        category: 'planteles',
        title: 'I am a coach and I don\'t see the Teams section. Is that right?',
        body: 'Yes, that is normal. Managing teams (creating them and assigning coaches) is done by the institution administrator.\n\nYou work with the players in the teams you were assigned: you see them in Players and their link appears on Home. If you are missing access to a team, ask your administrator.',
        audience: 'coach',
    },

    {
        id: 'admin-tambien-entrena',
        category: 'planteles',
        title: 'I am an admin and I also coach a team. How do I do that?',
        body: 'You can be the institution admin and, on top of that, the coach of one or more teams. You lose nothing: you just add the team to your account.',
        steps: [
            'Open Teams and select the team you coach.',
            'In the Coaches section, tap the "Me" chip to assign yourself (tap it again to unassign) and confirm.',
            'Done: that team appears in your selector. Picking it enters its coach view (its link, its players, its chat).',
            'To go back to the full view, pick "Administration" in the selector.',
        ],
        audience: 'admin',
        links: [{ label: 'Go to Teams', to: '/dashboard/planteles' }],
    },
    {
        id: 'cambiar-nivel-miembro',
        category: 'planteles',
        title: 'How do I change a member\'s level (Admin or Coach)?',
        body: 'In Users, each member has a level selector. Admin sees and manages the whole institution; Coach sees only their teams.',
        steps: [
            'Open Users.',
            'In the member\'s row, switch the selector between Admin and Coach.',
            'The change is immediate.',
        ],
        tip: 'The account owner\'s level cannot be changed (their row says "Owner"). That way the institution always keeps an owner.',
        audience: 'admin',
        links: [{ label: 'Go to Users', to: '/dashboard/users' }],
    },

    /* ═══ Players and profiles ═══ */
    {
        id: 'donde-aparecen-jugadores',
        category: 'players',
        title: 'Where do I see the children who already played?',
        body: 'In the Players section. Every child who completes the adventure appears there with their profile, age, sport and date.\n\nTap a row to expand their full profile. If a child started but did not finish, they show as pending until they complete it.',
        links: [{ label: 'Go to Players', to: '/dashboard/players' }],
    },
    {
        id: 'entender-arquetipos',
        category: 'players',
        title: 'What do the 12 profiles mean?',
        body: 'Each profile starts from a primary axis (how the child decides and relates: Driver, Connector, Sustainer or Strategist). Sometimes a lean is added, which is the child\'s second strongest axis. That gives the 12 profiles: the 4 pure axes (such as Driver or Strategist) and 8 combinations (such as Driver with a Connector lean).\n\nNo profile is better than another: they simply describe different ways of moving through the world. Apart from the name, the report measures their engine (the pace at which they process and decide) as its own reading. The profile is a snapshot of the present, not a label for life.',
    },
    {
        id: 'brujula-palabras',
        category: 'players',
        title: 'What are the secondary lean and the bridge words?',
        body: 'The secondary lean is the child\'s second strongest axis: it nuances their main profile.\n\nThe bridge words are phrases that connect with them and motivate them. The words to avoid are the ones that create friction or resistance. They give you a concrete way to talk to each child.',
        trialNote: 'These sections unlock on a paid plan.',
    },
    {
        id: 'descargar-reenviar-reporte',
        category: 'players',
        title: 'How do I download the report or resend it by email?',
        body: 'Expand the child profile in Players. At the bottom you will find the options to download the report as a PDF or resend it by email to the responsible adult. The report is generated in the language the child played in.',
        steps: [
            'Open Players and tap the child row.',
            'At the bottom of the profile, use Download PDF or Resend report.',
            'To resend, confirm the adult email.',
        ],
        links: [{ label: 'Go to Players', to: '/dashboard/players' }],
    },
    {
        id: 'reperfilar',
        category: 'players',
        title: 'How and when do I re-profile a child?',
        body: 'Children grow and change, so the profile can be updated every 6 months. When that time passes, the player shows a note suggesting a re-profile.\n\nAt 6 months a re-profile button appears on the player card. It copies their own link: you share it with the responsible adult and the child plays again. The new profile is added to their history (the previous one is kept) and does not take up a new spot.',
        links: [{ label: 'Go to Players', to: '/dashboard/players' }],
    },
    {
        id: 'jugador-pendiente',
        category: 'players',
        title: 'A child shows as pending. What happened?',
        body: 'Pending means they started the adventure but did not reach the end. Their spot is reserved, but there is no profile to view yet.\n\nTo complete it, share the link with the family again: the child can pick it up and finish.',
    },
    {
        id: 'archivar-reactivar',
        category: 'players',
        title: 'How do I archive or reactivate a player?',
        body: 'Archiving a player removes them from the active list and frees a spot in your team, without losing their profile. You can reactivate them whenever you want, if you have a spot available.',
        steps: [
            'Open Players and expand the child row.',
            'Use Archive to remove them from the active list.',
            'To bring them back, open the archived section at the bottom and tap Reactivate.',
        ],
        links: [{ label: 'Go to Players', to: '/dashboard/players' }],
    },
    {
        id: 'perfil-no-coincide',
        category: 'players',
        title: 'The profile does not match what I see in the activity.',
        body: 'The profile is a snapshot of how the child showed up during the adventure, at one specific moment. It is a reading tool, not an absolute truth.\n\nThe most valuable thing is to combine that data with your day-to-day observation. If several months have passed, it is worth re-profiling them: children change.',
    },

    /* ═══ Group chemistry ═══ */
    {
        id: 'que-es-grupo',
        category: 'grupos',
        title: 'What is group chemistry and how is it different from a team?',
        body: 'A team is structural: it organizes your players and owns the link. A chemistry group is an analysis tool: you put together a subset of your players to see how they work together.\n\nEach group belongs to a team (U12 and U14 are different categories, not comparable). To see or create groups, first pick a team in the selector. The group has no link and does not receive new players: you create it to answer questions such as, for example, how your back line complements each other.',
    },
    {
        id: 'crear-grupo',
        category: 'grupos',
        title: 'How do I create a group and add players?',
        body: 'You can create as many groups as you want to analyze different combinations of your players.',
        steps: [
            'Open Group chemistry.',
            'Tap Create and give the group a name.',
            'Select it and add the players you want to analyze.',
            'The analysis updates automatically as you add players.',
        ],
        links: [{ label: 'Go to Group chemistry', to: '/dashboard/grupos' }],
    },
    {
        id: 'leer-analisis-grupo',
        category: 'grupos',
        title: 'How do I read a group analysis?',
        body: 'The analysis shows you the group type (for example, competitive, social, cohesive, methodical or balanced), its level of diversity and the affinities and possible frictions between profiles.\n\nIt is not about finding the perfect group, but about understanding its dynamic to support it better.',
        trialNote: 'The detail of affinities and tools unlocks on a paid plan.',
    },

    /* ═══ Argo Coach ═══ */
    {
        id: 'que-es-coach',
        category: 'coach',
        title: 'What is Argo Coach and what can I ask it?',
        body: 'Argo Coach is an assistant that answers questions about your players and how to support them. It knows your team profiles, so you can ask it specific things.\n\nFor example: how to motivate a child who arrives unmotivated, how to balance a group with very different profiles, or what to watch for with a specific player before a match.',
        links: [{ label: 'Go to Argo Coach', to: '/dashboard/chat' }],
    },
    {
        id: 'coach-datos-limites',
        category: 'coach',
        title: 'What data does Argo Coach see and what are its limits?',
        body: 'Argo Coach sees the profiles of the players you have access to, in order to give you personalized answers.\n\nIt is a help, not a diagnosis. It can be wrong and it does not replace your judgment or that of a professional. Use it as a starting point to think, not as the final word.',
    },

    /* ═══ Behavioral Predictor ═══ */
    {
        id: 'usar-predictor',
        category: 'guide',
        title: 'How do I use the Behavioral Predictor before an activity?',
        body: 'The Predictor gathers common situations in the sport, across training, matches and competitions (a child who won\'t get started, one who gets frustrated, etc.). You choose the one that interests you and it shows you what may be happening and how to support them based on the profile.',
        steps: [
            'Open Behavioral Predictor.',
            'Search or filter by category for the situation you care about.',
            'Read it to understand what may be happening.',
            'If you want, select a player to see the guidance adapted to their profile.',
        ],
        links: [{ label: 'Go to Behavioral Predictor', to: '/dashboard/guide' }],
    },
    {
        id: 'personalizar-predictor',
        category: 'guide',
        title: 'How do I personalize the guidance for a player?',
        body: 'Within a situation, you can choose one of your players. The guidance adapts to their full profile: what might be going on, the nuance of their lean (their second axis), a concrete phrase to say and the most common mistake to avoid. With "Picture it with [name]" you can also generate an illustrative example of how that situation could look with that child in their sport. It is a possible example built from the profile, not a real event.',
        trialNote: 'Per-player personalization unlocks on a paid plan.',
    },

    /* ═══ Your team and account ═══ */
    {
        id: 'equipo-x-y',
        category: 'account',
        title: 'What does Team X/Y mean?',
        body: 'It is the number of active players (X) out of the maximum for your plan (Y). Each profiled or pending child takes up a spot.\n\nIf you reach the maximum, you can archive players to free a spot. Archiving does not delete the profile: it keeps it and you can reactivate it later.',
        audience: 'admin',
        links: [{ label: 'Go to Players', to: '/dashboard/players' }],
    },
    {
        id: 'cupo-lleno',
        category: 'account',
        title: 'My link says the roster is full. What do I do?',
        body: 'It means your team reached the maximum number of players for your plan. While it is full, no new players can be added through the link.',
        steps: [
            'Open Players.',
            'Archive the players you are no longer following to free a spot.',
            'Or move to a plan with more capacity when you need it.',
        ],
        links: [{ label: 'Go to Players', to: '/dashboard/players' }],
    },
    {
        id: 'prueba-vs-pago',
        category: 'account',
        title: 'What does the trial include and what unlocks with a paid plan?',
        body: 'The trial gives you the full dashboard, several players and a limited number of Argo Coach queries, for a limited time.\n\nA paid plan unlocks the bridge words and words to avoid, the quick guide, the per-player Predictor personalization, the group detail and re-profiling, plus more team capacity.',
        audience: 'admin',
        links: [{ label: 'See plans', to: '/dashboard/pricing' }],
    },
    {
        id: 'cancelar-eliminar',
        category: 'account',
        title: 'How do I cancel the subscription or delete my account?',
        body: 'Both options are in Settings and only the account owner can do them.\n\nWhen you cancel, the dashboard goes into read-only mode but your data is kept. When you delete the account, the subscription is cancelled and access is removed. These are sensitive actions, so it is worth being sure before you confirm.',
        audience: 'admin',
        links: [{ label: 'Go to Settings', to: '/dashboard/settings' }],
    },
    {
        id: 'cambiar-idioma',
        category: 'account',
        title: 'How do I change the dashboard language?',
        body: 'You can choose between Spanish, English and Portuguese. The change affects your whole dashboard.',
        steps: [
            'Open Settings.',
            'Choose the language (Español, English or Português).',
            'Save. The dashboard updates instantly.',
        ],
        links: [{ label: 'Go to Settings', to: '/dashboard/settings' }],
    },
    /* ═══ 2026-07 additions: memory, conversation and mobile ═══ */
    {
        id: 'memoria-asistente',
        category: 'coach',
        title: 'What is the assistant memory and who can see it?',
        body: 'It is what Argo Coach remembers about each child to give continuity to your consultations: the episodes (what you asked and what was suggested) and a summary that updates itself nightly.\n\nYou are the only person who can read it: neither Argo nor other coaches have access. You can edit the summary, remove episodes one by one, or delete the whole memory anytime.',
        steps: [
            'Go to Players and open the child\'s card.',
            'Tap "Memory" in the action row.',
            'Edit the summary, remove an episode with the trash icon, or use "Delete memory".',
        ],
        links: [{ label: 'Go to Players', to: '/dashboard/players' }],
    },
    {
        id: 'compartir-link-celular',
        category: 'getting-started',
        title: 'How do I share the link from my phone?',
        body: 'On the phone, the violet button at the center of the bottom bar copies your link, ready to paste into WhatsApp. A message confirms "Link copied".\n\nThe copied link depends on the team selected at the top right: inside a team it shares that team\'s link; under Administration, the institution\'s.',
        tip: 'If your team is full, the button warns you first: nobody new can register until a slot is freed.',
    },
    {
        id: 'acciones-ficha',
        category: 'players',
        title: 'What can I do from a player\'s card?',
        body: 'When you expand the card, the action row at the top gathers everything: ask Argo Coach about that child (opens the chat with their profile loaded), view their Memory, download the PDF report (the extended one the responsible adult receives), resend it by email, and archive.',
        links: [{ label: 'Go to Players', to: '/dashboard/players' }],
    },
];
