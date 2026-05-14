import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Local dev forwards /api/* to the develop branch preview on Vercel so that
// serverless functions (Stripe, MercadoPago, Supabase, Gemini, Resend) run
// with their real env vars without needing `vercel dev` or local secrets.
const API_PROXY_TARGET = process.env.VITE_API_PROXY
    || 'https://v0-argo-v1-git-develop-marianonoceti-gmailcoms-projects.vercel.app';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: API_PROXY_TARGET,
                changeOrigin: true,
                secure: true,
            },
        },
    },
});
