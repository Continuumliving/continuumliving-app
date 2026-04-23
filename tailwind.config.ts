import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1a1817",
        "ink-soft": "#3a3632",
        "stone-deep": "#6b5d4d",
        stone: "#a89683",
        "stone-soft": "#c4b59f",
        sand: "#d4c8b8",
        warm: "#ebe4d7",
        bone: "#f5f1ea",
        cream: "#faf6ee",
        terracotta: "#c97b5a",
        "terracotta-soft": "#e8c4b1",
        "terracotta-tint": "#f5e6dd",
        olive: "#5c7a6b",
        "olive-soft": "#b5c4bc",
        "olive-tint": "#d9e3dc",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
        sans: [
          "var(--font-sans)",
          "Inter",
          "-apple-system",
          "system-ui",
          "sans-serif",
        ],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
      },
    },
  },
  plugins: [],
};

export default config;
