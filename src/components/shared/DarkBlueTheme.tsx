"use client";

/**
 * Envolve qualquer trecho da árvore com a identidade institucional FAM,
 * sobrescrevendo as MESMAS variáveis CSS que os componentes shadcn
 * (Card, Input, Select, Button...) já usam (--card, --background,
 * --border, --foreground etc.) — então tudo que já existe (Card,
 * CardHeader, Input...) fica azul automaticamente, sem precisar
 * editar cada componente um por um.
 *
 * Isso é escopado (só afeta o que está DENTRO desta div) — o painel
 * administrativo e os componentes de admin continuam independentes deste wrapper.
 *
 * Classes fixas usam os aliases FAM definidos no Tailwind e permanecem
 * compatíveis com os componentes existentes.
 */
export function DarkBlueTheme({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`fam-institutional-theme min-h-screen ${className}`}
      style={{
        // Pinta o PRÓPRIO fundo (não basta definir a variável --background:
        // se nenhum elemento filho tiver bg-background/bg-card explícito,
        // sem isso aparece o branco da página por trás do texto branco).
        backgroundColor: "#4A173F",
        color: "#ffffff",
        // Fundo ameixa e texto padrão branco
        "--background": "313 52% 19%",
        "--foreground": "0 0% 100%",
        // Cards em roxo institucional
        "--card": "313 42% 25%",
        "--card-foreground": "0 0% 100%",
        "--popover": "313 42% 25%",
        "--popover-foreground": "0 0% 100%",
        // Botão e realce primário FAM
        "--primary": "330 66% 54%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "313 35% 32%",
        "--accent-foreground": "0 0% 100%",
        // Bordas e inputs em roxo suave
        "--border": "313 30% 38%",
        "--input": "313 30% 38%",
        "--ring": "45 74% 49%",
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
