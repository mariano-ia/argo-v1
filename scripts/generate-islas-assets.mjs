/**
 * Generate image assets for "Islas Desconocidas" mini-game
 * using DALL-E 3 via OpenAI API.
 *
 * Usage: node scripts/generate-islas-assets.mjs
 *
 * Requires: OPENAI_API_KEY in .env
 */

import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUT_DIR = path.resolve('public/scenes/islas');

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

// ─── Style reference (shared across ALL prompts for consistency) ───
const STYLE = `Flat vector cartoon illustration style for a children's mobile game.
Greek mythology nautical theme. Color palette: turquoise ocean, warm golden/amber accents,
soft sandy tones, bright tropical greens. Clean shapes, no outlines, subtle gradients.
Friendly and warm atmosphere. Similar style to a premium children's book illustration.
No text, no watermarks, no people.`;

// ─── Image definitions ────────────────────────────────────────────

const images = [
    // Background
    {
        name: 'islas-ocean-bg.png',
        prompt: `Wide open ocean scene viewed from above at a slight angle. Calm turquoise-blue water stretching to the horizon. A few small white clouds in a bright blue sky. Gentle wave patterns on the water surface. The scene should feel vast and inviting, like an unexplored ocean map waiting to be discovered. No islands, no boats, just open beautiful ocean. ${STYLE}`,
        size: '1792x1024',
    },

    // Islands (6 variants)
    {
        name: 'island-1.png',
        prompt: `A small tropical island floating in the ocean, seen from a 3/4 aerial view. Sandy beach, two palm trees, a few rocks. Surrounded by shallow turquoise water ring. Compact and round shape. The island should look mysterious and inviting. Transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },
    {
        name: 'island-2.png',
        prompt: `A small volcanic island floating in the ocean, seen from a 3/4 aerial view. Dark rocky peak in the center with lush green vegetation on the slopes. Sandy shore at the base. Small waterfall visible. Compact shape. Transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },
    {
        name: 'island-3.png',
        prompt: `A tiny atoll island floating in the ocean, seen from a 3/4 aerial view. Crescent-shaped sand bar with a few palm trees and tropical flowers. A small lagoon of bright turquoise water in the center. Compact and organic shape. Transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },
    {
        name: 'island-4.png',
        prompt: `A small ancient Greek-style island floating in the ocean, seen from a 3/4 aerial view. A tiny white stone ruin or column fragment among palm trees and green bushes. Golden sandy beach. Compact shape. Feels like a mythological discovery. Transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },
    {
        name: 'island-5.png',
        prompt: `A small dense jungle island floating in the ocean, seen from a 3/4 aerial view. Thick tropical canopy of various green shades. A single tall palm rising above the rest. Rocky edges with waves splashing gently. Compact round shape. Transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },
    {
        name: 'island-6.png',
        prompt: `A small treasure island floating in the ocean, seen from a 3/4 aerial view. Sandy beach with an X mark in the sand. A twisted old tree and a few palm trees. A small wooden sign post. Feels like adventure awaits. Compact shape. Transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },

    // Discoveries (6 items found on islands)
    {
        name: 'discovery-chest.png',
        prompt: `A golden treasure chest, slightly open with golden light glowing from inside. Wooden chest with golden metal bands and a jeweled lock. A few gold coins scattered around the base. Single object, centered, on transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },
    {
        name: 'discovery-starfish.png',
        prompt: `A beautiful large starfish in coral pink and orange colors, resting on a small mound of sand. Sparkles of light around it suggesting it's magical. Single object, centered, on transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },
    {
        name: 'discovery-parrot.png',
        prompt: `A friendly colorful tropical parrot perched on a small branch. Bright green, red, yellow, and blue feathers. The parrot looks curious and friendly with big expressive eyes. Children's illustration style. Single character, centered, on transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },
    {
        name: 'discovery-shell.png',
        prompt: `A large magical conch shell in pearlescent pink and cream colors. The shell has a soft inner glow suggesting ocean sounds inside. Small sparkles around it. Single object, centered, on transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },
    {
        name: 'discovery-compass.png',
        prompt: `An ancient golden nautical compass, ornate with Greek-inspired decorative engravings. The compass needle points north with a red tip. The compass is open showing its face. Antique but warm and inviting. Single object, centered, on transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },
    {
        name: 'discovery-map.png',
        prompt: `An ancient rolled parchment treasure map, partially unrolled showing a hand-drawn map with dotted paths, an X marks the spot, and small island illustrations. The parchment is aged golden-brown with burnt edges. A red wax seal on one corner. Single object, centered, on transparent/white background. ${STYLE}`,
        size: '1024x1024',
    },
];

// ─── Download helper ──────────────────────────────────────────────

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);
        proto.get(url, (response) => {
            // Follow redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                downloadImage(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => {
            fs.unlink(dest, () => {}); // Clean up
            reject(err);
        });
    });
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
    console.log(`\nGenerating ${images.length} images for "Islas Desconocidas"...\n`);
    console.log(`Output directory: ${OUT_DIR}\n`);

    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const outPath = path.join(OUT_DIR, img.name);

        // Skip if already generated
        if (fs.existsSync(outPath)) {
            console.log(`[${i + 1}/${images.length}] SKIP (exists): ${img.name}`);
            continue;
        }

        console.log(`[${i + 1}/${images.length}] Generating: ${img.name}...`);

        try {
            const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt: img.prompt,
                n: 1,
                size: img.size,
                quality: 'hd',
                style: 'vivid',
            });

            const imageUrl = response.data[0].url;
            await downloadImage(imageUrl, outPath);

            console.log(`  ✓ Saved to ${outPath}`);

            // Log revised prompt if DALL-E modified it
            if (response.data[0].revised_prompt) {
                console.log(`  (revised prompt: ${response.data[0].revised_prompt.substring(0, 80)}...)`);
            }
        } catch (err) {
            console.error(`  ✗ FAILED: ${err.message}`);
        }

        // Small delay to respect rate limits
        if (i < images.length - 1) {
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    console.log('\nDone! Check the output directory for results.');
}

main().catch(console.error);
