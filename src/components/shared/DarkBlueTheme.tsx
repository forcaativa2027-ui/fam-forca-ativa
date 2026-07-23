"use client";

/**
 * Envolve qualquer trecho da árvore em duas tonalidades de azul,
 * sobrescrevendo as MESMAS variáveis CSS que os componentes shadcn
 * (Card, Input, Select, Button...) já usam (--card, --background,
 * --border, --foreground etc.) — então tudo que já existe (Card,
 * CardHeader, Input...) fica azul automaticamente, sem precisar
 * editar cada componente um por um.
 *
 * Isso é escopado (só afeta o que está DENTRO desta div) — o painel
 * administrativo e os componentes de admin continuam exatamente
 * como estão, já que eles não ficam dentro deste wrapper.
 *
 * Ainda assim, classes "fixas" como `text-navy`, `text-ink` e
 * `text-muted` (cores hexadecimais fixas do Tailwind, não variáveis
 * CSS) não são afetadas por este wrapper — cada tela precisa trocar
 * essas classes manualmente por `text-white`/`text-white/70` etc.
 */
export function DarkBlueTheme({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`dark-blue-theme min-h-screen ${className}`}
      style={{
        // Pinta o PRÓPRIO fundo (não basta definir a variável --background:
        // se nenhum elemento filho tiver bg-background/bg-card explícito,
        // sem isso aparece o branco da página por trás do texto branco).
        backgroundColor: "hsl(213, 67%, 15%)",
        color: "#ffffff",
        // Fundo da página (azul mais escuro) e texto padrão (branco)
        "--background": "213 67% 15%",
        "--foreground": "0 0% 100%",
        // Cards (azul um pouco mais claro que o fundo)
        "--card": "212 61% 22%",
        "--card-foreground": "0 0% 100%",
        "--popover": "212 61% 22%",
        "--popover-foreground": "0 0% 100%",
        // Botão/realce primário continua o mesmo azul da marca
        "--primary": "213 67% 17%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "212 45% 30%",
        "--accent-foreground": "0 0% 100%",
        // Bordas e inputs — azul médio, visível contra o fundo escuro
        "--border": "213 40% 32%",
        "--input": "213 40% 32%",
        "--ring": "45 74% 49%",
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
