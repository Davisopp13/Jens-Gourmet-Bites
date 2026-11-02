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
          DEFAULT: "#146C68", // Deep teal
          50: "#F0F8F6",
          100: "#D9ECE7",
          200: "#B4D9D1",
          300: "#82BDB4",
          400: "#438F87",
          500: "#146C68",
          600: "#105B57",
          700: "#104A47",
          800: "#103C39",
          900: "#0D2D2B",
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
        display: ["var(--font-playfair)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
