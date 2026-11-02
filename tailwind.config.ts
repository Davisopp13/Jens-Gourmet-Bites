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
          DEFAULT: "#5E7B55", // Sage (was deep teal); also drives the admin
          50: "#F4F7EE",
          100: "#E6EDDA",
          200: "#D8E0C4",
          300: "#B5C69E",
          400: "#8AA67B",
          500: "#5E7B55",
          600: "#4F6B47",
          700: "#41583B",
          800: "#34462F",
          900: "#283725",
        },
        // Warm brown-greys replace Tailwind's cool greys so the admin matches the catalog
        gray: {
          50: "#FBF6EC",
          100: "#F5EDDC",
          200: "#E8DCC3",
          300: "#D3C3A5",
          400: "#A08E7A",
          500: "#7A6556",
          600: "#5C4636",
          700: "#4A3526",
          800: "#3A2A1E",
          900: "#2B1D14",
        },
        cream: {
          DEFAULT: "#FFF7ED", // Warm vanilla
          50: "#FFFFFF",
          100: "#FFF7ED",
          200: "#FDEBDC",
          300: "#F9D9C1",
        },
        accent: {
          DEFAULT: "#F0AB87", // Peach; pair filled surfaces with espresso text
          50: "#FFF0E5",
          100: "#FDE3D3",
          200: "#F9D1B9",
          300: "#F5C3A6",
          400: "#F2B795",
          500: "#F0AB87",
          600: "#E69870",
          700: "#A4502D", // Dark peach for readable accent text on light surfaces
          800: "#803B20",
          900: "#5D2B19",
        },
        espresso: "#382A24",
        // Card-catalog theme (public site only; the admin keeps the teal palette above)
        cat: {
          wood: "#B98457",
          paper: "#FFFDF6",
          ink: "#4A2E1F",
          rust: "#7A3B1D",
          sage: "#5E7B55",
          butter: "#EBCB8C",
          mint: "#D8E0C4",
          blush: "#F2C4B4",
          sky: "#C9DCE8",
          tape: "#F6D77B",
          stamp: "#B3341F",
          note: "#FBEFC4",
        },
      },
      fontFamily: {
        "cat-display": ["var(--font-young-serif)", "serif"],
        "cat-hand": ["var(--font-caveat)", "cursive"],
        "cat-body": ["var(--font-lora)", "serif"],
        display: ["var(--font-young-serif)", "serif"],
        body: ["var(--font-lora)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
