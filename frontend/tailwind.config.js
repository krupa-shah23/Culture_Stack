/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "earth-bg": "#FAF8F5",
                "earth-surface": "#F2EBE1",
                "earth-green": "#1A1A1A",
                "earth-tan": "#B6A696",
                "earth-sand": "#E6DBCE",
                "charcoal": "#1A1A1A"
            }
        },
    },
    plugins: [],
}
