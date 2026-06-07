import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0f7b6c", light: "#13a594" },
        accent: "#ff7a45",
        ink: "#1a2024",
        muted: "#6b7780",
        line: "#e7ebee",
        day: { d1: "#3b82f6", dday: "#0f7b6c", dplus: "#8b5cf6" },
      },
    },
  },
  plugins: [],
};

export default config;
