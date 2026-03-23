// ─── Islas Desconocidas — Shared Constants ──────────────────────────────────

export const ISLAND_COUNT = 6;
export const DISCOVERY_DISPLAY_MS = 800;
export const EMERGE_DURATION_MS = 800;
export const SINK_DURATION_MS = 500;
export const INTER_ISLAND_PAUSE_MS = 350;
export const TAP_HINT_DELAY_MS = 3000;
export const SCREEN_FLASH_MS = 80;
export const CAMERA_SHAKE_MS = 150;
export const HAPTIC_MS = 50;
export const COMPLETION_GLOW_MS = 600;
export const COMPLETION_SHIP_MS = 1500;
export const COMPLETION_CARD_DELAY_MS = 400;
export const COMPLETION_DONE_MS = 2500;

// Z-index layers
export const Z = {
    sky: 0,
    farClouds: 1,
    farWave: 2,
    ocean: 3,
    caustics: 4,
    midWave: 5,
    marineLife: 6,
    islands: 7,
    nearWave: 8,
    spray: 9,
    vignette: 10,
    ui: 11,
    screenFlash: 15,
    overlay: 20,
} as const;

// Island positions (% from viewport)
export const ISLAND_POSITIONS = [
    { x: 68, y: 34 },
    { x: 22, y: 50 },
    { x: 72, y: 60 },
    { x: 18, y: 32 },
    { x: 48, y: 44 },
    { x: 35, y: 64 },
];

export const ISLAND_IMAGES = [
    '/scenes/islas/island-1.webp',
    '/scenes/islas/island-2.webp',
    '/scenes/islas/island-3.webp',
    '/scenes/islas/island-4.webp',
    '/scenes/islas/island-5.webp',
    '/scenes/islas/island-6.webp',
];

// Discovery images — names come from translations.ts
export const DISCOVERY_IMAGES = [
    '/scenes/islas/discovery-chest.webp',
    '/scenes/islas/discovery-starfish.webp',
    '/scenes/islas/discovery-parrot.webp',
    '/scenes/islas/discovery-shell.webp',
    '/scenes/islas/discovery-compass.webp',
    '/scenes/islas/discovery-map.webp',
];

// Particle burst default colors
export const BURST_COLORS_GOLD = ['#F59E0B', '#FBBF24', '#FCD34D', '#D97706'];
export const BURST_COLORS_WATER = ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc'];

// Preload all game images
export function preloadImages(): Promise<void[]> {
    const urls = [
        ...ISLAND_IMAGES,
        ...DISCOVERY_IMAGES,
        '/scenes/islas/star-gold.webp',
        '/scenes/islas/star-silver.webp',
    ];
    return Promise.all(urls.map(url => new Promise<void>((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = () => resolve();
    })));
}
