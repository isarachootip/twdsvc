import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sarabun)",
          "Sarabun",
          "TH Sarabun New",
          "TH Sarabun PSK",
          "sans-serif",
        ],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        thaiwatsadu: {
          red: "#ED1C24",
          darkred: "#C4161C",
          navy: "#1B2A4A",
          yellow: "#FFD200",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
