import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        fam: {
          plum: "#6B285F",
          magenta: "#A73582",
          raspberry: "#C84B91",
          dustyRose: "#B982A6",
          softPink: "#F8EEF5",
          ivoryPink: "#FFF9FC",
          deepPlum: "#3F193B",
          lavender: "#E9D9E8",
          roseGold: "#C99A9A",
          champagne: "#E8CFA8",
          success: "#397A68",
          warning: "#B56B24",
          danger: "#B13B4A",
          muted: "#6F596B",
        },
        gold: { DEFAULT: "#C9A227", soft: "#E4CD7A", dark: "#A8841D" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
      },
      fontFamily: { display: ["Fraunces", "Georgia", "serif"], sans: ["Archivo", "system-ui", "sans-serif"], script: ["\"Dancing Script\"", "cursive"] },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
