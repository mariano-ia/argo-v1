#!/usr/bin/env node
/**
 * Generate images using Gemini 2.0 Flash (Nano Banana) API.
 * Usage: node scripts/generate-image.mjs "prompt text" output-filename.png
 */
import fs from 'fs';
import path from 'path';

const API_KEY = 'AIzaSyAwcLV4heMTK0xNQZ5aqpSDv_50zdBLCoU';
const MODEL = 'gemini-2.5-flash-image';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const prompt = process.argv[2];
const outputFile = process.argv[3];

if (!prompt || !outputFile) {
    console.error('Usage: node generate-image.mjs "prompt" output.png');
    process.exit(1);
}

async function generate() {
    console.log(`Generating: "${prompt.slice(0, 80)}..."`);
    console.log(`Output: ${outputFile}`);

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    };

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error(`API error ${res.status}: ${err}`);
        process.exit(1);
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts;

    if (!parts) {
        console.error('No parts in response:', JSON.stringify(data, null, 2));
        process.exit(1);
    }

    for (const part of parts) {
        if (part.inlineData) {
            const buf = Buffer.from(part.inlineData.data, 'base64');
            const dir = path.dirname(outputFile);
            if (dir) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(outputFile, buf);
            console.log(`Saved ${outputFile} (${(buf.length / 1024).toFixed(1)} KB)`);
            return;
        }
        if (part.text) {
            console.log('Model text:', part.text);
        }
    }

    console.error('No image data in response');
    process.exit(1);
}

generate().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
