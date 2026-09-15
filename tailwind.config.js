/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // Matches the original Tailwind CDN config from index.html:
  // tailwind.config = { darkMode: ['selector', '.dark-mode'], ... }
  darkMode: ["selector", ".dark-mode"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
      },
    },
  },
  plugins: [],
};
