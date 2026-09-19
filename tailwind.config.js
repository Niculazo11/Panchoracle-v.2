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
      // Visual feedback for stat increments, feeding and coin rewards.
      keyframes: {
        bounceShort: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10%)" },
        },
        coinPop: {
          "0%, 100%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.18)" },
        },
        statPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "bounce-short": "bounceShort 0.5s ease-in-out",
        "coin-pop": "coinPop 0.5s ease-in-out",
        "stat-pulse": "statPulse 0.6s ease-in-out",
      },
    },
  },
  plugins: [],
};
