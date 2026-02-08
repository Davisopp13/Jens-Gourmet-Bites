import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8B4513", // Saddle Brown
          50: "#FDF8F3",
          100: "#F5E6D3",
          200: "#E8C9A8",
          300: "#D4A574",
          400: "#B8784A",
          500: "#8B4513",
          600: "#723910",
          700: "#5A2D0D",
          800: "#42210A",
          900: "#2A1506",
        },
        cream: {
          DEFAULT: "#FFF8F0",
          50: "#FFFFFF",
          100: "#FFF8F0",
          200: "#FFEEDD",
          300: "#FFE4CC",
        },
        accent: {
          DEFAULT: "#C41E3A", // Cardinal Red
          50: "#FDF2F4",
          100: "#FCE7EB",
          200: "#F9CED6",
          300: "#F4A5B5",
          400: "#ED6B85",
          500: "#C41E3A",
          600: "#A81932",
          700: "#8C1529",
          800: "#701120",
          900: "#5A0E1A",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
