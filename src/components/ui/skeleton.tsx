import * as React from "react";

/**
 * ACA-UX-001 Fase B — skeleton de carregamento (§28: preferir
 * geometria semelhante à final em vez de spinner global). Respeita
 * CT-017 — a animação de pulso é desligada automaticamente quando
 * data-animations="desativada" (regra global já existe em globals.css).
 */
export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`animate-pulse rounded-md bg-navy/10 ${className}`} {...props} />;
}
