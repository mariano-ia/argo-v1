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
                    navy:      '#1D1D1F',
                    secondary: '#424245',
                    indigo:    '#0071E3',
                    grey:      '#86868B',
                    neutral:   '#F5F5F7',
                    border:    '#D2D2D7',
                }
            },
            fontFamily: {
                sans:    ['Inter', 'sans-serif'],
                display: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                'argo-sm': '12px',
                'argo-md': '18px',
                'argo-lg': '24px',
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
