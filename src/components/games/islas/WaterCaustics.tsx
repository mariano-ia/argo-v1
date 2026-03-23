import React, { useEffect, useRef } from 'react';
import { Z } from './constants';

// ─── Simplex-inspired 2D noise (lightweight, no deps) ───────────────────────
// Produces smooth pseudo-random values from 2D coords. Not true simplex but
// visually indistinguishable for caustic patterns at 256x256.

const P = new Uint8Array(512);
for (let i = 0; i < 256; i++) P[i] = i;
for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [P[i], P[j]] = [P[j], P[i]];
}
for (let i = 0; i < 256; i++) P[i + 256] = P[i];

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number) { return a + t * (b - a); }

function grad(hash: number, x: number, y: number) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = P[P[X] + Y];
    const ab = P[P[X] + Y + 1];
    const ba = P[P[X + 1] + Y];
    const bb = P[P[X + 1] + Y + 1];
    return lerp(
        lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
        lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
        v,
    );
}

// ─── Canvas Caustics Component ──────────────────────────────────────────────

const SIZE = 256;
const SCALE1 = 0.025;
const SCALE2 = 0.045;
const SPEED = 0.0008;

export const WaterCaustics: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const lastFrameRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const imageData = ctx.createImageData(SIZE, SIZE);
        const data = imageData.data;

        // Check reduced motion preference
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        const render = (time: number) => {
            // Throttle to ~24fps for performance
            if (time - lastFrameRef.current < 42) {
                rafRef.current = requestAnimationFrame(render);
                return;
            }
            lastFrameRef.current = time;

            const t = time * SPEED;

            for (let y = 0; y < SIZE; y++) {
                for (let x = 0; x < SIZE; x++) {
                    const n1 = noise2D(x * SCALE1 + t, y * SCALE1 + t * 0.7);
                    const n2 = noise2D(x * SCALE2 - t * 0.5, y * SCALE2 + t * 0.3);
                    const combined = (n1 + n2) * 0.5 + 0.5; // normalize to 0-1

                    // Only render bright caustic highlights
                    const brightness = Math.max(0, combined - 0.45) * 3.5;
                    const alpha = Math.min(brightness * 60, 40); // max alpha ~40/255

                    const idx = (y * SIZE + x) * 4;
                    data[idx] = 200;     // R
                    data[idx + 1] = 240; // G (slightly blue-green)
                    data[idx + 2] = 255; // B
                    data[idx + 3] = alpha;
                }
            }

            ctx.putImageData(imageData, 0, 0);
            rafRef.current = requestAnimationFrame(render);
        };

        rafRef.current = requestAnimationFrame(render);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
                zIndex: Z.caustics,
                mixBlendMode: 'soft-light',
                opacity: 0.6,
                imageRendering: 'auto',
            }}
        />
    );
};
