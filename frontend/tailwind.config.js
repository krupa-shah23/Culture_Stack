/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "soft-bone": "#F5F5F0",
                "warm-linen": "#F2EFE9",
                "muted-gold": "#8C7851",
                "charcoal": "#1A1A1A"
            }
        },
    },
    plugins: [],
}
