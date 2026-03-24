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
                    grey:      '#86868B',
                    light:     '#AEAEB2',
                    border:    '#E8E8ED',
                    bg:        '#F8F8FA',
                    neutral:   '#F5F5F7',
                    indigo:    '#0071E3',
                    'violet-50':  '#F9F5FC',
                    'violet-100': '#EDE5F5',
                    'violet-200': '#D4BCE8',
                    'violet-400': '#A97BD2',
                    'violet-500': '#955FB5',
                    'violet-600': '#7A4D96',
                },
                axis: {
                    impulsor:       '#f97316',
                    'impulsor-bg':  '#fff7ed',
                    conector:       '#f59e0b',
                    'conector-bg':  '#fffbeb',
                    sosten:         '#22c55e',
                    'sosten-bg':    '#f0fdf4',
                    estratega:      '#6366f1',
                    'estratega-bg': '#eef2ff',
                }
            },
            fontFamily: {
                sans:      ['Inter', 'sans-serif'],
                display:   ['Inter', 'sans-serif'],
                adventure: ['"Lilita One"', 'cursive'],
                quest:     ['"Quicksand"', 'sans-serif'],
            },
            borderRadius: {
                'argo-sm': '12px',
                'argo-md': '18px',
                'argo-lg': '24px',
            },
            boxShadow: {
                'argo':       '0 1px 3px rgba(0,0,0,0.04)',
                'argo-hover': '0 2px 12px rgba(0,0,0,0.06)',
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
