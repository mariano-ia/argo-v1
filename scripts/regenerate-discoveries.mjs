/**
 * Regenerate discovery card images with clean white backgrounds
 * and consistent flat vector style matching the Argo game.
 *
 * Usage: node scripts/regenerate-discoveries.mjs
 */

import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUT_DIR = path.resolve('public/scenes/islas');

const STYLE = `Flat vector illustration, children's mobile game style.
Clean solid WHITE background (#FFFFFF), no patterns, no gradients on background.
The object is centered, occupies about 70% of the frame.
Warm color palette: turquoise, golden amber, tropical greens, coral.
Thick clean outlines, friendly rounded shapes, no realistic textures.
Style reference: premium children's book illustration, like Moana or Luca concept art.
No text, no watermarks, no shadows on background, no floor/ground.
Single object floating on pure white.`;

const images = [
    {
        name: 'discovery-chest.png',
        prompt: `A wooden treasure chest, slightly open, with golden coins and jewels spilling out. The chest has ornate golden metal bands and a round lock. Warm amber and brown tones. ${STYLE}`,
    },
    {
        name: 'discovery-starfish.png',
        prompt: `A large five-pointed starfish in vibrant coral-orange color with subtle pattern dots. Friendly and cute looking, slightly cartoonish with a gentle smile suggested by its shape. Small sparkle stars around it. ${STYLE}`,
    },
    {
        name: 'discovery-parrot.png',
        prompt: `A friendly tropical parrot with bright green, blue, red and yellow feathers, perched with wings slightly spread. Big expressive cartoon eyes, curved orange beak. Cheerful and adventurous personality. ${STYLE}`,
    },
    {
        name: 'discovery-shell.png',
        prompt: `A large spiral conch shell in pearlescent pink and cream colors with subtle iridescent highlights. Elegant spiral shape, the opening faces the viewer. Small sparkle dots around it suggesting magic. ${STYLE}`,
    },
    {
        name: 'discovery-compass.png',
        prompt: `An antique golden nautical compass, open and facing up, showing the compass face with N/S/E/W markers. Ornate golden case with decorative engravings. The needle points north with a red tip. Greek-inspired decorative details. ${STYLE}`,
    },
    {
        name: 'discovery-map.png',
        prompt: `A rolled treasure map, partially unrolled, showing a hand-drawn map with islands, dotted paths, and a red X marks the spot. The parchment is golden-brown with slightly curled edges. A small red wax seal on one corner. ${STYLE}`,
    },
];

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);
        proto.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                downloadImage(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function main() {
    console.log(`\nRegenerating ${images.length} discovery images...\n`);

    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const pngPath = path.join(OUT_DIR, img.name);
        const webpPath = pngPath.replace('.png', '.webp');

        console.log(`[${i + 1}/${images.length}] Generating: ${img.name}...`);

        try {
            const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt: img.prompt,
                n: 1,
                size: '1024x1024',
                quality: 'hd',
                style: 'vivid',
            });

            const imageUrl = response.data[0].url;
            await downloadImage(imageUrl, pngPath);
            console.log(`  Downloaded PNG`);

            // Convert to WebP with sharp
            const sharp = (await import('sharp')).default;
            await sharp(pngPath)
                .resize({ width: 512, height: 512, fit: 'inside' })
                .webp({ quality: 85 })
                .toFile(webpPath);

            const webpSize = fs.statSync(webpPath).size;
            console.log(`  WebP: ${(webpSize / 1024).toFixed(0)}KB`);

            // Remove PNG to save space
            fs.unlinkSync(pngPath);

            if (response.data[0].revised_prompt) {
                console.log(`  (revised: ${response.data[0].revised_prompt.substring(0, 60)}...)`);
            }
        } catch (err) {
            console.error(`  FAILED: ${err.message}`);
        }

        if (i < images.length - 1) await new Promise(r => setTimeout(r, 1500));
    }

    console.log('\nDone!');
}

main().catch(console.error);
