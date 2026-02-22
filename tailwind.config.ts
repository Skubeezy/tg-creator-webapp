/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                tg: {
                    theme: 'var(--tg-theme-bg-color, #ffffff)',
                    text: 'var(--tg-theme-text-color, #000000)',
                    hint: 'var(--tg-theme-hint-color, #999999)',
                    link: 'var(--tg-theme-link-color, #2481cc)',
                    primary: 'var(--tg-theme-button-color, #2481cc)',
                    primaryText: 'var(--tg-theme-button-text-color, #ffffff)',
                    secondaryBg: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
                }
            }
        },
    },
    plugins: [],
}
