/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      keyframes: {
        "scan-line": {
          "0%": { top: "0%" },
          "50%": { top: "calc(100% - 2px)" },
          "100%": { top: "0%" },
        },
      },
      animation: {
        "scan-line": "scan-line 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
