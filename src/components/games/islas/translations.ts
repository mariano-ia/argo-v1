// ─── Mini-game translations (es/en/pt) ──────────────────────────────────────

export type MiniGameLang = 'es' | 'en' | 'pt';

export interface MiniGameTexts {
    // Game A — Islas / Cards
    cardTitle: string;
    cardBody: string;
    cardCompletion: string;
    // Game B — Esquivar / Dodge
    dodgeTitle: string;
    dodgeBody: string;
    dodgeCompletion: string;
    // Game C — Tormenta / Storm
    stormTitle: string;
    stormBody: string;
    stormCompletion: string;
    stormTapGold: string;
    stormTapSilver: string;
    // Shared
    tapToStart: string;
    continueAdventure: string;
    // Discovery names
    discoveries: string[];
}

const texts: Record<MiniGameLang, MiniGameTexts> = {
    es: {
        cardTitle: 'El cofre del Capitán',
        cardBody: 'El Capitán escondió objetos secretos antes de zarpar. Solo un verdadero explorador puede encontrarlos. Toca las cartas para revelar cada uno.',
        cardCompletion: 'Todos los objetos encontrados',
        dodgeTitle: '¡Mar abierto!',
        dodgeBody: 'Ya zarpamos. El mar trae olas, rocas y remolinos. Toca la pantalla para saltar los obstáculos.',
        dodgeCompletion: '¡Buen trabajo, navegante!',
        stormTitle: 'Después de la tormenta',
        stormBody: 'La tormenta dejó estrellas flotando en el mar. Recoge solo las doradas. Pero cuidado... cuando caiga un rayo, ¡las reglas cambian!',
        stormCompletion: '¡Sobreviviste a la tormenta!',
        stormTapGold: 'Toca las doradas',
        stormTapSilver: '¡Ahora las plateadas!',
        tapToStart: 'Toca para empezar',
        continueAdventure: 'Continuamos la aventura...',
        discoveries: [
            'Un cofre del tesoro',
            'Una estrella de mar',
            'Un loro explorador',
            'Una caracola mágica',
            'Una brújula antigua',
            'Un mapa misterioso',
        ],
    },
    en: {
        cardTitle: "The Captain's Chest",
        cardBody: 'The Captain hid secret objects before setting sail. Only a true explorer can find them. Tap the cards to reveal each one.',
        cardCompletion: 'All objects found',
        dodgeTitle: 'Open sea!',
        dodgeBody: "We've set sail. The sea brings waves, rocks, and whirlpools. Tap the screen to jump over obstacles.",
        dodgeCompletion: 'Great job, navigator!',
        stormTitle: 'After the storm',
        stormBody: 'The storm left stars floating in the sea. Collect only the golden ones. But watch out... when lightning strikes, the rules change!',
        stormCompletion: 'You survived the storm!',
        stormTapGold: 'Tap the golden ones',
        stormTapSilver: 'Now the silver ones!',
        tapToStart: 'Tap to start',
        continueAdventure: 'The adventure continues...',
        discoveries: [
            'A treasure chest',
            'A starfish',
            'An explorer parrot',
            'A magic shell',
            'An ancient compass',
            'A mysterious map',
        ],
    },
    pt: {
        cardTitle: 'O baú do Capitão',
        cardBody: 'O Capitão escondeu objetos secretos antes de zarpar. Só um verdadeiro explorador pode encontrá-los. Toque nas cartas para revelar cada um.',
        cardCompletion: 'Todos os objetos encontrados',
        dodgeTitle: 'Mar aberto!',
        dodgeBody: 'Já zarpamos. O mar traz ondas, rochas e redemoinhos. Toque na tela para pular os obstáculos.',
        dodgeCompletion: 'Bom trabalho, navegante!',
        stormTitle: 'Depois da tempestade',
        stormBody: 'A tempestade deixou estrelas flutuando no mar. Pegue apenas as douradas. Mas cuidado... quando o raio cair, as regras mudam!',
        stormCompletion: 'Você sobreviveu à tempestade!',
        stormTapGold: 'Toque nas douradas',
        stormTapSilver: 'Agora as prateadas!',
        tapToStart: 'Toque para começar',
        continueAdventure: 'A aventura continua...',
        discoveries: [
            'Um baú do tesouro',
            'Uma estrela-do-mar',
            'Um papagaio explorador',
            'Uma concha mágica',
            'Uma bússola antiga',
            'Um mapa misterioso',
        ],
    },
};

export function getMiniGameTexts(lang: string): MiniGameTexts {
    return texts[lang as MiniGameLang] ?? texts.es;
}
