import type { Config } from "tailwindcss";

/** Branding MUTUEL TOGO : bleu et vert du logo, sur clair (défaut) comme sur sombre. */
const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0B5FD7",
          deep: "#083B82",
          sky: "#2E8CFF",
          green: "#13A968",
          mint: "#1FC86B",
        },
      },
      boxShadow: {
        carte: "0 18px 40px -12px rgba(8, 59, 130, 0.45)",
        doux: "0 8px 24px -10px rgba(2, 24, 54, 0.18)",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
