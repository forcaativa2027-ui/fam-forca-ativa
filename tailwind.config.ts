import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        // Paleta oficial FAM — ameixa, roxo, pink, coral, lilás e dourado.
        fam: {
          plum: "#4A173F", purple: "#6D2C68", night: "#32132D", ink: "#321B2F",
          muted: "#6F596B", background: "#FFFCFD", surface: "#FFFFFF", border: "#E6DDE7",
          pink: "#D93683", rose: "#F05A9D", coral: "#F47C83", peach: "#F6B38A",
          lilac: "#B58AD9", "purple-light": "#EFE4FA", "soft-pink": "#F8EAF1",
          success: "#4FAF87", warning: "#B56B24", danger: "#B4233C",
          gold: "#C9A24A", "gold-soft": "#E8C978", "gold-dark": "#9A7626"
        },
        // Aliases legados mantidos durante a migração visual.
        navy: { DEFAULT:"#4A173F", 50:"#FFFCFD", 100:"#E6DDE7", 600:"#6D2C68", 700:"#4A173F", 900:"#32132D" },
        gold: { DEFAULT:"#C9A24A", soft:"#E8C978", dark:"#9A7626" },
        ink: "#321B2F", muted: "#6F596B",
        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
        primary: { DEFAULT:"hsl(var(--primary))", foreground:"hsl(var(--primary-foreground))" },
        accent: { DEFAULT:"hsl(var(--accent))", foreground:"hsl(var(--accent-foreground))" },
        destructive: { DEFAULT:"hsl(var(--destructive))", foreground:"hsl(var(--destructive-foreground))" },
        card: { DEFAULT:"hsl(var(--card))", foreground:"hsl(var(--card-foreground))" },
        popover: { DEFAULT:"hsl(var(--popover))", foreground:"hsl(var(--popover-foreground))" }
      },
      fontFamily: { display: ["Fraunces","Georgia","serif"], sans: ["Archivo","system-ui","sans-serif"], script: ["\"Dancing Script\"","cursive"] },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
export default config;
