/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                argos: {
                    deep: '#0f172a',
                    surface: '#1e293b',
                    cyan: '#06b6d4',
                    ember: '#f59e0b',
                    text: '#f8fafc',
                    muted: '#94a3b8',
                },
                argo: {
                    navy: '#1A1C2E',
                    indigo: '#5C62FF',
                    grey: '#717691',
                    neutral: '#FDFBFF',
                    border: '#E2E4EB'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            borderRadius: {
                'argo-sm': '4px',
                'argo-md': '8px',
                'argo-lg': '12px',
            },
            animation: {
                'scan': 'scan 4s linear infinite',
            },
            keyframes: {
                scan: {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(100%)' },
                }
            }
        },
    },
    plugins: [],
}
