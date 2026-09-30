import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0e14",
        card: "#121722",
        "card-hover": "#171e2c",
        border: "#1e293b",
        "crypto-green": "#10b981",
        "crypto-green-glow": "rgba(16, 185, 129, 0.15)",
        "crypto-red": "#f43f5e",
        "crypto-red-glow": "rgba(244, 63, 94, 0.15)",
        "accent-blue": "#38bdf8",
        "accent-purple": "#a855f7",
        "accent-amber": "#f59e0b",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
