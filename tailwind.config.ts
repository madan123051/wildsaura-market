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
        // WildSaura Brand Colors
        brand: {
          primary:   "#1A6B3C", // Deep Forest Green
          secondary: "#F5A623", // Warm Amber / Gold
          accent:    "#E84855", // Vibrant Red (Nepal Flag inspired)
          dark:      "#0D1B2A", // Deep Navy / Night Sky
          light:     "#F8F5F0", // Warm Off-White / Paper
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted:   "#F3F4F6",
          border:  "#E5E7EB",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-playfair)", "serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.14)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
