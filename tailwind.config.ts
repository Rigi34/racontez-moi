import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivoire: "#F5F0E8",
        "ivoire-fonce": "#EDE8DE",
        sable: "#D8D0C3",
        terracotta: "#C17A40",
        foret: "#2D5016",
        "presque-noir": "#1C1917",
        "gris-chaud": "#6B6560",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Helvetica", "sans-serif"],
        garamond: ["var(--font-eb-garamond)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
