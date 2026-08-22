import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        fam: { DEFAULT: "#E91E63", 50: "#FCE4EC", 100: "#F8BBD0", 200: "#F48FB1", 300: "#F06292", 400: "#EC407A", 500: "#E91E63", 600: "#D81B60", 700: "#C2185B", 800: "#AD1457", 900: "#880E4F" },
        famPink: { DEFAULT: "#EC407A", light: "#F8BBD0", dark: "#C2185B" },
        gold: { DEFAULT:"#C9A227", soft:"#E4CD7A", dark:"#A8841D" },
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
