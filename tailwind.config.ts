import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        navy: { DEFAULT:"#4A173F", 50:"#FFF7FB", 100:"#F8EAF1", 600:"#6D2C68", 700:"#4A173F", 900:"#32132D" },
        gold: { DEFAULT:"#C9A24A", soft:"#E8C978", dark:"#9A7626" },
        fam: {
          plum: "#4A173F", purple: "#6D2C68", pink: "#D93683", rose: "#F05A9D",
          coral: "#F47C83", lilac: "#B58AD9", peach: "#F6B38A", ivory: "#FFFCFD",
          softPink: "#F8EAF1", softLilac: "#EFE4FA", ink: "#321B2F", success: "#4FAF87",
          danger: "#B4233C"
        },
        ink: "#14213D", muted: "#6B7C93",
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
