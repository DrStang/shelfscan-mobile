/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: 'class', // This is crucial - enables class-based dark mode
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                // Dark mode specific grays (Tailwind default grays work well)
                dark: {
                    bg: '#111827',       // gray-900
                    card: '#1f2937',     // gray-800
                    border: '#374151',   // gray-700
                    text: '#f3f4f6',     // gray-100
                    muted: '#9ca3af',    // gray-400
                }
            },
            spacing: {
                'safe-top': 'env(safe-area-inset-top)',
                'safe-bottom': 'env(safe-area-inset-bottom)',
                'safe-left': 'env(safe-area-inset-left)',
                'safe-right': 'env(safe-area-inset-right)',
            },
            animation: {
                'slide-up': 'slide-up 0.3s ease-out',
                'fade-in': 'fade-in 0.2s ease-out',
                'scale-in': 'scale-in 0.2s ease-out',
            },
            keyframes: {
                'slide-up': {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            transitionProperty: {
                'colors': 'background-color, border-color, color, fill, stroke',
            },
        },
    },
    plugins: [
        require("@tailwindcss/typography"),
    ],
}